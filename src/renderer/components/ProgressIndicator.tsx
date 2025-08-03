import React from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

interface ProgressIndicatorProps {
  progress: number;
  isProcessing: boolean;
  mode: 'encrypt' | 'decrypt';
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ progress, isProcessing, mode }) => {
  if (!isProcessing) {
    return null;
  }

  return (
    <Box mb={2}>
      <Box display="flex" alignItems="center" mb={1}>
        <Typography variant="body2" color="text.secondary">
          {mode === 'encrypt' ? 'Encrypting' : 'Decrypting'} file...
        </Typography>
        <Box ml="auto">
          <Typography variant="body2" color="text.secondary">
            {Math.round(progress)}%
          </Typography>
        </Box>
      </Box>
      <LinearProgress variant="determinate" value={progress} />
    </Box>
  );
};

export default ProgressIndicator;
