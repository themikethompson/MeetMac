#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Create a simple SVG icon with blue gradient background and video camera
const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#5B9BD5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1E3A8A;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-opacity="0.3"/>
    </filter>
  </defs>

  <!-- Rounded square background -->
  <rect width="1024" height="1024" rx="226" fill="url(#grad1)"/>

  <!-- Video chat icon (Google Material Design) -->
  <g transform="translate(512, 512) scale(0.7) translate(-480, 480)" filter="url(#shadow)">
    <path d="M320-400h240q17 0 28.5-11.5T600-440v-80l80 80v-240l-80 80v-80q0-17-11.5-28.5T560-720H320q-17 0-28.5 11.5T280-680v240q0 17 11.5 28.5T320-400ZM80-80v-720q0-33 23.5-56.5T160-880h640q33 0 56.5 23.5T880-800v480q0 33-23.5 56.5T800-240H240L80-80Zm126-240h594v-480H160v525l46-45Zm-46 0v-480 480Z"
          fill="white" opacity="0.95"/>
  </g>
</svg>`;

// Write SVG file
const assetsDir = path.join(__dirname, 'assets');
const iconPath = path.join(assetsDir, 'icon.svg');

if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

fs.writeFileSync(iconPath, svgContent);
console.log('✅ Created icon.svg');

// Instructions for manual conversion
console.log('\n📝 To create PNG and ICNS files, run:');
console.log('   qlmanage -t -s 1024 -o assets/ assets/icon.svg');
console.log('   sips -s format png assets/icon.svg.png --out assets/icon.png');
console.log('   rm assets/icon.svg.png');
console.log('\nOr install electron-icon-builder:');
console.log('   npm install --save-dev electron-icon-builder');
console.log('   npx electron-icon-builder --input=assets/icon.svg --output=assets --flatten');
