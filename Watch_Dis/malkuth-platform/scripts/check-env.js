#!/usr/bin/env node

/**
 * Environment configuration checker
 * Validates that all required environment variables are properly configured
 */

const requiredEnvVars = {
  development: [
    'GEMINI_API_KEY',
    'NODE_ENV'
  ],
  production: [
    'GEMINI_API_KEY',
    'GEMINI_MODEL',
    'GOOGLE_CLOUD_PROJECT_ID',
    'NEXTAUTH_URL',
    'NEXTAUTH_SECRET',
    'JWT_SECRET',
    'NODE_ENV'
  ]
};

const optionalEnvVars = [
  'GOOGLE_CLOUD_API_KEY',
  'DATABASE_URL',
  'REDIS_URL',
  'ENCRYPTION_KEY',
  'CRON_SECRET',
  'CACHE_TTL',
  'API_RATE_LIMIT_MAX',
  'API_RATE_LIMIT_WINDOW',
  'ANALYTICS_RETENTION_DAYS',
  'MAX_BOTS_PER_USER',
  'DEFAULT_BOT_COUNT'
];

function checkEnvironment() {
  const env = process.env.NODE_ENV || 'development';
  const required = requiredEnvVars[env] || requiredEnvVars.development;
  
  console.log(`🔍 Checking environment configuration for: ${env}`);
  console.log('');

  let hasErrors = false;
  let hasWarnings = false;

  // Check required variables
  console.log('✅ Required Variables:');
  required.forEach(varName => {
    const value = process.env[varName];
    if (!value) {
      console.log(`  ❌ ${varName}: NOT SET`);
      hasErrors = true;
    } else if (value === 'your-api-key' || value === 'your-secret' || value.includes('your-')) {
      console.log(`  ⚠️  ${varName}: DEFAULT VALUE (needs to be changed)`);
      hasWarnings = true;
    } else {
      const maskedValue = varName.includes('KEY') || varName.includes('SECRET') 
        ? `${value.substring(0, 8)}...` 
        : value;
      console.log(`  ✅ ${varName}: ${maskedValue}`);
    }
  });

  console.log('');
  console.log('📋 Optional Variables:');
  optionalEnvVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      const maskedValue = varName.includes('KEY') || varName.includes('SECRET') || varName.includes('URL')
        ? `${value.substring(0, 8)}...` 
        : value;
      console.log(`  ✅ ${varName}: ${maskedValue}`);
    } else {
      console.log(`  ➖ ${varName}: Not set (using defaults)`);
    }
  });

  console.log('');

  // Environment-specific checks
  if (env === 'production') {
    console.log('🔒 Production Security Checks:');
    
    // Check for strong secrets
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length < 32) {
      console.log('  ⚠️  JWT_SECRET should be at least 32 characters long');
      hasWarnings = true;
    } else if (jwtSecret) {
      console.log('  ✅ JWT_SECRET length is adequate');
    }

    // Check NEXTAUTH_URL
    const nextAuthUrl = process.env.NEXTAUTH_URL;
    if (nextAuthUrl && !nextAuthUrl.startsWith('https://')) {
      console.log('  ⚠️  NEXTAUTH_URL should use HTTPS in production');
      hasWarnings = true;
    } else if (nextAuthUrl) {
      console.log('  ✅ NEXTAUTH_URL uses HTTPS');
    }

    // Check Gemini API key format
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey && !geminiKey.startsWith('AIza')) {
      console.log('  ⚠️  GEMINI_API_KEY format may be incorrect');
      hasWarnings = true;
    } else if (geminiKey) {
      console.log('  ✅ GEMINI_API_KEY format looks correct');
    }
  }

  console.log('');

  // Summary
  if (hasErrors) {
    console.log('❌ Environment check FAILED - missing required variables');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Environment check PASSED with warnings');
    console.log('   Consider addressing the warnings above for optimal security');
    process.exit(0);
  } else {
    console.log('✅ Environment check PASSED - all required variables are set');
    process.exit(0);
  }
}

// Run the check
checkEnvironment();