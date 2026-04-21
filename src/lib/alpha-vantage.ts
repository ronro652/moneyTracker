const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || "demo";
const BASE_URL = "https://www.alphavantage.co/query";

export interface StockQuote {
  ticker: string;
  price: number;
  changePercent: number;
  name: string;
}

export async function fetchStockQuote(ticker: string): Promise<StockQuote | null> {
  const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${encodeURIComponent(ticker)}&apikey=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  const quote = data["Global Quote"];
  if (!quote || !quote["05. price"]) {
    return null;
  }

  return {
    ticker: quote["01. symbol"],
    price: parseFloat(quote["05. price"]),
    changePercent: parseFloat(quote["10. change percent"]?.replace("%", "") || "0"),
    name: ticker.toUpperCase(),
  };
}

export async function searchTicker(query: string): Promise<{ ticker: string; name: string }[]> {
  const url = `${BASE_URL}?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(query)}&apikey=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  const matches = data["bestMatches"];
  if (!matches) return [];

  return matches.slice(0, 5).map((m: Record<string, string>) => ({
    ticker: m["1. symbol"],
    name: m["2. name"],
  }));
}
