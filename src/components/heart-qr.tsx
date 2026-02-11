import { forwardRef } from "react";
import QRCode from "qrcode";

interface HeartQrProps {
  text: string;
  className?: string;
}

function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateSemicirclePixels(
  moduleCount: number,
  side: "left" | "top",
  rand: () => number,
): Array<{ x: number; y: number }> {
  const r = moduleCount / 2;
  // Center of the semicircle
  const cxSemi = side === "left" ? 0 : r;
  const cySemi = side === "left" ? r : 0;

  const pixels: Array<{ x: number; y: number }> = [];

  // Scan a bounding box around the semicircle
  const minX = side === "left" ? Math.floor(-r) : 0;
  const maxX = side === "left" ? 0 : moduleCount;
  const minY = side === "left" ? 0 : Math.floor(-r);
  const maxY = side === "left" ? moduleCount : 0;

  for (let py = minY; py < maxY; py++) {
    for (let px = minX; px < maxX; px++) {
      // Check if the center of this pixel is inside the semicircle
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

export const HeartQr = forwardRef<SVGSVGElement, HeartQrProps>(function HeartQr(
  { text, className },
  ref,
) {
  let qr;
  try {
    qr = QRCode.create(text, { errorCorrectionLevel: "H" });
  } catch {
    return <p className="text-sm text-rose-400">Could not generate QR code</p>;
  }

  const moduleCount = qr.modules.size;
  const data = qr.modules.data;
  const S = moduleCount;

  // Rotate 45° CW around center of the square
  const cx = S / 2;
  const cy = S / 2;

  // ViewBox fits the rotated heart shape (semicircle arcs extend further after rotation)
  const vbMin = -0.4 * S;
  const vbSize = 1.8 * S;

  // Deterministic random based on text content
  const seed = Array.from(text).reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = mulberry32(seed);

  const leftPixels = generateSemicirclePixels(moduleCount, "left", rand);
  const topPixels = generateSemicirclePixels(moduleCount, "top", rand);

  return (
    <svg
      ref={ref}
      viewBox={`${vbMin} ${vbMin} ${vbSize} ${vbSize}`}
      className={className}
      role="img"
      aria-label={`Heart-shaped QR code for: ${text}`}
    >
      <g transform={`rotate(45, ${cx}, ${cy})`}>
        {/* Left semicircle pixels (becomes left bump of heart) */}
        {leftPixels.map(({ x, y }) => (
          <rect
            key={`left-${x}-${y}`}
            x={x}
            y={y}
            width={1.05}
            height={1.05}
            fill="currentColor"
          />
        ))}
        {/* Top semicircle pixels (becomes right bump of heart) */}
        {topPixels.map(({ x, y }) => (
          <rect
            key={`top-${x}-${y}`}
            x={x}
            y={y}
            width={1.05}
            height={1.05}
            fill="currentColor"
          />
        ))}
        {/* QR code modules */}
        {Array.from({ length: moduleCount }, (_, row) =>
          Array.from({ length: moduleCount }, (_, col) => {
            if (data[row * moduleCount + col]) {
              return (
                <rect
                  key={`${col}-${row}`}
                  x={col}
                  y={row}
                  width={1.05}
                  height={1.05}
                  fill="currentColor"
                />
              );
            }
            return null;
          }),
        )}
      </g>
    </svg>
  );
});
