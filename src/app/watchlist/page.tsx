"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Item = { id: string; symbol: string; type: "EQUITY" | "CRYPTO" | "INDEX" };

export default function WatchlistPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [symbol, setSymbol] = useState("AAPL");
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  async function checkLogin() {
    try {
      const r = await fetch("/api/auth/me?ts=" + Date.now(), {
        cache: "no-store",
      });
      const j = await r.json();
      setLoggedIn(!!j?.user);
      return !!j?.user;
    } catch {
      setLoggedIn(false);
      return false;
    }
  }

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/watchlist?ts=" + Date.now(), {
        cache: "no-store",
        headers: { "Cache-Control": "no-store" },
      });

      if (r.status === 401) {
        setLoggedIn(false);
        setItems([]);
        return;
      }

      const j = (await r.json()) as Item[];
      setItems(Array.isArray(j) ? j : []);
      setLoggedIn(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      const ok = await checkLogin();
      if (ok) await load();
    })();
  }, []);

  async function add() {
    const s = symbol.trim().toUpperCase();
    if (!s) return;

    const r = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ symbol: s, type: "EQUITY" }),
    });

    if (r.status === 401) {
      alert("Debes iniciar sesión");
      setLoggedIn(false);
      return;
    }

    // Tanto si se creó (201) como si ya existía (409), recarga la lista
    if (r.ok || r.status === 409) {
      await load();
      if (r.status === 409) {
        const j = await r.json().catch(() => null);
        alert(j?.error ?? "Ya está en tu watchlist");
      }
    } else {
      const j = await r.json().catch(() => null);
      alert(j?.error ?? "No se pudo crear");
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-semibold mb-6">Watchlist</h1>

      <div className="flex gap-3 mb-4">
        <input
          className="flex-1 border rounded px-3 py-2"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="AAPL"
        />
        <button className="px-4 py-2 border rounded" onClick={add} disabled={loading}>
          Añadir
        </button>
        <button className="px-4 py-2 border rounded" onClick={load} disabled={loading}>
          Refrescar precios
        </button>
      </div>

      {loggedIn === false && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded p-3 mb-4">
          Debes iniciar sesión para ver/editar tu watchlist.
        </div>
      )}

      {loggedIn && items.length === 0 && (
        <div className="text-gray-500">Tu watchlist está vacía. Añade un símbolo.</div>
      )}

      {loggedIn && items.length > 0 && (
        <ul className="space-y-2">
          {items.map((it) => (
            <li
              key={it.id}
              className="border rounded p-3 flex items-center justify-between"
            >
              <div className="font-mono">{it.symbol}</div>
              <div className="flex gap-3 text-xs text-blue-600">
                <Link href={`/stocks/${it.symbol}`}>Snapshots</Link>
                <Link href={`/stocks/${it.symbol}/onepager`}>One Pager</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

