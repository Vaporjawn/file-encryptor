import React, { useState } from 'react';
import { Button, LinearProgress, Box, Typography, Alert } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { saveFileToTemp, cleanupTempFile } from '../utils/fileHelpers';

interface DownloadButtonProps {
  mode: 'encrypt' | 'decrypt';
  file: File | null;
  password: string;
  disabled: boolean;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

function DownloadButton({
  mode,
  file,
  password,
  disabled,
  onSuccess,
  onError,
}: DownloadButtonProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentOperation, setCurrentOperation] = useState<string>('');

  const handleDownload = async () => {
    if (!file || !password.trim()) {
      onError('Please select a file and enter a password.');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setCurrentOperation(
      `${mode === 'encrypt' ? 'Encrypting' : 'Decrypting'} file...`,
    );

    let tempFilePath: string | null = null;

    try {
      // Save the File object to a temporary location
      setCurrentOperation('Preparing file...');
      tempFilePath = await saveFileToTemp(file);

      // Set up progress listener
      const progressListener = (progressValue: number) => {
        setProgress(progressValue * 100);
      };

      let result: any = null;
      let unsubscribe: (() => void) | null = null;

      if (mode === 'encrypt') {
        // Listen for encryption progress
        unsubscribe = window.electron.ipcRenderer.on(
          'encryption-progress',
          (...args: unknown[]) => {
            const progressValue = args[0] as number;
            progressListener(progressValue);
          },
        );

        result = await window.electron.crypto.encryptFileWithDownload(
          tempFilePath,
          password,
        );
      } else {
        // Listen for decryption progress
        unsubscribe = window.electron.ipcRenderer.on(
          'decryption-progress',
          (...args: unknown[]) => {
            const progressValue = args[0] as number;
            progressListener(progressValue);
          },
        );

        result = await window.electron.crypto.decryptFileWithDownload(
          tempFilePath,
          password,
        );
      }

      // Clean up listener
      if (unsubscribe) {
        unsubscribe();
      }

      if (result && result.success) {
        onSuccess(
          `File ${mode === 'encrypt' ? 'encrypted' : 'decrypted'} successfully and saved to: ${result.outputPath}`,
        );
      } else {
        onError(result?.error || 'Operation was cancelled by user.');
      }
    } catch (error) {
      onError(
        `Failed to ${mode} file: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    } finally {
      // Clean up temporary file
      if (tempFilePath) {
        await cleanupTempFile(tempFilePath);
      }
      setIsProcessing(false);
      setProgress(0);
      setCurrentOperation('');
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      {isProcessing && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {currentOperation}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{ mb: 1 }}
          />
          <Typography variant="body2" color="text.secondary" align="center">
            {progress.toFixed(1)}% complete
          </Typography>
        </Box>
      )}

      <Button
        variant="contained"
        color="primary"
        size="large"
        fullWidth
        startIcon={<DownloadIcon />}
        onClick={handleDownload}
        disabled={disabled || isProcessing}
        sx={{ py: 1.5 }}
      >
        {isProcessing
          ? `${mode === 'encrypt' ? 'Encrypting' : 'Decrypting'}...`
          : `${mode === 'encrypt' ? 'Encrypt' : 'Decrypt'} & Download`}
      </Button>

      <Box sx={{ mt: 2 }}>
        <Alert severity="info" sx={{ fontSize: '0.875rem' }}>
          <Typography variant="body2">
            Click the button above to {mode} your file. You&apos;ll be prompted
            to choose where to save the{' '}
            {mode === 'encrypt' ? 'encrypted' : 'decrypted'} file.
          </Typography>
        </Alert>
      </Box>
    </Box>
  );
}

export default DownloadButton;
