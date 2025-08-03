/**
 * File handling utilities for the renderer process
 */

// Function to save a File object to a temporary location and return the path
export async function saveFileToTemp(file: File): Promise<string> {
  try {
    // Read the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // Generate a temporary file path
    const tempPath = await window.electron.crypto.getTempFilePath(file.name);

    // Save the file to the temporary location (pass ArrayBuffer directly)
    await window.electron.crypto.saveBufferToFile(tempPath, arrayBuffer);

    return tempPath;
  } catch (error) {
    throw new Error(
      `Failed to save file to temporary location: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}

// Function to clean up temporary files
export async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    await window.electron.crypto.deleteTempFile(filePath);
  } catch {
    // Silently fail on cleanup errors - temp files will be cleaned up by OS
  }
}

// Function to get file info from a File object
export function getFileInfo(file: File): {
  name: string;
  size: number;
  type: string;
  lastModified: number;
} {
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
  };
}
