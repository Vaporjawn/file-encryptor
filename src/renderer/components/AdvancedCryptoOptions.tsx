import React, { useState } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Tooltip,
  IconButton,
  Chip,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Info as InfoIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

export interface CryptoOptions {
  algorithm: string;
  keyDerivationFunction: string;
  iterations: number;
  keySize: number;
  ivSize: number;
  saltSize: number;
  useHardwareAcceleration: boolean;
  compressionLevel: number;
  enableCompression: boolean;
  authenticationMode: string;
}

interface AdvancedCryptoOptionsProps {
  options: CryptoOptions;
  onChange: (options: CryptoOptions) => void;
  disabled?: boolean;
}

const DEFAULT_OPTIONS: CryptoOptions = {
  algorithm: 'aes-256-gcm',
  keyDerivationFunction: 'pbkdf2',
  iterations: 100000,
  keySize: 32,
  ivSize: 16,
  saltSize: 32,
  useHardwareAcceleration: true,
  compressionLevel: 6,
  enableCompression: false,
  authenticationMode: 'gcm',
};

const ALGORITHM_OPTIONS = [
  { value: 'aes-256-gcm', label: 'AES-256-GCM', security: 'high' },
  { value: 'aes-192-gcm', label: 'AES-192-GCM', security: 'high' },
  { value: 'aes-128-gcm', label: 'AES-128-GCM', security: 'medium' },
  { value: 'chacha20-poly1305', label: 'ChaCha20-Poly1305', security: 'high' },
  { value: 'aes-256-cbc', label: 'AES-256-CBC', security: 'medium' },
];

const KDF_OPTIONS = [
  { value: 'pbkdf2', label: 'PBKDF2', description: 'Widely supported, good security' },
  { value: 'scrypt', label: 'scrypt', description: 'Memory-hard, resistant to ASICs' },
  { value: 'argon2id', label: 'Argon2id', description: 'Latest standard, best security' },
];

const COMPRESSION_LEVELS = [
  { value: 0, label: 'No Compression' },
  { value: 1, label: 'Fastest' },
  { value: 3, label: 'Fast' },
  { value: 6, label: 'Default' },
  { value: 9, label: 'Best Compression' },
];

