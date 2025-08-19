// src/lib/onepager.ts
import { market } from "@/lib/market";

type Year = string; // "2024", etc.

type OnePager = {
  asOf: string;
  symbol: string;
  price: number | null;
  prevClose: number | null;
  latestDay: string | null;
  overview: {
    Name: string | null;
    Sector: string | null;
    PERatio: number | null;
    EPS: number | null;
    DividendPerShare: number | null;
    SharesOutstanding: number | null;
  };
  valuation: {
    method: string;
    intrinsicValue: number | null;
    fairPE: number | null;
    fairPFCF: number | null;
    medPE: number | null;
    medPFCF: number | null;
    normEPS: number | null;
    normFCFPS: number | null;
    undervaluedPct: number;
  };
  news: Array<{
    title: string;
    url: string;
    source: string;
    publishedAt: string | null;
    summary: string;
  }>;
  sentiment: { label: "positivo" | "negativo" | "mixto" | "sin datos"; score: number; n: number };
};

// ---------- helpers ----------
function toNum(x: any): number {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
}
function median(nums: number[]): number {
  const arr = nums.filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!arr.length) return 0;
  const mid = Math.floor(arr.length / 2);
  return arr.length % 2 ? arr[mid] : (arr[mid - 1] + arr[mid]) / 2;
}
function sortYearsAsc(ys: Year[]): Year[] {
  return ys.sort((a, b) => Number(a) - Number(b));
}
function lastN<T>(arr: T[], n: number): T[] {
  return arr.slice(Math.max(0, arr.length - n));
}

// promedio de "5. adjusted close" por año usando MONTHLY_ADJUSTED
function byYearFromMonthly(ma: Record<string, any>): Record<Year, number> {
  const src = ma?.["Monthly Adjusted Time Series"] ?? {};
  const bucket: Record<Year, number[]> = {};
  for (const [date, row] of Object.entries<any>(src)) {
    const y = String(date).slice(0, 4);
    const px = toNum(row["5. adjusted close"]);
    if (!bucket[y]) bucket[y] = [];
    if (px) bucket[y].push(px);
  }
  const out: Record<Year, number> = {};
  for (const y of Object.keys(bucket)) {
    const vals = bucket[y];
    out[y] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }
  return out;
}

function epsPerShareByYear(income: any): Record<Year, number> {
  const rep = income?.annualReports ?? [];
  const out: Record<Year, number> = {};
  for (const r of rep) {
    const y = String(r.fiscalDateEnding || "").slice(0, 4);
    const ni = toNum(r.netIncome);
    const sh =
      toNum(r.weightedAverageShsOutDil) ||
      toNum(r.weightedAverageShsOut) ||
      toNum(r.commonStockSharesOutstanding);
    if (y && ni && sh) out[y] = ni / sh;
  }
  return out;
}

// FCF por acción por año: OCF - CapEx, dividido entre acciones (fallback desde overview/income)
function fcfPerShareByYear(cash: any, sharesFallback?: number): Record<Year, number> {
  const rep = cash?.annualReports ?? [];
  const out: Record<Year, number> = {};
  const sh = sharesFallback && sharesFallback > 0 ? sharesFallback : NaN;

  for (const r of rep) {
    const y = String(r.fiscalDateEnding || "").slice(0, 4);
    const ocf = toNum(r.operatingCashflow);
    const capex = Math.abs(toNum(r.capitalExpenditures));
    const fcf = ocf - capex;
    if (y && Number.isFinite(fcf) && Number.isFinite(sh) && sh > 0) {
      out[y] = fcf / sh;
    }
  }
  return out;
}

function intersectYears(a: Record<Year, number>, b: Record<Year, number>): Year[] {
  const setA = new Set(Object.keys(a));
  return Object.keys(b).filter((y) => setA.has(y));
}

function sentimentFromNews(feed: any[], ticker: string) {
  const scores: number[] = [];
  for (const f of feed ?? []) {
    for (const t of f.ticker_sentiment ?? []) {
      if ((t.ticker || "").toUpperCase() === ticker.toUpperCase()) {
        const s = Number(t.ticker_sentiment_score);
        if (Number.isFinite(s)) scores.push(s);
      }
    }
  }
  if (!scores.length) return { label: "sin datos" as const, score: 0, n: 0 };
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const label = avg > 0.05 ? ("positivo" as const) : avg < -0.05 ? ("negativo" as const) : ("mixto" as const);
  return { label, score: avg, n: scores.length };
}

