// src/app/summary/[symbol]/page.tsx
import Link from "next/link";

export const revalidate = 0;

async function getSummary(symbol: string) {
  const base = process.env.APP_URL || "http://localhost:3000";
  const r = await fetch(`${base}/api/summary/${encodeURIComponent(symbol)}`, {
    cache: "no-store",
  });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default async function SummaryPage({ params }: { params: { symbol: string } }) {
  const sym = decodeURIComponent(params.symbol).toUpperCase();
  const data = await getSummary(sym);

  const price = data?.price;
  const prev = data?.prevClose;
  const iv = data?.valuation?.intrinsicValue;
  const pct = data?.valuation?.undervaluedPct;

  const updown =
    Number.isFinite(pct) ? (pct >= 0 ? `+${pct.toFixed(1)}%` : `${pct.toFixed(1)}%`) : "—";
  const updownColor =
    Number.isFinite(pct) ? (pct >= 0 ? "text-green-500" : "text-red-500") : "text-gray-400";

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-3xl font-bold">{sym} — One-Pager</h1>
        <Link href="/watchlist" className="underline text-sm">
          Volver a Watchlist
        </Link>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="border rounded p-4">
          <h2 className="font-semibold">Precio</h2>
          <p className="text-2xl">{Number.isFinite(price) ? `$ ${price.toFixed(2)}` : "—"}</p>
          <p className="text-sm text-gray-400">
            Último: {data?.latestDay ?? "—"} • Prev:{" "}
            {Number.isFinite(prev) ? `$ ${prev.toFixed(2)}` : "—"}
          </p>
        </div>

        <div className="border rounded p-4">
          <h2 className="font-semibold">Valor intrínseco</h2>
          <p className="text-2xl">{Number.isFinite(iv) ? `$ ${iv.toFixed(2)}` : "—"}</p>
          <p className={`text-sm ${updownColor}`}>Upside/Downside: {updown}</p>
          <p className="text-xs text-gray-400 mt-2">
            Método: {data?.valuation?.method}
            <br />
            Mediana P/E: {data?.valuation?.medPE ?? "—"} • Mediana P/FCF:{" "}
            {data?.valuation?.medPFCF ?? "—"}
            <br />
            EPS norm: {Number.isFinite(data?.valuation?.normEPS) ? data.valuation.normEPS.toFixed(2) : "—"}{" "}
            • FCF/acc norm:{" "}
            {Number.isFinite(data?.valuation?.normFCFPS)
              ? data.valuation.normFCFPS.toFixed(2)
              : "—"}
          </p>
        </div>

        <div className="border rounded p-4">
          <h2 className="font-semibold">Datos clave</h2>
          <ul className="text-sm">
            <li>
              <strong>Nombre:</strong> {data?.overview?.Name ?? "—"}
            </li>
            <li>
              <strong>Sector:</strong> {data?.overview?.Sector ?? "—"}
            </li>
            <li>
              <strong>PE:</strong> {data?.overview?.PERatio ?? "—"}
            </li>
            <li>
              <strong>EPS:</strong> {data?.overview?.EPS ?? "—"}
            </li>
            <li>
              <strong>Div/Share:</strong> {data?.overview?.DividendPerShare ?? "—"}
            </li>
            <li>
              <strong>Shares:</strong> {data?.overview?.SharesOutstanding ?? "—"}
            </li>
          </ul>
        </div>
      </div>

      <div className="border rounded p-4">
        <h2 className="font-semibold">Resumen de sentimiento</h2>
        <p className="text-sm">
          {data?.sentiment?.n
            ? `Sentimiento ${data.sentiment.label} (score ${data.sentiment.score.toFixed(2)} • ${data.sentiment.n} notas)`
            : "Sin noticias disponibles."}
        </p>
      </div>

      <div className="border rounded p-4">
        <h2 className="font-semibold">Noticias recientes</h2>
        {Array.isArray(data?.news) && data.news.length ? (
          <ul className="list-disc ml-5 space-y-2">
            {data.news.slice(0, 8).map((n: any, i: number) => (
              <li key={i}>
                <a href={n.url} target="_blank" className="underline">
                  {n.title}
                </a>{" "}
                <span className="text-xs text-gray-500">({n.source})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">Sin noticias disponibles.</p>
        )}
        <p className="text-xs text-gray-500 mt-3">
          Nota: valoración por múltiplos propios (P/E y P/FCF) usando históricos Alpha Vantage. No
          es recomendación de inversión.
        </p>
      </div>
    </div>
  );
}

