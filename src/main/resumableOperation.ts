import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { app } from 'electron';

export interface OperationCheckpoint {
  id: string;
  operation: 'encrypt' | 'decrypt';
  inputPath: string;
  outputPath: string;
  password: string; // This should be encrypted/hashed for security
  progress: number;
  bytesProcessed: number;
  totalBytes: number;
  chunkSize: number;
  timestamp: number;
  algorithm: string;
  salt?: Buffer;
  iv?: Buffer;
  tempDataPath?: string;
}

export interface ResumeInfo {
  canResume: boolean;
  checkpoint?: OperationCheckpoint;
  reason?: string;
}

export class ResumableOperation {
  private checkpointsDir: string;
  private tempDir: string;
  private checkpointInterval = 5 * 1024 * 1024; // 5MB intervals

  constructor() {
    const userDataPath = app.getPath('userData');
    this.checkpointsDir = path.join(userDataPath, 'checkpoints');
    this.tempDir = path.join(userDataPath, 'temp');
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.checkpointsDir)) {
      fs.mkdirSync(this.checkpointsDir, { recursive: true });
    }
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async saveCheckpoint(
    operationId: string,
    operation: 'encrypt' | 'decrypt',
    inputPath: string,
    outputPath: string,
    password: string,
    progress: number,
    bytesProcessed: number,
    totalBytes: number,
    algorithm = 'aes-256-gcm',
    salt?: Buffer,
    iv?: Buffer,
  ): Promise<void> {
    const checkpoint: OperationCheckpoint = {
      id: operationId,
      operation,
      inputPath,
      outputPath,
      password: this.encryptPassword(password), // Store encrypted password hash
      progress,
      bytesProcessed,
      totalBytes,
      chunkSize: this.checkpointInterval,
      timestamp: Date.now(),
      algorithm,
      salt,
      iv,
    };

    // Save any temporary data if needed
    if (bytesProcessed > 0) {
      const tempDataPath = path.join(this.tempDir, `${operationId}.temp`);
      checkpoint.tempDataPath = tempDataPath;

      // Copy partial output file to temp location
      if (fs.existsSync(outputPath)) {
        fs.copyFileSync(outputPath, tempDataPath);
      }
    }

    const checkpointPath = path.join(this.checkpointsDir, `${operationId}.json`);
    fs.writeFileSync(checkpointPath, JSON.stringify(checkpoint, null, 2));
  }

  async loadCheckpoint(operationId: string): Promise<OperationCheckpoint | null> {
    const checkpointPath = path.join(this.checkpointsDir, `${operationId}.json`);

    if (!fs.existsSync(checkpointPath)) {
      return null;
    }

    try {
      const data = fs.readFileSync(checkpointPath, 'utf8');
      const checkpoint = JSON.parse(data) as OperationCheckpoint;

      // Convert Buffer fields from JSON
      if (checkpoint.salt) {
        checkpoint.salt = Buffer.from(checkpoint.salt);
      }
      if (checkpoint.iv) {
        checkpoint.iv = Buffer.from(checkpoint.iv);
      }

      return checkpoint;
    } catch (error) {
      return null;
    }
  }

  async resumeOperation(
    operationId: string,
    password: string,
    onProgress?: (progress: number) => void,
  ): Promise<void> {
    const checkpoint = await this.loadCheckpoint(operationId);

    if (!checkpoint) {
      throw new Error('Checkpoint not found');
    }

    // Verify password
    if (!this.verifyPassword(password, checkpoint.password)) {
      throw new Error('Invalid password for resuming operation');
    }

    // Validate that input file still exists and hasn't changed
    const resumeInfo = await this.canResumeOperation(operationId, password);
    if (!resumeInfo.canResume) {
      throw new Error(resumeInfo.reason || 'Cannot resume operation');
    }

    try {
      if (checkpoint.operation === 'encrypt') {
        await this.resumeEncryption(checkpoint, password, onProgress);
      } else {
        await this.resumeDecryption(checkpoint, password, onProgress);
      }

      // Clean up checkpoint after successful completion
      await this.cleanupCheckpoint(operationId);
    } catch (error) {
      // Update checkpoint with current progress if needed
      throw error;
    }
  }

  async canResumeOperation(
    operationId: string,
    password: string,
  ): Promise<ResumeInfo> {
    const checkpoint = await this.loadCheckpoint(operationId);

    if (!checkpoint) {
      return { canResume: false, reason: 'Checkpoint not found' };
    }

    // Verify password
    if (!this.verifyPassword(password, checkpoint.password)) {
      return { canResume: false, reason: 'Invalid password' };
    }

    // Check if input file still exists
    if (!fs.existsSync(checkpoint.inputPath)) {
      return { canResume: false, reason: 'Input file no longer exists' };
    }

    // Check if input file size matches
    const currentSize = fs.statSync(checkpoint.inputPath).size;
    if (currentSize !== checkpoint.totalBytes) {
      return { canResume: false, reason: 'Input file has been modified' };
    }

    // Check if temp data exists if needed
    if (checkpoint.tempDataPath && !fs.existsSync(checkpoint.tempDataPath)) {
      return { canResume: false, reason: 'Temporary data lost' };
    }

    // Check if checkpoint is not too old (optional)
    const daysSinceCheckpoint = (Date.now() - checkpoint.timestamp) / (1000 * 60 * 60 * 24);
    if (daysSinceCheckpoint > 7) {
      return { canResume: false, reason: 'Checkpoint is too old (>7 days)' };
    }

    return { canResume: true, checkpoint };
  }

  private async resumeEncryption(
    checkpoint: OperationCheckpoint,
    password: string,
    onProgress?: (progress: number) => void,
  ): Promise<void> {
    const { inputPath, outputPath, bytesProcessed, totalBytes } = checkpoint;

    // Resume from where we left off
    const inputStream = fs.createReadStream(inputPath, { start: bytesProcessed });
    const outputStream = fs.createWriteStream(outputPath, { flags: 'a' }); // Append mode

    let processed = bytesProcessed;

    // Set up cipher with saved salt and IV
    const key = crypto.pbkdf2Sync(password, checkpoint.salt!, 100000, 32, 'sha256');
    const cipher = crypto.createCipheriv(checkpoint.algorithm, key, checkpoint.iv!);

    inputStream.on('data', (chunk: Buffer) => {
      processed += chunk.length;
      const progress = processed / totalBytes;

      if (onProgress) {
        onProgress(progress);
      }

      // Save checkpoint periodically
      if (processed % this.checkpointInterval === 0) {
        this.saveCheckpoint(
          checkpoint.id,
          checkpoint.operation,
          inputPath,
          outputPath,
          password,
          progress,
          processed,
          totalBytes,
          checkpoint.algorithm,
          checkpoint.salt,
          checkpoint.iv,
        ).catch(() => {
          // Handle checkpoint save error silently
        });
      }
    });

    return new Promise((resolve, reject) => {
      inputStream.pipe(cipher).pipe(outputStream);

      outputStream.on('finish', () => {
        // Add authentication tag for GCM mode
        if (checkpoint.algorithm.includes('gcm')) {
          const authTag = cipher.getAuthTag();
          fs.appendFileSync(outputPath, authTag);
        }
        resolve();
      });

      outputStream.on('error', reject);
      inputStream.on('error', reject);
      cipher.on('error', reject);
    });
  }

  private async resumeDecryption(
    checkpoint: OperationCheckpoint,
    password: string,
    onProgress?: (progress: number) => void,
  ): Promise<void> {
    const { inputPath, outputPath, bytesProcessed, totalBytes } = checkpoint;

    // For decryption, we need to handle the authentication tag and resume properly
    const key = crypto.pbkdf2Sync(password, checkpoint.salt!, 100000, 32, 'sha256');
    const decipher = crypto.createDecipheriv(checkpoint.algorithm, key, checkpoint.iv!);

    // Set authentication tag if GCM mode
    if (checkpoint.algorithm.includes('gcm')) {
      const stats = fs.statSync(inputPath);
      const authTag = Buffer.alloc(16);
      const fd = fs.openSync(inputPath, 'r');
      fs.readSync(fd, authTag, 0, 16, stats.size - 16);
      fs.closeSync(fd);
      decipher.setAuthTag(authTag);
    }

    // Calculate the actual data end position (excluding metadata)
    const stats = fs.statSync(inputPath);
    const dataEndPos = stats.size - (checkpoint.algorithm.includes('gcm') ? 16 : 0);
    const remainingStart = 48 + bytesProcessed; // 48 bytes for salt+iv

    const inputStream = fs.createReadStream(inputPath, {
      start: remainingStart,
      end: dataEndPos - 1
    });
    const outputStream = fs.createWriteStream(outputPath, { flags: 'a' });

    let processed = bytesProcessed;

    inputStream.on('data', (chunk: Buffer) => {
      processed += chunk.length;
      const progress = processed / (totalBytes - 48);

      if (onProgress) {
        onProgress(progress);
      }
    });

    return new Promise((resolve, reject) => {
      inputStream.pipe(decipher).pipe(outputStream);

      outputStream.on('finish', resolve);
      outputStream.on('error', reject);
      inputStream.on('error', reject);
      decipher.on('error', reject);
    });
  }

  async cleanupCheckpoint(operationId: string): Promise<void> {
    const checkpointPath = path.join(this.checkpointsDir, `${operationId}.json`);
    const tempDataPath = path.join(this.tempDir, `${operationId}.temp`);

    // Remove checkpoint file
    if (fs.existsSync(checkpointPath)) {
      fs.unlinkSync(checkpointPath);
    }

    // Remove temporary data
    if (fs.existsSync(tempDataPath)) {
      fs.unlinkSync(tempDataPath);
    }
  }

  async listAvailableCheckpoints(): Promise<OperationCheckpoint[]> {
    const checkpoints: OperationCheckpoint[] = [];

    if (!fs.existsSync(this.checkpointsDir)) {
      return checkpoints;
    }

    const files = fs.readdirSync(this.checkpointsDir);

    for (const file of files) {
      if (file.endsWith('.json')) {
        const operationId = file.replace('.json', '');
        const checkpoint = await this.loadCheckpoint(operationId);
        if (checkpoint) {
          checkpoints.push(checkpoint);
        }
      }
    }

    return checkpoints.sort((a, b) => b.timestamp - a.timestamp);
  }

  private encryptPassword(password: string): string {
    // Create a hash of the password for storage (don't store plain text)
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  private verifyPassword(password: string, storedHash: string): boolean {
    const hash = crypto.createHash('sha256').update(password).digest('hex');
    return hash === storedHash;
  }

  async cleanupOldCheckpoints(maxAgeInDays = 7): Promise<void> {
    const checkpoints = await this.listAvailableCheckpoints();
    const cutoffTime = Date.now() - (maxAgeInDays * 24 * 60 * 60 * 1000);

    for (const checkpoint of checkpoints) {
      if (checkpoint.timestamp < cutoffTime) {
        await this.cleanupCheckpoint(checkpoint.id);
      }
    }
  }
}
