import { parentPort, workerData } from 'worker_threads';
import { encryptFile, decryptFile } from './crypto';
import type { WorkerTask, WorkerProgress } from './encryptionWorkerManager';

// Handle the case where parentPort might be null
if (!parentPort) {
  throw new Error('This script must be run as a worker thread');
}

const task: WorkerTask = workerData;
let shouldCancel = false;

// Listen for cancellation messages
parentPort.on('message', (data) => {
  if (data.type === 'cancel') {
    shouldCancel = true;
  }
});

async function processFile(): Promise<void> {
  try {
    const progress: WorkerProgress = {
      taskId: task.id,
      progress: 0,
      status: 'processing',
    };

    // Send initial progress
    parentPort!.postMessage(progress);

    // Progress callback function
    const onProgress = (fileProgress: number) => {
      if (shouldCancel) {
        throw new Error('Operation cancelled by user');
      }

      progress.progress = fileProgress * 100;
      parentPort!.postMessage(progress);
    };

    // Perform the encryption/decryption operation
    if (task.type === 'encrypt') {
      await encryptFile(task.inputPath, task.outputPath, task.password, onProgress);
    } else {
      await decryptFile(task.inputPath, task.outputPath, task.password, onProgress);
    }

    // Send completion message
    progress.progress = 100;
    progress.status = 'completed';
    parentPort!.postMessage(progress);
  } catch (error) {
    // Send error message
    const errorProgress: WorkerProgress = {
      taskId: task.id,
      progress: 0,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
    parentPort!.postMessage(errorProgress);
  }
}

// Start processing
processFile().catch((error) => {
  const errorProgress: WorkerProgress = {
    taskId: task.id,
    progress: 0,
    status: 'error',
    error: error instanceof Error ? error.message : 'Unknown error occurred',
  };

  if (parentPort) {
    parentPort.postMessage(errorProgress);
  }
});
