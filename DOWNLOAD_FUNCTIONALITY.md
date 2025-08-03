# File Download Functionality

This document describes the new download functionality that has been added to the file encryptor application. These features provide enhanced user experience by automatically prompting users to save encrypted/decrypted files and offering additional file management utilities.

## Overview

The download functionality includes:
- **Save dialogs** for choosing where to save encrypted/decrypted files
- **Automatic file opening** in system file manager or default application
- **Batch processing** with folder selection
- **Utility functions** for file information and validation
- **Progress tracking** during encryption/decryption operations

## Main Functions

### 1. `encryptFileWithDownload(inputPath, password, suggestedFileName?)`

Encrypts a file and prompts the user to save it with a save dialog.

**Parameters:**
- `inputPath` (string): Path to the file to encrypt
- `password` (string): Password for encryption
- `suggestedFileName` (string, optional): Suggested name for the encrypted file

**Returns:** `Promise<string | null>` - Path where file was saved, or null if cancelled

**Features:**
- Shows save dialog with suggested filename (adds `.enc` extension)
- Progress tracking during encryption
- Success notification with options to "Show in Folder"
- Error handling with user-friendly dialogs

**Usage:**
```typescript
const result = await window.electron.crypto.encryptFileWithDownload(
  '/path/to/document.pdf',
  'mySecurePassword'
);

if (result) {
  console.log(`File encrypted and saved to: ${result}`);
}
```

### 2. `decryptFileWithDownload(inputPath, password, suggestedFileName?)`

Decrypts a file and prompts the user to save it with a save dialog.

**Parameters:**
- `inputPath` (string): Path to the encrypted file to decrypt
- `password` (string): Password for decryption
- `suggestedFileName` (string, optional): Suggested name for the decrypted file

**Returns:** `Promise<string | null>` - Path where file was saved, or null if cancelled

**Features:**
- Automatically removes `.enc` extension from filename suggestion
- Progress tracking during decryption
- Success notification with options to "Show in Folder" or "Open File"
- Error handling with user-friendly dialogs

**Usage:**
```typescript
const result = await window.electron.crypto.decryptFileWithDownload(
  '/path/to/document.pdf.enc',
  'mySecurePassword'
);

if (result) {
  console.log(`File decrypted and saved to: ${result}`);
}
```

### 3. `batchProcessWithDownload(files, operation, password, outputDirectory?)`

Processes multiple files (encrypt or decrypt) with automatic folder selection and progress tracking.

**Parameters:**
- `files` (string[]): Array of file paths to process
- `operation` ('encrypt' | 'decrypt'): Operation to perform
- `password` (string): Password for encryption/decryption
- `outputDirectory` (string, optional): Target directory (will prompt if not provided)

**Returns:** `Promise<string[]>` - Array of paths where files were saved

**Features:**
- Prompts user to select output directory if not provided
- Processes files sequentially with progress updates
- Continues processing even if individual files fail
- Shows completion summary with option to open output folder
- Handles filename conflicts automatically

**Usage:**
```typescript
const results = await window.electron.crypto.batchProcessWithDownload(
  ['/path/to/file1.txt', '/path/to/file2.pdf'],
  'encrypt',
  'mySecurePassword'
);

console.log(`Processed ${results.length} files successfully`);
```

## Utility Functions

### 4. `getFileInfo(filePath)`

Retrieves detailed information about a file.

**Parameters:**
- `filePath` (string): Path to the file

**Returns:** `Promise<FileInfo>` where FileInfo contains:
```typescript
{
  name: string;        // File name with extension
  size: number;        // File size in bytes
  extension: string;   // File extension (e.g., '.txt')
  isEncrypted: boolean; // Whether file appears to be encrypted
}
```

**Usage:**
```typescript
const info = await window.electron.crypto.getFileInfo('/path/to/file.txt');
console.log(`File: ${info.name}, Size: ${info.size} bytes, Encrypted: ${info.isEncrypted}`);
```

