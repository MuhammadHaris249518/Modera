"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { apiUrl } from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";
import { AuthShell } from "@/components/auth-shell";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch(apiUrl("/api/v1/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.detail || "Registration failed");

      // Redirect to login on success
      router.push("/login");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Registration failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create account"
      description="Register to access the moderation dashboard and admin workflow."
    >
      <form onSubmit={handleRegister} className="space-y-5">
        {error && (
          <div className="rounded-xl border border-border bg-surface-sunken px-3 py-2 text-sm text-ink">
            {error}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-ink-muted">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11 border-border bg-surface-sunken text-ink placeholder:text-ink-muted focus-visible:border-accent focus-visible:ring-accent/20"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-ink-muted">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11 border-border bg-surface-sunken text-ink placeholder:text-ink-muted focus-visible:border-accent focus-visible:ring-accent/20"
          />
        </div>
        <Button type="submit" className="h-11 w-full bg-accent text-nav-deep shadow-card-rest hover:bg-accent hover:opacity-90" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </Button>
        <div className="text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-accent hover:text-accent/80">
            Sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
