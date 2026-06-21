"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on the client after hydration. autoFocus renders the attribute
  // server-side, which lets the environment inject focus-tracking attributes
  // before React hydrates and trips a hydration mismatch that leaves the form
  // non-interactive (onChange never fires, so the button stays disabled).
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (res.ok) {
      router.push("/explore");
    } else {
      setError("Invalid token");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="w-full max-w-sm px-4">
        <p className="text-2xl font-bold text-slate-100 mb-1">hashit</p>
        <p className="text-slate-400 text-sm mb-6">Enter your API key to continue.</p>
        <form onSubmit={submit} className="space-y-3">
          <input
            ref={inputRef}
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="API key"
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 text-slate-100 text-sm focus:outline-none focus:border-slate-500 placeholder:text-slate-600"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 text-slate-100 rounded px-3 py-2 text-sm font-medium transition-colors"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