### 5. `suggestOutputFilename(inputPath, operation)`

Generates a suggested filename for the output file based on the operation.

**Parameters:**
- `inputPath` (string): Path to the input file
- `operation` ('encrypt' | 'decrypt'): Operation being performed

**Returns:** `Promise<string>` - Suggested filename

**Logic:**
- For encryption: Adds `.enc` extension to original filename
- For decryption: Removes `.enc` extension if present, otherwise adds `_decrypted` suffix

**Usage:**
```typescript
const suggested = await window.electron.crypto.suggestOutputFilename(
  '/path/to/document.pdf',
  'encrypt'
);
console.log(suggested); // "document.pdf.enc"
```

### 6. `isFileEncrypted(filePath)`

Checks whether a file appears to be encrypted by this application.

**Parameters:**
- `filePath` (string): Path to the file to check

**Returns:** `Promise<boolean>` - True if file appears to be encrypted

**Note:** This performs a basic check by examining file structure and size. It's not 100% accurate but provides a reasonable heuristic.

**Usage:**
```typescript
const encrypted = await window.electron.crypto.isFileEncrypted('/path/to/file.enc');
if (encrypted) {
  console.log('File appears to be encrypted');
}
```

## Progress Tracking

The download functions support progress tracking through IPC events:

### Encryption Progress
```typescript
window.electron.ipcRenderer.on('encryption-progress', (progress: number) => {
  console.log(`Encryption progress: ${(progress * 100).toFixed(1)}%`);
});
```

### Decryption Progress
```typescript
window.electron.ipcRenderer.on('decryption-progress', (progress: number) => {
  console.log(`Decryption progress: ${(progress * 100).toFixed(1)}%`);
});
```

### Batch Progress
```typescript
window.electron.ipcRenderer.on('batch-progress', (data: {
  fileIndex: number;
  fileProgress: number;
  fileName: string;
}) => {
  console.log(`Processing ${data.fileName}: ${(data.fileProgress * 100).toFixed(1)}%`);
});
```

## Error Handling

All functions include comprehensive error handling:

- **User cancellation**: Returns `null` when user cancels save dialog
- **File system errors**: Shows error dialogs with descriptive messages
- **Encryption/decryption errors**: Displays specific error information
- **Permission errors**: Handles access denied scenarios gracefully

## Integration with UI Components

The new functions are designed to work seamlessly with existing UI components:

```typescript
// In a React component
const handleEncryptAndDownload = async (filePath: string, password: string) => {
  try {
    setLoading(true);
    const result = await window.electron.crypto.encryptFileWithDownload(filePath, password);

    if (result) {
      showSuccessMessage(`File encrypted and saved to ${result}`);
    }
  } catch (error) {
    showErrorMessage(`Encryption failed: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
```

## File System Integration

The download functions integrate with the system file manager:

- **"Show in Folder"** opens the system file manager and highlights the saved file
- **"Open File"** (for decryption) opens the decrypted file with the default application
- **Cross-platform compatibility** works on Windows, macOS, and Linux

## Security Considerations

- Files are processed securely using the same encryption algorithms as the core functions
- Temporary files are automatically cleaned up
- Progress callbacks don't expose sensitive data
- Error messages don't reveal system paths unnecessarily

## Example Implementation

See `src/renderer/components/DownloadDemo.tsx` for a complete example of how to use these functions in a React component.

## Migration from Basic Functions

If you're currently using the basic `encryptFile` and `decryptFile` functions:

**Before:**
```typescript
await window.electron.crypto.encryptFile(inputPath, outputPath, password);
// User had to manually specify output path
```

**After:**
```typescript
const outputPath = await window.electron.crypto.encryptFileWithDownload(inputPath, password);
// User chooses where to save via dialog, gets automatic feedback
```

The new functions provide a much better user experience while maintaining all the security and functionality of the original implementations.
