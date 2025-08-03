import React from 'react';
import { Snackbar, Alert } from '@mui/material';

export interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
}

interface NotificationSnackbarsProps {
  notification: NotificationState;
  onClose: () => void;
}

const NotificationSnackbars: React.FC<NotificationSnackbarsProps> = ({ notification, onClose }) => {
  return (
    <Snackbar
      open={notification.open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert onClose={onClose} severity={notification.severity} sx={{ width: '100%' }}>
        {notification.message}
      </Alert>
    </Snackbar>
  );
};

export default NotificationSnackbars;
