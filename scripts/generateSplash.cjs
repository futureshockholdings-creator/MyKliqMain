const sharp = require('sharp');

const W = 1284;
const H = 2778;

// Icon rendered size and center position
const iconSize = 420;
const iconCX = W / 2;
const iconCY = H * 0.385;
const scale = iconSize / 400;
const tx = iconCX - iconSize / 2;
const ty = iconCY - iconSize / 2;

// Gradient anchored in user-space so all elements share one consistent colour sweep
const gx1 = W * 0.20;
const gy1 = H * 0.32;
const gx2 = W * 0.80;
const gy2 = H * 0.57;

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="pg" gradientUnits="userSpaceOnUse"
                    x1="${gx1}" y1="${gy1}" x2="${gx2}" y2="${gy2}">
      <stop offset="0%"   stop-color="#b84fff"/>
      <stop offset="100%" stop-color="#00d4ff"/>
    </linearGradient>

    <radialGradient id="glow" cx="50%" cy="50%" r="55%">
      <stop offset="0%"   stop-color="#2d0060" stop-opacity="0.6"/>
      <stop offset="45%"  stop-color="#003344" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Black background -->
  <rect width="${W}" height="${H}" fill="#000000"/>

  <!-- Ambient glow -->
  <ellipse cx="${W / 2}" cy="${H * 0.46}" rx="${W * 0.68}" ry="${H * 0.23}" fill="url(#glow)"/>

  <!--
    Person-add icon drawn in a 400x400 local space,
    scaled to ${iconSize}px, centred at (${iconCX.toFixed(0)}, ${iconCY.toFixed(0)}).

    Local layout:
      Head  : cx=148 cy=100 r=72
      Body  : M 10 310 Q 10 205 148 205 Q 286 205 286 310
      Plus H: (292,252)-(390,252)
      Plus V: (341,203)-(341,301)
  -->
  <g transform="translate(${tx.toFixed(2)}, ${ty.toFixed(2)}) scale(${scale.toFixed(4)})">
    <!-- Head -->
    <circle cx="148" cy="100" r="72"
            fill="none" stroke="url(#pg)" stroke-width="38" stroke-linecap="round"/>

    <!-- Shoulders -->
    <path d="M 10 310 Q 10 205 148 205 Q 286 205 286 310"
          fill="none" stroke="url(#pg)" stroke-width="38"
          stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Plus horizontal -->
    <line x1="272" y1="265" x2="402" y2="265"
          stroke="url(#pg)" stroke-width="50" stroke-linecap="round"/>

    <!-- Plus vertical -->
    <line x1="337" y1="200" x2="337" y2="330"
          stroke="url(#pg)" stroke-width="50" stroke-linecap="round"/>
  </g>

  <!-- MyKliq wordmark -->
  <text x="${W / 2}" y="${H * 0.535}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="172" font-weight="bold"
        text-anchor="middle"
        fill="url(#pg)">MyKliq</text>
</svg>`;

sharp(Buffer.from(svg))
  .png()
  .toFile('mobile/assets/splash.png')
  .then(() => console.log('Splash saved → mobile/assets/splash.png'))
  .catch(err => { console.error(err); process.exit(1); });
