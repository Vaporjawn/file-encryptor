/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import {
  encryptFile,
  decryptFile,
  encryptFileWithDownload,
  decryptFileWithDownload,
  batchProcessWithDownload,
  getFileInfo,
  suggestOutputFilename,
  isFileEncrypted,
} from './crypto';

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

// IPC handlers for encryption/decryption functions
ipcMain.handle(
  'encrypt-file',
  async (event, inputPath: string, outputPath: string, password: string) => {
    return encryptFile(inputPath, outputPath, password);
  },
);

ipcMain.handle(
  'decrypt-file',
  async (event, inputPath: string, outputPath: string, password: string) => {
    return decryptFile(inputPath, outputPath, password);
  },
);

ipcMain.handle(
  'encrypt-file-with-download',
  async (
    event,
    inputPath: string,
    password: string,
    suggestedFileName?: string,
  ) => {
    return encryptFileWithDownload(
      inputPath,
      password,
      (progress) => {
        event.sender.send('encryption-progress', progress);
      },
      suggestedFileName,
    );
  },
);

ipcMain.handle(
  'decrypt-file-with-download',
  async (
    event,
    inputPath: string,
    password: string,
    suggestedFileName?: string,
  ) => {
    return decryptFileWithDownload(
      inputPath,
      password,
      (progress) => {
        event.sender.send('decryption-progress', progress);
      },
      suggestedFileName,
    );
  },
);

ipcMain.handle(
  'batch-process-with-download',
  async (
    event,
    files: string[],
    operation: 'encrypt' | 'decrypt',
    password: string,
    outputDirectory?: string,
  ) => {
    return batchProcessWithDownload(
      files,
      operation,
      password,
      outputDirectory,
      (fileIndex, fileProgress, fileName) => {
        event.sender.send('batch-progress', {
          fileIndex,
          fileProgress,
          fileName,
        });
      },
    );
  },
);

ipcMain.handle('get-file-info', async (event, filePath: string) => {
  return getFileInfo(filePath);
});

ipcMain.handle(
  'suggest-output-filename',
  async (event, inputPath: string, operation: 'encrypt' | 'decrypt') => {
    return suggestOutputFilename(inputPath, operation);
  },
);

ipcMain.handle('is-file-encrypted', async (event, filePath: string) => {
  return isFileEncrypted(filePath);
});

// Temporary file handlers
ipcMain.handle(
  'get-temp-file-path',
  async (event, originalFileName: string) => {
    const os = require('os');
    const pathUtils = require('path');
    const { v4: uuidv4 } = require('uuid');

    const tempDir = os.tmpdir();
    const fileExtension = pathUtils.extname(originalFileName);
    const baseName = pathUtils.basename(originalFileName, fileExtension);
    const uniqueId = uuidv4();

    return pathUtils.join(tempDir, `${baseName}_${uniqueId}${fileExtension}`);
  },
);

ipcMain.handle(
  'save-buffer-to-file',
  async (event, filePath: string, arrayBuffer: ArrayBuffer) => {
    const fs = require('fs').promises;
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);
    return filePath;
  },
);

ipcMain.handle('delete-temp-file', async (event, filePath: string) => {
  const fs = require('fs').promises;
  try {
    await fs.unlink(filePath);
  } catch {
    // Silently fail if file doesn't exist - temp files will be cleaned up by OS
  }
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug').default();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
