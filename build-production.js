#!/usr/bin/env node

/**
 * Production Build Script for Golden Horse Shipping
 * This script ensures proper building for HTTP deployment
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🏗️  Starting Production Build for Golden Horse Shipping...\n');

try {
  // Step 1: Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync(path.join(__dirname, 'client/dist'))) {
    fs.rmSync(path.join(__dirname, 'client/dist'), { recursive: true, force: true });
  }
  console.log('✅ Clean completed\n');

  // Step 2: Install client dependencies
  console.log('📦 Installing client dependencies...');
  execSync('npm ci', { 
    cwd: path.join(__dirname, 'client'),
    stdio: 'inherit'
  });
  console.log('✅ Client dependencies installed\n');

  // Step 3: Build client
  console.log('🔨 Building client application...');
  execSync('npm run build', { 
    cwd: path.join(__dirname, 'client'),
    stdio: 'inherit'
  });
  console.log('✅ Client build completed\n');

  // Step 4: Verify build output
  console.log('🔍 Verifying build output...');
  const distPath = path.join(__dirname, 'client/dist');
  if (!fs.existsSync(distPath)) {
    throw new Error('Build output directory not found');
  }

  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    throw new Error('index.html not found in build output');
  }

  // Check for assets
  const assetsPath = path.join(distPath, 'assets');
  if (fs.existsSync(assetsPath)) {
    const assets = fs.readdirSync(assetsPath);
    console.log(`📁 Found ${assets.length} asset files`);
    
    // List key assets
    const jsFiles = assets.filter(f => f.endsWith('.js'));
    const cssFiles = assets.filter(f => f.endsWith('.css'));
    console.log(`   - ${jsFiles.length} JavaScript files`);
    console.log(`   - ${cssFiles.length} CSS files`);
  }

  console.log('✅ Build verification completed\n');

  // Step 5: Install server dependencies
  console.log('📦 Installing server dependencies...');
  execSync('npm ci --only=production', { 
    cwd: path.join(__dirname, 'server'),
    stdio: 'inherit'
  });
  console.log('✅ Server dependencies installed\n');

  console.log('🎉 Production build completed successfully!');
  console.log('\n📋 Build Summary:');
  console.log('   - Client: Built and ready');
  console.log('   - Server: Dependencies installed');
  console.log('   - Static files: Ready for serving');
  console.log('\n🚀 Ready for deployment!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
