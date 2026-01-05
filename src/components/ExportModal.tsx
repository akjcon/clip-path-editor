"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { Point } from "@/types";
import { generateExportCss, generateExportSvg } from "@/utils/pathGenerator";

interface ExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  points: Point[];
  imageWidth: number;
  imageHeight: number;
}

type Tab = "css" | "svg";

export function ExportModal({
  open,
  onOpenChange,
  points,
  imageWidth,
  imageHeight,
}: ExportModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>("css");
  const [copied, setCopied] = useState(false);

  const cssCode = generateExportCss(points, imageWidth, imageHeight);
  const svgCode = generateExportSvg(points, imageWidth, imageHeight);

  const code = activeTab === "css" ? cssCode : svgCode;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export Clip Path</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === "css" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("css")}
            >
              CSS
            </Button>
            <Button
              variant={activeTab === "svg" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("svg")}
            >
              SVG
            </Button>
          </div>

          {/* Code display */}
          <div className="relative">
            <pre className="max-h-80 overflow-auto rounded-lg bg-zinc-900 p-4 text-sm text-zinc-300">
              <code>{code}</code>
            </pre>
            <Button
              variant="secondary"
              size="sm"
              className="absolute right-2 top-2"
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="mr-1 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-1 h-4 w-4" />
                  Copy
                </>
              )}
            </Button>
          </div>

          {/* Info */}
          <p className="text-sm text-muted-foreground">
            {activeTab === "css" ? (
              <>
                The CSS clip-path uses absolute pixel values for the specified
                dimensions ({imageWidth}x{imageHeight}px). Adjust the values if
                your element has different dimensions.
              </>
            ) : (
              <>
                The SVG can be used as a mask, clipPath reference, or standalone
                shape.
              </>
            )}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
