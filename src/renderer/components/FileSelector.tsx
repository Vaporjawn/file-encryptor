import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
} from '@mui/material';
import { CloudUpload, Delete } from '@mui/icons-material';

interface FileSelectorProps {
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  onFileRemove: () => void;
}

const FileSelector: React.FC<FileSelectorProps> = ({ selectedFile, onFileSelect, onFileRemove }) => {
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  };

  return (
    <Box mb={3}>
      {!selectedFile ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: 'primary.main',
            cursor: 'pointer',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Drag and drop a file here
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            or click to select a file
          </Typography>
          <input
            id="file-input"
            type="file"
            style={{ display: 'none' }}
            onChange={handleFileInput}
          />
        </Paper>
      ) : (
        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle1">{selectedFile.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {(selectedFile.size / 1024).toFixed(2)} KB
            </Typography>
          </Box>
          <Button
            startIcon={<Delete />}
            onClick={onFileRemove}
            color="error"
            variant="outlined"
          >
            Remove
          </Button>
        </Paper>
      )}
    </Box>
  );
};

export default FileSelector;
