import { HeartQr } from "@/components/heart-qr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github } from "lucide-react";
import { useCallback, useRef, useState, type FormEvent } from "react";

const FLOATING_SYMBOLS = ["♥", "♡", "❤", "💕", "✦"];

function App() {
  const [input, setInput] = useState("");
  const [qrText, setQrText] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleCopy = useCallback(async () => {
    const svg = svgRef.current;
    if (!svg) return;

    // Replace currentColor so the exported PNG has the right fill
    const svgData = new XMLSerializer()
      .serializeToString(svg)
      .replaceAll("currentColor", "#fb7185");
    const svgBlob = new Blob([svgData], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 940;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 1024, 1024);
      URL.revokeObjectURL(url);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }, "image/png");
    };
    img.src = url;
  }, []);

  const handleGenerate = (e: FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      setQrText(input.trim());
    }
  };

  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-pink-100 p-4">
      {/* Radial glow accents */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_35%,rgba(251,113,133,0.2)_0%,transparent_50%),radial-gradient(circle_at_75%_65%,rgba(244,63,94,0.15)_0%,transparent_50%)]" />

      {/* Floating hearts */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        {Array.from({ length: 25 }, (_, i) => (
          <span
            key={i}
            className="absolute bottom-0 animate-float-up text-rose-400"
            style={{
              left: `${(i * 17 + 3) % 100}%`,
              animationDelay: `${(i * 1.7) % 12}s`,
              animationDuration: `${8 + (i % 7) * 2}s`,
              fontSize: `${14 + (i % 5) * 6}px`,
              opacity: 0.1 + (i % 4) * 0.08,
            }}
          >
            {FLOATING_SYMBOLS[i % FLOATING_SYMBOLS.length]}
          </span>
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex w-full max-w-[340px] flex-col items-center gap-8 sm:max-w-md">
        {/* Title */}
        <div className="text-center">
          <p className="mb-1 text-sm tracking-[0.3em] text-rose-300">
            ✧ ─── ✧ ─── ✧
          </p>
          <h1 className="font-pacifico text-4xl text-rose-400 drop-shadow-[0_2px_10px_rgba(244,63,94,0.3)] sm:text-6xl">
            QR My Heart
          </h1>
          <p className="mt-2 text-sm tracking-[0.3em] text-rose-300">
            ✧ ─── ♡ ─── ✧
          </p>
        </div>

        {/* Input */}
        <form
          onSubmit={handleGenerate}
          className="flex w-full flex-col gap-2 sm:flex-row sm:gap-3"
        >
          <Input
            name="text"
            type="text"
            required
            aria-label="Love note or URL"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write your love note..."
            className="h-11 min-w-0 flex-1 rounded-full border-2 border-rose-200 bg-white/60 text-base text-rose-600 backdrop-blur-sm placeholder:text-rose-300 focus-visible:border-rose-400 focus-visible:ring-rose-200 md:text-base"
          />
          <Button
            type="submit"
            className="rounded-full bg-rose-400 px-6 font-semibold text-white shadow-lg shadow-rose-300/50 hover:bg-rose-500"
          >
            Generate
          </Button>
        </form>

        {/* QR display area — fixed size prevents layout shift */}
        <div className="flex aspect-square w-full max-w-[340px] items-center justify-center">
          {qrText ? (
            <div className="animate-fade-in w-full">
              <HeartQr
                ref={svgRef}
                text={qrText}
                className="w-full text-rose-400 drop-shadow-[0_4px_20px_rgba(244,63,94,0.4)]"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-rose-300/60">
              <span className="text-5xl">♡</span>
              <p className="text-center text-sm italic">
                Your heart-shaped QR code
                <br />
                will appear here
              </p>
            </div>
          )}
        </div>

        <Button
          type="button"
          onClick={handleCopy}
          variant="outline"
          className={`rounded-full border-2 border-rose-200 bg-white/60 text-rose-500 backdrop-blur-sm hover:bg-rose-50 hover:text-rose-600 ${qrText ? "visible" : "invisible"}`}
        >
          {copied ? "Copied!" : "Copy Image"}
        </Button>
      </div>

      {/* GitHub link */}
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="absolute bottom-3 left-3 z-10 text-rose-300 hover:text-rose-400 hover:bg-rose-200/40"
      >
        <a
          href="https://github.com/nimobeeren/qheart"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Github className="size-5" aria-hidden="true" />
          <span className="sr-only">View source on GitHub</span>
        </a>
      </Button>
    </div>
  );
}

export default App;
