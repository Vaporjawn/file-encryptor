import { Worker } from 'worker_threads';
import path from 'path';
import { EventEmitter } from 'events';

export interface WorkerTask {
  id: string;
  type: 'encrypt' | 'decrypt';
  inputPath: string;
  outputPath: string;
  password: string;
}

export interface WorkerProgress {
  taskId: string;
  progress: number;
  status: 'processing' | 'completed' | 'error';
  error?: string;
}

export interface WorkerResult {
  taskId: string;
  success: boolean;
  error?: string;
  outputPath?: string;
}

export class EncryptionWorkerManager extends EventEmitter {
  private workers: Map<string, Worker> = new Map();
  private activeTasksQueue: WorkerTask[] = [];
  private maxWorkers = 4;
  private currentWorkerCount = 0;

  constructor(maxWorkers = 4) {
    super();
    this.maxWorkers = maxWorkers;
  }

  async processFileInBackground(
    filePath: string,
    outputPath: string,
    password: string,
    operation: 'encrypt' | 'decrypt',
  ): Promise<string> {
    const taskId = this.generateTaskId();

    const task: WorkerTask = {
      id: taskId,
      type: operation,
      inputPath: filePath,
      outputPath,
      password,
    };

    return new Promise((resolve, reject) => {
      // Set up event listeners for this specific task
      const onProgress = (progress: WorkerProgress) => {
        if (progress.taskId === taskId) {
          this.emit('progress', progress);

          if (progress.status === 'completed') {
            this.removeListeners();
            resolve(outputPath);
          } else if (progress.status === 'error') {
            this.removeListeners();
            reject(new Error(progress.error || 'Unknown worker error'));
          }
        }
      };

      const onError = (error: Error) => {
        this.removeListeners();
        reject(error);
      };

      const removeListeners = () => {
        this.off('workerProgress', onProgress);
        this.off('workerError', onError);
      };

      this.on('workerProgress', onProgress);
      this.on('workerError', onError);

      // Queue the task
      this.queueTask(task);
    });
  }

  private queueTask(task: WorkerTask): void {
    this.activeTasksQueue.push(task);
    this.processQueue();
  }

  private processQueue(): void {
    if (
      this.activeTasksQueue.length === 0 ||
      this.currentWorkerCount >= this.maxWorkers
    ) {
      return;
    }

    const task = this.activeTasksQueue.shift();
    if (!task) return;

    this.startWorker(task);
  }

  private startWorker(task: WorkerTask): void {
    const workerScript = path.join(__dirname, 'encryptionWorker.js');
    const worker = new Worker(workerScript, {
      workerData: task,
    });

    this.workers.set(task.id, worker);
    this.currentWorkerCount++;

    worker.on('message', (data: WorkerProgress) => {
      this.emit('workerProgress', data);

      if (data.status === 'completed' || data.status === 'error') {
        this.cleanupWorker(task.id);
        this.processQueue(); // Process next task in queue
      }
    });

    worker.on('error', (error) => {
      this.emit('workerError', error);
      this.cleanupWorker(task.id);
      this.processQueue();
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        this.emit('workerError', new Error(`Worker stopped with exit code ${code}`));
      }
      this.cleanupWorker(task.id);
      this.processQueue();
    });
  }

  private cleanupWorker(taskId: string): void {
    const worker = this.workers.get(taskId);
    if (worker) {
      worker.terminate();
      this.workers.delete(taskId);
      this.currentWorkerCount--;
    }
  }

  cancelTask(taskId: string): void {
    const worker = this.workers.get(taskId);
    if (worker) {
      worker.postMessage({ type: 'cancel' });
      this.cleanupWorker(taskId);
    }

    // Remove from queue if not started yet
    this.activeTasksQueue = this.activeTasksQueue.filter(
      (task) => task.id !== taskId,
    );
  }

  cancelAllTasks(): void {
    // Cancel all active workers
    this.workers.forEach((worker, taskId) => {
      worker.postMessage({ type: 'cancel' });
      this.cleanupWorker(taskId);
    });

    // Clear the queue
    this.activeTasksQueue = [];
  }

  getActiveTaskCount(): number {
    return this.currentWorkerCount;
  }

  getQueuedTaskCount(): number {
    return this.activeTasksQueue.length;
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Method to get system capabilities for optimal worker count
  static getOptimalWorkerCount(): number {
    const cpuCount = require('os').cpus().length;
    // Use half the CPU cores for encryption, minimum 2, maximum 8
    return Math.max(2, Math.min(8, Math.floor(cpuCount / 2)));
  }

  // Method to estimate task completion time
  estimateTaskTime(fileSizeBytes: number): number {
    // Rough estimate: 10MB per second processing speed per worker
    const processingSpeedPerWorker = 10 * 1024 * 1024; // 10MB/s
    const estimatedSeconds = fileSizeBytes / processingSpeedPerWorker;
    return Math.max(estimatedSeconds, 5); // Minimum 5 seconds
  }

  // Get performance statistics
  getPerformanceStats(): {
    activeWorkers: number;
    queuedTasks: number;
    maxWorkers: number;
    systemCpuCount: number;
  } {
    return {
      activeWorkers: this.currentWorkerCount,
      queuedTasks: this.activeTasksQueue.length,
      maxWorkers: this.maxWorkers,
      systemCpuCount: require('os').cpus().length,
    };
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    return new Promise((resolve) => {
      if (this.currentWorkerCount === 0) {
        resolve();
        return;
      }

      // Set a timeout for forceful shutdown
      const timeout = setTimeout(() => {
        this.cancelAllTasks();
        resolve();
      }, 30000); // 30 second timeout

      // Wait for all workers to complete
      const checkCompletion = () => {
        if (this.currentWorkerCount === 0) {
          clearTimeout(timeout);
          resolve();
        } else {
          setTimeout(checkCompletion, 100);
        }
      };

      checkCompletion();
    });
  }
}
