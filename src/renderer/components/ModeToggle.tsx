import React from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';

interface ModeToggleProps {
  mode: 'encrypt' | 'decrypt';
  onModeChange: (mode: 'encrypt' | 'decrypt') => void;
}

const ModeToggle: React.FC<ModeToggleProps> = ({ mode, onModeChange }) => {
  const handleModeChange = (_: React.MouseEvent<HTMLElement>, newMode: 'encrypt' | 'decrypt' | null) => {
    if (newMode) {
      onModeChange(newMode);
    }
  };

  return (
    <Box display="flex" justifyContent="center" mb={2}>
      <ToggleButtonGroup
        value={mode}
        exclusive
        onChange={handleModeChange}
        aria-label="encrypt or decrypt"
      >
        <ToggleButton value="encrypt">Encrypt</ToggleButton>
        <ToggleButton value="decrypt">Decrypt</ToggleButton>
      </ToggleButtonGroup>
    </Box>
  );
};

export default ModeToggle;
