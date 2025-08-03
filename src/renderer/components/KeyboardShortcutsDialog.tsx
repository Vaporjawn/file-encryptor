import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  TextField,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import {
  KeyboardShortcut,
  formatShortcut,
  groupShortcutsByCategory,
} from '../hooks/useKeyboardShortcuts';

interface KeyboardShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export default function KeyboardShortcutsDialog({
  open,
  onClose,
  shortcuts,
}: KeyboardShortcutsDialogProps) {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredShortcuts = shortcuts.filter(
    (shortcut) =>
      shortcut.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shortcut.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatShortcut(shortcut).toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const groupedShortcuts = groupShortcutsByCategory(filteredShortcuts);
  const categories = Object.keys(groupedShortcuts).sort();

  const getCategoryColor = (category: string) => {
    const colors = {
      'File Operations': 'primary',
      Security: 'success',
      Selection: 'info',
      Clipboard: 'warning',
      Edit: 'secondary',
      View: 'primary',
      Window: 'info',
      Settings: 'warning',
      Help: 'success',
      Search: 'secondary',
      General: 'default',
      Preview: 'info',
      Navigation: 'primary',
    };
    return colors[category as keyof typeof colors] || 'default';
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">Keyboard Shortcuts</Typography>
          <Chip
            label={`${shortcuts.length} shortcuts`}
            size="small"
            variant="outlined"
          />
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search shortcuts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {searchTerm && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {filteredShortcuts.length} shortcuts found
            </Typography>
          </Box>
        )}

        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid item xs={12} md={6} lg={4} key={category}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1} mb={2}>
                    <Chip
                      label={category}
                      size="small"
                      color={getCategoryColor(category) as any}
                      variant="outlined"
                    />
                    <Typography variant="caption" color="text.secondary">
                      ({groupedShortcuts[category].length})
                    </Typography>
                  </Box>

                  <List dense>
                    {groupedShortcuts[category].map((shortcut, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2">
                                {shortcut.description}
                              </Typography>
                              <Chip
                                label={formatShortcut(shortcut)}
                                size="small"
                                variant="filled"
                                sx={{
                                  fontFamily: 'monospace',
                                  fontSize: '0.75rem',
                                  minWidth: 'auto',
                                }}
                              />
                            </Box>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {filteredShortcuts.length === 0 && searchTerm && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="200px"
          >
            <Typography color="text.secondary">
              No shortcuts found matching "{searchTerm}"
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <Box>
          <Typography variant="h6" gutterBottom>
            Tips
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • Shortcuts work when the main application window is focused
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • Most shortcuts are disabled when typing in text fields
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • Use Ctrl (Windows/Linux) or ⌘ (Mac) for most shortcuts
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            • Press Esc to cancel most operations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Function keys (F1-F12) provide additional functionality
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
