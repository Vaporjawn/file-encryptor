import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  category: string;
}

export interface KeyboardShortcutHookProps {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

export function useKeyboardShortcuts({
  shortcuts,
  enabled = true
}: KeyboardShortcutHookProps) {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        return;
      }

      const matchingShortcut = shortcuts.find((shortcut) => {
        return (
          shortcut.key.toLowerCase() === event.key.toLowerCase() &&
          !!shortcut.ctrlKey === event.ctrlKey &&
          !!shortcut.shiftKey === event.shiftKey &&
          !!shortcut.altKey === event.altKey &&
          !!shortcut.metaKey === event.metaKey
        );
      });

      if (matchingShortcut) {
        event.preventDefault();
        event.stopPropagation();
        matchingShortcut.action();
      }
    },
    [shortcuts, enabled],
  );

  useEffect(() => {
    if (enabled) {
      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }
  }, [handleKeyPress, enabled]);
}

// Global keyboard shortcuts for the file encryptor app
export interface AppActions {
  openFile: () => void;
  quickEncrypt: () => void;
  quickDecrypt: () => void;
  generatePassword: () => void;
  toggleTheme: () => void;
  showSettings: () => void;
  showHelp: () => void;
  showShortcuts: () => void;
  newWindow: () => void;
  closeWindow: () => void;
  quit: () => void;
  showRecentFiles: () => void;
  clearHistory: () => void;
  toggleAdvancedOptions: () => void;
  focusPasswordField: () => void;
  selectAllFiles: () => void;
  removeSelectedFiles: () => void;
  copyToClipboard: () => void;
  pasteFromClipboard: () => void;
  undo: () => void;
  redo: () => void;
  refresh: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  toggleFullscreen: () => void;
}

export function createAppShortcuts(actions: AppActions): KeyboardShortcut[] {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const cmdKey = isMac ? 'metaKey' : 'ctrlKey';

  return [
    // File Operations
    {
      key: 'o',
      [cmdKey]: true,
      description: 'Open file(s)',
      action: actions.openFile,
      category: 'File Operations',
    },
    {
      key: 'e',
      [cmdKey]: true,
      description: 'Quick encrypt selected files',
      action: actions.quickEncrypt,
      category: 'File Operations',
    },
    {
      key: 'd',
      [cmdKey]: true,
      description: 'Quick decrypt selected files',
      action: actions.quickDecrypt,
      category: 'File Operations',
    },
    {
      key: 'r',
      [cmdKey]: true,
      description: 'Show recent files',
      action: actions.showRecentFiles,
      category: 'File Operations',
    },
    {
      key: 'r',
      [cmdKey]: true,
      shiftKey: true,
      description: 'Clear file history',
      action: actions.clearHistory,
      category: 'File Operations',
    },

    // Password & Security
    {
      key: 'g',
      [cmdKey]: true,
      description: 'Generate secure password',
      action: actions.generatePassword,
      category: 'Security',
    },
    {
      key: 'p',
      [cmdKey]: true,
      description: 'Focus password field',
      action: actions.focusPasswordField,
      category: 'Security',
    },
    {
      key: 'a',
      [cmdKey]: true,
      shiftKey: true,
      description: 'Toggle advanced crypto options',
      action: actions.toggleAdvancedOptions,
      category: 'Security',
    },

    // Selection & Editing
    {
      key: 'a',
      [cmdKey]: true,
      description: 'Select all files',
      action: actions.selectAllFiles,
      category: 'Selection',
    },
    {
      key: 'Delete',
      description: 'Remove selected files',
      action: actions.removeSelectedFiles,
      category: 'Selection',
    },
    {
      key: 'Backspace',
      description: 'Remove selected files',
      action: actions.removeSelectedFiles,
      category: 'Selection',
    },

    // Clipboard Operations
    {
      key: 'c',
      [cmdKey]: true,
      description: 'Copy file paths to clipboard',
      action: actions.copyToClipboard,
      category: 'Clipboard',
    },
    {
      key: 'v',
      [cmdKey]: true,
      description: 'Paste file paths from clipboard',
      action: actions.pasteFromClipboard,
      category: 'Clipboard',
    },

    // Undo/Redo
    {
      key: 'z',
      [cmdKey]: true,
      description: 'Undo last action',
      action: actions.undo,
      category: 'Edit',
    },
    {
      key: 'z',
      [cmdKey]: true,
      shiftKey: true,
      description: 'Redo last action',
      action: actions.redo,
      category: 'Edit',
    },

    // View & Interface
    {
      key: 't',
      [cmdKey]: true,
      description: 'Toggle dark/light theme',
      action: actions.toggleTheme,
      category: 'View',
    },
    {
      key: 'F5',
      description: 'Refresh application',
      action: actions.refresh,
      category: 'View',
    },
    {
      key: '=',
      [cmdKey]: true,
      description: 'Zoom in',
      action: actions.zoomIn,
      category: 'View',
    },
    {
      key: '-',
      [cmdKey]: true,
      description: 'Zoom out',
      action: actions.zoomOut,
      category: 'View',
    },
    {
      key: '0',
      [cmdKey]: true,
      description: 'Reset zoom',
      action: actions.resetZoom,
      category: 'View',
    },
    {
      key: 'F11',
      description: 'Toggle fullscreen',
      action: actions.toggleFullscreen,
      category: 'View',
    },

    // Window Management
    {
      key: 'n',
      [cmdKey]: true,
      description: 'New window',
      action: actions.newWindow,
      category: 'Window',
    },
    {
      key: 'w',
      [cmdKey]: true,
      description: 'Close window',
      action: actions.closeWindow,
      category: 'Window',
    },
    {
      key: 'q',
      [cmdKey]: true,
      description: 'Quit application',
      action: actions.quit,
      category: 'Window',
    },

    // Settings & Help
    {
      key: ',',
      [cmdKey]: true,
      description: 'Open settings',
      action: actions.showSettings,
      category: 'Settings',
    },
    {
      key: 'F1',
      description: 'Show help',
      action: actions.showHelp,
      category: 'Help',
    },
    {
      key: '/',
      [cmdKey]: true,
      description: 'Show keyboard shortcuts',
      action: actions.showShortcuts,
      category: 'Help',
    },
    {
      key: '?',
      [cmdKey]: true,
      shiftKey: true,
      description: 'Show keyboard shortcuts',
      action: actions.showShortcuts,
      category: 'Help',
    },

    // Function Keys
    {
      key: 'F2',
      description: 'Rename selected file',
      action: actions.openFile, // Placeholder
      category: 'File Operations',
    },
    {
      key: 'F3',
      description: 'Find files',
      action: actions.openFile, // Placeholder
      category: 'Search',
    },
    {
      key: 'F4',
      altKey: true,
      description: 'Close application',
      action: actions.quit,
      category: 'Window',
    },

    // ESC key
    {
      key: 'Escape',
      description: 'Cancel current operation',
      action: () => {
        // Cancel any ongoing operations
        document.dispatchEvent(new CustomEvent('cancel-operation'));
      },
      category: 'General',
    },

    // Space bar
    {
      key: ' ',
      description: 'Quick preview selected file',
      action: () => {
        // Quick preview functionality
        document.dispatchEvent(new CustomEvent('quick-preview'));
      },
      category: 'Preview',
    },

    // Arrow keys with modifiers
    {
      key: 'ArrowUp',
      [cmdKey]: true,
      description: 'Move to top of file list',
      action: () => {
        document.dispatchEvent(new CustomEvent('navigate-top'));
      },
      category: 'Navigation',
    },
    {
      key: 'ArrowDown',
      [cmdKey]: true,
      description: 'Move to bottom of file list',
      action: () => {
        document.dispatchEvent(new CustomEvent('navigate-bottom'));
      },
      category: 'Navigation',
    },

    // Tab navigation
    {
      key: 'Tab',
      [cmdKey]: true,
      description: 'Switch between tabs/panels',
      action: () => {
        document.dispatchEvent(new CustomEvent('switch-tab'));
      },
      category: 'Navigation',
    },
  ];
}

