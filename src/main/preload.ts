// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels =
  | 'ipc-example'
  | 'encryption-progress'
  | 'decryption-progress'
  | 'batch-progress';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  // Crypto functions
  crypto: {
    encryptFile: (inputPath: string, outputPath: string, password: string) =>
      ipcRenderer.invoke('encrypt-file', inputPath, outputPath, password),
    decryptFile: (inputPath: string, outputPath: string, password: string) =>
      ipcRenderer.invoke('decrypt-file', inputPath, outputPath, password),
    encryptFileWithDownload: (
      inputPath: string,
      password: string,
      suggestedFileName?: string,
    ) =>
      ipcRenderer.invoke(
        'encrypt-file-with-download',
        inputPath,
        password,
        suggestedFileName,
      ),
    decryptFileWithDownload: (
      inputPath: string,
      password: string,
      suggestedFileName?: string,
    ) =>
      ipcRenderer.invoke(
        'decrypt-file-with-download',
        inputPath,
        password,
        suggestedFileName,
      ),
    batchProcessWithDownload: (
      files: string[],
      operation: 'encrypt' | 'decrypt',
      password: string,
      outputDirectory?: string,
    ) =>
      ipcRenderer.invoke(
        'batch-process-with-download',
        files,
        operation,
        password,
        outputDirectory,
      ),
    getFileInfo: (filePath: string) =>
      ipcRenderer.invoke('get-file-info', filePath),
    suggestOutputFilename: (
      inputPath: string,
      operation: 'encrypt' | 'decrypt',
    ) => ipcRenderer.invoke('suggest-output-filename', inputPath, operation),
    isFileEncrypted: (filePath: string) =>
      ipcRenderer.invoke('is-file-encrypted', filePath),
    getTempFilePath: (originalFileName: string) =>
      ipcRenderer.invoke('get-temp-file-path', originalFileName),
    saveBufferToFile: (filePath: string, arrayBuffer: ArrayBuffer) =>
      ipcRenderer.invoke('save-buffer-to-file', filePath, arrayBuffer),
    deleteTempFile: (filePath: string) =>
      ipcRenderer.invoke('delete-temp-file', filePath),
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
