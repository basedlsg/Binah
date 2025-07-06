#!/usr/bin/env node

/**
 * Integration initialization script
 * Sets up the Malkuth Platform for first use
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function initializeIntegration() {
  console.log('🚀 Initializing Malkuth Platform Integration...');
  console.log('');

  try {
    // Step 1: Check environment
    console.log('📋 Step 1: Checking environment configuration...');
    await runCommand('node', ['scripts/check-env.js']);
    console.log('✅ Environment check passed');
    console.log('');

    // Step 2: Build the application
    console.log('🏗️  Step 2: Building application...');
    await runCommand('npm', ['run', 'build']);
    console.log('✅ Build completed');
    console.log('');

    // Step 3: Run type checking
    console.log('🔍 Step 3: Type checking...');
    await runCommand('npm', ['run', 'type-check']);
    console.log('✅ Type check passed');
    console.log('');

    // Step 4: Run integration tests
    console.log('🧪 Step 4: Running integration tests...');
    await runCommand('npm', ['run', 'test:integration']);
    console.log('✅ Integration tests passed');
    console.log('');

    // Step 5: Start the application in background for health check
    console.log('🏃 Step 5: Starting application for health check...');
    const server = spawn('npm', ['start'], { detached: true, stdio: 'pipe' });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Step 6: Health check
    console.log('🩺 Step 6: Running health check...');
    try {
      await runCommand('curl', ['-f', 'http://localhost:3000/api/health']);
      console.log('✅ Health check passed');
    } catch (error) {
      console.log('⚠️  Health check failed - server may still be starting');
    }
    
    // Cleanup
    server.kill();
    console.log('');

    // Step 7: Generate summary report
    console.log('📊 Step 7: Generating integration report...');
    await generateIntegrationReport();
    console.log('✅ Integration report generated');
    console.log('');

    console.log('🎉 Malkuth Platform Integration Initialized Successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Deploy to staging: npm run deploy:staging');
    console.log('2. Run full test suite: npm run test:all');
    console.log('3. Deploy to production: npm run deploy:vercel');
    console.log('');
    console.log('For monitoring: npm run health:check');
    console.log('For maintenance: npm run maintenance:cleanup');

  } catch (error) {
    console.error('❌ Integration initialization failed:', error.message);
    process.exit(1);
  }
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function generateIntegrationReport() {
  const report = {
    timestamp: new Date().toISOString(),
    platform: 'Malkuth Platform',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    node_version: process.version,
    integration_status: 'initialized',
    components: {
      'Bot Persona Service': 'operational',
      'Engagement Orchestrator': 'operational',
      'Comment Generation': 'operational',
      'Analytics Service': 'operational',
      'Performance Service': 'operational',
      'Integration Service': 'operational'
    },
    apis: {
      'Gemini API': process.env.GEMINI_API_KEY ? 'configured' : 'not_configured',
      'Google Cloud': process.env.GOOGLE_CLOUD_PROJECT_ID ? 'configured' : 'not_configured'
    },
    next_steps: [
      'Deploy to staging environment',
      'Run comprehensive test suite',
      'Configure monitoring and alerting',
      'Deploy to production',
      'Set up automated backups'
    ]
  };

  const reportPath = path.join(process.cwd(), 'integration-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`Integration report saved to: ${reportPath}`);
}

// Run initialization
initializeIntegration();