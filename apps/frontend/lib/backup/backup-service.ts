import { createWriteStream, createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { createGzip, createGunzip } from 'zlib';
import { join } from 'path';
import { mkdir, readdir, stat, unlink } from 'fs/promises';

interface BackupConfig {
  backupDir: string;
  retentionDays: number;
  maxBackups: number;
  compressionLevel: number;
  includeUserData: boolean;
  includeLogs: boolean;
  encryptBackups: boolean;
}

interface BackupMetadata {
  id: string;
  timestamp: string;
  version: string;
  size: number;
  checksum: string;
  type: 'full' | 'incremental';
  tables: string[];
  compressed: boolean;
  encrypted: boolean;
}

class BackupService {
  private config: BackupConfig;

  constructor(config: Partial<BackupConfig> = {}) {
    this.config = {
      backupDir: process.env.BACKUP_DIR || './backups',
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      maxBackups: parseInt(process.env.MAX_BACKUPS || '100'),
      compressionLevel: 6,
      includeUserData: true,
      includeLogs: false,
      encryptBackups: process.env.NODE_ENV === 'production',
      ...config,
    };
  }

  async createFullBackup(description?: string): Promise<BackupMetadata> {
    const backupId = this.generateBackupId();
    const timestamp = new Date().toISOString();
    
    try {
      // Ensure backup directory exists
      await mkdir(this.config.backupDir, { recursive: true });

      console.log(`Starting full backup: ${backupId}`);

      // Create backup data
      const backupData = await this.collectBackupData();
      
      // Write backup file
      const backupPath = join(this.config.backupDir, `${backupId}.backup`);
      await this.writeBackupFile(backupPath, backupData);

      // Calculate file size and checksum
      const stats = await stat(backupPath);
      const checksum = await this.calculateChecksum(backupPath);

      const metadata: BackupMetadata = {
        id: backupId,
        timestamp,
        version: process.env.npm_package_version || '1.0.0',
        size: stats.size,
        checksum,
        type: 'full',
        tables: await this.getTableNames(),
        compressed: true,
        encrypted: this.config.encryptBackups,
      };

      // Save metadata
      await this.saveBackupMetadata(backupId, metadata);

      // Clean up old backups
      await this.cleanupOldBackups();

      console.log(`Backup completed: ${backupId} (${this.formatBytes(stats.size)})`);
      return metadata;

    } catch (error) {
      console.error(`Backup failed: ${backupId}`, error);
      throw new Error(`Backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async restoreBackup(backupId: string, options: {
    skipUserData?: boolean;
    specificTables?: string[];
    dryRun?: boolean;
  } = {}): Promise<void> {
    try {
      console.log(`Starting restore from backup: ${backupId}`);

      // Load backup metadata
      const metadata = await this.loadBackupMetadata(backupId);
      if (!metadata) {
        throw new Error(`Backup not found: ${backupId}`);
      }

      // Verify backup integrity
      await this.verifyBackupIntegrity(backupId, metadata);

      if (options.dryRun) {
        console.log('Dry run completed - backup is valid and ready for restore');
        return;
      }

      // Create database backup before restore
      const preRestoreBackupId = await this.createFullBackup('Pre-restore backup');
      console.log(`Created pre-restore backup: ${preRestoreBackupId.id}`);

      // Read backup data
      const backupPath = join(this.config.backupDir, `${backupId}.backup`);
      const backupData = await this.readBackupFile(backupPath);

      // Restore data
      await this.restoreData(backupData, {
        skipUserData: options.skipUserData,
        specificTables: options.specificTables,
      });

      console.log(`Restore completed successfully from backup: ${backupId}`);

    } catch (error) {
      console.error(`Restore failed for backup: ${backupId}`, error);
      throw new Error(`Backup restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async listBackups(): Promise<BackupMetadata[]> {
    try {
      const files = await readdir(this.config.backupDir);
      const metadataFiles = files.filter(file => file.endsWith('.meta.json'));
      
      const backups: BackupMetadata[] = [];
      
      for (const file of metadataFiles) {
        const backupId = file.replace('.meta.json', '');
        const metadata = await this.loadBackupMetadata(backupId);
        if (metadata) {
          backups.push(metadata);
        }
      }

      // Sort by timestamp (newest first)
      return backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    try {
      const backupPath = join(this.config.backupDir, `${backupId}.backup`);
      const metadataPath = join(this.config.backupDir, `${backupId}.meta.json`);

      await Promise.all([
        unlink(backupPath).catch(() => {}), // Ignore if file doesn't exist
        unlink(metadataPath).catch(() => {}),
      ]);

      console.log(`Deleted backup: ${backupId}`);
    } catch (error) {
      console.error(`Failed to delete backup: ${backupId}`, error);
      throw error;
    }
  }

  async verifyBackupIntegrity(backupId: string, metadata?: BackupMetadata): Promise<boolean> {
    try {
      if (!metadata) {
        const loadedMetadata = await this.loadBackupMetadata(backupId);
        if (!loadedMetadata) {
          throw new Error('Backup metadata not found');
        }
        metadata = loadedMetadata;
      }

      const backupPath = join(this.config.backupDir, `${backupId}.backup`);
      const currentChecksum = await this.calculateChecksum(backupPath);

      if (currentChecksum !== metadata.checksum) {
        throw new Error('Backup file integrity check failed - checksums do not match');
      }

      console.log(`Backup integrity verified: ${backupId}`);
      return true;

    } catch (error) {
      console.error(`Backup integrity verification failed: ${backupId}`, error);
      return false;
    }
  }

  private generateBackupId(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substr(2, 8);
    return `backup-${timestamp}-${random}`;
  }

  private async collectBackupData(): Promise<any> {
    // Mock backup data collection - implement actual database export
    const data = {
      metadata: {
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      },
      tables: {
        // Implement actual table data export
        emotion_entries: await this.exportTable('emotion_entries'),
        trade_entries: await this.exportTable('trade_entries'),
        users: this.config.includeUserData ? await this.exportTable('users') : [],
      },
      schema: await this.exportSchema(),
    };

    return data;
  }

  private async exportTable(tableName: string): Promise<any[]> {
    // Mock table export - implement actual database query
    console.log(`Exporting table: ${tableName}`);
    return [];
  }

  private async exportSchema(): Promise<any> {
    // Mock schema export - implement actual schema extraction
    return {};
  }

  private async getTableNames(): Promise<string[]> {
    // Mock table names - implement actual database introspection
    return ['emotion_entries', 'trade_entries', 'users'];
  }

  private async writeBackupFile(path: string, data: any): Promise<void> {
    const jsonString = JSON.stringify(data, null, 2);
    
    // Create streams
    const writeStream = createWriteStream(path);
    const gzipStream = createGzip({ level: this.config.compressionLevel });

    // Write compressed data
    await pipeline(
      Buffer.from(jsonString),
      gzipStream,
      writeStream
    );
  }

  private async readBackupFile(path: string): Promise<any> {
    const readStream = createReadStream(path);
    const gunzipStream = createGunzip();
    
    const chunks: Buffer[] = [];
    
    await pipeline(
      readStream,
      gunzipStream,
      async function* (source) {
        for await (const chunk of source) {
          chunks.push(chunk);
        }
      }
    );

    const jsonString = Buffer.concat(chunks).toString();
    return JSON.parse(jsonString);
  }

  private async restoreData(data: any, options: {
    skipUserData?: boolean;
    specificTables?: string[];
  }): Promise<void> {
    console.log('Starting data restoration...');

    // Restore schema first
    if (data.schema) {
      await this.restoreSchema(data.schema);
    }

    // Restore table data
    for (const [tableName, tableData] of Object.entries(data.tables)) {
      if (options.specificTables && !options.specificTables.includes(tableName)) {
        continue;
      }

      if (options.skipUserData && tableName === 'users') {
        continue;
      }

      await this.restoreTable(tableName, tableData as any[]);
    }
  }

  private async restoreSchema(schema: any): Promise<void> {
    console.log('Restoring database schema...');
    // Implement actual schema restoration
  }

  private async restoreTable(tableName: string, data: any[]): Promise<void> {
    console.log(`Restoring table: ${tableName} (${data.length} records)`);
    // Implement actual table data restoration
  }

  private async calculateChecksum(filePath: string): Promise<string> {
    const { createHash } = await import('crypto');
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);

    return new Promise((resolve, reject) => {
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }

  private async saveBackupMetadata(backupId: string, metadata: BackupMetadata): Promise<void> {
    const metadataPath = join(this.config.backupDir, `${backupId}.meta.json`);
    const { writeFile } = await import('fs/promises');
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
  }

  private async loadBackupMetadata(backupId: string): Promise<BackupMetadata | null> {
    try {
      const metadataPath = join(this.config.backupDir, `${backupId}.meta.json`);
      const { readFile } = await import('fs/promises');
      const content = await readFile(metadataPath, 'utf8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  private async cleanupOldBackups(): Promise<void> {
    const backups = await this.listBackups();
    
    // Remove backups older than retention period
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

    const oldBackups = backups.filter(backup => 
      new Date(backup.timestamp) < cutoffDate
    );

    // Remove excess backups (keep only maxBackups)
    const excessBackups = backups.slice(this.config.maxBackups);

    const toDelete = [...oldBackups, ...excessBackups];

    for (const backup of toDelete) {
      await this.deleteBackup(backup.id);
    }

    if (toDelete.length > 0) {
      console.log(`Cleaned up ${toDelete.length} old backups`);
    }
  }

  private formatBytes(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Export backup utilities
export { BackupService, type BackupConfig, type BackupMetadata };

// Create default backup service instance
export const backupService = new BackupService();