// Utility function to format keyboard shortcut for display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const parts: string[] = [];

  if (shortcut.ctrlKey && !isMac) parts.push('Ctrl');
  if (shortcut.metaKey && isMac) parts.push('⌘');
  if (shortcut.metaKey && !isMac) parts.push('Win');
  if (shortcut.altKey) parts.push(isMac ? '⌥' : 'Alt');
  if (shortcut.shiftKey) parts.push(isMac ? '⇧' : 'Shift');

  // Format special keys
  let keyDisplay = shortcut.key;
  switch (shortcut.key.toLowerCase()) {
    case ' ':
      keyDisplay = 'Space';
      break;
    case 'arrowup':
      keyDisplay = '↑';
      break;
    case 'arrowdown':
      keyDisplay = '↓';
      break;
    case 'arrowleft':
      keyDisplay = '←';
      break;
    case 'arrowright':
      keyDisplay = '→';
      break;
    case 'escape':
      keyDisplay = 'Esc';
      break;
    case 'delete':
      keyDisplay = 'Del';
      break;
    case 'backspace':
      keyDisplay = '⌫';
      break;
    default:
      keyDisplay = shortcut.key.toUpperCase();
  }

  parts.push(keyDisplay);

  return parts.join(isMac ? '' : '+');
}

// Group shortcuts by category
export function groupShortcutsByCategory(
  shortcuts: KeyboardShortcut[],
): Record<string, KeyboardShortcut[]> {
  return shortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as Record<string, KeyboardShortcut[]>,
  );
}

// Custom hook for managing global app shortcuts
export function useAppShortcuts(actions: AppActions, enabled = true) {
  const shortcuts = createAppShortcuts(actions);
  useKeyboardShortcuts({ shortcuts, enabled });

  return {
    shortcuts,
    groupedShortcuts: groupShortcutsByCategory(shortcuts),
  };
}
