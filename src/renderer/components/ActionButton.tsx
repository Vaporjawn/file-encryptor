import React from 'react';
import { Button } from '@mui/material';
import { Lock, LockOpen } from '@mui/icons-material';

interface ActionButtonProps {
  mode: 'encrypt' | 'decrypt';
  onAction: () => void;
  disabled: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ mode, onAction, disabled }) => {
  return (
    <Button
      variant="contained"
      size="large"
      fullWidth
      onClick={onAction}
      disabled={disabled}
      startIcon={mode === 'encrypt' ? <Lock /> : <LockOpen />}
      sx={{ py: 1.5, mb: 2 }}
    >
      {mode === 'encrypt' ? 'Encrypt File' : 'Decrypt File'}
    </Button>
  );
};

export default ActionButton;
