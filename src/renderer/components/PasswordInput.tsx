import React, { useState } from 'react';
import {
  Box,
  TextField,
  IconButton,
  InputAdornment,
  Button,
  Tooltip,
} from '@mui/material';
import { Visibility, VisibilityOff, Key, ContentCopy } from '@mui/icons-material';

interface PasswordInputProps {
  password: string;
  onPasswordChange: (password: string) => void;
  mode: 'encrypt' | 'decrypt';
}

const PasswordInput: React.FC<PasswordInputProps> = ({ password, onPasswordChange, mode }) => {
  const [showPassword, setShowPassword] = useState(false);

  const generatePassword = () => {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
    let result = '';
    for (let i = 0; i < 32; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    onPasswordChange(result);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box mb={3}>
      <TextField
        fullWidth
        label={mode === 'encrypt' ? 'Encryption Password' : 'Decryption Password'}
        type={showPassword ? 'text' : 'password'}
        value={password}
        onChange={(e) => onPasswordChange(e.target.value)}
        variant="outlined"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title="Toggle password visibility">
                <IconButton
                  onClick={handleTogglePasswordVisibility}
                  edge="end"
                  aria-label="toggle password visibility"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Tooltip>
              {password && (
                <Tooltip title="Copy password">
                  <IconButton
                    onClick={copyToClipboard}
                    edge="end"
                    aria-label="copy password"
                  >
                    <ContentCopy />
                  </IconButton>
                </Tooltip>
              )}
            </InputAdornment>
          ),
        }}
      />
      {mode === 'encrypt' && (
        <Box mt={2}>
          <Button
            startIcon={<Key />}
            onClick={generatePassword}
            variant="outlined"
            size="small"
          >
            Generate Secure Password
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default PasswordInput;
