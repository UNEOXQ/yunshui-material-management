#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Cross-platform test runner script
class CrossPlatformTestRunner {
  constructor() {
    this.testResults = {
      platformCompatibility: { passed: 0, failed: 0, total: 0 },
      screenSizeAdaptability: { passed: 0, failed: 0, total: 0 },
      gestureOperations: { passed: 0, failed: 0, total: 0 },
      comprehensive: { passed: 0, failed: 0, total: 0 },
    };
    
    this.deviceConfigurations = [
      { name: 'iPhone SE', platform: 'ios', width: 320, height: 568 },
      { name: 'iPhone 12', platform: 'ios', width: 390, height: 844 },
      { name: 'iPhone 12 Pro Max', platform: 'ios', width: 428, height: 926 },
      { name: 'iPad', platform: 'ios', width: 768, height: 1024 },
      { name: 'Samsung Galaxy S21', platform: 'android', width: 360, height: 800 },
      { name: 'Samsung Galaxy Note', platform: 'android', width: 412, height: 915 },
      { name: 'Android Tablet', platform: 'android', width: 800, height: 1280 },
    ];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async runTestSuite(suiteName, testFile) {
    this.log(`Running ${suiteName} tests...`, 'info');
    
    try {
      const command = `npm run test:cross-platform -- --testPathPattern="${testFile}" --verbose`;
      const output = execSync(command, { 
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe'
      });
      
      // Parse test results from Jest output
      const results = this.parseJestOutput(output);
      this.testResults[suiteName.toLowerCase().replace(/\s+/g, '')] = results;
      
      this.log(`${suiteName} tests completed: ${results.passed}/${results.total} passed`, 'success');
      return results;
    } catch (error) {
      this.log(`${suiteName} tests failed: ${error.message}`, 'error');
      return { passed: 0, failed: 1, total: 1, error: error.message };
    }
  }

  parseJestOutput(output) {
    const lines = output.split('\n');
    let passed = 0;
    let failed = 0;
    let total = 0;

    lines.forEach(line => {
      if (line.includes('✓') || line.includes('PASS')) {
        passed++;
      } else if (line.includes('✗') || line.includes('FAIL')) {
        failed++;
      }
    });

    total = passed + failed;
    return { passed, failed, total };
  }

  async runDeviceSpecificTests() {
    this.log('Running device-specific compatibility tests...', 'info');
    
    for (const device of this.deviceConfigurations) {
      this.log(`Testing on ${device.name} (${device.platform})...`, 'info');
      
      try {
        const env = {
          ...process.env,
          TEST_DEVICE_NAME: device.name,
          TEST_PLATFORM: device.platform,
          TEST_SCREEN_WIDTH: device.width.toString(),
          TEST_SCREEN_HEIGHT: device.height.toString(),
        };
        
        const command = `npm run test:cross-platform -- --testPathPattern="CrossPlatformTestSuite" --verbose`;
        execSync(command, { 
          encoding: 'utf8',
          cwd: process.cwd(),
          env,
          stdio: 'inherit'
        });
        
        this.log(`${device.name} tests passed`, 'success');
      } catch (error) {
        this.log(`${device.name} tests failed: ${error.message}`, 'error');
      }
    }
  }

  async generateTestReport() {
    this.log('Generating cross-platform test report...', 'info');
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        totalPassed: 0,
        totalFailed: 0,
        successRate: 0,
      },
      testSuites: this.testResults,
      deviceConfigurations: this.deviceConfigurations,
      recommendations: [],
    };

    // Calculate totals
    Object.values(this.testResults).forEach(suite => {
      report.summary.totalTests += suite.total;
      report.summary.totalPassed += suite.passed;
      report.summary.totalFailed += suite.failed;
    });

    report.summary.successRate = report.summary.totalTests > 0 
      ? (report.summary.totalPassed / report.summary.totalTests * 100).toFixed(2)
      : 0;

    // Generate recommendations
    if (report.summary.successRate < 90) {
      report.recommendations.push('Consider reviewing failed tests and improving cross-platform compatibility');
    }
    
    if (this.testResults.gestureOperations.failed > 0) {
      report.recommendations.push('Review gesture handling implementation for better cross-platform consistency');
    }
    
    if (this.testResults.screenSizeAdaptability.failed > 0) {
      report.recommendations.push('Improve responsive design implementation for better screen size adaptability');
    }

    // Save report
    const reportPath = path.join(process.cwd(), 'coverage', 'cross-platform', 'test-report.json');
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Test report saved to ${reportPath}`, 'success');
    return report;
  }

  async runAll() {
    this.log('Starting comprehensive cross-platform testing...', 'info');
    
    try {
      // Run individual test suites
      await this.runTestSuite('Platform Compatibility', 'PlatformCompatibility.test.tsx');
      await this.runTestSuite('Screen Size Adaptability', 'ScreenSizeAdaptability.test.tsx');
      await this.runTestSuite('Gesture Operations', 'GestureOperations.test.tsx');
      await this.runTestSuite('Comprehensive', 'CrossPlatformTestSuite.test.tsx');
      
      // Run device-specific tests
      await this.runDeviceSpecificTests();
      
      // Generate report
      const report = await this.generateTestReport();
      
      // Display summary
      this.displaySummary(report);
      
      // Exit with appropriate code
      const success = report.summary.successRate >= 90;
      process.exit(success ? 0 : 1);
      
    } catch (error) {
      this.log(`Cross-platform testing failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }

  displaySummary(report) {
    this.log('\n=== Cross-Platform Test Summary ===', 'info');
    this.log(`Total Tests: ${report.summary.totalTests}`, 'info');
    this.log(`Passed: ${report.summary.totalPassed}`, 'success');
    this.log(`Failed: ${report.summary.totalFailed}`, report.summary.totalFailed > 0 ? 'error' : 'info');
    this.log(`Success Rate: ${report.summary.successRate}%`, 
      report.summary.successRate >= 90 ? 'success' : 'warning');
    
    if (report.recommendations.length > 0) {
      this.log('\n=== Recommendations ===', 'warning');
      report.recommendations.forEach(rec => {
        this.log(`• ${rec}`, 'warning');
      });
    }
    
    this.log('\n=== Test Suite Breakdown ===', 'info');
    Object.entries(report.testSuites).forEach(([suite, results]) => {
      this.log(`${suite}: ${results.passed}/${results.total} passed`, 
        results.failed > 0 ? 'warning' : 'success');
    });
  }
}

// Run the test runner
if (require.main === module) {
  const runner = new CrossPlatformTestRunner();
  runner.runAll().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = CrossPlatformTestRunner;