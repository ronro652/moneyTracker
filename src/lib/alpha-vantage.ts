const API_KEY = process.env.FINNHUB_API_KEY || "";
const BASE_URL = "https://finnhub.io/api/v1";

export interface StockQuote {
  ticker: string;
  price: number;
  changePercent: number;
  name: string;
}

export async function fetchStockQuote(ticker: string): Promise<StockQuote | null> {
  const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(ticker)}&token=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data || data.c === 0 || data.c === undefined) {
    return null;
  }

  return {
    ticker,
    price: data.c,
    changePercent: data.dp ?? 0,
    name: ticker.toUpperCase(),
  };
}

export async function searchTicker(query: string): Promise<{ ticker: string; name: string }[]> {
  const url = `${BASE_URL}/search?q=${encodeURIComponent(query)}&token=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data?.result) return [];

  return data.result
    .filter((r: Record<string, string>) => r.type === "Common Stock" || r.type === "ETP")
    .slice(0, 5)
    .map((r: Record<string, string>) => ({
      ticker: r.symbol,
      name: r.description,
    }));
}

const CRYPTO_EXCHANGE_MAP: Record<string, string> = {
  BTC: "BINANCE:BTCUSDT",
  ETH: "BINANCE:ETHUSDT",
  BNB: "BINANCE:BNBUSDT",
  SOL: "BINANCE:SOLUSDT",
  XRP: "BINANCE:XRPUSDT",
  ADA: "BINANCE:ADAUSDT",
  DOGE: "BINANCE:DOGEUSDT",
  DOT: "BINANCE:DOTUSDT",
  MATIC: "BINANCE:MATICUSDT",
  LTC: "BINANCE:LTCUSDT",
  AVAX: "BINANCE:AVAXUSDT",
  LINK: "BINANCE:LINKUSDT",
  UNI: "BINANCE:UNIUSDT",
  SHIB: "BINANCE:SHIBUSDT",
  ATOM: "BINANCE:ATOMUSDT",
  XLM: "BINANCE:XLMUSDT",
  FIL: "BINANCE:FILUSDT",
  NEAR: "BINANCE:NEARUSDT",
  APT: "BINANCE:APTUSDT",
  ARB: "BINANCE:ARBUSDT",
  OP: "BINANCE:OPUSDT",
  SUI: "BINANCE:SUIUSDT",
  PEPE: "BINANCE:PEPEUSDT",
  AAVE: "BINANCE:AAVEUSDT",
  TRX: "BINANCE:TRXUSDT",
  ETC: "BINANCE:ETCUSDT",
  BCH: "BINANCE:BCHUSDT",
  ALGO: "BINANCE:ALGOUSDT",
  VET: "BINANCE:VETUSDT",
  FTM: "BINANCE:FTMUSDT",
};

export async function fetchCryptoQuote(symbol: string): Promise<StockQuote | null> {
  const finnhubSymbol = CRYPTO_EXCHANGE_MAP[symbol.toUpperCase()] || `BINANCE:${symbol.toUpperCase()}USDT`;
  const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(finnhubSymbol)}&token=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data || data.c === 0 || data.c === undefined) {
    return null;
  }

  return {
    ticker: symbol.toUpperCase(),
    price: data.c,
    changePercent: data.dp ?? 0,
    name: symbol.toUpperCase(),
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
  const url = `${BASE_URL}/forex/rates?base=${encodeURIComponent(from)}&token=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data?.quote || !data.quote[to]) return null;
  return data.quote[to];
}

export function searchCrypto(query: string): { ticker: string; name: string }[] {
  const q = query.toLowerCase();
  return CRYPTO_LIST.filter(
    (c) => c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
  ).slice(0, 5);
}
