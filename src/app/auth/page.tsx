"use client";

import { useState } from "react";

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [msg, setMsg] = useState("");

  async function safeFetch(input: RequestInfo, init?: RequestInit) {
    try {
      const r = await fetch(input, {
        credentials: "same-origin", // asegura cookies en same-origin
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(init?.headers || {}),
        },
      });
      const text = await r.text();
      // muestra status + body para depurar
      setMsg(`STATUS ${r.status}\n${text}`);
      return { ok: r.ok, text };
    } catch (e: any) {
      setMsg(`FAILED FETCH: ${e?.message || e}`);
      throw e;
    }
  }

  async function doSignUp() {
    await safeFetch("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password: pass }),
    });
  }

  async function doSignIn() {
    await safeFetch("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify({ email, password: pass }),
    });
  }

  async function me() {
    await safeFetch("/api/auth/me");
  }

  async function signout() {
    await safeFetch("/api/auth/signout", { method: "POST" });
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Auth MVP</h1>
      <input
        className="border p-2 w-full"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        className="border p-2 w-full"
        placeholder="password"
        type="password"
        value={pass}
        onChange={(e) => setPass(e.target.value)}
      />
      <div className="flex gap-2 flex-wrap">
        <button className="border px-3 py-2" onClick={doSignUp}>
          Sign up
        </button>
        <button className="border px-3 py-2" onClick={doSignIn}>
          Sign in
        </button>
        <button className="border px-3 py-2" onClick={me}>
          Who am I?
        </button>
        <button className="border px-3 py-2" onClick={signout}>
          Sign out
        </button>
      </div>
      <pre className="text-xs bg-gray-100 p-2 overflow-auto whitespace-pre-wrap">
        {msg}
      </pre>
    </div>
  );
}



