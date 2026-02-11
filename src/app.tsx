import { useState, type FormEvent } from "react";
import { HeartQr } from "@/components/heart-qr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const FLOATING_SYMBOLS = ["♥", "♡", "❤", "💕", "✦"];

function App() {
  const [input, setInput] = useState("");
  const [qrText, setQrText] = useState<string | null>(null);

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
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Title */}
        <div className="text-center">
          <p className="mb-1 text-sm tracking-[0.3em] text-rose-300">
            ✧ ─── ✧ ─── ✧
          </p>
          <h1 className="font-pacifico text-5xl text-rose-400 drop-shadow-[0_2px_10px_rgba(244,63,94,0.3)] sm:text-6xl">
            QR My Heart
          </h1>
          <p className="mt-2 text-sm tracking-[0.3em] text-rose-300">
            ✧ ─── ♡ ─── ✧
          </p>
        </div>

        {/* Input */}
        <form onSubmit={handleGenerate} className="flex gap-3">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your love note..."
            className="w-64 rounded-full border-2 border-rose-200 bg-white/60 text-rose-600 backdrop-blur-sm placeholder:text-rose-300 focus-visible:border-rose-400 focus-visible:ring-rose-200 sm:w-72"
          />
          <Button
            type="submit"
            className="rounded-full bg-rose-400 px-6 font-semibold text-white shadow-lg shadow-rose-300/50 hover:bg-rose-500"
          >
            Generate
          </Button>
        </form>

        {/* QR display area — fixed size prevents layout shift */}
        <div className="flex h-[340px] w-[340px] items-center justify-center">
          {qrText ? (
            <div className="animate-fade-in">
              <HeartQr
                text={qrText}
                size={320}
                className="text-rose-400 drop-shadow-[0_4px_20px_rgba(244,63,94,0.4)]"
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
      </div>
    </div>
  );
}

export default App;
