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

export async function fetchCryptoQuote(symbol: string): Promise<StockQuote | null> {
  const url = `${BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${encodeURIComponent(symbol)}&to_currency=USD&apikey=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  const rate = data["Realtime Currency Exchange Rate"];
  if (!rate || !rate["5. Exchange Rate"]) {
    return null;
  }

  return {
    ticker: rate["1. From_Currency Code"],
    price: parseFloat(rate["5. Exchange Rate"]),
    changePercent: 0,
    name: rate["2. From_Currency Name"],
  };
}

const CRYPTO_LIST: { ticker: string; name: string }[] = [
  { ticker: "BTC", name: "Bitcoin" },
  { ticker: "ETH", name: "Ethereum" },
  { ticker: "BNB", name: "Binance Coin" },
  { ticker: "SOL", name: "Solana" },
  { ticker: "XRP", name: "Ripple" },
  { ticker: "ADA", name: "Cardano" },
  { ticker: "DOGE", name: "Dogecoin" },
  { ticker: "DOT", name: "Polkadot" },
  { ticker: "MATIC", name: "Polygon" },
  { ticker: "LTC", name: "Litecoin" },
  { ticker: "AVAX", name: "Avalanche" },
  { ticker: "LINK", name: "Chainlink" },
  { ticker: "UNI", name: "Uniswap" },
  { ticker: "SHIB", name: "Shiba Inu" },
  { ticker: "ATOM", name: "Cosmos" },
  { ticker: "XLM", name: "Stellar" },
  { ticker: "FIL", name: "Filecoin" },
  { ticker: "NEAR", name: "NEAR Protocol" },
  { ticker: "APT", name: "Aptos" },
  { ticker: "ARB", name: "Arbitrum" },
  { ticker: "OP", name: "Optimism" },
  { ticker: "SUI", name: "Sui" },
  { ticker: "PEPE", name: "Pepe" },
  { ticker: "AAVE", name: "Aave" },
  { ticker: "TRX", name: "TRON" },
  { ticker: "ETC", name: "Ethereum Classic" },
  { ticker: "BCH", name: "Bitcoin Cash" },
  { ticker: "ALGO", name: "Algorand" },
  { ticker: "VET", name: "VeChain" },
  { ticker: "FTM", name: "Fantom" },
];

export async function fetchExchangeRate(from: string, to: string): Promise<number | null> {
  const url = `${BASE_URL}?function=CURRENCY_EXCHANGE_RATE&from_currency=${encodeURIComponent(from)}&to_currency=${encodeURIComponent(to)}&apikey=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  const rate = data["Realtime Currency Exchange Rate"];
  if (!rate || !rate["5. Exchange Rate"]) return null;
  return parseFloat(rate["5. Exchange Rate"]);
}

export function searchCrypto(query: string): { ticker: string; name: string }[] {
  const q = query.toLowerCase();
  return CRYPTO_LIST.filter(
    (c) => c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
  ).slice(0, 5);
}
