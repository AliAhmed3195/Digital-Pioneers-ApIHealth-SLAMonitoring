"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole, Rocket, ShieldCheck } from "lucide-react";
import { useToast } from "@/shared/ui/ToastProvider";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoAvailable, setLogoAvailable] = useState(true);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast.error(payload.error ?? "Login failed.");
        return;
      }
      toast.success("Login successful.");
      const nextPath = searchParams.get("next");
      router.push(nextPath && nextPath.startsWith("/") ? nextPath : "/dashboard");
      router.refresh();
    } catch {
      toast.error("Unable to sign in right now.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function fillDemoAccount() {
    setUsername("digitalpioneer@avanzasolutions.com");
    setPassword("DigitalPioneer");
    toast.info("Demo account credentials filled.");
  }

  return (
    <main className="login-page">
      <div className="login-layout">
        <section className="login-hero">
          <span className="login-pill">Enterprise Monitoring</span>
          <h1>Digital Pioneer</h1>
          <p>
            API Health SLA Monitor with AI incident intelligence for proactive, fast, and reliable
            operations.
          </p>
          <div className="login-feature-list">
            <div className="login-feature-item">
              <ShieldCheck size={16} />
              <span>Realtime SLA posture</span>
            </div>
            <div className="login-feature-item">
              <Rocket size={16} />
              <span>AI-powered incident insights</span>
            </div>
            <div className="login-feature-item">
              <LockKeyhole size={16} />
              <span>Secure controlled access</span>
            </div>
          </div>
        </section>

        <section className="login-card">
          <div className="login-brand">
            {logoAvailable ? (
              <img
                className="login-logo"
                src="/team-logo.png"
                alt="Digital Pioneer Team Logo"
                onError={() => setLogoAvailable(false)}
              />
            ) : (
              <div className="login-logo-fallback">DP</div>
            )}
            <div>
              <p className="login-brand-name">Digital Pioneer</p>
              <p className="login-brand-subtitle">SLA Intelligence Console</p>
            </div>
          </div>
          <h2>Welcome Back</h2>
          <p className="muted">Sign in to continue monitoring and incident response workflows.</p>

          <form className="login-form" onSubmit={onSubmit}>
            <label className="login-label">
              Username
              <input
                className="input login-input"
                value={username}
                autoComplete="username"
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                required
              />
            </label>
            <label className="login-label">
              Password
              <input
                className="input login-input"
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter password"
                required
              />
            </label>
            <button className="btn btn-primary login-submit" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
            <button
              className="btn login-demo"
              type="button"
              onClick={fillDemoAccount}
              disabled={isSubmitting}
            >
              Use Demo Account
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="login-page" />}>
      <LoginPageContent />
    </Suspense>
  );
}
