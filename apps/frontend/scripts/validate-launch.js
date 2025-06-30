#!/usr/bin/env node

/**
 * Launch Readiness Validation Script
 * 
 * This script validates that TradeMentor is ready for user testing and production launch.
 * It checks all critical systems, security configurations, and user experience flows.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ANSI color codes for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

class LaunchValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      checks: [],
    };
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: `${colors.blue}ℹ${colors.reset}`,
      success: `${colors.green}✓${colors.reset}`,
      error: `${colors.red}✗${colors.reset}`,
      warning: `${colors.yellow}⚠${colors.reset}`,
    }[type];

    console.log(`${timestamp} ${prefix} ${message}`);
  }

  async check(name, testFn, critical = true) {
    this.log(`Running check: ${name}`, 'info');
    
    try {
      const result = await testFn();
      const passed = result === true || (typeof result === 'object' && result.success);
      
      const checkResult = {
        name,
        passed,
        critical,
        message: typeof result === 'object' ? result.message : (passed ? 'OK' : 'Failed'),
        details: typeof result === 'object' ? result.details : null,
        timestamp: new Date().toISOString(),
      };

      this.results.checks.push(checkResult);

      if (passed) {
        this.results.passed++;
        this.log(`✓ ${name}: ${checkResult.message}`, 'success');
      } else if (critical) {
        this.results.failed++;
        this.log(`✗ ${name}: ${checkResult.message}`, 'error');
      } else {
        this.results.warnings++;
        this.log(`⚠ ${name}: ${checkResult.message}`, 'warning');
      }

      return checkResult;
    } catch (error) {
      const checkResult = {
        name,
        passed: false,
        critical,
        message: error.message,
        details: error.stack,
        timestamp: new Date().toISOString(),
      };

      this.results.checks.push(checkResult);

      if (critical) {
        this.results.failed++;
        this.log(`✗ ${name}: ${error.message}`, 'error');
      } else {
        this.results.warnings++;
        this.log(`⚠ ${name}: ${error.message}`, 'warning');
      }

      return checkResult;
    }
  }

  async validateEnvironmentVariables() {
    const requiredVars = [
      'NEXT_PUBLIC_APP_URL',
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'NEXTAUTH_URL',
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return {
        success: false,
        message: `Missing required environment variables: ${missingVars.join(', ')}`,
        details: { missingVars },
      };
    }

    return {
      success: true,
      message: `All ${requiredVars.length} required environment variables are set`,
      details: { requiredVars },
    };
  }

  async validateDependencies() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return {
        success: false,
        message: 'package.json not found',
      };
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const criticalDeps = [
      'next',
      'react',
      'react-dom',
      '@radix-ui/react-dialog',
      'lucide-react',
      'tailwindcss',
    ];

    const missingDeps = criticalDeps.filter(dep => !dependencies[dep]);
    
    if (missingDeps.length > 0) {
      return {
        success: false,
        message: `Missing critical dependencies: ${missingDeps.join(', ')}`,
        details: { missingDeps },
      };
    }

    return {
      success: true,
      message: `All ${criticalDeps.length} critical dependencies are installed`,
      details: { criticalDeps },
    };
  }

  async validateCoreFiles() {
    const criticalFiles = [
      'app/layout.tsx',
      'app/page.tsx',
      'components/ui/button.tsx',
      'components/ui/card.tsx',
      'components/feedback/FeedbackWidget.tsx',
      'lib/analytics/user-analytics.ts',
      'lib/monitoring/error-tracking.ts',
    ];

    const missingFiles = criticalFiles.filter(file => 
      !fs.existsSync(path.join(process.cwd(), file))
    );

    if (missingFiles.length > 0) {
      return {
        success: false,
        message: `Missing critical files: ${missingFiles.join(', ')}`,
        details: { missingFiles },
      };
    }

    return {
      success: true,
      message: `All ${criticalFiles.length} critical files are present`,
      details: { criticalFiles },
    };
  }

  async validateAPIEndpoints() {
    const endpoints = [
      '/api/health',
      '/api/feedback',
      '/api/analytics/events',
    ];

    const results = await Promise.all(
      endpoints.map(async (endpoint) => {
        try {
          const response = await this.makeRequest(`${this.baseUrl}${endpoint}`);
          return {
            endpoint,
            status: response.statusCode,
            success: response.statusCode < 400,
          };
        } catch (error) {
          return {
            endpoint,
            status: 0,
            success: false,
            error: error.message,
          };
        }
      })
    );

    const failedEndpoints = results.filter(r => !r.success);
    
    if (failedEndpoints.length > 0) {
      return {
        success: false,
        message: `${failedEndpoints.length} API endpoints are not responding correctly`,
        details: { results, failedEndpoints },
      };
    }

    return {
      success: true,
      message: `All ${endpoints.length} API endpoints are responding correctly`,
      details: { results },
    };
  }

  async validateSecurity() {
    const securityChecks = [];

    // Check if HTTPS is enforced in production
    if (process.env.NODE_ENV === 'production' && !this.baseUrl.startsWith('https://')) {
      securityChecks.push('HTTPS is not enforced in production');
    }

    // Check for security headers configuration
    const securityFiles = [
      'next.config.js',
      'middleware.ts',
    ];

    const hasSecurityConfig = securityFiles.some(file => 
      fs.existsSync(path.join(process.cwd(), file))
    );

    if (!hasSecurityConfig) {
      securityChecks.push('No security configuration files found');
    }

    // Check for environment variable security
    if (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET.length < 32) {
      securityChecks.push('NEXTAUTH_SECRET is not set or too short');
    }

    if (securityChecks.length > 0) {
      return {
        success: false,
        message: `Security issues found: ${securityChecks.join(', ')}`,
        details: { securityChecks },
      };
    }

    return {
      success: true,
      message: 'Basic security checks passed',
      details: { securityChecks: [] },
    };
  }

  async validateUserExperience() {
    const uxChecks = [];

    // Check for essential UX components
    const uxComponents = [
      'components/feedback/FeedbackWidget.tsx',
      'components/testing/BetaTestingDashboard.tsx',
      'components/research/UserInterviewSystem.tsx',
    ];

    const missingComponents = uxComponents.filter(component => 
      !fs.existsSync(path.join(process.cwd(), component))
    );

    if (missingComponents.length > 0) {
      uxChecks.push(`Missing UX components: ${missingComponents.join(', ')}`);
    }

    // Check for analytics tracking
    if (!fs.existsSync(path.join(process.cwd(), 'lib/analytics/user-analytics.ts'))) {
      uxChecks.push('User analytics tracking not implemented');
    }

    // Check for error monitoring
    if (!fs.existsSync(path.join(process.cwd(), 'lib/monitoring/error-tracking.ts'))) {
      uxChecks.push('Error monitoring not implemented');
    }

    if (uxChecks.length > 0) {
      return {
        success: false,
        message: `UX validation issues: ${uxChecks.join(', ')}`,
        details: { uxChecks },
      };
    }

    return {
      success: true,
      message: 'User experience validation passed',
      details: { uxChecks: [] },
    };
  }

  async validatePerformance() {
    // Basic performance checks
    const performanceChecks = [];

    // Check for Next.js optimization features
    const nextConfigPath = path.join(process.cwd(), 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
      
      if (!nextConfig.includes('swcMinify') && !nextConfig.includes('minify')) {
        performanceChecks.push('Minification not configured');
      }
    } else {
      performanceChecks.push('next.config.js not found');
    }

    // Check for critical performance files
    const performanceFiles = [
      'tailwind.config.js',
      'tsconfig.json',
    ];

    const missingPerfFiles = performanceFiles.filter(file => 
      !fs.existsSync(path.join(process.cwd(), file))
    );

    if (missingPerfFiles.length > 0) {
      performanceChecks.push(`Missing performance config files: ${missingPerfFiles.join(', ')}`);
    }

    if (performanceChecks.length > 0) {
      return {
        success: false,
        message: `Performance issues: ${performanceChecks.join(', ')}`,
        details: { performanceChecks },
      };
    }

    return {
      success: true,
      message: 'Performance validation passed',
      details: { performanceChecks: [] },
    };
  }

  makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https://');
      const client = isHttps ? https : http;
      
      const req = client.request(url, {
        method: 'GET',
        timeout: 10000,
        ...options,
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data,
          });
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));
      req.end();
    });
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.checks.length,
        passed: this.results.passed,
        failed: this.results.failed,
        warnings: this.results.warnings,
        successRate: Math.round((this.results.passed / this.results.checks.length) * 100),
      },
      readiness: {
        isReady: this.results.failed === 0,
        criticalIssues: this.results.failed,
        nonCriticalIssues: this.results.warnings,
        recommendation: this.results.failed === 0 
          ? 'System is ready for user testing and production launch'
          : 'Critical issues must be resolved before launch',
      },
      checks: this.results.checks,
    };

    return report;
  }

  async run() {
    this.log(`${colors.bold}🚀 TradeMentor Launch Readiness Validation${colors.reset}`, 'info');
    this.log(`Base URL: ${this.baseUrl}`, 'info');
    this.log('', 'info');

    // Run all validation checks
    await this.check('Environment Variables', () => this.validateEnvironmentVariables());
    await this.check('Dependencies', () => this.validateDependencies());
    await this.check('Core Files', () => this.validateCoreFiles());
    await this.check('API Endpoints', () => this.validateAPIEndpoints(), false); // Non-critical for local dev
    await this.check('Security Configuration', () => this.validateSecurity());
    await this.check('User Experience', () => this.validateUserExperience());
    await this.check('Performance Setup', () => this.validatePerformance(), false); // Non-critical

    // Generate and display report
    const report = this.generateReport();
    
    this.log('', 'info');
    this.log(`${colors.bold}📊 VALIDATION SUMMARY${colors.reset}`, 'info');
    this.log(`Total Checks: ${report.summary.total}`, 'info');
    this.log(`Passed: ${colors.green}${report.summary.passed}${colors.reset}`, 'info');
    this.log(`Failed: ${colors.red}${report.summary.failed}${colors.reset}`, 'info');
    this.log(`Warnings: ${colors.yellow}${report.summary.warnings}${colors.reset}`, 'info');
    this.log(`Success Rate: ${report.summary.successRate}%`, 'info');
    this.log('', 'info');

    if (report.readiness.isReady) {
      this.log(`${colors.green}${colors.bold}✅ LAUNCH READY${colors.reset}`, 'success');
      this.log(report.readiness.recommendation, 'success');
    } else {
      this.log(`${colors.red}${colors.bold}❌ NOT READY FOR LAUNCH${colors.reset}`, 'error');
      this.log(report.readiness.recommendation, 'error');
      this.log(`Critical issues to resolve: ${report.readiness.criticalIssues}`, 'error');
    }

    // Save detailed report
    const reportPath = path.join(process.cwd(), 'launch-readiness-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    this.log(`Detailed report saved to: ${reportPath}`, 'info');

    // Exit with appropriate code
    process.exit(report.readiness.isReady ? 0 : 1);
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new LaunchValidator();
  validator.run().catch((error) => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = LaunchValidator;
