// src/lib/alpha.ts
const BASE = "https://www.alphavantage.co/query";
const KEY = process.env.ALPHA_VANTAGE_API_KEY!;

async function get(path: URLSearchParams) {
  if (!KEY) throw new Error("Falta ALPHA_VANTAGE_API_KEY");
  path.set("apikey", KEY);
  const url = `${BASE}?${path.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Alpha error ${res.status}`);
  const json = await res.json();
  // Mensajes típicos de rate limit / premium
  if (json["Note"] || json["Information"] || typeof json === "string") {
    throw new Error(json["Note"] || json["Information"] || String(json));
  }
  return json;
}

// Último precio (GLOBAL_QUOTE)
export async function avQuote(symbol: string) {
  const q = new URLSearchParams({ function: "GLOBAL_QUOTE", symbol });
  const j = await get(q);
  const row = j["Global Quote"] || {};
  // Campos útiles normalizados
  return {
    symbol: row["01. symbol"] ?? symbol,
    price: parseFloat(row["05. price"]) || NaN,
    change: parseFloat(row["09. change"]) || NaN,
    changePercent: parseFloat((row["10. change percent"] || "").replace("%","")) || NaN,
    ts: new Date(),
    raw: row,
  };
}

// Serie diaria (gratuita)
export async function avDaily(symbol: string) {
  const q = new URLSearchParams({
    function: "TIME_SERIES_DAILY", // <- antes estaba TIME_SERIES_DAILY_ADJUSTED
    symbol,
    outputsize: "compact",
    datatype: "json",
  });
  const j = await get(q);
  return j["Time Series (Daily)"] as Record<string, any>;
}
