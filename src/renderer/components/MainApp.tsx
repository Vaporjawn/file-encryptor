import React, { useState } from 'react';
import { Container, Paper } from '@mui/material';
import AppHeader from './AppHeader';
import FileSelector from './FileSelector';
import PasswordInput from './PasswordInput';
import NotificationSnackbars, {
  NotificationState,
} from './NotificationSnackbars';
import ModeToggle from './ModeToggle';
import DownloadButton from './DownloadButton';

interface MainAppProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

function MainApp({ darkMode, onToggleDarkMode }: MainAppProps) {
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const showNotification = (
    message: string,
    severity: 'success' | 'error' | 'warning' | 'info',
  ) => {
    setNotification({ open: true, message, severity });
  };

  const closeNotification = () => {
    setNotification((prev: NotificationState) => ({ ...prev, open: false }));
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
  };

  const handleFileRemove = () => {
    setFile(null);
  };

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
  };

  const handleModeChange = (newMode: 'encrypt' | 'decrypt') => {
    setMode(newMode);
  };

  const handleDownloadSuccess = (message: string) => {
    showNotification(message, 'success');
  };

  const handleDownloadError = (message: string) => {
    showNotification(message, 'error');
  };

  const isActionDisabled = !file || !password.trim();

  return (
    <Container maxWidth="sm">
      <AppHeader darkMode={darkMode} onToggleDarkMode={onToggleDarkMode} />

      <Paper sx={{ p: 4, mt: 4 }}>
        <ModeToggle mode={mode} onModeChange={handleModeChange} />

        <FileSelector
          selectedFile={file}
          onFileSelect={handleFileSelect}
          onFileRemove={handleFileRemove}
        />

        <PasswordInput
          password={password}
          onPasswordChange={handlePasswordChange}
          mode={mode}
        />

        <DownloadButton
          mode={mode}
          file={file}
          password={password}
          disabled={isActionDisabled}
          onSuccess={handleDownloadSuccess}
          onError={handleDownloadError}
        />
      </Paper>

      <NotificationSnackbars
        notification={notification}
        onClose={closeNotification}
      />
    </Container>
  );
}

export default MainApp;
