#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const distDir = join(__dirname, '..', 'dist');

const componentRegistrationESM = `
  import { defineCustomElements } from './loader.js';

  // Auto-register components when the SDK is imported
  if (typeof window !== 'undefined') {
    defineCustomElements();
  }
  `;

const componentRegistrationCJS = `
  const { defineCustomElements } = require('./loader.cjs.js');

  // Auto-register components when the SDK is imported
  if (typeof window !== 'undefined') {
    defineCustomElements();
  }
  `;

function addComponentRegistration() {
  try {
    // Update ESM index.js (check if it exists first)
    const esmIndexPath = join(distDir, 'esm', 'index.js');
    let esmContent = '';
    try {
      esmContent = readFileSync(esmIndexPath, 'utf8');
      writeFileSync(esmIndexPath, esmContent + componentRegistrationESM);
      console.log('✓ Updated dist/esm/index.js');
    } catch (esmError) {
      console.log('⚠ dist/esm/index.js not found, skipping ESM update');
    }

    // Update CJS index.cjs.js (check if it exists first)
    const cjsIndexPath = join(distDir, 'cjs', 'index.cjs.js');
    try {
      const cjsContent = readFileSync(cjsIndexPath, 'utf8');
      writeFileSync(cjsIndexPath, cjsContent + componentRegistrationCJS);
      console.log('✓ Updated dist/cjs/index.cjs.js');
    } catch (cjsError) {
      console.log('⚠ dist/cjs/index.cjs.js not found, skipping CJS update');
    }

    // Copy all ESM files to www for development
    const wwwDir = join(__dirname, '..', 'www');
    const esmDir = join(distDir, 'esm');

    try {
      // Copy the main file as index.js
      const esmContent = readFileSync(esmIndexPath, 'utf8');
      writeFileSync(join(wwwDir, 'index.js'), esmContent);
      console.log('✓ Copied modified index.js to www/ for development');

      // Also update the build/index.esm.js file with component registration
      const wwwBuildIndexPath = join(wwwDir, 'build', 'index.esm.js');
      try {
        const buildContent = readFileSync(wwwBuildIndexPath, 'utf8');
        // Use unidy-login.esm.js for build directory since it auto-registers
        const buildComponentRegistration = `
          // Auto-register components when the SDK is imported
          import './unidy-login.esm.js';
          `;
        const buildWithRegistration = buildContent + buildComponentRegistration;
        writeFileSync(wwwBuildIndexPath, buildWithRegistration);
        console.log('✓ Updated www/build/index.esm.js with component registration');
      } catch (buildError) {
        console.log('⚠ Could not update www/build/index.esm.js');
      }

      // Copy all other ESM dependencies
      const esmFiles = readdirSync(esmDir).filter(file =>
        file.endsWith('.js') &&
        file !== 'index.js' &&
        file !== 'loader.js' &&
        !file.includes('.map')
      );

      for (const file of esmFiles) {
        const srcPath = join(esmDir, file);
        const destPath = join(wwwDir, file);
        const content = readFileSync(srcPath, 'utf8');
        writeFileSync(destPath, content);
        console.log(`✓ Copied ${file} to www/`);
      }

      // Copy the loader
      const loaderContent = readFileSync(join(esmDir, 'loader.js'), 'utf8');
      writeFileSync(join(wwwDir, 'loader.js'), loaderContent);
      console.log('✓ Copied loader.js to www/');

    } catch (error) {
      console.log('⚠ Error copying ESM files to www/:', error.message);
    }

  } catch (error) {
    console.error('Error adding component registration to built index files', error);
    process.exit(1);
  }
}

addComponentRegistration();