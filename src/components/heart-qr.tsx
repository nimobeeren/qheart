import QRCode from "qrcode";

interface HeartQrProps {
  text: string;
  size?: number;
  className?: string;
}

export function HeartQr({ text, size = 300, className }: HeartQrProps) {
  let qr;
  try {
    qr = QRCode.create(text, { errorCorrectionLevel: "H" });
  } catch {
    return <p className="text-sm text-rose-400">Could not generate QR code</p>;
  }

  const moduleCount = qr.modules.size;
  const data = qr.modules.data;
  const S = moduleCount;
  const r = S / 2;

  // Rotate 45° CW around center of the square
  const cx = S / 2;
  const cy = S / 2;

  // ViewBox fits the rotated heart shape (semicircle arcs extend further after rotation)
  const vbMin = -0.4 * S;
  const vbSize = 1.8 * S;

  return (
    <svg
      viewBox={`${vbMin} ${vbMin} ${vbSize} ${vbSize}`}
      width={size}
      height={size}
      className={className}
    >
      <g transform={`rotate(45, ${cx}, ${cy})`}>
        {/* Left semicircle (bulges left, becomes left bump of heart) */}
        <path d={`M 0,0 A ${r},${r} 0 0,0 0,${S} Z`} fill="currentColor" />
        {/* Top semicircle (bulges up, becomes right bump of heart) */}
        <path d={`M 0,0 A ${r},${r} 0 0,1 ${S},0 Z`} fill="currentColor" />
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
}
