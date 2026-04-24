const sharp = require('sharp');

const W = 1284;
const H = 2778;

// Glow blob radius / opacity tuned to match existing splash aesthetic
const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Purple-to-cyan gradient (matches existing splash text) -->
    <linearGradient id="pg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#b84fff"/>
      <stop offset="100%" stop-color="#00d4ff"/>
    </linearGradient>

    <!-- Same gradient but vertical for cleaner icon rendering -->
    <linearGradient id="pgv" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%"   stop-color="#b84fff"/>
      <stop offset="100%" stop-color="#00d4ff"/>
    </linearGradient>

    <!-- Soft radial glow behind the icon+text -->
    <radialGradient id="glow" cx="50%" cy="50%" r="55%">
      <stop offset="0%"   stop-color="#2d0060" stop-opacity="0.55"/>
      <stop offset="50%"  stop-color="#003344" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <!-- Black background -->
  <rect width="${W}" height="${H}" fill="#000000"/>

  <!-- Ambient glow centred on content -->
  <ellipse cx="${W / 2}" cy="${H * 0.47}" rx="${W * 0.7}" ry="${H * 0.22}" fill="url(#glow)"/>

  <!--
    Person-add icon, 340×340 px, centred at (W/2, H*0.385).
    Drawn in a 400×400 local coordinate space then translated+scaled.
    All strokes / fills use the purple-cyan gradient.
    
    Layout (in local 400×400 space):
      Head circle : cx=148 cy=118 r=68  (stroke, no fill)
      Body arc    : M 18 320 Q 18 215 148 215 Q 278 215 278 320  (stroke, open path)
      Plus horiz  : (295, 270) → (385, 270)
      Plus vert   : (340, 225) → (340, 315)
  -->
  <g transform="translate(${W / 2 - 170}, ${H * 0.385 - 170}) scale(1)">
    <!-- scale the local 400×400 icon to 340px on screen -->
    <g transform="scale(0.85)">
      <!-- Head -->
      <circle cx="148" cy="118" r="68"
              fill="none"
              stroke="url(#pgv)"
              stroke-width="34"
              stroke-linecap="round"/>

      <!-- Shoulders / body -->
      <path d="M 18 320 Q 18 215 148 215 Q 278 215 278 320"
            fill="none"
            stroke="url(#pgv)"
            stroke-width="34"
            stroke-linecap="round"
            stroke-linejoin="round"/>

      <!-- Plus — horizontal bar -->
      <line x1="295" y1="270" x2="385" y2="270"
            stroke="url(#pgv)"
            stroke-width="36"
            stroke-linecap="round"/>

      <!-- Plus — vertical bar -->
      <line x1="340" y1="225" x2="340" y2="315"
            stroke="url(#pgv)"
            stroke-width="36"
            stroke-linecap="round"/>
    </g>
  </g>

  <!-- MyKliq wordmark -->
  <text x="${W / 2}" y="${H * 0.535}"
        font-family="Arial, Helvetica, sans-serif"
        font-size="172"
        font-weight="bold"
        text-anchor="middle"
        fill="url(#pg)">MyKliq</text>
</svg>`;

sharp(Buffer.from(svg))
  .png()
  .toFile('mobile/assets/splash.png')
  .then(() => console.log('✅ Splash screen saved to mobile/assets/splash.png'))
  .catch(err => {
    console.error('❌ Error generating splash:', err);
    process.exit(1);
  });
