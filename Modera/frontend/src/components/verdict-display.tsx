"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ModerationScoreValue, UploadResult } from "@/lib/types";
import { apiUrl } from "@/lib/api";

const categories = [
  { key: "graphicViolence", label: "Graphic violence" },
  { key: "hateSymbols", label: "Hate symbols" },
  { key: "selfHarm", label: "Self harm" },
  { key: "extremistPropaganda", label: "Extremist propaganda" },
  { key: "weaponsContraband", label: "Weapons & contraband" },
  { key: "harassmentHumiliation", label: "Harassment & humiliation" },
] as const;

function verdictTone(verdict: string) {
  if (verdict === "Blocked") return "border-rose-500/30 bg-rose-500/15 text-rose-100 shadow-[0_0_0_1px_rgba(244,63,94,0.08),0_0_30px_rgba(244,63,94,0.22)]";
  if (verdict === "Flagged") return "border-amber-500/30 bg-amber-500/15 text-amber-100 shadow-[0_0_0_1px_rgba(245,158,11,0.08),0_0_30px_rgba(245,158,11,0.2)]";
  return "border-emerald-500/30 bg-emerald-500/15 text-emerald-100 shadow-[0_0_0_1px_rgba(16,185,129,0.08),0_0_30px_rgba(16,185,129,0.18)]";
}

function verdictLabel(verdict: string) {
  if (verdict === "Blocked") return "Blocked";
  if (verdict === "Flagged") return "Needs review";
  return "Safe";
}

function scoreHue(score: number) {
  if (score >= 80) return { ring: "stroke-rose-400", glow: "drop-shadow-[0_0_14px_rgba(248,113,113,0.35)]", track: "stroke-white/10" };
  if (score >= 50) return { ring: "stroke-amber-400", glow: "drop-shadow-[0_0_14px_rgba(251,191,36,0.28)]", track: "stroke-white/10" };
  return { ring: "stroke-emerald-400", glow: "drop-shadow-[0_0_14px_rgba(74,222,128,0.25)]", track: "stroke-white/10" };
}

function ScoreRing({
  label,
  score,
  detected,
}: {
  label: string;
  score: number;
  detected: boolean;
}) {
  const size = 84;
  const stroke = 8;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, score)) / 100) * circumference;
  const hue = scoreHue(score);

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.05] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-100">{label}</p>
        <Badge
          variant="outline"
          className={cn(
            "border px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]",
            detected
              ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
              : "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
          )}
        >
          {detected ? "Detected" : "Clear"}
        </Badge>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <div className="relative h-[84px] w-[84px]">
          <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className={hue.track}
              strokeWidth={stroke}
              fill="none"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              className={cn(hue.ring, hue.glow)}
              strokeWidth={stroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-semibold text-white">{score}</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-slate-400">/100</span>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</p>
          <p className="mt-1 text-sm leading-6 text-slate-300">
            {detected ? "Visual evidence was detected in this category." : "No meaningful visual evidence detected."}
          </p>
        </div>
      </div>
    </div>
  );
}

export function VerdictDisplay({ result }: { result: UploadResult }) {
  const verdict = verdictLabel(result.final_verdict);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className="space-y-5"
    >
      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="overflow-hidden rounded-[26px] border border-white/10 bg-white/[0.04] p-[1px] shadow-[0_30px_90px_rgba(2,6,23,0.55)]">
          <div className="relative overflow-hidden rounded-[25px] border border-white/10 bg-slate-950">
            <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
            <Image
              src={apiUrl(result.image_url)}
              alt="Uploaded preview"
              width={640}
              height={640}
              unoptimized
              className="h-64 w-full object-cover"
            />
          </div>
        </div>

        <div className="rounded-[26px] border border-white/10 bg-white/[0.06] p-5 shadow-[0_30px_90px_rgba(2,6,23,0.5)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Badge className={cn("border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]", verdictTone(result.final_verdict))}>
                Verdict Status
              </Badge>
              <span className="text-sm text-slate-300">{verdict}</span>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1 text-xs font-medium text-slate-300">
              Gemini-first analysis
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[20px] border border-white/10 bg-slate-950/50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">File</p>
              <p className="mt-1 truncate text-sm text-slate-100">{result.filename}</p>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-slate-950/50 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Decision</p>
              <p className="mt-1 text-sm text-slate-100">{result.final_verdict}</p>
            </div>
          </div>

          <div className="mt-4 rounded-[22px] border border-white/10 bg-slate-950/60 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">Reason</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {result.ai_analysis.reasoning || result.ai_analysis.error || "No reasoning provided."}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-[26px] border border-white/10 bg-white/[0.05] p-5 shadow-[0_30px_90px_rgba(2,6,23,0.5)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">Category scores</h3>
          <span className="text-xs text-slate-500">Out of 100</span>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const rawScore = result.ai_analysis[category.key] as ModerationScoreValue | undefined;
            const score = typeof rawScore === "object" && rawScore !== null ? (rawScore.confidence || 0) : (rawScore || 0);
            const detected = typeof rawScore === "object" && rawScore !== null ? rawScore.detected : false;

            return <ScoreRing key={category.key} label={category.label} score={score} detected={detected} />;
          })}
        </div>
      </div>
    </motion.div>
  );
}
