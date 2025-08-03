import crypto from 'crypto';

/**
 * SecureBuffer class for handling sensitive data in memory
 * Provides secure allocation, zeroing, and automatic cleanup
 */
export class SecureBuffer {
  private buffer: Buffer;
  private isCleared = false;

  constructor(size: number) {
    // Allocate uninitialized buffer for better security
    this.buffer = Buffer.allocUnsafe(size);

    // Immediately fill with random data to prevent memory dumps
    crypto.randomFillSync(this.buffer);
  }

  /**
   * Write data to the secure buffer
   */
  write(data: Buffer | string, offset = 0): number {
    if (this.isCleared) {
      throw new Error('Cannot write to cleared SecureBuffer');
    }

    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');

    if (offset + dataBuffer.length > this.buffer.length) {
      throw new Error('Data exceeds buffer capacity');
    }

    return dataBuffer.copy(this.buffer, offset);
  }

  /**
   * Read data from the secure buffer
   */
  read(start = 0, end?: number): Buffer {
    if (this.isCleared) {
      throw new Error('Cannot read from cleared SecureBuffer');
    }

    return this.buffer.slice(start, end);
  }

  /**
   * Get buffer size
   */
  get length(): number {
    return this.buffer.length;
  }

  /**
   * Check if buffer has been cleared
   */
  get cleared(): boolean {
    return this.isCleared;
  }

  /**
   * Securely clear the buffer contents
   */
  clear(): void {
    if (!this.isCleared) {
      // Multiple passes with different patterns for secure deletion
      this.buffer.fill(0x00);
      this.buffer.fill(0xFF);
      crypto.randomFillSync(this.buffer);
      this.buffer.fill(0x00);

      this.isCleared = true;
    }
  }

  /**
   * Convert to string (use with caution)
   */
  toString(encoding: BufferEncoding = 'utf8'): string {
    if (this.isCleared) {
      throw new Error('Cannot convert cleared SecureBuffer to string');
    }

    return this.buffer.toString(encoding);
  }

  /**
   * Copy data to another SecureBuffer
   */
  copyTo(target: SecureBuffer, targetStart = 0, sourceStart = 0, sourceEnd?: number): void {
    if (this.isCleared) {
      throw new Error('Cannot copy from cleared SecureBuffer');
    }

    if (target.cleared) {
      throw new Error('Cannot copy to cleared SecureBuffer');
    }

    this.buffer.copy(target.buffer, targetStart, sourceStart, sourceEnd);
  }

  /**
   * Compare with another SecureBuffer using constant-time comparison
   */
  equals(other: SecureBuffer): boolean {
    if (this.isCleared || other.cleared) {
      return false;
    }

    if (this.buffer.length !== other.buffer.length) {
      return false;
    }

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(this.buffer, other.buffer);
  }

  /**
   * Slice the buffer (creates a new SecureBuffer)
   */
  slice(start = 0, end?: number): SecureBuffer {
    if (this.isCleared) {
      throw new Error('Cannot slice cleared SecureBuffer');
    }

    const sliced = this.buffer.slice(start, end);
    const secureSlice = new SecureBuffer(sliced.length);
    sliced.copy(secureSlice.buffer);

    // Clear the temporary slice
    sliced.fill(0);

    return secureSlice;
  }
}

/**
 * SecureString class for handling sensitive string data
 */
export class SecureString {
  private secureBuffer: SecureBuffer;

  constructor(value: string) {
    const buffer = Buffer.from(value, 'utf8');
    this.secureBuffer = new SecureBuffer(buffer.length);
    this.secureBuffer.write(buffer);

    // Clear the original buffer
    buffer.fill(0);
  }

  /**
   * Get the string value
   */
  getValue(): string {
    return this.secureBuffer.toString('utf8');
  }

  /**
   * Get the length of the string
   */
  get length(): number {
    return this.secureBuffer.length;
  }

  /**
   * Check if the string has been cleared
   */
  get cleared(): boolean {
    return this.secureBuffer.cleared;
  }

  /**
   * Securely clear the string
   */
  clear(): void {
    this.secureBuffer.clear();
  }

  /**
   * Compare with another SecureString
   */
  equals(other: SecureString | string): boolean {
    if (typeof other === 'string') {
      const tempSecure = new SecureString(other);
      const result = this.secureBuffer.equals(tempSecure.secureBuffer);
      tempSecure.clear();
      return result;
    }

    return this.secureBuffer.equals(other.secureBuffer);
  }

  /**
   * Create a copy of this SecureString
   */
  clone(): SecureString {
    if (this.cleared) {
      throw new Error('Cannot clone cleared SecureString');
    }

    const copy = new SecureString('');
    copy.secureBuffer.clear();
    copy.secureBuffer = this.secureBuffer.slice();
    return copy;
  }
}

/**
 * SecureMemoryManager for managing multiple secure buffers
 */
