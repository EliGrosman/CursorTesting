#!/usr/bin/env node

// This script generates PWA icons from the base SVG
// Run with: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="100" fill="#D97706"/>
  <circle cx="256" cy="256" r="180" fill="white" opacity="0.9"/>
  <path d="M256 140 L256 256 L320 320" stroke="#D97706" stroke-width="20" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="256" cy="256" r="15" fill="#D97706"/>
</svg>`;

const sizes = [192, 512];
const outputDir = path.join(__dirname, '../client/public');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Save SVG files for each size (as placeholders)
sizes.forEach(size => {
  const filename = path.join(outputDir, `icon-${size}.png`);
  console.log(`Note: Please convert SVG to PNG for ${filename}`);
  
  // For maskable icons
  const maskableFilename = path.join(outputDir, `icon-${size}-maskable.png`);
  console.log(`Note: Please convert SVG to PNG for ${maskableFilename}`);
});

// Save the base SVG
fs.writeFileSync(path.join(outputDir, 'icon.svg'), iconSvg);
console.log('Base SVG saved to client/public/icon.svg');

console.log('\nTo generate PNG icons, use an online converter or install sharp:');
console.log('npm install sharp');
console.log('Then update this script to use sharp for PNG generation.');