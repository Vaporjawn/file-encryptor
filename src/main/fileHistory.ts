import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export interface RecentFile {
  path: string;
  name: string;
  operation: 'encrypt' | 'decrypt';
  timestamp: number;
  size: number;
}

export interface FavoriteLocation {
  path: string;
  name: string;
  timestamp: number;
}

export class FileHistoryManager {
  private historyPath: string;
  private favoritesPath: string;
  private maxRecentFiles = 20;
  private maxFavorites = 10;

  constructor() {
    const userDataPath = app.getPath('userData');
    this.historyPath = path.join(userDataPath, 'recent-files.json');
    this.favoritesPath = path.join(userDataPath, 'favorites.json');
    this.ensureDataFiles();
  }

  private ensureDataFiles(): void {
    if (!fs.existsSync(this.historyPath)) {
      fs.writeFileSync(this.historyPath, JSON.stringify([]));
    }
    if (!fs.existsSync(this.favoritesPath)) {
      fs.writeFileSync(this.favoritesPath, JSON.stringify([]));
    }
  }

  addToHistory(filePath: string, operation: 'encrypt' | 'decrypt'): void {
    try {
      const stats = fs.statSync(filePath);
      const recentFile: RecentFile = {
        path: filePath,
        name: path.basename(filePath),
        operation,
        timestamp: Date.now(),
        size: stats.size,
      };

      const history = this.getRecentFiles();

      // Remove existing entry if present
      const filteredHistory = history.filter(file => file.path !== filePath);

      // Add new entry at the beginning
      filteredHistory.unshift(recentFile);

      // Keep only the most recent entries
      const trimmedHistory = filteredHistory.slice(0, this.maxRecentFiles);

      fs.writeFileSync(this.historyPath, JSON.stringify(trimmedHistory, null, 2));
    } catch (error) {
      console.error('Error adding to history:', error);
    }
  }

  getRecentFiles(): RecentFile[] {
    try {
      const data = fs.readFileSync(this.historyPath, 'utf8');
      const files = JSON.parse(data) as RecentFile[];

      // Filter out files that no longer exist
      return files.filter(file => fs.existsSync(file.path));
    } catch (error) {
      console.error('Error reading history:', error);
      return [];
    }
  }

  clearHistory(): void {
    try {
      fs.writeFileSync(this.historyPath, JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }

  addToFavorites(filePath: string, customName?: string): void {
    try {
      const favorite: FavoriteLocation = {
        path: filePath,
        name: customName || path.basename(filePath),
        timestamp: Date.now(),
      };

      const favorites = this.getFavorites();

      // Remove existing entry if present
      const filteredFavorites = favorites.filter(fav => fav.path !== filePath);

      // Add new entry at the beginning
      filteredFavorites.unshift(favorite);

      // Keep only the most recent favorites
      const trimmedFavorites = filteredFavorites.slice(0, this.maxFavorites);

      fs.writeFileSync(this.favoritesPath, JSON.stringify(trimmedFavorites, null, 2));
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  }

  getFavorites(): FavoriteLocation[] {
    try {
      const data = fs.readFileSync(this.favoritesPath, 'utf8');
      const favorites = JSON.parse(data) as FavoriteLocation[];

      // Filter out locations that no longer exist
      return favorites.filter(fav => fs.existsSync(fav.path));
    } catch (error) {
      console.error('Error reading favorites:', error);
      return [];
    }
  }

  removeFromFavorites(filePath: string): void {
    try {
      const favorites = this.getFavorites();
      const filteredFavorites = favorites.filter(fav => fav.path !== filePath);
      fs.writeFileSync(this.favoritesPath, JSON.stringify(filteredFavorites, null, 2));
    } catch (error) {
      console.error('Error removing from favorites:', error);
    }
  }

  clearFavorites(): void {
    try {
      fs.writeFileSync(this.favoritesPath, JSON.stringify([]));
    } catch (error) {
      console.error('Error clearing favorites:', error);
    }
  }
}
