import sharp from "sharp";
import { join } from "node:path";

const root = process.cwd();
const source = join(root, "public/logotextpng.png");
const outDir = join(root, "public/icons");

await sharp(source)
  .resize(192, 192, {
    fit: "contain",
    background: { r: 10, g: 10, b: 10, alpha: 1 },
  })
  .png()
  .toFile(join(outDir, "icon-192.png"));

await sharp(source)
  .resize(512, 512, {
    fit: "contain",
    background: { r: 10, g: 10, b: 10, alpha: 1 },
  })
  .png()
  .toFile(join(outDir, "icon-512.png"));

console.log("PWA icons generated in public/icons/");
