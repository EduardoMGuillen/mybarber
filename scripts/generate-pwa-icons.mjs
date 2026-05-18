import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const source = join(root, "public/logotextpng.png");
const iconsDir = join(root, "public/icons");
const appDir = join(root, "src/app");

const bg = { r: 10, g: 10, b: 10, alpha: 1 };

async function writeIcon(outPath, size, padding = 0.12) {
  const inner = Math.round(size * (1 - padding * 2));
  const logo = await sharp(source)
    .resize(inner, inner, { fit: "contain", background: bg })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: bg,
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(outPath);
}

async function writeOgImage(outPath) {
  const w = 1200;
  const h = 630;
  const logoW = 420;
  const logo = await sharp(source)
    .resize(logoW, logoW, { fit: "contain", background: { ...bg, alpha: 0 } })
    .png()
    .toBuffer();

  const goldBar = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g" cx="50%" cy="0%" r="80%">
          <stop offset="0%" stop-color="#c9a227" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#0a0a0a" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="#0a0a0a"/>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`,
  );

  const base = await sharp(goldBar).png().toBuffer();

  await sharp(base)
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toFile(outPath);
}

await mkdir(iconsDir, { recursive: true });

await writeIcon(join(iconsDir, "favicon-32.png"), 32, 0.1);
await writeIcon(join(iconsDir, "icon-192.png"), 192, 0.14);
await writeIcon(join(iconsDir, "icon-512.png"), 512, 0.14);
await writeIcon(join(iconsDir, "apple-touch-icon.png"), 180, 0.12);

await writeIcon(join(appDir, "icon.png"), 32, 0.1);
await writeIcon(join(appDir, "apple-icon.png"), 180, 0.12);

await writeOgImage(join(root, "public/og-image.png"));

console.log("Generated: public/icons/*, src/app/icon.png, src/app/apple-icon.png, public/og-image.png");