export default function AdvancedCryptoOptions({
  options,
  onChange,
  disabled = false,
}: AdvancedCryptoOptionsProps) {
  const [expanded, setExpanded] = useState(false);

  const handleChange = (field: keyof CryptoOptions, value: any) => {
    const newOptions = { ...options, [field]: value };

    // Auto-adjust related settings
    if (field === 'algorithm') {
      if (value.includes('gcm')) {
        newOptions.authenticationMode = 'gcm';
      } else if (value.includes('poly1305')) {
        newOptions.authenticationMode = 'poly1305';
      } else {
        newOptions.authenticationMode = 'hmac';
      }

      // Adjust key size based on algorithm
      if (value.includes('256')) {
        newOptions.keySize = 32;
      } else if (value.includes('192')) {
        newOptions.keySize = 24;
      } else if (value.includes('128')) {
        newOptions.keySize = 16;
      }
    }

    // Adjust iterations based on KDF
    if (field === 'keyDerivationFunction') {
      switch (value) {
        case 'pbkdf2':
          newOptions.iterations = 100000;
          break;
        case 'scrypt':
          newOptions.iterations = 16384;
          break;
        case 'argon2id':
          newOptions.iterations = 3;
          break;
      }
    }

    onChange(newOptions);
  };

  const getSecurityLevel = (algorithm: string): 'low' | 'medium' | 'high' => {
    const alg = ALGORITHM_OPTIONS.find(opt => opt.value === algorithm);
    return alg?.security as 'low' | 'medium' | 'high' || 'medium';
  };

  const getSecurityColor = (level: string) => {
    switch (level) {
      case 'high': return 'success';
      case 'medium': return 'warning';
      case 'low': return 'error';
      default: return 'default';
    }
  };

  const resetToDefaults = () => {
    onChange(DEFAULT_OPTIONS);
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
      disabled={disabled}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box display="flex" alignItems="center" gap={1}>
          <SecurityIcon />
          <Typography variant="h6">Advanced Cryptographic Options</Typography>
          <Chip
            size="small"
            label={`${options.algorithm.toUpperCase()}`}
            color={getSecurityColor(getSecurityLevel(options.algorithm))}
          />
        </Box>
      </AccordionSummary>

      <AccordionDetails>
        <Box display="flex" flexDirection="column" gap={3}>

          {/* Encryption Algorithm */}
          <FormControl fullWidth>
            <InputLabel>Encryption Algorithm</InputLabel>
            <Select
              value={options.algorithm}
              label="Encryption Algorithm"
              onChange={(e) => handleChange('algorithm', e.target.value)}
            >
              {ALGORITHM_OPTIONS.map((alg) => (
                <MenuItem key={alg.value} value={alg.value}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {alg.label}
                    <Chip
                      size="small"
                      label={alg.security}
                      color={getSecurityColor(alg.security)}
                    />
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Key Derivation Function */}
          <FormControl fullWidth>
            <InputLabel>Key Derivation Function</InputLabel>
            <Select
              value={options.keyDerivationFunction}
              label="Key Derivation Function"
              onChange={(e) => handleChange('keyDerivationFunction', e.target.value)}
            >
              {KDF_OPTIONS.map((kdf) => (
                <MenuItem key={kdf.value} value={kdf.value}>
                  <Box>
                    <Typography variant="body1">{kdf.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {kdf.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* KDF Iterations */}
          <Box display="flex" alignItems="center" gap={1}>
            <TextField
              fullWidth
              label="KDF Iterations"
              type="number"
              value={options.iterations}
              onChange={(e) => handleChange('iterations', parseInt(e.target.value) || 100000)}
              helperText={`Higher values = more secure but slower (${options.keyDerivationFunction} recommended: ${
                options.keyDerivationFunction === 'pbkdf2' ? '100,000+' :
                options.keyDerivationFunction === 'scrypt' ? '16,384+' : '3+'
              })`}
            />
            <Tooltip title="More iterations make password cracking harder but increase processing time">
              <IconButton>
                <InfoIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Advanced Settings */}
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Technical Parameters
          </Typography>

          <Box display="flex" gap={2}>
            <TextField
              label="Key Size (bytes)"
              type="number"
              value={options.keySize}
              onChange={(e) => handleChange('keySize', parseInt(e.target.value) || 32)}
              inputProps={{ min: 16, max: 64 }}
            />
            <TextField
              label="IV Size (bytes)"
              type="number"
              value={options.ivSize}
              onChange={(e) => handleChange('ivSize', parseInt(e.target.value) || 16)}
              inputProps={{ min: 12, max: 16 }}
            />
            <TextField
              label="Salt Size (bytes)"
              type="number"
              value={options.saltSize}
              onChange={(e) => handleChange('saltSize', parseInt(e.target.value) || 32)}
              inputProps={{ min: 16, max: 64 }}
            />
          </Box>

          {/* Performance Options */}
          <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
            Performance & Compression
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={options.useHardwareAcceleration}
                onChange={(e) => handleChange('useHardwareAcceleration', e.target.checked)}
              />
            }
            label="Use Hardware Acceleration (AES-NI)"
          />

          <FormControlLabel
            control={
              <Switch
                checked={options.enableCompression}
                onChange={(e) => handleChange('enableCompression', e.target.checked)}
              />
            }
            label="Enable Compression (reduces file size)"
          />

          {options.enableCompression && (
            <FormControl fullWidth>
              <InputLabel>Compression Level</InputLabel>
              <Select
                value={options.compressionLevel}
                label="Compression Level"
                onChange={(e) => handleChange('compressionLevel', e.target.value)}
              >
                {COMPRESSION_LEVELS.map((level) => (
                  <MenuItem key={level.value} value={level.value}>
                    {level.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {/* Security Summary */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Security Summary
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Algorithm: {options.algorithm.toUpperCase()} •
              Key Derivation: {options.keyDerivationFunction.toUpperCase()} •
              Iterations: {options.iterations.toLocaleString()} •
              Key Size: {options.keySize * 8} bits
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Estimated time to crack with current technology:
              {options.keySize >= 32 && options.iterations >= 100000
                ? ' >10^15 years (effectively unbreakable)'
                : options.keySize >= 24 && options.iterations >= 50000
                ? ' >10^10 years (very secure)'
                : ' <10^8 years (moderately secure)'
              }
            </Typography>
          </Box>

          {/* Reset Button */}
          <Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }}>
            <Typography
              variant="body2"
              color="primary"
              sx={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={resetToDefaults}
            >
              Reset to Recommended Defaults
            </Typography>
          </Box>

        </Box>
      </AccordionDetails>
    </Accordion>
  );
}
