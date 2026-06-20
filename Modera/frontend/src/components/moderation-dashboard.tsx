"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Moon, Sun, UploadCloud, Settings, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/app-shell";
import { apiUrl } from "@/lib/api";
import { clearAuth } from "@/lib/auth";
import { getErrorMessage } from "@/lib/errors";
import type { ModerationScoreValue, UploadResult } from "@/lib/types";
import { cn } from "@/lib/utils";

const categories = [
  { key: "graphicViolence", label: "Graphic violence" },
  { key: "hateSymbols", label: "Hate symbols" },
  { key: "selfHarm", label: "Self harm" },
  { key: "extremistPropaganda", label: "Extremist propaganda" },
  { key: "weaponsContraband", label: "Weapons & contraband" },
  { key: "harassmentHumiliation", label: "Harassment & humiliation" },
] as const;

type VerdictState = "approved" | "flagged" | "blocked" | "pending";

type VerdictStyle = {
  soft: string;
  text: string;
  dot: string;
  ring: string;
  shadow: string;
  hoverShadow: string;
};

const verdictStyles: Record<VerdictState, VerdictStyle> = {
  approved: {
    soft: "bg-verdict-approved-soft text-verdict-approved border-verdict-approved/20",
    text: "text-verdict-approved",
    dot: "bg-verdict-approved",
    ring: "stroke-verdict-approved",
    shadow: "shadow-score-approved",
    hoverShadow: "shadow-score-approved-hover",
  },
  flagged: {
    soft: "bg-verdict-flagged-soft text-verdict-flagged border-verdict-flagged/20",
    text: "text-verdict-flagged",
    dot: "bg-verdict-flagged",
    ring: "stroke-verdict-flagged",
    shadow: "shadow-score-flagged",
    hoverShadow: "shadow-score-flagged-hover",
  },
  blocked: {
    soft: "bg-verdict-blocked-soft text-verdict-blocked border-verdict-blocked/20",
    text: "text-verdict-blocked",
    dot: "bg-verdict-blocked",
    ring: "stroke-verdict-blocked",
    shadow: "shadow-score-blocked",
    hoverShadow: "shadow-score-blocked-hover",
  },
  pending: {
    soft: "bg-verdict-pending-soft text-verdict-pending border-verdict-pending/20",
    text: "text-verdict-pending",
    dot: "bg-verdict-pending",
    ring: "stroke-verdict-pending",
    shadow: "shadow-score-pending",
    hoverShadow: "shadow-score-pending-hover",
  },
};

const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

function verdictState(verdict: UploadResult["final_verdict"]): VerdictState {
  if (verdict === "Approved") return "approved";
  if (verdict === "Flagged") return "flagged";
  if (verdict === "Blocked") return "blocked";
  return "pending";
}

function verdictLabel(verdict: UploadResult["final_verdict"]) {
  if (verdict === "Blocked") return "Blocked";
  if (verdict === "Flagged") return "Needs Review";
  if (verdict === "Approved") return "Approved";
  return "Review Error";
}

function getReasons(result: UploadResult) {
  const rawReason = result.ai_analysis.reasoning ?? result.ai_analysis.error;

  if (Array.isArray(rawReason)) {
    return [...new Set(rawReason.map((reason) => String(reason).trim()).filter(Boolean))];
  }

  if (typeof rawReason === "string") {
    return [...new Set(rawReason.split("|").map((reason) => reason.trim()).filter(Boolean))];
  }

  return [];
}

function CardFrame({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: "tween", duration: 0.16, ease: "easeOut" }}
      className={cn(
        "rounded-[32px] border border-border bg-surface text-ink shadow-card-raised transition-shadow duration-160 ease-out hover:shadow-card-hover",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

function StatusPill({
  state,
  label,
}: {
  state: VerdictState;
  label: string;
}) {
  const style = verdictStyles[state];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 font-body text-[11px] font-semibold uppercase tracking-[0.22em]",
        style.soft
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {label}
    </span>
  );
}

function SummaryCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-[28px] border border-border bg-surface p-5 shadow-card-rest transition-shadow hover:shadow-card-hover">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-ink-muted">{label}</p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-sm leading-6 text-ink-muted">{detail}</p>
    </div>
  );
}

