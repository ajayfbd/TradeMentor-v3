#!/usr/bin/env node

/**
 * TradeMentor Backup Management Script
 * 
 * Usage:
 *   node scripts/backup.js create        # Create full backup
 *   node scripts/backup.js list          # List all backups
 *   node scripts/backup.js restore <id>  # Restore from backup
 *   node scripts/backup.js verify <id>   # Verify backup integrity
 *   node scripts/backup.js cleanup       # Clean up old backups
 *   node scripts/backup.js schedule      # Set up automated backups
 */

const { BackupService } = require('../lib/backup/backup-service');
const { exec } = require('child_process');
const { promisify } = require('util');
const cron = require('node-cron');

const execAsync = promisify(exec);

class BackupManager {
  constructor() {
    this.backupService = new BackupService({
      backupDir: process.env.BACKUP_DIR || './backups',
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30'),
      maxBackups: parseInt(process.env.MAX_BACKUPS || '100'),
    });
  }

  async createBackup(description) {
    try {
      console.log('🔄 Creating backup...');
      const startTime = Date.now();
      
      const metadata = await this.backupService.createFullBackup(description);
      const duration = Date.now() - startTime;
      
      console.log('✅ Backup created successfully!');
      console.log(`📁 Backup ID: ${metadata.id}`);
      console.log(`📊 Size: ${this.formatBytes(metadata.size)}`);
      console.log(`⏱️  Duration: ${duration}ms`);
      console.log(`🔒 Checksum: ${metadata.checksum.substring(0, 16)}...`);
      
      return metadata;
    } catch (error) {
      console.error('❌ Backup failed:', error.message);
      process.exit(1);
    }
  }

  async listBackups() {
    try {
      const backups = await this.backupService.listBackups();
      
      if (backups.length === 0) {
        console.log('📁 No backups found');
        return;
      }

      console.log(`📁 Found ${backups.length} backup(s):\n`);
      console.log('ID'.padEnd(30) + 'Timestamp'.padEnd(25) + 'Size'.padEnd(12) + 'Type');
      console.log('-'.repeat(75));
      
      for (const backup of backups) {
        const timestamp = new Date(backup.timestamp).toLocaleString();
        const size = this.formatBytes(backup.size);
        console.log(
          backup.id.padEnd(30) + 
          timestamp.padEnd(25) + 
          size.padEnd(12) + 
          backup.type
        );
      }
    } catch (error) {
      console.error('❌ Failed to list backups:', error.message);
      process.exit(1);
    }
  }

  async restoreBackup(backupId, options = {}) {
    try {
      console.log(`🔄 Restoring from backup: ${backupId}`);
      
      if (options.dryRun) {
        console.log('🧪 Running in dry-run mode...');
      }

      const startTime = Date.now();
      await this.backupService.restoreBackup(backupId, options);
      const duration = Date.now() - startTime;
      
      if (options.dryRun) {
        console.log('✅ Dry run completed successfully!');
      } else {
        console.log('✅ Restore completed successfully!');
      }
      console.log(`⏱️  Duration: ${duration}ms`);
      
    } catch (error) {
      console.error('❌ Restore failed:', error.message);
      process.exit(1);
    }
  }

  async verifyBackup(backupId) {
    try {
      console.log(`🔍 Verifying backup: ${backupId}`);
      
      const isValid = await this.backupService.verifyBackupIntegrity(backupId);
      
      if (isValid) {
        console.log('✅ Backup integrity verified successfully!');
      } else {
        console.log('❌ Backup integrity check failed!');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Verification failed:', error.message);
      process.exit(1);
    }
  }

  async cleanup() {
    try {
      console.log('🧹 Cleaning up old backups...');
      
      const backupsBefore = await this.backupService.listBackups();
      // Cleanup is handled internally by the service
      await this.backupService.createFullBackup('Cleanup trigger');
      const backupsAfter = await this.backupService.listBackups();
      
      const cleaned = backupsBefore.length - backupsAfter.length + 1; // +1 for the new backup
      
      if (cleaned > 0) {
        console.log(`✅ Cleaned up ${cleaned} old backup(s)`);
      } else {
        console.log('✅ No cleanup needed');
      }
    } catch (error) {
      console.error('❌ Cleanup failed:', error.message);
      process.exit(1);
    }
  }

  async scheduleBackups() {
    const schedule = process.env.BACKUP_SCHEDULE || '0 2 * * *'; // Daily at 2 AM
    
    console.log(`⏰ Scheduling automated backups: ${schedule}`);
    
    cron.schedule(schedule, async () => {
      console.log('🔄 Running scheduled backup...');
      try {
        await this.createBackup('Scheduled backup');
        console.log('✅ Scheduled backup completed');
      } catch (error) {
        console.error('❌ Scheduled backup failed:', error.message);
        // Send alert notification
        await this.sendAlert('Backup Failed', error.message);
      }
    });

    console.log('✅ Backup scheduler started');
    console.log('Press Ctrl+C to stop the scheduler');
    
    // Keep the process running
    process.on('SIGINT', () => {
      console.log('\n⏹️  Backup scheduler stopped');
      process.exit(0);
    });
  }

  async sendAlert(title, message) {
    // Implement alerting mechanism
    // Email, Slack, SMS, etc.
    console.log(`🚨 ALERT: ${title} - ${message}`);
    
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        // Send Slack notification
        // await sendSlackNotification(title, message);
      } catch (error) {
        console.error('Failed to send Slack alert:', error.message);
      }
    }
  }

  formatBytes(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// CLI Interface
async function main() {
  const manager = new BackupManager();
  const command = process.argv[2];
  const args = process.argv.slice(3);

  console.log('🛡️  TradeMentor Backup Manager\n');

  switch (command) {
    case 'create':
      await manager.createBackup(args[0] || `Manual backup ${new Date().toISOString()}`);
      break;
      
    case 'list':
      await manager.listBackups();
      break;
      
    case 'restore':
      if (!args[0]) {
        console.error('❌ Backup ID required');
        console.log('Usage: node scripts/backup.js restore <backup-id>');
        process.exit(1);
      }
      
      const restoreOptions = {
        dryRun: args.includes('--dry-run'),
        skipUserData: args.includes('--skip-user-data'),
      };
      
      await manager.restoreBackup(args[0], restoreOptions);
      break;
      
    case 'verify':
      if (!args[0]) {
        console.error('❌ Backup ID required');
        console.log('Usage: node scripts/backup.js verify <backup-id>');
        process.exit(1);
      }
      await manager.verifyBackup(args[0]);
      break;
      
    case 'cleanup':
      await manager.cleanup();
      break;
      
    case 'schedule':
      await manager.scheduleBackups();
      break;
      
    default:
      console.log('Usage:');
      console.log('  node scripts/backup.js create [description]');
      console.log('  node scripts/backup.js list');
      console.log('  node scripts/backup.js restore <id> [--dry-run] [--skip-user-data]');
      console.log('  node scripts/backup.js verify <id>');
      console.log('  node scripts/backup.js cleanup');
      console.log('  node scripts/backup.js schedule');
      process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = { BackupManager };
