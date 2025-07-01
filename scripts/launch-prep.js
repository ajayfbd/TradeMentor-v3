#!/usr/bin/env node

/**
 * TradeMentor Production Launch Script
 * 
 * This script performs final checks and preparations before production deployment
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class ProductionLauncher {
  constructor() {
    this.checklistPath = path.join(__dirname, '..', 'DEPLOYMENT_CHECKLIST.md');
    this.errors = [];
    this.warnings = [];
  }

  async runPreLaunchChecks() {
    console.log('🚀 TradeMentor Production Launch Preparation\n');
    console.log('🔍 Running pre-launch security and readiness checks...\n');

    // Environment validation
    await this.checkEnvironmentVariables();
    
    // Security validation
    await this.checkSecurityConfiguration();
    
    // Performance validation
    await this.checkPerformanceOptimizations();
    
    // Database validation
    await this.checkDatabaseReadiness();
    
    // Build validation
    await this.checkBuildConfiguration();
    
    // Monitoring validation
    await this.checkMonitoringSetup();

    // Report results
    this.generateReport();
  }

  async checkEnvironmentVariables() {
    console.log('🔐 Checking environment variables...');
    
    const requiredProdVars = [
      'NODE_ENV',
      'NEXT_PUBLIC_APP_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET',
      'ENCRYPTION_KEY',
      'DATABASE_ENCRYPTION_KEY',
      'SESSION_SECRET',
      'DATABASE_URL',
    ];

    const optionalVars = [
      'SENTRY_DSN',
      'REDIS_URL',
      'SMTP_HOST',
      'BACKUP_DIR',
      'ALLOWED_ORIGINS',
    ];

    // Check required variables
    for (const varName of requiredProdVars) {
      const value = process.env[varName];
      if (!value) {
        this.errors.push(`Missing required environment variable: ${varName}`);
      } else if (varName.includes('SECRET') || varName.includes('KEY')) {
        if (value.length < 32) {
          this.errors.push(`${varName} must be at least 32 characters long`);
        }
        if (value.includes('development') || value.includes('change')) {
          this.errors.push(`${varName} appears to contain development placeholder`);
        }
      }
    }

    // Check optional variables
    for (const varName of optionalVars) {
      if (!process.env[varName]) {
        this.warnings.push(`Optional environment variable not set: ${varName}`);
      }
    }

    // Validate NODE_ENV
    if (process.env.NODE_ENV !== 'production') {
      this.errors.push('NODE_ENV must be set to "production"');
    }

    console.log('  ✅ Environment variables checked');
  }

  async checkSecurityConfiguration() {
    console.log('🛡️  Checking security configuration...');

    // Check SSL/HTTPS
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (appUrl && !appUrl.startsWith('https://')) {
      this.errors.push('App URL must use HTTPS in production');
    }

    // Check database SSL
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && !dbUrl.includes('sslmode=require')) {
      this.warnings.push('Database connection should require SSL in production');
    }

    // Check CORS origins
    const allowedOrigins = process.env.ALLOWED_ORIGINS;
    if (!allowedOrigins) {
      this.warnings.push('ALLOWED_ORIGINS should be configured for CORS');
    } else if (allowedOrigins.includes('localhost')) {
      this.warnings.push('ALLOWED_ORIGINS contains localhost (development URL)');
    }

    console.log('  ✅ Security configuration checked');
  }

  async checkPerformanceOptimizations() {
    console.log('⚡ Checking performance optimizations...');

    try {
      // Check if bundle analyzer is available
      const packageJson = JSON.parse(
        await fs.readFile(path.join(__dirname, '..', 'apps', 'frontend', 'package.json'), 'utf8')
      );

      // Check for performance-related dependencies
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (!deps['@next/bundle-analyzer']) {
        this.warnings.push('Consider adding @next/bundle-analyzer for bundle size monitoring');
      }

      // Check Next.js configuration
      const nextConfigPath = path.join(__dirname, '..', 'apps', 'frontend', 'next.config.mjs');
      try {
        const nextConfig = await fs.readFile(nextConfigPath, 'utf8');
        if (!nextConfig.includes('compress: true')) {
          this.warnings.push('Compression should be enabled in Next.js config');
        }
        if (!nextConfig.includes('swcMinify: true')) {
          this.warnings.push('SWC minification should be enabled');
        }
      } catch (error) {
        this.warnings.push('Next.js configuration file not found or readable');
      }

    } catch (error) {
      this.warnings.push('Could not analyze package.json for performance checks');
    }

    console.log('  ✅ Performance optimizations checked');
  }

  async checkDatabaseReadiness() {
    console.log('🗄️  Checking database readiness...');

    // Check if database URL is configured
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      this.errors.push('DATABASE_URL is required for production');
      return;
    }

    // Basic URL validation
    try {
      const url = new URL(dbUrl);
      if (!url.hostname) {
        this.errors.push('Invalid DATABASE_URL format');
      }
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        this.warnings.push('Database appears to be localhost - ensure this is correct for production');
      }
    } catch (error) {
      this.errors.push('Invalid DATABASE_URL format');
    }

    // Check backup configuration
    if (!process.env.BACKUP_DIR) {
      this.warnings.push('BACKUP_DIR not configured - automated backups may not work');
    }

    console.log('  ✅ Database readiness checked');
  }

  async checkBuildConfiguration() {
    console.log('🔨 Checking build configuration...');

    try {
      // Check if TypeScript compilation passes
      console.log('  📝 Running TypeScript check...');
      await execAsync('cd apps/frontend && npm run type-check');
      console.log('  ✅ TypeScript check passed');

      // Check if build passes
      console.log('  🏗️  Running production build...');
      await execAsync('cd apps/frontend && npm run build');
      console.log('  ✅ Production build succeeded');

    } catch (error) {
      this.errors.push(`Build check failed: ${error.message}`);
    }
  }

  async checkMonitoringSetup() {
    console.log('📊 Checking monitoring setup...');

    // Check error tracking
    if (!process.env.SENTRY_DSN) {
      this.warnings.push('SENTRY_DSN not configured - error tracking will be limited');
    }

    // Check if monitoring endpoints exist
    const monitoringFiles = [
      'apps/frontend/app/api/health/route.ts',
      'apps/frontend/app/api/monitoring/errors/route.ts',
    ];

    for (const file of monitoringFiles) {
      try {
        await fs.access(path.join(__dirname, '..', file));
      } catch (error) {
        this.warnings.push(`Monitoring endpoint missing: ${file}`);
      }
    }

    console.log('  ✅ Monitoring setup checked');
  }

  generateReport() {
    console.log('\n📋 Pre-Launch Check Report\n');
    console.log('=' .repeat(50));

    if (this.errors.length === 0) {
      console.log('✅ All critical checks passed!');
    } else {
      console.log('❌ Critical issues found:');
      this.errors.forEach(error => console.log(`  • ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`  • ${warning}`));
    }

    console.log('\n' + '=' .repeat(50));

    if (this.errors.length === 0) {
      console.log('🎉 Application is ready for production deployment!');
      console.log('\nNext steps:');
      console.log('1. Review the full deployment checklist');
      console.log('2. Set up monitoring and alerting');
      console.log('3. Configure SSL certificates');
      console.log('4. Test backup and recovery procedures');
      console.log('5. Deploy to production environment');
      console.log('6. Run post-deployment verification');
    } else {
      console.log('🚫 Please fix all critical issues before deploying to production');
      process.exit(1);
    }
  }

  async generateSecurityHeaders() {
    console.log('\n🔒 Recommended Security Headers:\n');
    
    const headers = {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Content-Security-Policy': [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: https:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-ancestors 'none'",
        "upgrade-insecure-requests"
      ].join('; ')
    };

    Object.entries(headers).forEach(([header, value]) => {
      console.log(`${header}: ${value}`);
    });
  }

  async checkSSLCertificate() {
    const domain = process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '');
    if (!domain) return;

    try {
      console.log(`🔐 Checking SSL certificate for ${domain}...`);
      
      const { stdout } = await execAsync(`echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -dates`);
      
      console.log('  ✅ SSL certificate information:');
      console.log(`  ${stdout.trim()}`);
    } catch (error) {
      this.warnings.push(`Could not verify SSL certificate: ${error.message}`);
    }
  }
}

// Performance benchmarking
async function runPerformanceBenchmark() {
  console.log('\n⚡ Running performance benchmark...\n');
  
  try {
    // Lighthouse CI or similar performance testing
    console.log('📊 Performance metrics to monitor:');
    console.log('  • First Contentful Paint: <1.8s');
    console.log('  • Largest Contentful Paint: <2.5s');
    console.log('  • First Input Delay: <100ms');
    console.log('  • Cumulative Layout Shift: <0.1');
    console.log('  • Time to Interactive: <3.8s');
    console.log('\n  Run `npx lighthouse [URL]` after deployment to verify');
  } catch (error) {
    console.log('⚠️  Could not run performance benchmark:', error.message);
  }
}

// Main execution
async function main() {
  const launcher = new ProductionLauncher();
  
  await launcher.runPreLaunchChecks();
  await launcher.generateSecurityHeaders();
  await launcher.checkSSLCertificate();
  await runPerformanceBenchmark();
  
  console.log('\n📖 Don\'t forget to review the complete deployment checklist:');
  console.log('   ./DEPLOYMENT_CHECKLIST.md');
}

if (require.main === module) {
  main().catch(error => {
    console.error('❌ Launch preparation failed:', error.message);
    process.exit(1);
  });
}

module.exports = { ProductionLauncher };