function ThemeSwitch({
  isDarkMode,
  onToggle,
  ready,
}: {
  isDarkMode: boolean;
  onToggle: () => void;
  ready: boolean;
}) {
  if (!ready) {
    return <div className="h-11 w-28 rounded-full border border-border bg-surface-sunken shadow-sm" aria-hidden="true" />;
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.96 }}
      onClick={onToggle}
      className="relative flex h-12 w-28 items-center rounded-full border px-2 py-1.5 text-ink-muted shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_20px_rgba(0,0,0,0.08)]"
      aria-label="Toggle theme"
    >
      <motion.span
        layout
        className="absolute left-1 top-1 h-9 w-9 rounded-full bg-surface text-ink shadow-sm"
        animate={{ x: isDarkMode ? 48 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
      <span className={cn("relative z-10 flex h-full w-1/2 items-center justify-center", isDarkMode && "text-accent-strong")}>
        <Moon className="h-4 w-4" />
      </span>
      <span className={cn("relative z-10 flex h-full w-1/2 items-center justify-center", !isDarkMode && "text-accent-strong")}>
        <Sun className="h-4 w-4" />
      </span>
    </motion.button>
  );
}

function UploadWell({
  loading,
  onFileSelect,
  isDarkMode,
}: {
  loading: boolean;
  onFileSelect: (file: File) => void;
  isDarkMode: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);

  const handleFile = (file: File | undefined) => {
    if (file) onFileSelect(file);
  };

  const handleLeave = () => {
    setHovered(false);
    setDragging(false);
  };

  return (
    <motion.div
      onClick={() => inputRef.current?.click()}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleLeave}
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
        handleFile(e.dataTransfer.files?.[0]);
      }}
      className={cn(
        "group relative min-h-130 cursor-pointer overflow-hidden rounded-[32px] border p-1 shadow-card-raised transition-all duration-300",
        isDarkMode ? "border-white/10 bg-zinc-950/80" : "border-zinc-950/10 bg-white",
        hovered && "shadow-[0_24px_60px_rgba(59,130,246,0.14)]",
        dragging && "scale-[1.003] border-accent/40 bg-accent-soft/80"
      )}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_38%),radial-gradient(circle_at_bottom,rgba(99,102,241,0.08),transparent_40%)] opacity-90" />
      <div className="relative flex h-full min-h-130 flex-col items-center justify-center rounded-[30px] border border-border bg-surface-sunken p-8 text-center backdrop-blur-xl">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/jpeg, image/png, image/webp"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-linear-to-br from-accent to-accent-strong text-surface shadow-[0_24px_80px_rgba(59,130,246,0.18)]">
          <UploadCloud className="h-10 w-10" />
        </div>

        <div className="relative z-10 mt-6 space-y-3">
          <p className="text-xl font-semibold text-ink">Drag & drop your image</p>
          <p className="max-w-88 text-sm leading-6 text-ink-muted">
            Secure AI moderation for JPG, PNG, and WEBP files up to 5MB. Smart previews and clear verdicts come instantly.
          </p>
        </div>

        <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-full bg-surface text-xs font-semibold text-ink-muted px-4 py-2 shadow-card-rest">Safe upload</span>
          <span className="rounded-full bg-accent-soft text-xs font-semibold text-accent px-4 py-2 shadow-card-rest">Real-time verdict</span>
        </div>

        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center rounded-[30px] bg-surface/80 backdrop-blur-sm"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="relative flex h-14 w-14 items-center justify-center">
                  <div className="absolute inset-0 rounded-full border border-accent/20" />
                  <div className="absolute inset-0 rounded-full border-t-2 border-accent-strong animate-spin" />
                </div>
                <p className="text-sm font-medium text-ink">Analyzing image...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-x-6 bottom-6 rounded-full border border-accent/10 bg-white/10 px-4 py-2 text-xs text-ink-muted">
          Click to upload or drop a file anywhere inside
        </div>

        {dragging && <div className="pointer-events-none absolute inset-0 rounded-[30px] border-2 border-accent/40 bg-accent/10" />}
      </div>
    </motion.div>
  );
}

