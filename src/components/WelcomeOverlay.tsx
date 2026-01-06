"use client";

import { useState, useEffect } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "clip-path-editor-welcomed";

export function WelcomeOverlay() {
  const [show, setShow] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if user has seen the welcome before
    const hasSeenWelcome = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenWelcome) {
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    localStorage.setItem(STORAGE_KEY, "true");
    // Wait for exit animation to complete
    setTimeout(() => {
      setShow(false);
    }, 600);
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText("jconsenstein@gmail.com");
      setCopied(true);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = "jconsenstein@gmail.com";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
    }
  };

  if (!show) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-zinc-800/30 backdrop-blur-md",
        isExiting
          ? "animate-out fade-out duration-500 fill-mode-forwards"
          : "animate-in fade-in duration-200"
      )}
    >
      <div className="relative max-w-lg px-8 py-10 text-center">
        <p className="text-md leading-relaxed text-zinc-300 mb-6">
          I needed a way to create precise clip-paths and couldn&apos;t find a
          tool that did the job, so I built this.
        </p>
        <p className="text-md leading-relaxed text-zinc-400 mb-6">
          It's simple, free, and all local in your browser.
        </p>

        <button
          onClick={handleDismiss}
          className="mt-3 cursor-pointer rounded-md border border-zinc-700 bg-zinc-800/50 px-6 py-2 text-sm text-zinc-300 transition-all hover:border-zinc-500 hover:bg-zinc-700/50 hover:text-white"
        >
          Get Clipping!
        </button>

        <p className="mt-10 text-xs text-zinc-500">
          <span>questions/concerns/friendly notes:</span> <br />
          <button
            onClick={handleCopyEmail}
            onMouseLeave={() => setTimeout(() => setCopied(false), 400)}
            className="group mt-1 inline-flex cursor-pointer items-center gap-1.5 text-zinc-400 underline underline-offset-2 transition-colors hover:text-zinc-300"
          >
            jconsenstein@gmail.com
            <span className="relative size-3 translate-y-px opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Copy
                className={cn(
                  "absolute inset-0 size-3 transition-opacity duration-300",
                  copied ? "opacity-0" : "opacity-100"
                )}
              />
              <Check
                className={cn(
                  "absolute inset-0 size-3 text-green-400 transition-opacity duration-300",
                  copied ? "opacity-100" : "opacity-0"
                )}
              />
            </span>
          </button>
        </p>
      </div>
    </div>
  );
}
