// src/lib/alpha.ts
const BASE = "https://www.alphavantage.co/query";
const KEY = process.env.ALPHA_VANTAGE_API_KEY!;
type Json = Record<string, any>;

// caché simple en memoria (dev) para amortiguar cuota
const globalAny = global as unknown as { __av_cache?: Map<string, { t: number; v: any }> };
const cache = (globalAny.__av_cache ??= new Map());
const TTL_MS = 1000 * 60 * 5;

function getCache(k: string) {
  const e = cache.get(k);
  if (!e) return null;
  if (Date.now() - e.t > TTL_MS) {
    cache.delete(k);
    return null;
  }
  return e.v;
}
function setCache(k: string, v: any) {
  cache.set(k, { t: Date.now(), v });
}

async function get(params: URLSearchParams): Promise<Json> {
  if (!KEY) throw new Error("Falta ALPHA_VANTAGE_API_KEY");
  params.set("apikey", KEY);
  const url = `${BASE}?${params.toString()}`;

  const c = getCache(url);
  if (c) return c;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`AlphaVantage ${res.status}`);
  const json = await res.json();

  if (json?.Note || json?.Information) throw new Error(json.Note || json.Information);
  setCache(url, json);
  return json;
}

// -------- Endpoints --------
export async function alphaQuote(symbol: string) {
  const q = new URLSearchParams({ function: "GLOBAL_QUOTE", symbol });
  return get(q); // j["Global Quote"]["05. price"], "08. previous close", "07. latest trading day"
}

export async function alphaOverview(symbol: string) {
  const q = new URLSearchParams({ function: "OVERVIEW", symbol });
  return get(q); // PERatio, EPS, DividendPerShare, SharesOutstanding, Sector, Beta, Name...
}

export async function alphaCashFlow(symbol: string) {
  const q = new URLSearchParams({ function: "CASH_FLOW", symbol });
  return get(q); // annualReports[].operatingCashflow, capitalExpenditures, commonStockRepurchased...
}

export async function alphaIncome(symbol: string) {
  const q = new URLSearchParams({ function: "INCOME_STATEMENT", symbol });
  return get(q); // annualReports[].netIncome, weightedAverageShsOut, weightedAverageShsOutDil
}

export async function alphaBalance(symbol: string) {
  const q = new URLSearchParams({ function: "BALANCE_SHEET", symbol });
  return get(q); // annualReports[].totalDebt, totalShareholderEquity...
}

export async function alphaMonthlyAdjusted(symbol: string) {
  const q = new URLSearchParams({ function: "TIME_SERIES_MONTHLY_ADJUSTED", symbol });
  return get(q); // "Monthly Adjusted Time Series": { "YYYY-MM-DD": { "5. adjusted close": "..." } }
}

export async function alphaNews(tickers: string, limit = 10) {
  const q = new URLSearchParams({
    function: "NEWS_SENTIMENT",
    tickers,
    limit: String(Math.min(limit, 50)),
    sort: "LATEST",
  });
  return get(q); // feed[]
}

