const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function colorDistance(r1, g1, b1, r2, g2, b2) {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function isCheckerboardPixel(r, g, b, a, tolerance = 42) {
  if (a < 16) return true;
  const targets = [
    [255, 255, 255],
    [204, 204, 204],
    [192, 192, 192],
    [170, 170, 170],
    [153, 153, 153],
    [128, 128, 128],
    [240, 240, 240],
    [220, 220, 220],
  ];
  return targets.some(([tr, tg, tb]) => colorDistance(r, g, b, tr, tg, tb) <= tolerance);
}

function removeCheckerboardBackground(inputPath, outputPath) {
  return sharp(inputPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
    .then(({ data, info }) => {
      const { width, height, channels } = info;
      const visited = new Uint8Array(width * height);
      const queue = [];

      const pushIfBackground = (x, y) => {
        if (x < 0 || y < 0 || x >= width || y >= height) return;
        const idx = y * width + x;
        if (visited[idx]) return;
        const offset = idx * channels;
        const r = data[offset];
        const g = data[offset + 1];
        const b = data[offset + 2];
        const a = data[offset + 3];
        if (!isCheckerboardPixel(r, g, b, a)) return;
        visited[idx] = 1;
        queue.push(idx);
      };

      for (let x = 0; x < width; x += 1) {
        pushIfBackground(x, 0);
        pushIfBackground(x, height - 1);
      }
      for (let y = 0; y < height; y += 1) {
        pushIfBackground(0, y);
        pushIfBackground(width - 1, y);
      }

      while (queue.length) {
        const idx = queue.pop();
        const x = idx % width;
        const y = (idx - x) / width;
        pushIfBackground(x - 1, y);
        pushIfBackground(x + 1, y);
        pushIfBackground(x, y - 1);
        pushIfBackground(x, y + 1);
      }

      for (let idx = 0; idx < width * height; idx += 1) {
        if (!visited[idx]) continue;
        const offset = idx * channels;
        data[offset + 3] = 0;
      }

      return sharp(data, { raw: { width, height, channels } })
        .trim({ threshold: 1 })
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toFile(outputPath);
    });
}

async function main() {
  const input = process.argv[2];
  const output = process.argv[3];
  if (!input || !output) {
    console.error('Usage: node scripts/remove-checkerboard-bg.js <input.png> <output.png>');
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(output), { recursive: true });
  await removeCheckerboardBackground(input, output);
  const meta = await sharp(output).metadata();
  console.log(`Saved ${output} (${meta.width}x${meta.height})`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