function ScoreCard({
  label,
  score,
  detected,
  index,
  isDarkMode,
  reducedMotion,
}: {
  label: string;
  score: number;
  detected: boolean;
  index: number;
  isDarkMode: boolean;
  reducedMotion: boolean;
}) {
  const size = 64;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const normalizedScore = Math.max(0, Math.min(100, score));
  const offset = circumference - (normalizedScore / 100) * circumference;
  const state: VerdictState = detected ? "flagged" : "approved";
  const style = verdictStyles[state];

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -1, transition: { type: "tween", duration: 0.16, ease: "easeOut" } }}
      transition={{ duration: reducedMotion ? 0.2 : 0.22, ease: "easeOut", type: "tween", delay: index * 0.04 }}
      className={cn(
        "flex items-center gap-4 rounded-[28px] border px-4 py-3 transition-shadow duration-200 ease-out",
        isDarkMode
          ? "bg-zinc-900/82 border-white/10 text-zinc-100 shadow-[0_18px_36px_rgba(0,0,0,0.22)]"
          : "bg-white border border-zinc-200/80 text-zinc-950 shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
      )}
    >
      <div
        className={cn(
          "relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full",
          isDarkMode
            ? "bg-zinc-950 shadow-[inset_0_2px_14px_rgba(0,0,0,0.24)]"
            : "bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]"
        )}
      >
        <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            className={isDarkMode ? "stroke-zinc-700" : "stroke-zinc-200"}
            fill={isDarkMode ? "rgba(15,23,42,0.85)" : "rgba(255,255,255,0.95)"}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={cn(style.ring)}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.6, ease: "easeOut", delay: index * 0.04 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-base font-semibold tabular-nums">{Math.round(score)}</span>
          <span className="mt-0.5 text-[10px] uppercase tracking-[0.26em] text-ink-muted">
            {detected ? "risk" : "safe"}
          </span>
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm leading-snug">{label}</p>
        <p className="mt-1 text-xs leading-5 text-ink-muted">
          {detected ? "Evidence detected" : "No significant evidence"}
        </p>
      </div>
    </motion.div>
  );
}

function PreviewPanel({
  src,
  pending,
  isDarkMode,
  reducedMotion,
}: {
  src: string;
  pending: boolean;
  isDarkMode: boolean;
  reducedMotion: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn("relative overflow-hidden rounded-[32px] border border-border bg-glass-panel shadow-glass-highlight backdrop-blur-[20px]")}
    >
      <div className="aspect-4/3 w-full min-h-105 overflow-hidden">
        <Image src={src} alt="Uploaded preview" width={640} height={640} unoptimized className="h-full w-full object-cover" />
      </div>
      {pending && !reducedMotion && (
        <motion.div
          key="scan-plane"
          className="scan-sweep pointer-events-none absolute inset-x-0 -top-12 h-12 bg-linear-to-b from-transparent via-accent/30 to-transparent"
          initial={{ y: "-120%" }}
          animate={{ y: "420%" }}
          transition={{ duration: 1.8, ease: "linear" }}
        />
      )}
      {pending && <div className={cn("pointer-events-none absolute inset-0", isDarkMode ? "bg-accent/5" : "bg-accent/4")} />}
    </motion.div>
  );
}

function VerdictPlaceholder({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <div
      className={cn(
        "flex min-h-115 flex-col items-center justify-center rounded-[32px] border border-border bg-surface-sunken px-6 text-center",
        isDarkMode ? "text-ink" : "text-ink"
      )}
    >
      <div className="relative mb-5 h-12 w-12">
        <div className="absolute inset-0 rounded-full border border-border" />
        <div className="absolute inset-3 animate-pulse rounded-full border border-accent/40" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="h-2 w-2 rounded-full bg-accent" />
        </div>
      </div>

      <p className="font-body text-base font-semibold text-ink">Waiting for an upload</p>
      <p className="mt-2 max-w-xs font-body text-xs leading-5 text-ink-muted">
        Upload an image to see the verdict, file details, and category scores.
      </p>
    </div>
  );
}

