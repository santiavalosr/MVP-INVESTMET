// src/app/stocks/[symbol]/page.tsx
import { avQuote, avDaily } from "@/lib/alpha";

type Props = { params: { symbol: string } };

export default async function StockPage({ params }: Props) {
  const symbol = decodeURIComponent(params.symbol);

  // Llamamos directo al SDK (no a /api)
  let quote: Awaited<ReturnType<typeof avQuote>> | null = null;
  let daily: Record<string, any> | null = null;
  let err: string | null = null;

  try {
    [quote, daily] = await Promise.all([avQuote(symbol), avDaily(symbol)]);
  } catch (e: any) {
    err = e?.message ?? "Error al consultar datos";
  }

  const days = daily
    ? Object.entries(daily).slice(0, 30) // últimos 30
    : [];

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold"> {symbol} </h1>

      {err ? (
        <p className="text-red-600 text-sm">{err}</p>
      ) : (
        <>
          <div className="text-lg">
            Precio:{" "}
            {quote && isFinite(quote.price) ? `$ ${quote.price.toFixed(2)}` : "N/D"}{" "}
            {quote && isFinite(quote.changePercent) && (
              <span className={quote.changePercent >= 0 ? "text-green-600" : "text-red-600"}>
                ({quote.changePercent.toFixed(2)}%)
              </span>
            )}
          </div>

          <div>
            <h2 className="font-semibold">Últimos días</h2>
            <ul className="text-sm space-y-1">
              {days.map(([d, row]) => (
                <li key={d} className="border-b py-1">
                  {d}: close ${Number(row["4. close"]).toFixed(2)}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

