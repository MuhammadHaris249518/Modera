"use client";

import { useRef, useState, type MouseEvent } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

type UploadDropzoneProps = {
  loading: boolean;
  onFileSelect: (file: File) => void;
};

export function UploadDropzone({ loading, onFileSelect }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: 160, damping: 18, mass: 0.2 });
  const springY = useSpring(rotateY, { stiffness: 160, damping: 18, mass: 0.2 });

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    rotateX.set((0.5 - y) * 12);
    rotateY.set((x - 0.5) * 14);
  };

  const resetTilt = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <motion.div
      style={{
        perspective: 1200,
        rotateX: springX,
        rotateY: springY,
        transformStyle: "preserve-3d",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        resetTilt();
      }}
      onMouseMove={handleMove}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) onFileSelect(file);
      }}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "group relative min-h-[360px] cursor-pointer overflow-hidden rounded-[26px] border border-input bg-[linear-gradient(180deg,rgba(59,130,246,0.12),rgba(30,58,138,0.08))] p-[1px] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_30px_80px_rgba(15,23,42,0.22)] transition-transform duration-300",
        hovered && "shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_38px_100px_rgba(59,130,246,0.18)]"
      )}
    >
      <div className="relative flex h-full min-h-[358px] flex-col items-center justify-center overflow-hidden rounded-[25px] border border-input/50 bg-surface/85 px-6 text-center backdrop-blur-xl backdrop-saturate-150">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-input/30" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-border/40" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_42%),radial-gradient(circle_at_bottom,rgba(59,130,246,0.06),transparent_34%)] opacity-85" />

        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/jpeg, image/png, image/webp"
          onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])}
        />

        <motion.div
          animate={loading ? { scale: [1, 1.06, 1], opacity: [0.9, 1, 0.9] } : { scale: 1 }}
          transition={loading ? { repeat: Number.POSITIVE_INFINITY, duration: 1.8, ease: "easeInOut" } : { duration: 0.2 }}
            className={cn(
            "relative z-10 flex h-18 w-18 items-center justify-center rounded-[22px] border border-accent/20 bg-accent-soft text-accent shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_10px_30px_rgba(15,23,42,0.24)]",
            dragging && "border-accent/60 bg-accent/15 text-accent-strong"
          )}
        >
          <UploadCloud className="h-9 w-9" />
        </motion.div>

        <div className="relative z-10 mt-6 space-y-2">
          <p className="text-lg font-medium text-foreground">Click or drag an image here</p>
          <p className="max-w-sm text-sm leading-6 text-muted-foreground">
            JPG, PNG, and WEBP up to 5MB. The upload zone has a gentle lift and soft brand glow.
          </p>
        </div>

        <motion.div
          initial={false}
          animate={{
            opacity: hovered ? 1 : 0,
            scale: hovered ? 1 : 0.98,
          }}
          className="pointer-events-none absolute inset-0 rounded-[25px] border border-accent/20 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.08)]"
        />

        <div className="relative z-10 mt-6">
          {loading ? (
            <div className="rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-sm text-accent-strong">
              AI is analyzing the image...
            </div>
          ) : (
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
              Glowing inset upload well
            </div>
          )}
        </div>

        {dragging && (
          <div className="pointer-events-none absolute inset-0 rounded-[25px] border border-accent/40 bg-accent/10" />
        )}
      </div>
    </motion.div>
  );
}
