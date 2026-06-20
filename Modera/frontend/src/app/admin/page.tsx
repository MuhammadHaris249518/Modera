"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Ban, Save, LogOut } from "lucide-react";
import { apiUrl } from "@/lib/api";
import { clearAuth } from "@/lib/auth";
import { AppShell, Surface } from "@/components/app-shell";
import type { AppealItem, QueueItem, Policy, ModerationScoreValue } from "@/lib/types";

export default function AdminPage() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [appeals, setAppeals] = useState<AppealItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    const load = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [qRes, pRes, aRes] = await Promise.all([
          fetch(apiUrl("/api/v1/admin/queue"), { headers }),
          fetch(apiUrl("/api/v1/admin/policies"), { headers }),
          fetch(apiUrl("/api/v1/admin/appeals"), { headers }),
        ]);

        if (
          qRes.status === 401 || qRes.status === 403 ||
          pRes.status === 401 || pRes.status === 403 ||
          aRes.status === 401 || aRes.status === 403
        ) {
          clearAuth();
          router.push("/login");
          return;
        }

        const qData = await qRes.json();
        const pData = await pRes.json();
        const aData = await aRes.json();

        setQueue(qData.queue || []);
        setPolicies(pData.policies || []);
        setAppeals(aData.appeals || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [router]);

  const handleOverride = async (id: string, newVerdict: "Approved" | "Blocked") => {
    try {
      const token = localStorage.getItem("token");
      await fetch(apiUrl(`/api/v1/admin/verdict/${id}?new_verdict=${newVerdict}`), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      // Remove item from queue visually
      setQueue((prev) => prev.filter((item) => item._id !== id));
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to override verdict");
    }
  };

  const resolveAppeal = async (id: string, action: "APPROVED" | "REJECTED") => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(apiUrl(`/api/v1/admin/appeals/${id}/resolve`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Unable to resolve appeal");
      }

      setAppeals((prev) =>
        prev.map((appeal) =>
          appeal.id === id ? { ...appeal, status: action, reviewed_at: new Date().toISOString() } : appeal
        )
      );
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to resolve appeal");
    }
  };

  const savePolicies = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch(apiUrl("/api/v1/admin/policies"), {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(policies),
      });
      alert("Policies updated successfully!");
    } catch (err: unknown) {
      console.error(err);
      alert("Failed to save policies");
    }
  };

  const updatePolicy = (index: number, field: "flag_threshold" | "block_threshold", val: number) => {
    const newPolicies = [...policies];
    newPolicies[index][field] = val;
    setPolicies(newPolicies);
  };

  const handleSliderChange = (
    index: number,
    field: "flag_threshold" | "block_threshold",
    value: number | readonly number[]
  ) => {
    const nextValue = Array.isArray(value) ? value[0] : value;
    updatePolicy(index, field, nextValue);
  };

  return (
    <AppShell>
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-border bg-surface/92 px-5 py-4 shadow-card-rest backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-accent">
              Admin workspace
            </p>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Review queue and policy controls
            </h1>
            <p className="text-sm text-ink-muted">
              Review flagged uploads and fine-tune threshold sliders with a calmer, denser interface.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="border-border bg-surface text-ink hover:border-accent hover:bg-accent-soft hover:text-accent-strong" onClick={() => router.push("/dashboard")}>
              User dashboard
            </Button>
            <Button variant="outline" className="border-border bg-surface text-ink hover:border-accent hover:bg-surface-sunken hover:text-ink" onClick={() => { localStorage.removeItem("token"); router.push("/login"); }}>
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </div>
        </header>

        <Tabs defaultValue="queue" className="w-full">
          <TabsList className="mb-4 rounded-xl border border-border bg-surface/80 p-1">
            <TabsTrigger value="queue">Flagged queue ({queue.length})</TabsTrigger>
            <TabsTrigger value="policies">Policy controls</TabsTrigger>
            <TabsTrigger value="appeals">Appeals ({appeals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="queue" className="mt-0">
            <Surface className="p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink">Manual review queue</h2>
                  <p className="text-sm text-ink-muted">Items the AI flagged for human review.</p>
                </div>
              </div>

              {loading ? (
                <p className="text-ink-muted">Loading queue...</p>
              ) : queue.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface-sunken px-4 py-10 text-center text-ink-muted">
                  No flagged items in the queue. You&apos;re all caught up.
                </div>
              ) : (
                <div className="space-y-4">
                  {queue.map((item) => (
                    <div
                      key={item._id}
                      className="grid gap-4 rounded-xl border border-border bg-surface/85 p-4 lg:grid-cols-[96px_1fr_320px]"
                    >
                      <div className="overflow-hidden rounded-xl border border-border bg-surface-sunken">
                        <Image
                          src={apiUrl(item.image_url)}
                          alt="Flagged upload"
                          width={96}
                          height={96}
                          unoptimized
                          className="h-24 w-24 object-cover"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-accent/30 bg-accent-soft text-nav-deep">
                            Review needed
                          </Badge>
                          <span className="text-sm text-ink-muted">Reasoning</span>
                        </div>
                        <p className="max-w-2xl text-sm leading-6 text-ink">
                          {item.ai_scores.reasoning}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-ink-muted">
                          <span className="rounded-full border border-border bg-surface-sunken px-3 py-1">
                            File: {item._id}
                          </span>
                          <span className="rounded-full border border-border bg-surface-sunken px-3 py-1">
                            Verdict: {item.final_verdict}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-2">
                          {["violence", "explicit", "weapons", "hate", "self_harm", "spam"].map((cat) => {
                            const rawScore = item.ai_scores[cat] as ModerationScoreValue | undefined;
                            const score = typeof rawScore === "object" && rawScore !== null ? (rawScore.confidence || 0) : (rawScore || 0);
                            if (score > 0) {
                              return (
                                <Badge key={cat} variant="secondary" className="bg-surface-sunken text-ink">
                                  {cat.replace("_", " ")} {score}/100
                                </Badge>
                              );
                            }
                            return null;
                          })}
                        </div>
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button size="sm" className="bg-accent text-nav-deep hover:bg-accent hover:opacity-90" onClick={() => handleOverride(item._id, "Approved")}>
                            <ShieldCheck className="mr-2 h-4 w-4" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleOverride(item._id, "Blocked")}>
                            <Ban className="mr-2 h-4 w-4" /> Block
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Surface>
          </TabsContent>

          <TabsContent value="appeals" className="mt-0">
            <Surface className="p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink">Appeals review</h2>
                  <p className="text-sm text-ink-muted">Review user requests and resolve whether a blocked or flagged upload should be changed.</p>
                </div>
              </div>

              {loading ? (
                <p className="text-ink-muted">Loading appeals...</p>
              ) : appeals.length === 0 ? (
                <div className="rounded-xl border border-border bg-surface-sunken px-4 py-10 text-center text-ink-muted">
                  No appeals have been submitted yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {appeals.map((appeal) => (
                    <div key={appeal.id} className="grid gap-4 rounded-xl border border-border bg-surface/85 p-4 lg:grid-cols-[96px_1fr_320px]">
                      <div className="overflow-hidden rounded-xl border border-border bg-surface-sunken">
                        {appeal.image_url ? (
                          <img src={apiUrl(appeal.image_url)} alt="Appeal image" className="h-24 w-full object-cover" />
                        ) : (
                          <div className="flex h-24 items-center justify-center text-sm text-ink-muted">No preview</div>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-accent/30 bg-accent-soft text-nav-deep">
                            {appeal.status.toLowerCase()}
                          </Badge>
                          <span className="text-sm text-ink-muted">Request by user</span>
                        </div>
                        <p className="max-w-2xl text-sm leading-6 text-ink">{appeal.reason}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-ink-muted">
                          <span className="rounded-full border border-border bg-surface-sunken px-3 py-1">File: {appeal.filename || appeal.upload_id}</span>
                          <span className="rounded-full border border-border bg-surface-sunken px-3 py-1">Verdict: {appeal.final_verdict || "Unknown"}</span>
                          <span className="rounded-full border border-border bg-surface-sunken px-3 py-1">Submitted: {new Date(appeal.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button size="sm" className="bg-accent text-nav-deep hover:bg-accent hover:opacity-90" onClick={() => resolveAppeal(appeal.id, "APPROVED")} disabled={appeal.status !== "PENDING"}>
                            <ShieldCheck className="mr-2 h-4 w-4" /> Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => resolveAppeal(appeal.id, "REJECTED")} disabled={appeal.status !== "PENDING"}>
                            <Ban className="mr-2 h-4 w-4" /> Reject
                          </Button>
                        </div>
                        {appeal.status !== "PENDING" && (
                          <p className="text-xs text-ink-muted">Resolved at {new Date(appeal.reviewed_at ?? appeal.updated_at ?? appeal.created_at).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Surface>
          </TabsContent>

          <TabsContent value="policies" className="mt-0">
            <Surface className="p-5">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-lg font-semibold text-ink">AI threshold configuration</h2>
                  <p className="text-sm text-ink-muted">Adjust how sensitive the moderation engine should be.</p>
                </div>
                <Button onClick={savePolicies} className="bg-accent text-nav-deep hover:bg-accent hover:opacity-90">
                  <Save className="mr-2 h-4 w-4" /> Save changes
                </Button>
              </div>

              <div className="space-y-4">
                {policies.map((policy, index) => (
                  <div key={policy.category} className="rounded-xl border border-border bg-surface/85 p-4">
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="font-display text-base font-semibold capitalize text-ink">
                        {policy.category.replace("_", " ")}
                      </h3>
                      <Badge variant="outline" className="border-border bg-surface-sunken text-ink-muted">
                        Policy
                      </Badge>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink">Flag threshold</span>
                          <span className="font-mono text-ink-muted">{policy.flag_threshold}/100</span>
                        </div>
                        <Slider
                          value={[policy.flag_threshold]}
                          max={100}
                          step={1}
                          onValueChange={(value) => handleSliderChange(index, "flag_threshold", value)}
                          className="[&_[role=slider]]:bg-accent [&_.bg-primary]:bg-accent"
                        />
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-ink">Block threshold</span>
                          <span className="font-mono text-ink-muted">{policy.block_threshold}/100</span>
                        </div>
                        <Slider
                          value={[policy.block_threshold]}
                          max={100}
                          step={1}
                          onValueChange={(value) => handleSliderChange(index, "block_threshold", value)}
                          className="[&_[role=slider]]:bg-accent [&_.bg-primary]:bg-accent"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Surface>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
