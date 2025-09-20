#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// TypeScript syntax fix patterns
const fixPatterns = [
  {
    // Fix: account.(isNaN(balance) || !isFinite(balance) ? 0 : balance).toLocaleString('ar-LY')
    // To: (isNaN(account.balance) || !isFinite(account.balance) ? 0 : account.balance).toLocaleString('ar-LY')
    pattern: /(\w+)\.(\(isNaN\((\w+)\)\s*\|\|\s*!isFinite\(\3\)\s*\?\s*0\s*:\s*\3\))/g,
    replacement: '(isNaN($1.$3) || !isFinite($1.$3) ? 0 : $1.$3)'
  },
  {
    // Fix complex nested patterns like: trialBalanceData.(isNaN(totals.totalDebits)...
    pattern: /(\w+)\.(\(isNaN\((\w+\.\w+)\)\s*\|\|\s*!isFinite\(\3\)\s*\?\s*0\s*:\s*\3\))/g,
    replacement: '(isNaN($1.$3) || !isFinite($1.$3) ? 0 : $1.$3)'
  },
  {
    // Fix patterns like: selectedEmployee.(isNaN(employee.salary)...
    pattern: /(\w+)\.(\(isNaN\((\w+\.\w+)\)\s*\|\|\s*!isFinite\(\3\)\s*\?\s*0\s*:\s*\3\))/g,
    replacement: '(isNaN($1.$3) || !isFinite($1.$3) ? 0 : $1.$3)'
  },
  {
    // Fix patterns like: selectedEmployee.accounts.(isNaN(salary.balance)...
    pattern: /(\w+\.\w+)\.(\(isNaN\((\w+\.\w+)\)\s*\|\|\s*!isFinite\(\3\)\s*\?\s*0\s*:\s*\3\))/g,
    replacement: '(isNaN($1.$3) || !isFinite($1.$3) ? 0 : $1.$3)'
  },
  {
    // Fix deeply nested patterns like: selectedEmployee.(isNaN(accounts.salary.balance)...
    pattern: /(\w+)\.(\(isNaN\((\w+\.\w+\.\w+)\)\s*\|\|\s*!isFinite\(\3\)\s*\?\s*0\s*:\s*\3\))/g,
    replacement: '(isNaN($1.$3) || !isFinite($1.$3) ? 0 : $1.$3)'
  }
];

// Function to fix TypeScript syntax in a file
function fixTypeScriptFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    fixPatterns.forEach(pattern => {
      content = content.replace(pattern.pattern, pattern.replacement);
    });
    
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find TypeScript files
function findTypeScriptFiles(dir, extensions = ['.tsx', '.ts']) {
  const files = [];
  
  function walk(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        walk(fullPath);
      } else if (stat.isFile() && extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

// Main execution
const clientSrcPath = path.join(__dirname, 'client', 'src');

if (!fs.existsSync(clientSrcPath)) {
  console.error('❌ Client src directory not found!');
  process.exit(1);
}

console.log('🔧 Starting TypeScript syntax fixes...');

const tsFiles = findTypeScriptFiles(clientSrcPath);
console.log(`📁 Found ${tsFiles.length} TypeScript files`);

let fixedCount = 0;
for (const file of tsFiles) {
  if (fixTypeScriptFile(file)) {
    fixedCount++;
  }
}

console.log(`\n✅ Fixed ${fixedCount} files out of ${tsFiles.length} total files`);

if (fixedCount > 0) {
  console.log('\n💡 Run "npm run type-check" in the client directory to verify fixes');
} else {
  console.log('\n📋 No files needed fixing');
}