import { logger } from "./logger";

const API_KEY = process.env.FINNHUB_API_KEY || "";
const BASE_URL = "https://finnhub.io/api/v1";

export interface StockQuote {
  ticker: string;
  price: number;
  changePercent: number;
  name: string;
}

export interface FinnhubDividend {
  symbol: string;
  date: string;
  amount: number;
  payDate: string;
  currency: string;
}

export async function fetchStockQuote(ticker: string): Promise<StockQuote | null> {
  try {
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
  } catch {
    return null;
  }
}

export async function searchTicker(query: string): Promise<{ ticker: string; name: string }[]> {
  try {
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
  } catch {
    return [];
  }
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
  try {
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
  } catch {
    return null;
  }
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
  try {
    const url = `${BASE_URL}/forex/rates?base=${encodeURIComponent(from)}&token=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data?.quote || !data.quote[to]) return null;
    return data.quote[to];
  } catch {
    return null;
  }
}

export interface DividendFetchResult {
  dividends: FinnhubDividend[];
  /**
   * True when Finnhub responded with an error / plan-restriction payload
   * (the free tier this project is documented to run on is not entitled to
   * call /stock/dividend) rather than a genuine "no dividends in range"
   * empty array. Callers should treat this as "auto-detection unavailable",
   * not as "no dividends for this ticker".
   */
  restricted: boolean;
}

export async function fetchDividends(
  ticker: string,
  from: string,
  to: string,
): Promise<DividendFetchResult> {
  try {
    const url = `${BASE_URL}/stock/dividend?symbol=${encodeURIComponent(ticker)}&from=${from}&to=${to}&token=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!Array.isArray(data)) {
      const looksLikeError = !res.ok || (data && typeof data === "object" && "error" in data);
      if (looksLikeError) {
        logger.warn(
          { ticker, status: res.status, body: data },
          "Finnhub /stock/dividend request failed or is plan-restricted; automatic dividend detection is unavailable",
        );
        return { dividends: [], restricted: true };
      }
      return { dividends: [], restricted: false };
    }

    return {
      dividends: data.map((d: Record<string, unknown>) => ({
        symbol: d.symbol as string,
        date: d.date as string,
        amount: d.amount as number,
        payDate: d.payDate as string,
        currency: d.currency as string,
      })),
      restricted: false,
    };
  } catch (e) {
    logger.error({ ticker, err: e }, "Failed to fetch dividends from Finnhub");
    return { dividends: [], restricted: false };
  }
}

export interface IntradayCandle {
  timestamp: number;
  close: number;
}

export interface ChartMeta {
  dayHigh: number | null;
  dayLow: number | null;
  fiftyTwoWeekHigh: number | null;
  fiftyTwoWeekLow: number | null;
  previousClose: number | null;
}

export interface IntradayChartData {
  candles: IntradayCandle[];
  meta: ChartMeta;
}

const YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart";

function toYahooSymbol(ticker: string, assetType: "stock" | "crypto"): string {
  if (assetType === "crypto") return `${ticker.toUpperCase()}-USD`;
  return ticker.toUpperCase();
}

export async function fetchIntradayCandles(
  ticker: string,
  assetType: "stock" | "crypto" = "stock",
): Promise<IntradayChartData> {
  const empty: IntradayChartData = {
    candles: [],
    meta: { dayHigh: null, dayLow: null, fiftyTwoWeekHigh: null, fiftyTwoWeekLow: null, previousClose: null },
  };
  try {
    const symbol = toYahooSymbol(ticker, assetType);
    const url = `${YAHOO_BASE}/${encodeURIComponent(symbol)}?interval=5m&range=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const data = await res.json();

    const result = data?.chart?.result?.[0];
    if (!result?.timestamp || !result?.indicators?.quote?.[0]?.close) return empty;

    const timestamps: number[] = result.timestamp;
    const closes: (number | null)[] = result.indicators.quote[0].close;

    const candles = timestamps
      .map((t, i) => ({ timestamp: t, close: closes[i] }))
      .filter((c): c is IntradayCandle => c.close !== null);

    const m = result.meta || {};
    const meta: ChartMeta = {
      dayHigh: m.regularMarketDayHigh ?? null,
      dayLow: m.regularMarketDayLow ?? null,
      fiftyTwoWeekHigh: m.fiftyTwoWeekHigh ?? null,
      fiftyTwoWeekLow: m.fiftyTwoWeekLow ?? null,
      previousClose: m.previousClose ?? null,
    };

    return { candles, meta };
  } catch {
    return empty;
  }
}

export function searchCrypto(query: string): { ticker: string; name: string }[] {
  const q = query.toLowerCase();
  return CRYPTO_LIST.filter(
    (c) => c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
  ).slice(0, 5);
}
