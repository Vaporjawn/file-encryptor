import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Slider,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  TextField,
  Divider,
} from '@mui/material';
import { ChromePicker } from 'react-color';
import {
  ThemePreferences,
  COLOR_SCHEMES,
  THEME_PRESETS,
  validateThemePreferences,
} from '../themes/customTheme';

interface ThemeCustomizerProps {
  open: boolean;
  onClose: () => void;
  preferences: ThemePreferences;
  onSave: (preferences: ThemePreferences) => void;
}

export default function ThemeCustomizer({
  open,
  onClose,
  preferences,
  onSave,
}: ThemeCustomizerProps) {
  const [localPreferences, setLocalPreferences] = useState<ThemePreferences>(preferences);
  const [showColorPicker, setShowColorPicker] = useState<{
    primary: boolean;
    secondary: boolean;
  }>({
    primary: false,
    secondary: false,
  });

  const handleChange = (field: keyof ThemePreferences, value: any) => {
    setLocalPreferences(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const validatedPreferences = validateThemePreferences(localPreferences);
    onSave(validatedPreferences);
    onClose();
  };

  const handleReset = () => {
    setLocalPreferences(preferences);
  };

  const applyPreset = (presetName: string) => {
    const preset = THEME_PRESETS[presetName];
    if (preset) {
      setLocalPreferences(prev => ({ ...prev, ...preset }));
    }
  };

  const applyColorScheme = (scheme: any) => {
    setLocalPreferences(prev => ({
      ...prev,
      primaryColor: scheme.primary,
      secondaryColor: scheme.secondary,
    }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Customize Theme</DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Presets
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {Object.keys(THEME_PRESETS).map((presetName) => (
              <Chip
                key={presetName}
                label={presetName}
                onClick={() => applyPreset(presetName)}
                variant="outlined"
                clickable
              />
            ))}
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {/* Basic Settings */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Basic Settings
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Theme Mode</InputLabel>
              <Select
                value={localPreferences.mode}
                label="Theme Mode"
                onChange={(e) => handleChange('mode', e.target.value)}
              >
                <MenuItem value="light">Light</MenuItem>
                <MenuItem value="dark">Dark</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Font Size</InputLabel>
              <Select
                value={localPreferences.fontSize}
                label="Font Size"
                onChange={(e) => handleChange('fontSize', e.target.value)}
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="large">Large</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Custom Font Family"
              value={localPreferences.customFont || ''}
              onChange={(e) => handleChange('customFont', e.target.value)}
              placeholder="e.g., 'Inter', 'Arial', sans-serif"
              sx={{ mb: 2 }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={localPreferences.animations}
                  onChange={(e) => handleChange('animations', e.target.checked)}
                />
              }
              label="Enable Animations"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={localPreferences.compactMode}
                  onChange={(e) => handleChange('compactMode', e.target.checked)}
                />
              }
              label="Compact Mode"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={localPreferences.highContrast}
                  onChange={(e) => handleChange('highContrast', e.target.checked)}
                />
              }
              label="High Contrast"
            />
          </Grid>

          {/* Colors */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Colors
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Color Schemes
              </Typography>
              <Grid container spacing={1}>
                {COLOR_SCHEMES.map((scheme) => (
                  <Grid item xs={6} key={scheme.name}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                      onClick={() => applyColorScheme(scheme)}
                    >
                      <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              backgroundColor: scheme.primary,
                              borderRadius: '50%',
                            }}
                          />
                          <Box
                            sx={{
                              width: 16,
                              height: 16,
                              backgroundColor: scheme.secondary,
                              borderRadius: '50%',
                            }}
                          />
                        </Box>
                        <Typography variant="caption" fontWeight="bold">
                          {scheme.name}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Primary Color
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: localPreferences.primaryColor,
                    border: '2px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowColorPicker(prev => ({ ...prev, primary: !prev.primary }))}
                />
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {localPreferences.primaryColor}
                </Typography>
              </Box>
              {showColorPicker.primary && (
                <Box sx={{ mt: 2 }}>
                  <ChromePicker
                    color={localPreferences.primaryColor}
                    onChange={(color) => handleChange('primaryColor', color.hex)}
                  />
                </Box>
              )}
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Secondary Color
              </Typography>
              <Box display="flex" alignItems="center" gap={2}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    backgroundColor: localPreferences.secondaryColor,
                    border: '2px solid',
                    borderColor: 'divider',
                    borderRadius: 1,
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowColorPicker(prev => ({ ...prev, secondary: !prev.secondary }))}
                />
                <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                  {localPreferences.secondaryColor}
                </Typography>
              </Box>
              {showColorPicker.secondary && (
                <Box sx={{ mt: 2 }}>
                  <ChromePicker
                    color={localPreferences.secondaryColor}
                    onChange={(color) => handleChange('secondaryColor', color.hex)}
                  />
                </Box>
              )}
            </Box>
          </Grid>

          {/* Advanced Settings */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Advanced Settings
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Border Radius: {localPreferences.borderRadius}px
                </Typography>
                <Slider
                  value={localPreferences.borderRadius}
                  onChange={(_, value) => handleChange('borderRadius', value)}
                  min={0}
                  max={20}
                  step={1}
                  marks={[
                    { value: 0, label: '0' },
                    { value: 4, label: '4' },
                    { value: 8, label: '8' },
                    { value: 12, label: '12' },
                    { value: 16, label: '16' },
                    { value: 20, label: '20' },
                  ]}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Spacing: {localPreferences.spacing}px
                </Typography>
                <Slider
                  value={localPreferences.spacing}
                  onChange={(_, value) => handleChange('spacing', value)}
                  min={4}
                  max={16}
                  step={2}
                  marks={[
                    { value: 4, label: '4' },
                    { value: 6, label: '6' },
                    { value: 8, label: '8' },
                    { value: 10, label: '10' },
                    { value: 12, label: '12' },
                    { value: 16, label: '16' },
                  ]}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Preview */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Preview
            </Typography>
            <Card sx={{ p: 2, bgcolor: 'background.paper' }}>
              <Typography variant="h6" color="primary" gutterBottom>
                File Encryptor
              </Typography>
              <Typography variant="body1" gutterBottom>
                This is how your theme will look with these settings.
              </Typography>
              <Box display="flex" gap={2} mt={2}>
                <Button variant="contained" color="primary">
                  Primary Button
                </Button>
                <Button variant="outlined" color="secondary">
                  Secondary Button
                </Button>
              </Box>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleReset}>Reset</Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save Theme
        </Button>
      </DialogActions>
    </Dialog>
  );
}