// ---------- main ----------
export async function getOnePager(symbol: string): Promise<OnePager> {
  const [quote, overview, cashflow, income, _balance, monthly, news] = await Promise.all([
    market.quote(symbol),
    market.overview(symbol),
    market.cashflow(symbol),
    market.income(symbol),
    market.balance(symbol), // reservado por si decides añadir ratios
    market.monthly(symbol),
    market.news(symbol, 10),
  ]);

  // Precio y prev close
  const q = quote?.["Global Quote"] ?? {};
  const price = toNum(q["05. price"]) || null;
  const prevClose = toNum(q["08. previous close"]) || null;
  const latestDay = (q["07. latest trading day"] as string) || null;

  // Datos clave
  const name = (overview?.Name as string) ?? null;
  const sector = (overview?.Sector as string) ?? null;
  const pe = toNum(overview?.PERatio) || null;
  const eps = toNum(overview?.EPS) || null;
  const dividend = toNum(overview?.DividendPerShare) || null;
  const shares =
    toNum(overview?.SharesOutstanding) ||
    toNum(income?.annualReports?.[0]?.weightedAverageShsOutDil) ||
    toNum(income?.annualReports?.[0]?.weightedAverageShsOut) ||
    0;

  // Series por año
  const priceAvgYear = byYearFromMonthly(monthly);
  const epsYear = epsPerShareByYear(income);
  const fcfYear = fcfPerShareByYear(cashflow, shares);

  // Años en común (ordenados y últimos 5)
  const yearsPE = lastN(sortYearsAsc(intersectYears(priceAvgYear, epsYear)), 5);
  const yearsPFCF = lastN(sortYearsAsc(intersectYears(priceAvgYear, fcfYear)), 5);

  // Series de múltiplos
  const peSeries: number[] = yearsPE.map((y) => {
    const e = epsYear[y];
    const p = priceAvgYear[y];
    return e > 0 ? p / e : NaN;
  });
  const pfcfSeries: number[] = yearsPFCF.map((y) => {
    const f = fcfYear[y];
    const p = priceAvgYear[y];
    return f > 0 ? p / f : NaN;
  });

  const medPE = median(peSeries) || 0;
  const medPFCF = median(pfcfSeries) || 0;

  // Métricas normalizadas (medianas 3-5 años)
  const normEPS = median(yearsPE.map((y) => epsYear[y]).filter((x) => x > 0)) || 0;
  const normFCFPS = median(yearsPFCF.map((y) => fcfYear[y]).filter((x) => x > 0)) || 0;

  // Fair values por métodos
  const fairPE = medPE && normEPS ? medPE * normEPS : 0;
  const fairPFCF = medPFCF && normFCFPS ? medPFCF * normFCFPS : 0;

  // Blend
  let intrinsic = 0;
  if (fairPE && fairPFCF) intrinsic = 0.5 * fairPE + 0.5 * fairPFCF;
  else intrinsic = fairPE || fairPFCF || 0;

  // % sub/sobre valoración
  const px = typeof price === "number" ? price : 0;
  const undervaluedPct = px > 0 && intrinsic > 0 ? ((intrinsic - px) / px) * 100 : 0;

  // Sentimiento y noticias
  const feed = Array.isArray(news?.feed) ? news.feed : [];
  const senti = sentimentFromNews(feed, symbol);

  return {
    asOf: new Date().toISOString(),
    symbol,
    price,
    prevClose,
    latestDay,
    overview: {
      Name: name,
      Sector: sector,
      PERatio: pe,
      EPS: eps,
      DividendPerShare: dividend,
      SharesOutstanding: shares || null,
    },
    valuation: {
      method: "Múltiplos propios (P/E & P/FCF, mediana 3–5 años)",
      intrinsicValue: intrinsic || null,
      fairPE: fairPE || null,
      fairPFCF: fairPFCF || null,
      medPE: medPE || null,
      medPFCF: medPFCF || null,
      normEPS: normEPS || null,
      normFCFPS: normFCFPS || null,
      undervaluedPct,
    },
    news: feed.map((n: any) => ({
      title: n.title,
      url: n.url,
      source: n.source,
      publishedAt: n.time_published || null,
      summary: n.summary ?? "",
    })),
    sentiment: senti,
  };
}

