import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';

interface FileInfo {
  path: string;
  name: string;
  size: number;
  type: string;
}

interface FileDropZoneProps {
  onFilesSelect: (files: FileInfo[]) => void;
  acceptedTypes?: string[];
  maxSize?: number;
  multiple?: boolean;
}

export default function FileDropZone({
  onFilesSelect,
  acceptedTypes = [],
  maxSize = 100 * 1024 * 1024,
  multiple = true,
}: FileDropZoneProps) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileInfo[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (maxSize && file.size > maxSize) {
        return `File "${file.name}" is too large (${(
          file.size /
          1024 /
          1024
        ).toFixed(1)}MB). Maximum size is ${(maxSize / 1024 / 1024).toFixed(
          1,
        )}MB.`;
      }

      if (acceptedTypes.length > 0) {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (!fileExtension || !acceptedTypes.includes(`.${fileExtension}`)) {
          return `File type ".${fileExtension}" is not supported. Accepted types: ${acceptedTypes.join(
            ', ',
          )}`;
        }
      }

      return null;
    },
    [acceptedTypes, maxSize],
  );

  const processFiles = useCallback((fileList: FileList) => {
    const newFiles: FileInfo[] = [];
    const newErrors: string[] = [];

    Array.from(fileList).forEach(file => {
      const error = validateFile(file);
      if (error) {
        newErrors.push(error);
      } else {
        newFiles.push({
          path: file.path || file.name,
          name: file.name,
          size: file.size,
          type: file.type
        });
      }
    });

    if (!multiple && newFiles.length > 1) {
      newErrors.push('Only one file can be selected at a time.');
      return;
    }

    setErrors(newErrors);

    if (newFiles.length > 0) {
      const updatedFiles = multiple ? [...selectedFiles, ...newFiles] : newFiles;
      setSelectedFiles(updatedFiles);
      onFilesSelect(updatedFiles);
    }
  }, [multiple, selectedFiles, onFilesSelect, validateFile]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  const removeFile = useCallback((index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updatedFiles);
    onFilesSelect(updatedFiles);
  }, [selectedFiles, onFilesSelect]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <Paper
        elevation={dragActive ? 4 : 1}
        sx={{
          border: dragActive ? '2px dashed #1976d2' : '2px dashed #ccc',
          borderRadius: 2,
          padding: 3,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: dragActive ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
          transition: 'all 0.3s ease',
          minHeight: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column'
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <FileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="h6" gutterBottom>
          {dragActive ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or click to select files
        </Typography>
        {acceptedTypes.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            Accepted types: {acceptedTypes.join(', ')}
          </Typography>
        )}
      </Paper>

      <input
        id="file-input"
        type="file"
        multiple={multiple}
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        style={{ display: 'none' }}
      />

      {errors.length > 0 && (
        <Box sx={{ mt: 2 }}>
          {errors.map((error, index) => (
            <Typography key={index} color="error" variant="body2">
              {error}
            </Typography>
          ))}
        </Box>
      )}

      {selectedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Selected Files ({selectedFiles.length})
          </Typography>
          <List>
            {selectedFiles.map((file, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  <IconButton edge="end" onClick={() => removeFile(index)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText
                  primary={file.name}
                  secondary={`${formatFileSize(file.size)} • ${file.path}`}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}
