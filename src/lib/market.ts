// src/lib/market.ts
import {
  alphaQuote,
  alphaOverview,
  alphaCashFlow,
  alphaIncome,
  alphaBalance,
  alphaMonthlyAdjusted,
  alphaNews,
} from "@/lib/alpha";

export const market = {
  quote: alphaQuote,
  overview: alphaOverview,
  cashflow: alphaCashFlow,
  income: alphaIncome,
  balance: alphaBalance,
  monthly: alphaMonthlyAdjusted,
  news: alphaNews,
};

