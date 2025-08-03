import { encryptFile, decryptFile } from './crypto';
import { FileHistoryManager } from './fileHistory';
import path from 'path';

export interface BatchFileInfo {
  inputPath: string;
  outputPath: string;
  name: string;
  size: number;
}

export interface BatchProgress {
  fileIndex: number;
  fileName: string;
  fileProgress: number;
  overallProgress: number;
  completed: number;
  total: number;
  errors: string[];
}

export interface BatchOptions {
  operation: 'encrypt' | 'decrypt';
  password: string;
  outputDirectory?: string;
  preserveStructure?: boolean;
  overwriteExisting?: boolean;
}

export class BatchProcessor {
  private isProcessing = false;
  private shouldCancel = false;
  private fileHistoryManager: FileHistoryManager;

  constructor() {
    this.fileHistoryManager = new FileHistoryManager();
  }

  async processFiles(
    files: BatchFileInfo[],
    options: BatchOptions,
    onProgress: (progress: BatchProgress) => void,
  ): Promise<void> {
    if (this.isProcessing) {
      throw new Error('Batch processing is already in progress');
    }

    this.isProcessing = true;
    this.shouldCancel = false;

    const progress: BatchProgress = {
      fileIndex: 0,
      fileName: '',
      fileProgress: 0,
      overallProgress: 0,
      completed: 0,
      total: files.length,
      errors: [],
    };

    try {
      for (let i = 0; i < files.length; i++) {
        if (this.shouldCancel) {
          break;
        }

        const file = files[i];
        progress.fileIndex = i;
        progress.fileName = file.name;
        progress.fileProgress = 0;
        progress.overallProgress = (i / files.length) * 100;
        onProgress({ ...progress });

        try {
          await this.processingleFile(
            file,
            options,
            (fileProgress: number) => {
              progress.fileProgress = fileProgress * 100;
              progress.overallProgress = ((i + fileProgress) / files.length) * 100;
              onProgress({ ...progress });
            },
          );

          progress.completed++;
          this.fileHistoryManager.addToHistory(file.inputPath, options.operation);
        } catch (error) {
          const errorMessage = `Failed to ${options.operation} ${file.name}: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`;
          progress.errors.push(errorMessage);
        }
      }

      progress.overallProgress = 100;
      onProgress({ ...progress });
    } finally {
      this.isProcessing = false;
    }
  }

  private async processingleFile(
    file: BatchFileInfo,
    options: BatchOptions,
    onProgress: (progress: number) => void,
  ): Promise<void> {
    // Check if output file already exists
    if (!options.overwriteExisting && require('fs').existsSync(file.outputPath)) {
      throw new Error(`Output file already exists: ${file.outputPath}`);
    }

    // Ensure output directory exists
    const outputDir = path.dirname(file.outputPath);
    if (!require('fs').existsSync(outputDir)) {
      require('fs').mkdirSync(outputDir, { recursive: true });
    }

    if (options.operation === 'encrypt') {
      await encryptFile(file.inputPath, file.outputPath, options.password, onProgress);
    } else {
      await decryptFile(file.inputPath, file.outputPath, options.password, onProgress);
    }
  }

  generateOutputPaths(
    inputPaths: string[],
    options: BatchOptions,
  ): BatchFileInfo[] {
    return inputPaths.map((inputPath) => {
      const stats = require('fs').statSync(inputPath);
      const fileName = path.basename(inputPath);
      const fileNameWithoutExt = path.parse(fileName).name;
      const fileExt = path.parse(fileName).ext;

      let outputFileName: string;
      let outputPath: string;

      if (options.operation === 'encrypt') {
        outputFileName = `${fileName}.enc`;
      } else {
        // For decryption, remove .enc extension if present
        if (fileExt === '.enc') {
          outputFileName = fileNameWithoutExt;
        } else {
          outputFileName = `${fileNameWithoutExt}_decrypted${fileExt}`;
        }
      }

      if (options.outputDirectory) {
        if (options.preserveStructure) {
          // Preserve directory structure relative to a common base
          const relativePath = path.relative(process.cwd(), inputPath);
          const relativeDir = path.dirname(relativePath);
          outputPath = path.join(options.outputDirectory, relativeDir, outputFileName);
        } else {
          outputPath = path.join(options.outputDirectory, outputFileName);
        }
      } else {
        // Place in same directory as input file
        outputPath = path.join(path.dirname(inputPath), outputFileName);
      }

      return {
        inputPath,
        outputPath,
        name: fileName,
        size: stats.size,
      };
    });
  }

  cancel(): void {
    this.shouldCancel = true;
  }

  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }

  // Utility method to estimate total processing time
  estimateProcessingTime(files: BatchFileInfo[]): number {
    // Rough estimate: 1MB per second processing speed
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const estimatedSeconds = totalSize / (1024 * 1024); // 1MB/s
    return Math.max(estimatedSeconds, files.length * 2); // Minimum 2 seconds per file
  }

  // Method to validate all files before processing
  validateFiles(files: BatchFileInfo[], options: BatchOptions): string[] {
    const errors: string[] = [];

    files.forEach((file) => {
      // Check if input file exists and is readable
      try {
        require('fs').accessSync(file.inputPath, require('fs').constants.R_OK);
      } catch {
        errors.push(`Cannot read input file: ${file.inputPath}`);
      }

      // Check if output directory is writable
      const outputDir = path.dirname(file.outputPath);
      try {
        require('fs').accessSync(outputDir, require('fs').constants.W_OK);
      } catch {
        errors.push(`Cannot write to output directory: ${outputDir}`);
      }

      // Check for output file conflicts
      if (!options.overwriteExisting && require('fs').existsSync(file.outputPath)) {
        errors.push(`Output file already exists: ${file.outputPath}`);
      }
    });

    return errors;
  }
}
