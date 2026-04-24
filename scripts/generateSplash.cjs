const sharp = require('sharp');
const fs = require('fs');

const ICON_GREEN = '#2ae149';   // exact green sampled from the original icon
const SW = 1284, SH = 2778;

// Icon at 560px — large enough to be bold on screen
const ICON_PX = 560;
const ICON_X = Math.round((SW - ICON_PX) / 2);
const ICON_Y = Math.round(SH * 0.30);   // sit slightly above centre

// SVG text strip: "MyKliq" in the same green on transparent bg
const TEXT_W = SW, TEXT_H = 220;
const TEXT_Y = ICON_Y + ICON_PX + 48;   // just below the icon
const textSvg = Buffer.from(`
<svg width="${TEXT_W}" height="${TEXT_H}" xmlns="http://www.w3.org/2000/svg">
  <text x="${TEXT_W / 2}" y="160"
        font-family="Arial, Helvetica, sans-serif"
        font-size="180" font-weight="bold"
        text-anchor="middle"
        fill="#000000">MyKliq</text>
</svg>`);

async function run() {
  // Resize the original icon
  const iconBuf = await sharp('client/public/icons/icon-512x512.png')
    .resize(ICON_PX, ICON_PX)
    .png()
    .toBuffer();

  // Green background → icon → text label
  await sharp({
    create: { width: SW, height: SH, channels: 3, background: ICON_GREEN },
  })
    .composite([
      { input: iconBuf,  left: ICON_X,     top: ICON_Y    },
      { input: textSvg,  left: 0,           top: TEXT_Y    },
    ])
    .png()
    .toFile('mobile/assets/splash.png');

  // Copy original icon to mobile/assets for the spinning animation
  fs.copyFileSync(
    'client/public/icons/icon-512x512.png',
    'mobile/assets/person-plus-icon.png'
  );

  console.log('✅ mobile/assets/splash.png');
  console.log('✅ mobile/assets/person-plus-icon.png');
}

run().catch(err => { console.error(err); process.exit(1); });
