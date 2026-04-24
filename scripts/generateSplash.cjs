const sharp = require('sharp');
const path = require('path');

const GREEN = '#00e676';
const WHITE = '#ffffff';

// ─── 1. Static splash.png ───────────────────────────────────────────────────
// Green background, white icon + wordmark, centred

const SW = 1284, SH = 2778;
const iconSize = 400;
const iconCX = SW / 2, iconCY = SH * 0.39;
const scale = iconSize / 400;
const tx = iconCX - iconSize / 2;
const ty = iconCY - iconSize / 2;

const splashSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${SW}" height="${SH}" viewBox="0 0 ${SW} ${SH}" xmlns="http://www.w3.org/2000/svg">
  <!-- Green background -->
  <rect width="${SW}" height="${SH}" fill="${GREEN}"/>

  <!-- Person-add icon (white), 400px, local 400×400 space -->
  <g transform="translate(${tx.toFixed(1)}, ${ty.toFixed(1)}) scale(${scale.toFixed(4)})">
    <circle cx="148" cy="100" r="72"
            fill="none" stroke="${WHITE}" stroke-width="38" stroke-linecap="round"/>
    <path d="M 10 310 Q 10 205 148 205 Q 286 205 286 310"
          fill="none" stroke="${WHITE}" stroke-width="38"
          stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="272" y1="265" x2="402" y2="265"
          stroke="${WHITE}" stroke-width="50" stroke-linecap="round"/>
    <line x1="337" y1="200" x2="337" y2="330"
          stroke="${WHITE}" stroke-width="50" stroke-linecap="round"/>
  </g>

  <!-- MyKliq wordmark -->
  <text x="${SW / 2}" y="${SH * 0.535}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="172" font-weight="bold"
        text-anchor="middle" fill="${WHITE}">MyKliq</text>
</svg>`;

// ─── 2. logo-white.png ───────────────────────────────────────────────────────
// Transparent background, white icon only — used for the spinning animation

const LW = 512, LH = 512;
const lScale = LW / 400;
const logoSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${LW}" height="${LH}" viewBox="0 0 ${LW} ${LH}" xmlns="http://www.w3.org/2000/svg">
  <g transform="scale(${lScale.toFixed(4)})">
    <circle cx="148" cy="100" r="72"
            fill="none" stroke="${WHITE}" stroke-width="38" stroke-linecap="round"/>
    <path d="M 10 310 Q 10 205 148 205 Q 286 205 286 310"
          fill="none" stroke="${WHITE}" stroke-width="38"
          stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="272" y1="265" x2="402" y2="265"
          stroke="${WHITE}" stroke-width="50" stroke-linecap="round"/>
    <line x1="337" y1="200" x2="337" y2="330"
          stroke="${WHITE}" stroke-width="50" stroke-linecap="round"/>
  </g>
</svg>`;

Promise.all([
  sharp(Buffer.from(splashSvg)).png().toFile('mobile/assets/splash.png'),
  sharp(Buffer.from(logoSvg)).png().toFile('mobile/assets/logo-white.png'),
]).then(() => {
  console.log('✅ mobile/assets/splash.png');
  console.log('✅ mobile/assets/logo-white.png');
}).catch(err => { console.error(err); process.exit(1); });
