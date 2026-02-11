import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import QRCode from "qrcode";
import { existsSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Download and register Pacifico font
const fontPath = resolve(__dirname, "Pacifico-Regular.ttf");
if (!existsSync(fontPath)) {
  const url =
    "https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf";
  console.log("Downloading Pacifico font...");
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download font: ${res.status}`);
  writeFileSync(fontPath, Buffer.from(await res.arrayBuffer()));
}
GlobalFonts.registerFromPath(fontPath, "Pacifico");

// --- Config ---
const WIDTH = 1200;
const HEIGHT = 600;
const BG_COLOR = "#fce7f3"; // pink-100
const ROSE_400 = "#fb7185";
const ROSE_300 = "#fda4af";
const QR_TEXT = "ILY";

// --- QR heart generation (mirrors heart-qr.tsx logic) ---
function mulberry32(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateSemicirclePixels(moduleCount, side, rand) {
  const r = moduleCount / 2;
  const cxSemi = side === "left" ? 0 : r;
  const cySemi = side === "left" ? r : 0;
  const pixels = [];

  const minX = side === "left" ? Math.floor(-r) : 0;
  const maxX = side === "left" ? 0 : moduleCount;
  const minY = side === "left" ? 0 : Math.floor(-r);
  const maxY = side === "left" ? moduleCount : 0;

  for (let py = minY; py < maxY; py++) {
    for (let px = minX; px < maxX; px++) {
      const centerX = px + 0.5;
      const centerY = py + 0.5;
      const dx = centerX - cxSemi;
      const dy = centerY - cySemi;
      if (dx * dx + dy * dy <= r * r) {
        if (rand() < 0.5) {
          pixels.push({ x: px, y: py });
        }
      }
    }
  }
  return pixels;
}

function drawHeartQr(ctx, text, cx, cy, size) {
  const qr = QRCode.create(text, { errorCorrectionLevel: "H" });
  const moduleCount = qr.modules.size;
  const data = qr.modules.data;
  const S = moduleCount;

  const seed = Array.from(text).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = mulberry32(seed);

  const leftPixels = generateSemicirclePixels(moduleCount, "left", rand);
  const topPixels = generateSemicirclePixels(moduleCount, "top", rand);

  // The SVG viewBox is: vbMin = -0.4*S, vbSize = 1.8*S
  const vbMin = -0.4 * S;
  const vbSize = 1.8 * S;
  const scale = size / vbSize;

  ctx.save();
  // Translate so that the viewBox origin maps to the desired position
  ctx.translate(cx - size / 2, cy - size / 2);
  ctx.scale(scale, scale);
  ctx.translate(-vbMin, -vbMin);

  // Rotate 45° around center of the QR square
  const qrCx = S / 2;
  const qrCy = S / 2;
  ctx.translate(qrCx, qrCy);
  ctx.rotate((45 * Math.PI) / 180);
  ctx.translate(-qrCx, -qrCy);

  ctx.fillStyle = ROSE_400;

  // Draw semicircle pixels
  for (const { x, y } of leftPixels) {
    ctx.fillRect(x, y, 1.05, 1.05);
  }
  for (const { x, y } of topPixels) {
    ctx.fillRect(x, y, 1.05, 1.05);
  }

  // Draw QR modules
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (data[row * moduleCount + col]) {
        ctx.fillRect(col, row, 1.05, 1.05);
      }
    }
  }

  ctx.restore();
}

// --- Decoration helpers ---

function drawDiamond(ctx, x, y, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawSmallHeart(ctx, x, y, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  // Simple heart using two arcs and a triangle
  const s = size;
  ctx.moveTo(x, y + s * 0.4);
  ctx.bezierCurveTo(x, y - s * 0.2, x - s, y - s * 0.6, x, y - s * 1.1);
  ctx.moveTo(x, y + s * 0.4);
  ctx.bezierCurveTo(x, y - s * 0.2, x + s, y - s * 0.6, x, y - s * 1.1);
  ctx.fill();
  ctx.restore();
}

/** Draws "✧ ─── ✧/♡ ─── ✧" style decoration */
function drawDecoration(ctx, cx, cy, color, withHeart) {
  const lineLen = 50;
  const gap = 10;
  const dSize = 4;

  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  // Left diamond
  drawDiamond(ctx, cx - lineLen - gap - dSize, cy, dSize, color);
  // Left line
  ctx.beginPath();
  ctx.moveTo(cx - lineLen - gap + dSize, cy);
  ctx.lineTo(cx - gap, cy);
  ctx.stroke();

  // Center symbol
  if (withHeart) {
    drawSmallHeart(ctx, cx, cy + 4, 7, color);
  } else {
    drawDiamond(ctx, cx, cy, dSize, color);
  }

  // Right line
  ctx.beginPath();
  ctx.moveTo(cx + gap, cy);
  ctx.lineTo(cx + lineLen + gap - dSize, cy);
  ctx.stroke();
  // Right diamond
  drawDiamond(ctx, cx + lineLen + gap + dSize, cy, dSize, color);

  ctx.restore();
}

// --- Main ---
const canvas = createCanvas(WIDTH, HEIGHT);
const ctx = canvas.getContext("2d");

// Background
ctx.fillStyle = BG_COLOR;
ctx.fillRect(0, 0, WIDTH, HEIGHT);

// Radial glow accents (approximate the CSS radial gradients)
const glow1 = ctx.createRadialGradient(
  WIDTH * 0.25,
  HEIGHT * 0.35,
  0,
  WIDTH * 0.25,
  HEIGHT * 0.35,
  WIDTH * 0.5,
);
glow1.addColorStop(0, "rgba(251,113,133,0.2)");
glow1.addColorStop(1, "transparent");
ctx.fillStyle = glow1;
ctx.fillRect(0, 0, WIDTH, HEIGHT);

const glow2 = ctx.createRadialGradient(
  WIDTH * 0.75,
  HEIGHT * 0.65,
  0,
  WIDTH * 0.75,
  HEIGHT * 0.65,
  WIDTH * 0.5,
);
glow2.addColorStop(0, "rgba(244,63,94,0.15)");
glow2.addColorStop(1, "transparent");
ctx.fillStyle = glow2;
ctx.fillRect(0, 0, WIDTH, HEIGHT);

// --- Left half: Title & decoration ---
const leftCx = WIDTH * 0.28;

// Top decoration
drawDecoration(ctx, leftCx, HEIGHT * 0.35, ROSE_300, false);

// Title on a single line with drop shadow
ctx.save();
ctx.shadowColor = "rgba(244,63,94,0.3)";
ctx.shadowBlur = 20;
ctx.shadowOffsetY = 4;
ctx.fillStyle = ROSE_400;
ctx.font = "80px Pacifico";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.fillText("QR My Heart", leftCx, HEIGHT * 0.5);
ctx.restore();

// Bottom decoration
drawDecoration(ctx, leftCx, HEIGHT * 0.65, ROSE_300, true);

// --- Right half: Heart QR ---
const qrSize = HEIGHT * 0.7;
const qrCx = WIDTH * 0.73;
const qrCy = HEIGHT * 0.5;
drawHeartQr(ctx, QR_TEXT, qrCx, qrCy, qrSize);

// --- Save ---
const outputPath = resolve(__dirname, "../public/og.png");
const pngBuffer = canvas.toBuffer("image/png");
writeFileSync(outputPath, pngBuffer);
console.log(`OG image written to ${outputPath} (${pngBuffer.length} bytes)`);
