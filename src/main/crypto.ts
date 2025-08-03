import crypto from 'crypto';
import fs from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { dialog, shell } from 'electron';
import path from 'path';

const pipe = promisify(pipeline);

export async function encryptFile(
  inputPath: string,
  outputPath: string,
  password: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const algorithm = 'aes-256-gcm';
  const salt = crypto.randomBytes(32);
  const iv = crypto.randomBytes(16);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);
  const total = fs.statSync(inputPath).size;
  let processed = 0;

  input.on('data', (chunk) => {
    processed += chunk.length;
    if (onProgress) onProgress(processed / total);
  });

  output.write(salt);
  output.write(iv);

  await pipe(input, cipher, output);
  const authTag = cipher.getAuthTag();
  output.write(authTag);

  // Optionally trigger download of the encrypted file
  return outputPath;
}

export async function encryptFileWithDownload(
  inputPath: string,
  password: string,
  onProgress?: (progress: number) => void,
  suggestedFileName?: string,
): Promise<string | null> {
  // Generate suggested output filename
  const inputFileName = path.basename(inputPath);
  const defaultOutputName = suggestedFileName || `${inputFileName}.enc`;

  // Show save dialog to let user choose where to save the encrypted file
  const result = await dialog.showSaveDialog({
    title: 'Save Encrypted File',
    defaultPath: defaultOutputName,
    filters: [
      { name: 'Encrypted Files', extensions: ['enc'] },
      { name: 'All Files', extensions: ['*'] },
    ],
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  const outputPath = result.filePath;

  try {
    // Encrypt the file
    await encryptFile(inputPath, outputPath, password, onProgress);

    // Show success notification and option to open file location
    const openLocation = await dialog.showMessageBox({
      type: 'info',
      title: 'Encryption Complete',
      message: 'File encrypted successfully!',
      detail: `Encrypted file saved to: ${outputPath}`,
      buttons: ['OK', 'Show in Folder'],
      defaultId: 0,
    });

    if (openLocation.response === 1) {
      // Show the file in the system file manager
      shell.showItemInFolder(outputPath);
    }

    return outputPath;
  } catch (error) {
    // Show error dialog
    await dialog.showErrorBox(
      'Encryption Failed',
      `Failed to encrypt file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    throw error;
  }
}

export async function decryptFile(
  inputPath: string,
  outputPath: string,
  password: string,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const algorithm = 'aes-256-gcm';
  const input = fs.createReadStream(inputPath);
  const output = fs.createWriteStream(outputPath);
  const fd = fs.openSync(inputPath, 'r');
  const salt = Buffer.alloc(32);
  const iv = Buffer.alloc(16);
  fs.readSync(fd, salt, 0, 32, 0);
  fs.readSync(fd, iv, 0, 16, 32);
  const key = crypto.pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  const authTag = Buffer.alloc(16);
  const stats = fs.statSync(inputPath);
  fs.readSync(fd, authTag, 0, 16, stats.size - 16);
  fs.closeSync(fd);
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);
  let processed = 0;
  const total = stats.size;
  input.on('data', (chunk) => {
    processed += chunk.length;
    if (onProgress) onProgress(processed / total);
  });
  // Skip salt+iv (48 bytes) and authTag (last 16 bytes)
  const fileStream = fs.createReadStream(inputPath, {
    start: 48,
    end: stats.size - 17,
  });
  await pipe(fileStream, decipher, output);

  return outputPath;
}

export async function decryptFileWithDownload(
  inputPath: string,
  password: string,
  onProgress?: (progress: number) => void,
  suggestedFileName?: string,
): Promise<string | null> {
  // Generate suggested output filename (remove .enc extension if present)
  const inputFileName = path.basename(inputPath);
  let defaultOutputName = suggestedFileName;

  if (!defaultOutputName) {
    if (inputFileName.endsWith('.enc')) {
      defaultOutputName = inputFileName.slice(0, -4); // Remove .enc extension
    } else {
      defaultOutputName = `${inputFileName}_decrypted`;
    }
  }

  // Show save dialog to let user choose where to save the decrypted file
  const result = await dialog.showSaveDialog({
    title: 'Save Decrypted File',
    defaultPath: defaultOutputName,
    filters: [{ name: 'All Files', extensions: ['*'] }],
  });

  if (result.canceled || !result.filePath) {
    return null;
  }

  const outputPath = result.filePath;

  try {
    // Decrypt the file
    await decryptFile(inputPath, outputPath, password, onProgress);

    // Show success notification and option to open file location
    const openLocation = await dialog.showMessageBox({
      type: 'info',
      title: 'Decryption Complete',
      message: 'File decrypted successfully!',
      detail: `Decrypted file saved to: ${outputPath}`,
      buttons: ['OK', 'Show in Folder', 'Open File'],
      defaultId: 0,
    });

    if (openLocation.response === 1) {
      // Show the file in the system file manager
      shell.showItemInFolder(outputPath);
    } else if (openLocation.response === 2) {
      // Open the decrypted file with default application
      shell.openPath(outputPath);
    }

    return outputPath;
  } catch (error) {
    // Show error dialog
    await dialog.showErrorBox(
      'Decryption Failed',
      `Failed to decrypt file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
    throw error;
  }
}

// Utility function to get file info for download preparation
export function getFileInfo(filePath: string): {
  name: string;
  size: number;
  extension: string;
  isEncrypted: boolean;
} {
  const stats = fs.statSync(filePath);
  const fileName = path.basename(filePath);
  const extension = path.extname(fileName);
  const isEncrypted = extension === '.enc';

  return {
    name: fileName,
    size: stats.size,
    extension,
    isEncrypted,
  };
}

// Function to automatically suggest output filename
export function suggestOutputFilename(
  inputPath: string,
  operation: 'encrypt' | 'decrypt',
): string {
  const fileName = path.basename(inputPath);

  if (operation === 'encrypt') {
    return `${fileName}.enc`;
  }

  // For decryption
  if (fileName.endsWith('.enc')) {
    return fileName.slice(0, -4); // Remove .enc extension
  }

  const { name: nameWithoutExt, ext } = path.parse(fileName);
  return `${nameWithoutExt}_decrypted${ext}`;
}

// Function to batch process files with download
export async function batchProcessWithDownload(
  files: string[],
  operation: 'encrypt' | 'decrypt',
  password: string,
  outputDirectory?: string,
  onProgress?: (
    fileIndex: number,
    fileProgress: number,
    fileName: string,
  ) => void,
): Promise<string[]> {
  const processedFiles: string[] = [];

  // If no output directory specified, ask user to choose one
  let targetDirectory = outputDirectory;
  if (!targetDirectory) {
    const result = await dialog.showOpenDialog({
      title: `Select Output Directory for ${operation === 'encrypt' ? 'Encrypted' : 'Decrypted'} Files`,
      properties: ['openDirectory', 'createDirectory'],
    });

    if (result.canceled || !result.filePaths[0]) {
      throw new Error('No output directory selected');
    }

    [targetDirectory] = result.filePaths;
  }

  // Process each file
  for (let i = 0; i < files.length; i += 1) {
    const inputPath = files[i];
    const suggestedName = suggestOutputFilename(inputPath, operation);
    const outputPath = path.join(targetDirectory, suggestedName);

    try {
      const fileProgressCallback = (progress: number) => {
        if (onProgress) {
          onProgress(i, progress, path.basename(inputPath));
        }
      };

      if (operation === 'encrypt') {
        // eslint-disable-next-line no-await-in-loop
        await encryptFile(
          inputPath,
          outputPath,
          password,
          fileProgressCallback,
        );
      } else {
        // eslint-disable-next-line no-await-in-loop
        await decryptFile(
          inputPath,
          outputPath,
          password,
          fileProgressCallback,
        );
      }

      processedFiles.push(outputPath);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`Failed to ${operation} ${inputPath}:`, error);
      // Continue processing other files even if one fails
    }
  }

  // Show completion dialog
  if (processedFiles.length > 0) {
    const message = `Successfully ${operation === 'encrypt' ? 'encrypted' : 'decrypted'} ${processedFiles.length} out of ${files.length} files.`;
    const openLocation = await dialog.showMessageBox({
      type: 'info',
      title: `Batch ${operation === 'encrypt' ? 'Encryption' : 'Decryption'} Complete`,
      message,
      detail: `Files saved to: ${targetDirectory}`,
      buttons: ['OK', 'Show in Folder'],
      defaultId: 0,
    });

    if (openLocation.response === 1) {
      shell.showItemInFolder(targetDirectory);
    }
  }

  return processedFiles;
}

// Function to verify file encryption status
export function isFileEncrypted(filePath: string): boolean {
  try {
    const fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(48); // Read first 48 bytes (salt + iv)
    fs.readSync(fd, buffer, 0, 48, 0);
    fs.closeSync(fd);

    // Check if the file has the expected structure for our encrypted files
    // This is a basic check - in practice, you might want more sophisticated validation
    const stats = fs.statSync(filePath);
    return stats.size > 64; // At least salt(32) + iv(16) + authTag(16) bytes
  } catch {
    return false;
  }
}
