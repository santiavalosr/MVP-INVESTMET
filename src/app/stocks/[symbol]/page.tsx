// src/app/stocks/[symbol]/page.tsx
export const revalidate = 0;

async function getDaily(sym: string) {
  const r = await fetch(
    `${process.env.APP_URL || "http://localhost:3000"}/api/market/daily?symbol=${encodeURIComponent(sym)}`,
    { cache: "no-store" }
  );
  if (!r.ok) throw new Error(await r.text());
  return r.json() as Promise<Array<{ date: string; close: number }>>;
}

export default async function StockPage({ params }: { params: { symbol: string } }) {
  const symbol = decodeURIComponent(params.symbol).toUpperCase();
  const rows = await getDaily(symbol);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold">{symbol}</h1>
      <h2 className="mt-4 mb-2 font-semibold">Últimos días</h2>
      <ul className="space-y-1">
        {rows.map(r => (
          <li key={r.date} className="border-b py-1">
            {r.date}: close ${r.close.toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}