export class SecureMemoryManager {
  private buffers = new Set<SecureBuffer>();
  private strings = new Set<SecureString>();
  private isDestroyed = false;

  /**
   * Create a new SecureBuffer and track it
   */
  createBuffer(size: number): SecureBuffer {
    if (this.isDestroyed) {
      throw new Error('SecureMemoryManager has been destroyed');
    }

    const buffer = new SecureBuffer(size);
    this.buffers.add(buffer);
    return buffer;
  }

  /**
   * Create a new SecureString and track it
   */
  createString(value: string): SecureString {
    if (this.isDestroyed) {
      throw new Error('SecureMemoryManager has been destroyed');
    }

    const secureString = new SecureString(value);
    this.strings.add(secureString);
    return secureString;
  }

  /**
   * Remove a buffer from tracking
   */
  releaseBuffer(buffer: SecureBuffer): void {
    buffer.clear();
    this.buffers.delete(buffer);
  }

  /**
   * Remove a string from tracking
   */
  releaseString(secureString: SecureString): void {
    secureString.clear();
    this.strings.delete(secureString);
  }

  /**
   * Clear all tracked buffers and strings
   */
  clearAll(): void {
    for (const buffer of this.buffers) {
      buffer.clear();
    }

    for (const string of this.strings) {
      string.clear();
    }

    this.buffers.clear();
    this.strings.clear();
  }

  /**
   * Destroy the manager and clear all memory
   */
  destroy(): void {
    if (!this.isDestroyed) {
      this.clearAll();
      this.isDestroyed = true;
    }
  }

  /**
   * Get memory usage statistics
   */
  getStats(): {
    bufferCount: number;
    stringCount: number;
    totalBufferSize: number;
    clearedBuffers: number;
    clearedStrings: number;
  } {
    let totalBufferSize = 0;
    let clearedBuffers = 0;
    let clearedStrings = 0;

    for (const buffer of this.buffers) {
      totalBufferSize += buffer.length;
      if (buffer.cleared) {
        clearedBuffers++;
      }
    }

    for (const string of this.strings) {
      if (string.cleared) {
        clearedStrings++;
      }
    }

    return {
      bufferCount: this.buffers.size,
      stringCount: this.strings.size,
      totalBufferSize,
      clearedBuffers,
      clearedStrings,
    };
  }
}

/**
 * Global secure memory manager instance
 */
export const globalSecureMemory = new SecureMemoryManager();

/**
 * Utility function to securely wipe a regular Buffer
 */
export function secureWipe(buffer: Buffer): void {
  if (buffer && buffer.length > 0) {
    buffer.fill(0x00);
    buffer.fill(0xFF);
    crypto.randomFillSync(buffer);
    buffer.fill(0x00);
  }
}

/**
 * Utility function to create a temporary secure buffer for operations
 */
export function withSecureBuffer<T>(
  size: number,
  operation: (buffer: SecureBuffer) => T,
): T {
  const buffer = new SecureBuffer(size);
  try {
    return operation(buffer);
  } finally {
    buffer.clear();
  }
}

/**
 * Utility function to create a temporary secure string for operations
 */
export function withSecureString<T>(
  value: string,
  operation: (secureString: SecureString) => T,
): T {
  const secureString = new SecureString(value);
  try {
    return operation(secureString);
  } finally {
    secureString.clear();
  }
}

/**
 * Memory pressure monitoring and cleanup
 */
export class MemoryPressureMonitor {
  private static instance: MemoryPressureMonitor | null = null;
  private cleanupCallbacks: Array<() => void> = [];
  private monitoringInterval: NodeJS.Timeout | null = null;

  static getInstance(): MemoryPressureMonitor {
    if (!this.instance) {
      this.instance = new MemoryPressureMonitor();
    }
    return this.instance;
  }

  /**
   * Start monitoring memory pressure
   */
  startMonitoring(intervalMs = 30000): void {
    if (this.monitoringInterval) {
      return; // Already monitoring
    }

    this.monitoringInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
      const heapTotalMB = memUsage.heapTotal / 1024 / 1024;

      // Trigger cleanup if heap usage is above 80%
      if (heapUsedMB / heapTotalMB > 0.8) {
        this.triggerCleanup();
      }
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Register a cleanup callback
   */
  onMemoryPressure(callback: () => void): void {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Trigger all cleanup callbacks
   */
  private triggerCleanup(): void {
    for (const callback of this.cleanupCallbacks) {
      try {
        callback();
      } catch (error) {
        // Ignore cleanup errors to prevent cascading failures
      }
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Get current memory statistics
   */
  getMemoryStats(): NodeJS.MemoryUsage {
    return process.memoryUsage();
  }
}

// Register global cleanup handler
const memoryMonitor = MemoryPressureMonitor.getInstance();
memoryMonitor.onMemoryPressure(() => {
  globalSecureMemory.clearAll();
});

// Start monitoring by default
memoryMonitor.startMonitoring();