function VerdictPanel({
  result,
  isDarkMode,
  reducedMotion,
  appealStatus,
  appealReason,
  appealError,
  setAppealReason,
  requestAppeal,
}: {
  result: UploadResult;
  isDarkMode: boolean;
  reducedMotion: boolean;
  appealStatus: "idle" | "submitting" | "submitted" | "failed";
  appealReason: string;
  appealError: string | null;
  setAppealReason: (value: string) => void;
  requestAppeal: () => Promise<void>;
}) {
  const state = verdictState(result.final_verdict);
  const verdict = verdictLabel(result.final_verdict);
  const reasons = getReasons(result);

  return (
    <div className="relative overflow-hidden rounded-[40px]">
      <div
        className={cn(
          "pointer-events-none absolute inset-0 blur-3xl",
          isDarkMode ? "bg-cyan-500/10" : "bg-slate-900/10"
        )}
      />
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className={cn(
          "relative overflow-hidden rounded-[40px] border p-6",
          isDarkMode ? "border-white/10 bg-zinc-900/90 text-zinc-100 shadow-[0_30px_90px_rgba(0,0,0,0.35)]" : "border-zinc-950/10 bg-white text-zinc-950 shadow-[4px_4px_0_rgba(9,9,11,0.12)]"
        )}
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(300px,380px)_minmax(360px,1fr)]">
          <div className="space-y-5">
            <div
              className={cn(
                "rounded-[28px] border px-5 py-4",
                isDarkMode ? "border-white/10 bg-zinc-950/85" : "border-zinc-200/80 bg-white"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-muted">Active analysis</p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-ink">Result spotlight</h2>
                </div>
                <StatusPill state={state} label={verdict} />
              </div>
            </div>

            <div
              className={cn(
                "relative overflow-hidden rounded-[32px] border border-border shadow-[0_20px_60px_rgba(0,0,0,0.12)]",
                isDarkMode ? "bg-zinc-950/90 border-white/10" : "bg-zinc-100 border-zinc-200/80"
              )}
            >
              <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 border-b border-border/70 bg-surface/85 px-4 py-3 backdrop-blur-sm">
                <span className="rounded-full bg-accent-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-strong">
                  Live preview
                </span>
                <span className="rounded-full bg-zinc-100/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-muted">
                  Image fidelity
                </span>
              </div>
              <div className="pt-12">
                <PreviewPanel src={apiUrl(result.image_url)} pending={false} isDarkMode={isDarkMode} reducedMotion={reducedMotion} />
              </div>
            </div>
          </div>

          <div className="flex max-w-full flex-col gap-5">
            <div
              className={cn(
                "rounded-[28px] border px-5 py-4",
                isDarkMode ? "border-white/10 bg-zinc-950/85" : "border-zinc-200/80 bg-white"
              )}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted">File ID</p>
                  <p className="mt-2 truncate text-sm font-semibold text-ink">{result.filename}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted">Decision</p>
                  <p className="mt-2 text-sm font-semibold text-ink">{result.final_verdict}</p>
                </div>
              </div>
            </div>
            <div
              className={cn(
                "rounded-[32px] border px-5 py-5",
                isDarkMode ? "border-white/10 bg-zinc-950/80" : "border-zinc-200/80 bg-white"
              )}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted">Reason</p>
                  <p className="mt-2 text-sm text-ink-muted">Why this verdict was generated</p>
                </div>
                <span className="rounded-full bg-zinc-100/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-muted">
                  {reasons.length} insights
                </span>
              </div>
              <div className="mt-4 max-w-md">
                {reasons.length > 0 ? (
                  <ul className="space-y-3 text-sm leading-7 text-ink-muted">
                    {reasons.map((reason) => (
                      <li key={reason} className="wrap-break-word">{reason}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm leading-7 text-ink-muted">No reasoning provided.</p>
                )}
              </div>

              {(state === "flagged" || state === "blocked") && (
                <div className="mt-6 rounded-[28px] border p-5 shadow-card-rest bg-surface-sunken">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-ink">Request human review</p>
                      <p className="text-xs text-ink-muted">Request an appeal for this verdict if you believe the decision is incorrect.</p>
                    </div>
                    <span className="rounded-full border border-border bg-white/10 px-3 py-1 text-xs text-ink-muted">
                      {appealStatus === "submitted" ? "Submitted" : "Ready"}
                    </span>
                  </div>

                  <textarea
                    className="min-h-[120px] w-full rounded-3xl border border-border bg-surface p-4 text-sm text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/10"
                    value={appealReason}
                    onChange={(event) => setAppealReason(event.target.value)}
                    placeholder="Describe why this upload should be re-reviewed by the moderation team..."
                    disabled={appealStatus === "submitting" || appealStatus === "submitted"}
                  />

                  {appealError && <p className="mt-3 text-sm text-rose-400">{appealError}</p>}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Button
                      size="sm"
                      className="bg-accent text-nav-deep hover:bg-accent hover:opacity-90"
                      onClick={requestAppeal}
                      disabled={appealStatus === "submitting" || appealStatus === "submitted" || appealReason.trim().length < 10}
                    >
                      {appealStatus === "submitting" ? "Submitting..." : appealStatus === "submitted" ? "Request Sent" : "Request Review"}
                    </Button>
                    <p className="text-xs text-ink-muted">
                      Appeals are available for flagged or blocked uploads only.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-muted">Category Scores</p>
              <p className="mt-2 text-sm text-ink-muted">Risk categories arranged for fast comparison.</p>
            </div>
            <span className="rounded-full bg-zinc-100/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-ink-muted">
              0 = no visual evidence
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((category, index) => {
              const rawScore = result.ai_analysis[category.key] as ModerationScoreValue | undefined;
              const score = typeof rawScore === "object" && rawScore !== null ? rawScore.confidence || 0 : rawScore || 0;
              const detected = typeof rawScore === "object" && rawScore !== null ? rawScore.detected : false;

              return (
                <ScoreCard
                  key={category.key}
                  label={category.label}
                  score={score}
                  detected={detected}
                  index={index}
                  isDarkMode={isDarkMode}
                  reducedMotion={reducedMotion}
                />
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function PendingVerdictPanel({
  src,
  isDarkMode,
  reducedMotion,
}: {
  src: string;
  isDarkMode: boolean;
  reducedMotion: boolean;
}) {
  return (
    <CardFrame className="overflow-hidden p-5">
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <PreviewPanel src={src} pending={true} isDarkMode={isDarkMode} reducedMotion={reducedMotion} />
        <div className="flex flex-col justify-center gap-4">
          <div>
            <span className="font-body text-[10px] font-bold uppercase tracking-[0.2em] text-ink-muted">Verdict Status</span>
            <div className="mt-3">
              <StatusPill state="pending" label="Needs Review" />
            </div>
          </div>
          <p className="font-body text-sm leading-6 text-ink-muted">
            The scan is running once over the uploaded image. Category scores will settle into place as each signal resolves.
          </p>
          <div className={cn(
            "rounded-[28px] border px-4 py-3 text-sm",
            isDarkMode ? "border-white/10 bg-zinc-950/85 text-zinc-200" : "border-zinc-200/80 bg-white text-zinc-900"
          )}>
            <p className="font-semibold">Fast verdict funnel</p>
            <p className="mt-2 text-ink-muted">A clean preview with a pending overlay keeps the workflow focused.</p>
          </div>
        </div>
      </div>
    </CardFrame>
  );
}

export function ModerationDashboard() {
  const router = useRouter();
  const reducedMotion = useReducedMotion() ?? false;
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [appealReason, setAppealReason] = useState("");
  const [appealStatus, setAppealStatus] = useState<"idle" | "submitting" | "submitted" | "failed">("idle");
  const [appealError, setAppealError] = useState<string | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeReady, setThemeReady] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("moderation-theme");
    const nextTheme =
      saved === "dark" ? true : saved === "light" ? false : window.matchMedia("(prefers-color-scheme: dark)").matches;

    const frame = window.requestAnimationFrame(() => {
      setIsDarkMode(nextTheme);
      setThemeReady(true);
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!themeReady) return;
    window.localStorage.setItem("moderation-theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode, themeReady]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) router.push("/login");
  }, [router]);

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    };
  }, [pendingPreviewUrl]);

  const processFile = async (file: File) => {
    if (!file.type?.startsWith("image/")) {
      alert("Please upload a valid image file.");
      return;
    }

    setLoading(true);
    setResult(null);
    setAppealReason("");
    setAppealStatus("idle");
    setAppealError(null);
    setPendingPreviewUrl((currentUrl) => {
      if (currentUrl) URL.revokeObjectURL(currentUrl);
      return URL.createObjectURL(file);
    });

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(apiUrl("/api/v1/upload/"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          clearAuth();
          router.push("/login");
          throw new Error("Your session expired. Please log in again.");
        }
        throw new Error(data.detail || "Upload failed");
      }

      setResult(data);
      setPendingPreviewUrl(null);
    } catch (err: unknown) {
      setAppealStatus("idle");
      setAppealError(null);
      alert("Error processing image: " + getErrorMessage(err, "Upload failed"));
    } finally {
      setLoading(false);
    }
  };

  const requestAppeal = async () => {
    if (!result?.upload_id) {
      setAppealError("Cannot request review for this upload.");
      setAppealStatus("failed");
      return;
    }

    if (appealReason.trim().length < 10) {
      setAppealError("Please include at least 10 characters describing why this should be reviewed.");
      setAppealStatus("failed");
      return;
    }

    setAppealStatus("submitting");
    setAppealError(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl("/api/v1/appeals/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ upload_id: result.upload_id, reason: appealReason.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Unable to request review");
      }

      setAppealStatus("submitted");
      setAppealReason("");
      alert("Review request submitted successfully.");
    } catch (err: unknown) {
      setAppealStatus("failed");
      setAppealError(getErrorMessage(err, "Failed to submit appeal."));
      console.error(err);
    }
  };

  return (
    <AppShell isDarkMode={isDarkMode}>
      <motion.div
        variants={pageVariants}
        initial="hidden"
        animate="show"
        className="mx-auto flex w-full max-w-370 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8"
      >
        <motion.header
          variants={itemVariants}
          className="grid gap-4 rounded-[36px] border border-border bg-surface/95 px-6 py-6 shadow-card-raised backdrop-blur-xl sm:grid-cols-[1.38fr_0.62fr] sm:items-center"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-strong shadow-sm">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-accent shadow-[0_0_0_8px_rgba(59,130,246,0.08)]" />
              Moderation Workspace
            </div>
            <div className="space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h1 className="font-display text-4xl font-semibold tracking-tight text-ink">Moderation Dashboard</h1>
                  <p className="mt-2 max-w-3xl text-base leading-7 text-ink-muted">
                    A modern moderation workspace with proactive AI insight, polished upload flow, and verdict details that stay easy to scan.
                  </p>
                </div>
                <div
                  className={cn(
                    "flex items-center gap-2 rounded-lg border px-2 py-1",
                    isDarkMode ? "border-white/10 bg-zinc-950/80" : "border-zinc-200/80 bg-white shadow-[0_8px_20px_rgba(0,0,0,0.04)]"
                  )}
                >
                  <ThemeSwitch
                    isDarkMode={themeReady ? isDarkMode : false}
                    ready={themeReady}
                    onToggle={() => setIsDarkMode((value) => !value)}
                  />

                  <Button
                    size="sm"
                    className={cn(
                      "flex items-center gap-2 h-10 px-3 text-sm font-semibold transition-transform duration-200",
                      isDarkMode
                        ? "border-white/10 bg-zinc-900/90 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_16px_rgba(0,0,0,0.18)]"
                        : "border-zinc-200/80 bg-white text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_16px_rgba(15,23,42,0.06)]"
                    )}
                    onClick={() => router.push("/admin")}
                  >
                    <Settings className="h-4 w-4" />
                    <span className="hidden sm:inline">Admin</span>
                  </Button>

                  <Button
                    size="sm"
                    className={cn(
                      "flex items-center gap-2 h-10 px-3 text-sm font-semibold transition-transform duration-200",
                      isDarkMode
                        ? "border-white/10 bg-zinc-900/90 text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_16px_rgba(0,0,0,0.18)]"
                        : "border-zinc-200/80 bg-white text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_8px_16px_rgba(15,23,42,0.06)]"
                    )}
                    onClick={() => {
                      clearAuth();
                      router.push("/login");
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryCard label="Current Status" value={result ? result.final_verdict : "Ready"} detail="Upload a file to generate AI verdicts." />
            <SummaryCard label="Activity" value={loading ? "Processing..." : result ? "Verdict ready" : "Waiting"} detail="Status updates as the AI analysis completes." />
          </div>
        </motion.header>

        <motion.section variants={itemVariants} className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 160, damping: 32 }}
              className={cn(
                "group relative h-full overflow-hidden rounded-[40px] border p-6 transition-all duration-300",
                isDarkMode ? "border-white/10 bg-zinc-900/90 shadow-[0_30px_90px_rgba(0,0,0,0.35)]" : "border-zinc-950/10 bg-white shadow-[4px_4px_0_rgba(9,9,11,0.12)]"
              )}
            >
              <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-cyan-400/15 to-transparent" />
              <div className="relative z-10 flex h-full flex-col justify-between gap-8">
                <div className="space-y-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-muted">Upload panel</p>
                  <div>
                    <h2 className="text-3xl font-semibold tracking-tight text-ink">Immersive upload well</h2>
                    <p className="mt-3 text-sm leading-6 text-ink-muted">
                      Drop a file into the inset 3D well and keep the focus on the analysis output, which appears immediately in the right column.
                    </p>
                  </div>
                </div>

                <div
                  className={cn(
                    "rounded-[36px] border p-5 shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)]",
                    isDarkMode ? "border-white/10 bg-zinc-950/80" : "border-zinc-950/10 bg-zinc-100/90"
                  )}
                >
                  <UploadWell loading={loading} onFileSelect={processFile} isDarkMode={isDarkMode} />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className={cn(
                    "rounded-[28px] border p-4 text-sm",
                    isDarkMode ? "border-white/10 bg-zinc-950/80 text-zinc-100" : "border-zinc-950/10 bg-zinc-50 text-zinc-950"
                  )}>
                    <p className="font-semibold">Clear workflow</p>
                    <p className="mt-2 text-ink-muted">This column is dedicated entirely to upload and capture.</p>
                  </div>
                  <div className={cn(
                    "rounded-[28px] border p-4 text-sm",
                    isDarkMode ? "border-white/10 bg-zinc-950/80 text-zinc-100" : "border-zinc-950/10 bg-zinc-50 text-zinc-950"
                  )}>
                    <p className="font-semibold">Instant focus</p>
                    <p className="mt-2 text-ink-muted">Results appear in the right canvas without scrolling down.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="lg:col-span-7">
            <motion.div
              whileHover={{ y: -2 }}
              transition={{ type: "spring", stiffness: 160, damping: 32 }}
              className={cn(
                "relative overflow-hidden rounded-[40px] border p-6 transition-all duration-300",
                isDarkMode ? "border-white/10 bg-zinc-900/90 shadow-[0_30px_90px_rgba(0,0,0,0.35)]" : "border-zinc-950/10 bg-white shadow-[4px_4px_0_rgba(9,9,11,0.12)]"
              )}
            >
              <div className={cn(
                "pointer-events-none absolute inset-0 bg-linear-to-br opacity-80",
                isDarkMode ? "from-cyan-500/10 via-zinc-950/20 to-transparent" : "from-slate-900/5 via-white/70 to-transparent"
              )} />
              <div className="relative z-10 space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ink-muted">Active analysis</p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight text-ink">Primary result canvas</h2>
                  </div>
                  <StatusPill
                    state={result ? verdictState(result.final_verdict) : loading ? "pending" : "pending"}
                    label={result ? verdictLabel(result.final_verdict) : loading ? "Processing" : "Ready"}
                  />
                </div>

                <AnimatePresence mode="wait">
                  {loading && pendingPreviewUrl ? (
                    <motion.div
                      key="pending"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                    >
                      <PendingVerdictPanel src={pendingPreviewUrl} isDarkMode={isDarkMode} reducedMotion={reducedMotion} />
                    </motion.div>
                  ) : result ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                    >
                      <VerdictPanel
                        result={result}
                        isDarkMode={isDarkMode}
                        reducedMotion={reducedMotion}
                        appealStatus={appealStatus}
                        appealReason={appealReason}
                        appealError={appealError}
                        setAppealReason={setAppealReason}
                        requestAppeal={requestAppeal}
                      />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="placeholder"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                    >
                      <VerdictPlaceholder isDarkMode={isDarkMode} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </motion.section>
      </motion.div>
    </AppShell>
  );
}
