// src/lib/valuation.ts
import { alphaCashFlow, alphaIncome, alphaBalance, alphaOverview } from "@/lib/alpha";

type DcfOutput = {
  intrinsic: number;     // Valor intrínseco x acción
  upsidePct: number | null;
  wacc: number;
  growthCAGR: number;
  terminalG: number;
  lastFCF: number;
  debt: number;
  cash: number;
  shares: number;
  evEbitda?: number | null;
  pFcf?: number | null;
};

function n(x: any) { const v = Number(x); return Number.isFinite(v) ? v : NaN; }
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

function cagr(first: number, last: number, years: number) {
  if (!Number.isFinite(first) || !Number.isFinite(last) || years <= 0 || first <= 0) return NaN;
  return Math.pow(last / first, 1 / years) - 1;
}

export async function discountedCashFlow(symbol: string, currentPrice?: number): Promise<DcfOutput> {
  const [cash, income, balance, overview] = await Promise.all([
    alphaCashFlow(symbol),
    alphaIncome(symbol),
    alphaBalance(symbol),
    alphaOverview(symbol),
  ]);

  // 1) FCF histórico (últimos 5 años) = OCF - |CapEx|
  const fcfArr = (cash?.annualReports ?? [])
    .slice(0, 5)
    .map((y) => n(y.operatingCashflow) - Math.abs(n(y.capitalExpenditures)))
    .filter(Number.isFinite)
    .reverse();

  const lastFCF = fcfArr.at(-1) ?? NaN;

  // 2) CAGR de FCF (histórico 3–5 años)
  let growth = NaN;
  if (fcfArr.length >= 3) {
    growth = cagr(fcfArr[0], fcfArr.at(-1)!, fcfArr.length - 1);
  }
  // límites sanos: -10% a +20%
  growth = clamp(Number.isFinite(growth) ? growth : 0.03, -0.10, 0.20);

  // 3) Datos de balance (deuda/caja)
  const lastBal = (balance?.annualReports ?? [])[0] || {};
  const shortDebt = Math.max(0, n(lastBal.shortTermDebt) || n(lastBal.shortLongTermDebtTotal) || 0);
  const longDebt  = Math.max(0, n(lastBal.longTermDebt) || 0);
  const totalDebt = shortDebt + longDebt;
  const cashEq    = Math.max(0, n(lastBal.cashAndCashEquivalentsAtCarryingValue) || n(lastBal.cashAndShortTermInvestments) || 0);

  // 4) Income (intereses, EBITDA, impuestos)
  const lastInc = (income?.annualReports ?? [])[0] || {};
  const interestExpense = Math.abs(n(lastInc.interestExpense)) || 0;
  const ebitda = n(lastInc.ebitda) || NaN;
  const incomeBeforeTax = n(lastInc.incomeBeforeTax);
  const incomeTaxExpense = Math.abs(n(lastInc.incomeTaxExpense));
  let taxRate = Number.isFinite(incomeBeforeTax) && incomeBeforeTax > 0
    ? clamp(incomeTaxExpense / incomeBeforeTax, 0, 0.35)
    : 0.21;

  // 5) Overview (beta, shares, marketcap)
  const shares = n(overview?.SharesOutstanding);
  const marketCap = n(overview?.MarketCapitalization);
  const beta = Number.isFinite(n(overview?.Beta)) ? Math.max(0.5, Math.min(2.0, n(overview?.Beta))) : 1.0;

  // 6) Cost of Equity (CAPM) y Cost of Debt
  const rf = 0.04; // 10Y aprox (ajústalo por config si quieres)
  const rp = 0.05; // premio por riesgo
  const ke = rf + beta * rp;

  const kd = totalDebt > 0 ? clamp(interestExpense / totalDebt, 0.01, 0.12) : 0.0;

  // 7) WACC
  const E = Number.isFinite(marketCap) ? marketCap : 0;
  const D = totalDebt;
  const V = E + D || 1; // evitar /0
  const wacc = (E / V) * ke + (D / V) * kd * (1 - taxRate);

  // 8) Proyección de FCF 5 años
  const years = 5;
  const proj: number[] = [];
  for (let t = 1; t <= years; t++) proj.push((lastFCF || 0) * Math.pow(1 + growth, t));

  // 9) Valor presente de FCFs
  const pvFCFs = proj.map((f, i) => f / Math.pow(1 + wacc, i + 1));
  const pvSum = pvFCFs.reduce((a, b) => a + b, 0);

  // 10) Valor terminal (perpetuidad) con g_terminal = min(g, 3%)
  const gT = clamp(growth, -0.02, 0.03);
  const f5 = proj.at(-1) || 0;
  const tv = wacc > gT ? (f5 * (1 + gT)) / (wacc - gT) : 0;
  const pvTV = tv / Math.pow(1 + wacc, years);

  // 11) Enterprise Value & Equity Value
  const EV = pvSum + pvTV;
  const equity = EV - D + cashEq;
  const intrinsic = shares > 0 ? equity / shares : NaN;

  // 12) Métricas extra
  const evEbitda = Number.isFinite(ebitda) && ebitda > 0 ? ( (E + D - cashEq) / ebitda ) : null;
  const pFcf = Number.isFinite(lastFCF) && lastFCF > 0 ? E / lastFCF : null;

  const upsidePct =
    Number.isFinite(intrinsic) && Number.isFinite(currentPrice!)
      ? ((intrinsic - (currentPrice as number)) / (currentPrice as number)) * 100
      : null;

  return {
    intrinsic,
    upsidePct,
    wacc,
    growthCAGR: growth,
    terminalG: gT,
    lastFCF: lastFCF || NaN,
    debt: D,
    cash: cashEq,
    shares: shares || NaN,
    evEbitda,
    pFcf
  };
}

