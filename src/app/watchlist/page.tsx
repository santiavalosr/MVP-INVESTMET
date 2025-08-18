"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Item = { id: string; symbol: string; createdAt: string };
type Quote = { symbol: string; price: number; change?: number; changePercent?: number };

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRateLimitedPayload(j: any) {
  return j && (j.Note || j.Information);
}

export default function WatchlistPage() {
  const [list, setList] = useState<Item[]>([]);
  const [symbol, setSymbol] = useState("");
  const [quotes, setQuotes] = useState<Record<string, Quote | null>>({});
  const [loading, setLoading] = useState(false);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  async function load() {
    const r = await fetch("/api/watchlist");
    if (r.ok) {
      const j = await r.json();
      setList(j.items as Item[]);
    } else {
      setList([]);
    }
  }

  // Añadir y traer SOLO ese símbolo (1 request)
  async function add() {
    const sym = symbol.trim().toUpperCase();
    if (!sym) return;

    const r = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: sym }),
    });

    if (!r.ok) {
      alert(await r.text());
      return;
    }

    setSymbol("");
    await load();

    // Trae precio solo del nuevo, para que aparezca sin “Refrescar precios”
    try {
      const qRes = await fetch(`/api/market/quote?symbol=${encodeURIComponent(sym)}`);
      const j = await qRes.json().catch(() => null);
      if (!isRateLimitedPayload(j) && qRes.ok && Number.isFinite(j?.price)) {
        setQuotes((prev) => ({ ...prev, [sym]: j as Quote }));
      }
    } catch {
      /* ignore */
    }
  }

  async function remove(sym: string) {
    const r = await fetch(`/api/watchlist?symbol=${encodeURIComponent(sym)}`, {
      method: "DELETE",
    });
    if (r.ok) await load();
  }

  // Refrescar TODO en serie con pausas + cortar ante rate-limit
  async function refreshQuotes() {
    if (!list.length) {
      setQuotes({});
      return;
    }
    setLoading(true);
    try {
      const acc: Record<string, Quote | null> = {};

      for (const it of list) {
        try {
          const r = await fetch(`/api/market/quote?symbol=${encodeURIComponent(it.symbol)}`);

          // intenta leer el cuerpo una vez; si trae Note/Information, corta
          const body = await r.json().catch(() => null);
          if (isRateLimitedPayload(body)) {
            acc[it.symbol] = null;
            setQuotes((prev) => ({ ...prev, ...acc }));
            alert("Llegaste al límite diario del plan gratuito de Alpha Vantage (25/día).");
            break;
          }

          if (!r.ok || !body || !Number.isFinite(body?.price)) {
            acc[it.symbol] = null;
          } else {
            acc[it.symbol] = body as Quote;
          }
        } catch {
          acc[it.symbol] = null;
        }

        // ~1.2s entre requests para respetar 5/min del plan free
        await sleep(1200);
      }

      setQuotes((prev) => ({ ...prev, ...acc }));
    } finally {
      setLoading(false);
    }
  }

  async function saveSnapshot(sym: string) {
    const r = await fetch("/api/snapshot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symbol: sym }),
    });
    const j = await r.json().catch(() => null);
    if (!r.ok) {
      alert(`Error: ${j?.error ?? "no se pudo guardar"}`);
    } else {
      alert("Snapshot guardado ✅");
    }
  }

  // Cargar lista al entrar
  useEffect(() => {
    load();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Cuando cambie la lista, refresca UNA vez. (Sin polling automático para no quemar cuota)
  useEffect(() => {
    (async () => {
      await refreshQuotes();
      if (pollingRef.current) clearInterval(pollingRef.current);
      // Si más adelante contratas plan, puedes reactivar un polling aquí.
      // pollingRef.current = setInterval(() => refreshQuotes(), 60_000);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list]);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Watchlist</h1>

      <div className="flex gap-2">
        <input
          className="border p-2 flex-1"
          value={symbol}
          placeholder="AAPL"
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
        />
        <button className="border px-3 py-2" onClick={add}>
          Añadir
        </button>
        <button className="border px-3 py-2" onClick={refreshQuotes} disabled={loading}>
          {loading ? "Actualizando..." : "Refrescar precios"}
        </button>
      </div>

      <ul className="space-y-2">
        {list.map((it) => {
          const q = quotes[it.symbol] ?? null;
          const pct = q?.changePercent;
          const pctColor =
            typeof pct === "number"
              ? pct >= 0
                ? "text-green-600"
                : "text-red-600"
              : "text-gray-500";

          return (
            <li key={it.id} className="border p-2 flex justify-between items-center">
              <div className="flex flex-col">
                <div className="flex items-center gap-3">
                  <Link href={`/stocks/${encodeURIComponent(it.symbol)}`} className="font-mono underline">
                    {it.symbol}
                  </Link>
                  <Link
                    href={`/snapshots/${encodeURIComponent(it.symbol)}`}
                    className="text-xs underline"
                    title="Ver snapshots"
                  >
                    Ver snapshots
                  </Link>
                </div>

                {q ? (
                  <span className="text-sm">
                    {Number.isFinite(q.price) ? `$ ${q.price.toFixed(2)}` : "—"}{" "}
                    {typeof pct === "number" && Number.isFinite(pct) ? (
                      <span className={pctColor}>({pct.toFixed(2)}%)</span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </span>
                ) : (
                  <span className="text-sm text-gray-500">—</span>
                )}
              </div>

              <div className="flex gap-3">
                <button className="text-blue-600" onClick={() => saveSnapshot(it.symbol)}>
                  Guardar snapshot
                </button>
                <button className="text-red-600" onClick={() => remove(it.symbol)}>
                  Eliminar
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-sm text-gray-500">
        Necesitas estar logueado para ver/editar tu watchlist y guardar snapshots.
      </p>
    </div>
  );
}

