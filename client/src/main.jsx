
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDown,
  ArrowUp,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Headphones,
  History,
  LogOut,
  Minus,
  MoreHorizontal,
  Plus,
  RefreshCw,
  TrendingUp,
  UserRound,
  Wallet,
  X
} from "lucide-react";
import "./style.css";

/* =========================================================
   CONFIG
========================================================= */

const API = import.meta.env.VITE_API_URL || "/api";
const TOKEN_KEY = "qx_token";
const PAIRS = ["EUR/USD", "GBP/USD", "BTC/USD"];

const COLOR = {
  bg: "#1c1e2b",
  panel: "#292d3d",
  panel2: "#303447",
  border: "#393e52",
  text: "#f5f6fb",
  muted: "#969bad",
  green: "#12b96d",
  red: "#e64d3c",
  blue: "#348fe9"
};

const fmtMoney = value =>
  Number(value || 0).toFixed(2);

const priceDigits = symbol =>
  symbol === "BTC/USD" ? 2 : 5;

const fmtPrice = (value, symbol) =>
  value == null || !Number.isFinite(Number(value))
    ? "—"
    : Number(value).toFixed(priceDigits(symbol));

const token = () =>
  sessionStorage.getItem(TOKEN_KEY) || "";

async function request(path, method = "GET", body) {
  const response = await fetch(`${API}${path}`, {
    method,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token()
        ? { Authorization: `Bearer ${token()}` }
        : {})
    },
    ...(body === undefined
      ? {}
      : { body: JSON.stringify(body) })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.error ||
      data.message ||
      `Request failed (${response.status})`
    );
  }

  return data;
}

function IconButton({
  children,
  title,
  onClick,
  disabled = false,
  style = {}
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      style={{
        display: "grid",
        placeItems: "center",
        padding: 0,
        width: 29,
        height: 29,
        borderRadius: 5,
        background: COLOR.panel2,
        color: COLOR.text,
        flexShrink: 0,
        ...style
      }}
    >
      {children}
    </button>
  );
}

/* =========================================================
   AUTHENTICATION
========================================================= */

function Auth({ onSuccess }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    country: "India"
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const payload =
        mode === "register"
          ? form
          : {
              email: form.email,
              password: form.password
            };

      const result = await request(
        `/auth/${mode}`,
        "POST",
        payload
      );

      if (!result.token) {
        throw new Error("Authentication token missing");
      }

      sessionStorage.setItem(TOKEN_KEY, result.token);
      onSuccess(result.user || {});
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <div className="authcard">
        <div className="logo">
          <span style={{ color: COLOR.green }}>◆</span>
          {" "}Quotexx
        </div>

        <p className="hint">Trading account</p>

        <h2>
          {mode === "login"
            ? "Welcome back"
            : "Create your account"}
        </h2>

        <form onSubmit={submit}>
          {mode === "register" && (
            <>
              <label>
                Full name
                <input
                  required
                  value={form.name}
                  onChange={e =>
                    setForm(p => ({
                      ...p,
                      name: e.target.value
                    }))
                  }
                />
              </label>

              <label>
                Country
                <input
                  required
                  value={form.country}
                  onChange={e =>
                    setForm(p => ({
                      ...p,
                      country: e.target.value
                    }))
                  }
                />
              </label>
            </>
          )}

          <label>
            Email
            <input
              required
              type="email"
              value={form.email}
              onChange={e =>
                setForm(p => ({
                  ...p,
                  email: e.target.value
                }))
              }
            />
          </label>

          <label>
            Password
            <input
              required
              type="password"
              value={form.password}
              onChange={e =>
                setForm(p => ({
                  ...p,
                  password: e.target.value
                }))
              }
            />
          </label>

          <button type="submit" disabled={busy}>
            {busy
              ? "Please wait..."
              : mode === "login"
                ? "Login"
                : "Register"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        <button
          type="button"
          className="link"
          onClick={() => {
            setError("");
            setMode(
              mode === "login" ? "register" : "login"
            );
          }}
        >
          {mode === "login"
            ? "Create an account"
            : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   LIVE CANDLE CHART
   - Canvas based
   - Horizontal drag
   - Zoom
   - Responsive height
   - Price axis
   - Time axis
========================================================= */

function CandleChart({
  symbol,
  candles,
  currentPrice,
  openTrades,
  connected
}) {
  const holderRef = useRef(null);
  const canvasRef = useRef(null);
  const pointerRef = useRef(null);
  const chartRef = useRef({});

  const [dimensions, setDimensions] = useState({
    width: 700,
    height: 350
  });

  const [gap, setGap] = useState(13);
  const [offset, setOffset] = useState(0);
  const [showMenu, setShowMenu] = useState(false);

  const validCandles = useMemo(() => {
    if (!Array.isArray(candles)) return [];

    const map = new Map();

    for (const c of candles) {
      if (
        !c ||
        !Number.isFinite(Number(c.time)) ||
        ["open", "high", "low", "close"].some(
          key =>
            c[key] == null ||
            !Number.isFinite(Number(c[key]))
        )
      ) {
        continue;
      }

      map.set(Number(c.time), {
        time: Number(c.time),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close)
      });
    }

    return [...map.values()].sort(
      (a, b) => a.time - b.time
    );
  }, [candles]);

  useEffect(() => {
    const el = holderRef.current;
    if (!el) return;

    const measure = () => {
      setDimensions({
        width: Math.max(280, el.clientWidth),
        height: Math.max(150, el.clientHeight)
      });
    };

    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setOffset(0);
  }, [symbol]);

  const visibleCount = Math.max(
    8,
    Math.floor((dimensions.width - 110) / gap)
  );

  const maxOffset = Math.max(
    0,
    validCandles.length - visibleCount
  );

  const safeOffset = Math.min(offset, maxOffset);

  chartRef.current = {
    candles: validCandles,
    currentPrice,
    openTrades,
    symbol,
    offset: safeOffset,
    gap
  };

  const zoom = change =>
    setGap(value =>
      Math.max(6, Math.min(30, value + change))
    );

  const scroll = change =>
    setOffset(value =>
      Math.max(
        0,
        Math.min(maxOffset, value + change)
      )
    );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = dimensions.width;
    const height = dimensions.height;
    const ratio = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

    let frame;
    let running = true;

    const draw = () => {
      if (!running) return;

      const {
        candles: all = [],
        currentPrice: live,
        openTrades: trades = [],
        symbol: pair,
        offset: scrollOffset = 0,
        gap: spacing = 13
      } = chartRef.current;

      const left = 6;
      const right = width < 500 ? 72 : 85;
      const top = 12;
      const bottom = 27;
      const plotRight = width - right;
      const plotBottom = height - bottom;
      const plotHeight = plotBottom - top;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = COLOR.bg;
      ctx.fillRect(0, 0, width, height);

      if (!all.length) {
        ctx.fillStyle = COLOR.muted;
        ctx.textAlign = "center";
        ctx.font = "12px Arial";
        ctx.fillText(
          "Waiting for candle data",
          width / 2,
          height / 2
        );

        frame = requestAnimationFrame(draw);
        return;
      }

      const count = Math.max(
        8,
        Math.floor((plotRight - 40) / spacing)
      );

      const boundedOffset = Math.min(
        scrollOffset,
        Math.max(0, all.length - count)
      );

      const end = all.length - boundedOffset;
      const rows = all.slice(
        Math.max(0, end - count),
        end
      );

      if (!rows.length) {
        frame = requestAnimationFrame(draw);
        return;
      }

      const latest = rows.at(-1);

      const livePrice =
        boundedOffset === 0 &&
        live != null &&
        Number.isFinite(Number(live))
          ? Number(live)
          : latest.close;

      const values = rows.flatMap(c => [
        c.low,
        c.high
      ]);

      values.push(livePrice);

      for (const t of trades) {
        if (
          t.entryPrice != null &&
          Number.isFinite(Number(t.entryPrice))
        ) {
          values.push(Number(t.entryPrice));
        }
      }

      const min = Math.min(...values);
      const max = Math.max(...values);

      const minimumRange =
        pair === "BTC/USD" ? 1 : 0.00005;

      const range = Math.max(
        max - min,
        minimumRange
      );

      const low = min - range * 0.2;
      const high = max + range * 0.2;

      const y = price =>
        top +
        ((high - price) / (high - low)) *
          plotHeight;

      const x = index =>
        plotRight -
        38 -
        (rows.length - 1 - index) * spacing;

      // Grid
      ctx.strokeStyle = "#353849";
      ctx.lineWidth = 1;

      for (let i = 0; i <= 5; i++) {
        const yy =
          top + (plotHeight * i) / 5;

        ctx.beginPath();
        ctx.moveTo(left, yy);
        ctx.lineTo(plotRight, yy);
        ctx.stroke();
      }

      for (let i = 0; i < rows.length; i += 8) {
        const xx = x(i);

        ctx.beginPath();
        ctx.moveTo(xx, top);
        ctx.lineTo(xx, plotBottom);
        ctx.stroke();
      }

      ctx.save();
      ctx.beginPath();
      ctx.rect(
        left,
        top,
        plotRight - left,
        plotHeight
      );
      ctx.clip();

      // Candles
      rows.forEach((c, i) => {
        const xx = x(i);
        const up = c.close >= c.open;
        const color = up
          ? "#13bf70"
          : "#e84c43";

        const candleWidth = Math.max(
          3,
          Math.min(10, spacing * 0.67)
        );

        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.moveTo(xx, y(c.high));
        ctx.lineTo(xx, y(c.low));
        ctx.stroke();

        const openY = y(c.open);
        const closeY = y(c.close);

        ctx.fillRect(
          xx - candleWidth / 2,
          Math.min(openY, closeY),
          candleWidth,
          Math.max(
            1.5,
            Math.abs(closeY - openY)
          )
        );
      });

      // Entry price lines
      for (const t of trades) {
        const entry = Number(t.entryPrice);

        if (!Number.isFinite(entry)) continue;

        const yy = y(entry);
        const color =
          t.direction === "buy"
            ? COLOR.green
            : COLOR.red;

        ctx.strokeStyle = color;
        ctx.setLineDash([5, 5]);

        ctx.beginPath();
        ctx.moveTo(left, yy);
        ctx.lineTo(plotRight, yy);
        ctx.stroke();

        ctx.setLineDash([]);
      }

      // Current price dotted line
      const priceY = y(livePrice);

      ctx.strokeStyle = "#e0e2eb";
      ctx.setLineDash([4, 4]);

      ctx.beginPath();
      ctx.moveTo(left, priceY);
      ctx.lineTo(plotRight, priceY);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.restore();

      // Price scale
      ctx.fillStyle = "#c3c8d5";
      ctx.font = "11px Arial";
      ctx.textAlign = "left";

      for (let i = 0; i <= 5; i++) {
        const yy =
          top + (plotHeight * i) / 5;

        const value =
          high - ((high - low) * i) / 5;

        ctx.fillText(
          fmtPrice(value, pair),
          plotRight + 5,
          yy + 4
        );
      }

      // Price marker
      const markerY = Math.max(
        top + 13,
        Math.min(plotBottom - 13, priceY)
      );

      ctx.fillStyle =
        livePrice >= latest.open
          ? COLOR.green
          : COLOR.red;

      ctx.fillRect(
        plotRight,
        markerY - 13,
        right,
        26
      );

      ctx.fillStyle = "#fff";
      ctx.font = "bold 11px Arial";
      ctx.fillText(
        fmtPrice(livePrice, pair),
        plotRight + 5,
        markerY + 4
      );

      // Time labels
      ctx.fillStyle = "#a7acba";
      ctx.textAlign = "center";
      ctx.font = "10px Arial";

      const labelStep = Math.max(
        1,
        Math.ceil(75 / spacing)
      );

      for (
        let i = rows.length - 1;
        i >= 0;
        i -= labelStep
      ) {
        const xx = x(i);

        if (
          xx < 25 ||
          xx > plotRight - 20
        ) {
          continue;
        }

        ctx.fillText(
          new Date(rows[i].time)
            .toLocaleTimeString("en-GB", {
              timeZone: "Asia/Kolkata",
              hour: "2-digit",
              minute: "2-digit"
            }),
          xx,
          height - 8
        );
      }

      frame = requestAnimationFrame(draw);
    };

    frame = requestAnimationFrame(draw);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
    };
  }, [dimensions]);

  return (
    <div className="qx-chart-card">
      <div className="qx-chart-toolbar">
        <div className="qx-chart-pair">
          <span className="qx-pair-dot">●</span>
          <strong>{symbol}</strong>
          <span className="qx-pair-feed">
            {connected ? "LIVE FEED" : "WAITING"}
          </span>
        </div>

        <div className="qx-chart-actions">
          <IconButton
            title="Previous chart"
            onClick={() => scroll(12)}
          >
            <ChevronLeft size={16} />
          </IconButton>

          <IconButton
            title="Next chart"
            onClick={() => scroll(-12)}
          >
            <ChevronRight size={16} />
          </IconButton>

          <IconButton
            title="Zoom out"
            onClick={() => zoom(-2)}
          >
            <Minus size={15} />
          </IconButton>

          <IconButton
            title="Zoom in"
            onClick={() => zoom(2)}
          >
            <Plus size={15} />
          </IconButton>

          <IconButton
            title="More"
            onClick={() =>
              setShowMenu(value => !value)
            }
          >
            <MoreHorizontal size={16} />
          </IconButton>
        </div>
      </div>

      {showMenu && (
        <div className="qx-chart-menu">
          <button
            type="button"
            onClick={() => {
              setOffset(0);
              setShowMenu(false);
            }}
          >
            Back to live
          </button>

          <button
            type="button"
            onClick={() => {
              setGap(13);
              setOffset(0);
              setShowMenu(false);
            }}
          >
            Reset zoom
          </button>
        </div>
      )}

      <div
        ref={holderRef}
        className="qx-chart-viewport"
      >
        <canvas
          ref={canvasRef}
          className="qx-chart-canvas"
          onPointerDown={event => {
            event.currentTarget.setPointerCapture(
              event.pointerId
            );

            pointerRef.current = {
              x: event.clientX,
              offset: safeOffset
            };
          }}
          onPointerMove={event => {
            if (!pointerRef.current) return;

            const delta =
              event.clientX -
              pointerRef.current.x;

            const steps = Math.round(
              delta / gap
            );

            setOffset(
              Math.max(
                0,
                Math.min(
                  maxOffset,
                  pointerRef.current.offset + steps
                )
              )
            );
          }}
          onPointerUp={event => {
            pointerRef.current = null;

            if (
              event.currentTarget.hasPointerCapture(
                event.pointerId
              )
            ) {
              event.currentTarget.releasePointerCapture(
                event.pointerId
              );
            }
          }}
          onPointerCancel={() => {
            pointerRef.current = null;
          }}
          onWheel={event => {
            event.preventDefault();

            if (event.shiftKey) {
              scroll(
                event.deltaY > 0 ? 5 : -5
              );
            } else {
              zoom(
                event.deltaY > 0 ? -2 : 2
              );
            }
          }}
        />

        {safeOffset > 0 && (
          <button
            type="button"
            className="qx-back-live"
            onClick={() => setOffset(0)}
          >
            <RefreshCw size={13} />
            Live
          </button>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   TRADES TABLE
========================================================= */

function TradesTable({
  trades,
  prices,
  onClose,
  closingId
}) {
  if (!trades.length) {
    return (
      <div className="qx-empty">
        No trades available
      </div>
    );
  }

  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            <th>Pair</th>
            <th>Direction</th>
            <th>Amount</th>
            <th>Entry</th>
            <th>Exit / Current</th>
            <th>Profit</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {trades.map(t => {
            const open = t.status === "open";

            return (
              <tr key={t._id}>
                <td>{t.symbol}</td>

                <td
                  style={{
                    color:
                      t.direction === "buy"
                        ? COLOR.green
                        : COLOR.red,
                    fontWeight: 700
                  }}
                >
                  {String(
                    t.direction
                  ).toUpperCase()}
                </td>

                <td>${fmtMoney(t.amountUSD)}</td>

                <td>
                  {fmtPrice(
                    t.entryPrice,
                    t.symbol
                  )}
                </td>

                <td>
                  {fmtPrice(
                    open
                      ? prices[t.symbol]
                      : t.exitPrice,
                    t.symbol
                  )}
                </td>

                <td>
                  {open
                    ? "—"
                    : `$${fmtMoney(t.profitUSD)}`}
                </td>

                <td>{t.status}</td>

                <td>
                  {open && !t.expiresAt ? (
                    <button
                      type="button"
                      className="qx-exit-button"
                      disabled={Boolean(closingId)}
                      onClick={() => onClose(t._id)}
                    >
                      {closingId === t._id
                        ? "Closing..."
                        : "EXIT"}
                    </button>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* =========================================================
   MAIN APPLICATION
========================================================= */

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(
    Boolean(token())
  );

  const [overview, setOverview] = useState(null);
  const [page, setPage] = useState("Trading");
  const [symbol, setSymbol] = useState("EUR/USD");
  const [amount, setAmount] = useState("10");

  const [candles, setCandles] = useState([]);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [prices, setPrices] = useState({});
  const [connected, setConnected] = useState(false);

  const [busy, setBusy] = useState(false);
  const [closingId, setClosingId] = useState(null);
  const [notice, setNotice] = useState("");
  const [showOffer, setShowOffer] = useState(true);
  const [showNotifications, setShowNotifications] =
    useState(false);

  const [deposit, setDeposit] = useState({
    amountUSD: "100",
    method: "UPI",
    reference: ""
  });

  const [ticket, setTicket] = useState({
    subject: "",
    message: ""
  });

  const refreshOverview = useCallback(async () => {
    const data = await request("/me/overview");

    setOverview(data);

    if (data.user) {
      setUser(data.user);
    }
  }, []);

  // Restore login
  useEffect(() => {
    if (!token()) {
      setCheckingAuth(false);
      return;
    }

    let cancelled = false;

    request("/auth/me")
      .then(data => {
        if (!cancelled) {
          setUser(data.user);
        }
      })
      .catch(() => {
        sessionStorage.removeItem(TOKEN_KEY);
      })
      .finally(() => {
        if (!cancelled) {
          setCheckingAuth(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Overview polling
  useEffect(() => {
    if (!user) return;

    let stopped = false;
    let running = false;

    const poll = async () => {
      if (stopped || running) return;
      running = true;

      try {
        const data = await request(
          "/me/overview"
        );

        if (!stopped) {
          setOverview(data);

          if (data.user) {
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        running = false;
      }
    };

    poll();

    const timer = setInterval(
      poll,
      3000
    );

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [Boolean(user)]);

  // Chart polling
  useEffect(() => {
    if (!user) return;

    let stopped = false;
    let running = false;

    setCandles([]);
    setCurrentPrice(null);
    setConnected(false);

    const poll = async () => {
      if (stopped || running) return;
      running = true;

      try {
        const data = await request(
          "/trading/chart?symbol=" +
            encodeURIComponent(symbol)
        );

        if (stopped) return;

        const list = Array.isArray(data.candles)
          ? data.candles
          : [];

        setCandles(list);

        const valid =
          data.currentPrice != null &&
          Number.isFinite(
            Number(data.currentPrice)
          );

        const nextPrice = valid
          ? Number(data.currentPrice)
          : null;

        setCurrentPrice(nextPrice);

        setPrices(previous => ({
          ...previous,
          [symbol]: nextPrice
        }));

        setConnected(
          valid &&
          list.some(c =>
            c &&
            c.close != null &&
            Number.isFinite(
              Number(c.close)
            )
          )
        );
      } catch (error) {
        if (!stopped) {
          setConnected(false);
          console.error(error);
        }
      } finally {
        running = false;
      }
    };

    poll();

    const timer = setInterval(
      poll,
      1000
    );

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [Boolean(user), symbol]);

  // Price polling
  useEffect(() => {
    if (!user) return;

    let stopped = false;

    const poll = async () => {
      try {
        const data = await request(
          "/trading/prices"
        );

        if (
          !stopped &&
          data.prices &&
          typeof data.prices === "object"
        ) {
          setPrices(data.prices);
        }
      } catch (error) {
        console.error(error);
      }
    };

    poll();

    const timer = setInterval(
      poll,
      2000
    );

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [Boolean(user)]);

  async function place(direction) {
    const value = Number(amount);

    if (
      !Number.isFinite(value) ||
      value < 1 ||
      value > 1000 ||
      Math.abs(
        value * 100 -
          Math.round(value * 100)
      ) > 1e-7
    ) {
      setNotice(
        "Investment must be between $1 and $1000."
      );
      return;
    }

    if (!connected) {
      setNotice(
        "Price feed is not ready."
      );
      return;
    }

    setBusy(true);
    setNotice("");

    try {
      await request(
        "/trading/place",
        "POST",
        {
          symbol,
          direction,
          amountUSD: value
        }
      );

      setNotice(
        `${direction.toUpperCase()} trade placed.`
      );

      await refreshOverview();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function closeTrade(id) {
    setClosingId(id);
    setNotice("");

    try {
      await request(
        `/trading/${id}/close`,
        "POST"
      );

      setNotice("Trade closed.");
      await refreshOverview();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setClosingId(null);
    }
  }

  async function submitDeposit(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");

    try {
      await request(
        "/me/deposits",
        "POST",
        {
          amountUSD: Number(
            deposit.amountUSD
          ),
          method: deposit.method,
          reference: deposit.reference
        }
      );

      setNotice(
        "Deposit request submitted."
      );

      await refreshOverview();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function submitTicket(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");

    try {
      await request(
        "/me/tickets",
        "POST",
        ticket
      );

      setTicket({
        subject: "",
        message: ""
      });

      setNotice(
        "Support ticket created."
      );

      await refreshOverview();
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    sessionStorage.removeItem(
      TOKEN_KEY
    );

    setUser(null);
    setOverview(null);
    setPage("Trading");
    setNotice("");
  }

  const trades = overview?.trades || [];

  const openTrades = trades.filter(
    t => t.status === "open"
  );

  const closedTrades = trades.filter(
    t => t.status !== "open"
  );

  const pairOpenTrades = openTrades.filter(
    t => t.symbol === symbol
  );

  const balance = Number(
    user?.balanceUSD ??
      user?.demoBalance ??
      0
  );

  const navigation = [
    {
      name: "Trading",
      icon: TrendingUp
    },
    {
      name: "Wallet",
      icon: Wallet
    },
    {
      name: "Support",
      icon: Headphones
    },
    {
      name: "Account",
      icon: UserRound
    }
  ];

  if (checkingAuth) {
    return (
      <div className="qx-loading">
        Loading Quotexx...
      </div>
    );
  }

  if (!user) {
    return (
      <Auth onSuccess={setUser} />
    );
  }

  return (
    <div className="qx-app">
      {/* TOP HEADER */}
      <header className="qx-app-header">
        <div className="qx-brand">
          <span style={{ color: COLOR.green }}>
            ◆
          </span>
          {" "}Quotexx
        </div>

        <nav className="qx-header-nav">
          {navigation.map(item => (
            <button
              key={item.name}
              type="button"
              className={
                page === item.name
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage(item.name)
              }
            >
              {item.name}
            </button>
          ))}
        </nav>

        <div className="qx-balance">
          <span className="qx-balance-live">
            LIVE
          </span>

          <span>
            ${fmtMoney(balance)}
          </span>

          <ChevronDown size={14} />
        </div>

        <IconButton
          title="Notifications"
          onClick={() =>
            setShowNotifications(v => !v)
          }
        >
          <Bell size={18} />
        </IconButton>

        <button
          type="button"
          className="qx-deposit-btn"
          onClick={() =>
            setPage("Wallet")
          }
        >
          Deposit
        </button>
      </header>

      {showNotifications && (
        <div className="qx-notification-popup">
          <strong>Notifications</strong>

          <p>No new notifications</p>

          <button
            type="button"
            onClick={() =>
              setShowNotifications(false)
            }
          >
            Close
          </button>
        </div>
      )}

      {/* OFFER BANNER */}
      {page === "Trading" &&
        showOffer && (
          <div className="qx-offer">
            <span>🎁</span>

            <span>
              50% deposit bonus available
            </span>

            <strong className="qx-offer-badge">
              +50%
            </strong>

            <button
              type="button"
              className="qx-offer-close"
              onClick={() =>
                setShowOffer(false)
              }
            >
              <X size={16} />
            </button>
          </div>
        )}

      {/* NOTICE */}
      {notice && (
        <div className="qx-notice">
          <span>{notice}</span>

          <button
            type="button"
            onClick={() =>
              setNotice("")
            }
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* TRADING */}
      {page === "Trading" && (
        <main className="qx-trading-main">
          {/* DESKTOP PAIR TABS */}
          <div className="qx-pair-tabs">
            {PAIRS.map(pair => (
              <button
                key={pair}
                type="button"
                className={
                  symbol === pair
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setSymbol(pair)
                }
              >
                {pair}
              </button>
            ))}
          </div>

          <div className="qx-trading-grid">
            {/* CHART */}
            <div className="qx-chart-column">
              <CandleChart
                symbol={symbol}
                candles={candles}
                currentPrice={currentPrice}
                openTrades={pairOpenTrades}
                connected={connected}
              />
            </div>

            {/* COMPACT TRADING PANEL */}
            <div className="qx-order-panel">
              <div className="qx-order-header">
                <div className="qx-mobile-pair-selector">
                  <select
                    value={symbol}
                    onChange={event =>
                      setSymbol(
                        event.target.value
                      )
                    }
                  >
                    {PAIRS.map(pair => (
                      <option
                        key={pair}
                        value={pair}
                      >
                        {pair}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="qx-order-pair-desktop">
                  <strong>{symbol}</strong>

                  <small>
                    Simulated trading
                  </small>
                </div>

                <span
                  className={
                    connected
                      ? "qx-feed-connected"
                      : "qx-feed-disconnected"
                  }
                >
                  ●{" "}
                  {connected
                    ? "CONNECTED"
                    : "WAITING"}
                </span>
              </div>

              <div className="qx-order-fields">
                <div className="qx-order-field">
                  <span>Trade mode</span>

                  <strong>
                    Manual Exit
                  </strong>
                </div>

                <div className="qx-order-field">
                  <span>Price</span>

                  <strong>
                    {fmtPrice(
                      currentPrice,
                      symbol
                    )}
                  </strong>
                </div>
              </div>

              <div className="qx-investment">
                <span className="qx-investment-label">
                  Investment
                </span>

                <div className="qx-investment-control">
                  <IconButton
                    title="Decrease investment"
                    onClick={() =>
                      setAmount(v =>
                        String(
                          Math.max(
                            1,
                            Number(v || 1) - 1
                          )
                        )
                      )
                    }
                  >
                    <Minus size={16} />
                  </IconButton>

                  <div className="qx-investment-input">
                    <span>$</span>

                    <input
                      type="number"
                      min="1"
                      max="1000"
                      step="0.01"
                      value={amount}
                      onChange={event =>
                        setAmount(
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <IconButton
                    title="Increase investment"
                    onClick={() =>
                      setAmount(v =>
                        String(
                          Math.min(
                            1000,
                            Number(v || 0) + 1
                          )
                        )
                      )
                    }
                  >
                    <Plus size={16} />
                  </IconButton>
                </div>
              </div>

              <div className="qx-profit-row">
                <span>Profit calculation</span>

                <strong>
                  Points based
                </strong>
              </div>

              <div className="qx-trade-buttons">
                <button
                  type="button"
                  className="qx-buy-btn"
                  disabled={
                    busy || !connected
                  }
                  onClick={() =>
                    place("buy")
                  }
                >
                  <ArrowUp size={18} />
                  <span>BUY</span>
                </button>

                <button
                  type="button"
                  className="qx-sell-btn"
                  disabled={
                    busy || !connected
                  }
                  onClick={() =>
                    place("sell")
                  }
                >
                  <ArrowDown size={18} />
                  <span>SELL</span>
                </button>
              </div>
            </div>
          </div>

          {/* HISTORY BELOW TRADING VIEW */}
          <section className="qx-section">
            <h2>
              Open Trades (
              {openTrades.length})
            </h2>

            <TradesTable
              trades={openTrades}
              prices={prices}
              onClose={closeTrade}
              closingId={closingId}
            />
          </section>

          <section className="qx-section">
            <h2>Trade History</h2>

            <TradesTable
              trades={closedTrades}
              prices={prices}
              closingId={closingId}
              onClose={closeTrade}
            />
          </section>
        </main>
      )}

      {/* WALLET */}
      {page === "Wallet" && (
        <main className="qx-content-page">
          <h2>Wallet</h2>

          <div className="qx-page-card">
            <span>LIVE Balance</span>

            <h1>
              ${fmtMoney(balance)}
            </h1>
          </div>

          <div className="qx-page-card">
            <h3>Deposit</h3>

            <form onSubmit={submitDeposit}>
              <label>
                Amount USD
                <input
                  type="number"
                  min="10"
                  step="0.01"
                  required
                  value={deposit.amountUSD}
                  onChange={e =>
                    setDeposit(p => ({
                      ...p,
                      amountUSD:
                        e.target.value
                    }))
                  }
                />
              </label>

              <label>
                Payment Method
                <select
                  value={deposit.method}
                  onChange={e =>
                    setDeposit(p => ({
                      ...p,
                      method:
                        e.target.value
                    }))
                  }
                >
                  <option value="UPI">
                    UPI
                  </option>
                  <option value="PhonePe">
                    PhonePe
                  </option>
                  <option value="Paytm">
                    Paytm
                  </option>
                </select>
              </label>

              <label>
                Payment Reference
                <input
                  required
                  value={deposit.reference}
                  onChange={e =>
                    setDeposit(p => ({
                      ...p,
                      reference:
                        e.target.value
                    }))
                  }
                />
              </label>

              <button
                type="submit"
                className="qx-deposit-btn"
                disabled={busy}
              >
                Submit Deposit
              </button>
            </form>
          </div>

          <div className="qx-page-card">
            <h3>Deposit History</h3>

            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {(
                    overview?.deposits || []
                  ).map(item => (
                    <tr key={item._id}>
                      <td>
                        $
                        {fmtMoney(
                          item.amountUSD
                        )}
                      </td>
                      <td>
                        {item.method}
                      </td>
                      <td>
                        {item.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      )}

      {/* SUPPORT */}
      {page === "Support" && (
        <main className="qx-content-page">
          <h2>Support</h2>

          <div className="qx-page-card">
            <h3>Create Ticket</h3>

            <form onSubmit={submitTicket}>
              <label>
                Subject
                <input
                  required
                  value={ticket.subject}
                  onChange={e =>
                    setTicket(p => ({
                      ...p,
                      subject:
                        e.target.value
                    }))
                  }
                />
              </label>

              <label>
                Message
                <textarea
                  required
                  rows={5}
                  value={ticket.message}
                  onChange={e =>
                    setTicket(p => ({
                      ...p,
                      message:
                        e.target.value
                    }))
                  }
                />
              </label>

              <button
                type="submit"
                disabled={busy}
              >
                Submit Ticket
              </button>
            </form>
          </div>

          <div className="qx-page-card">
            <h3>My Tickets</h3>

            {(
              overview?.tickets || []
            ).map(item => (
              <div
                className="qx-ticket"
                key={item._id}
              >
                <strong>
                  {item.subject}
                </strong>

                <p>
                  {item.message}
                </p>

                <small>
                  {item.status}
                </small>

                {item.reply && (
                  <p>
                    Reply: {item.reply}
                  </p>
                )}
              </div>
            ))}
          </div>
        </main>
      )}

      {/* ACCOUNT */}
      {page === "Account" && (
        <main className="qx-content-page">
          <h2>Account</h2>

          <div className="qx-page-card">
            <h3>
              {user.name || "Trader"}
            </h3>

            <p>{user.email}</p>

            <p>
              Balance: $
              {fmtMoney(balance)}
            </p>

            <button
              type="button"
              onClick={logout}
              style={{
                background: COLOR.red
              }}
            >
              <LogOut
                size={16}
                style={{
                  verticalAlign: "middle"
                }}
              />
              {" "}Logout
            </button>
          </div>
        </main>
      )}

      {/* MOBILE NAVIGATION */}
      <div className="qx-mobile-nav">
        {navigation.map(item => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              type="button"
              className={
                page === item.name
                  ? "active"
                  : ""
              }
              onClick={() =>
                setPage(item.name)
              }
            >
              <Icon size={20} />

              <span>
                {item.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* COMPONENT-SPECIFIC STYLES */}
      <style>{`
        .qx-app {
          min-height: 100dvh;
          background: ${COLOR.bg};
          color: ${COLOR.text};
        }

        .qx-chart-toolbar {
          height: 39px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
          padding: 4px 9px;
          background: ${COLOR.bg};
        }

        .qx-chart-pair {
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          white-space: nowrap;
        }

        .qx-chart-pair strong {
          font-size: 13px;
        }

        .qx-pair-dot {
          color: ${COLOR.green};
          font-size: 12px;
        }

        .qx-pair-feed {
          font-size: 9px;
          color: ${COLOR.muted};
        }

        .qx-chart-actions {
          display: flex;
          gap: 3px;
        }

        .qx-chart-menu {
          display: flex;
          gap: 6px;
          padding: 6px 10px;
          background: ${COLOR.panel};
        }

        .qx-chart-menu button {
          padding: 7px 10px;
          font-size: 11px;
        }

        .qx-chart-viewport {
          position: relative;
          width: 100%;
          height: min(72vh, 710px);
          min-height: 440px;
          overflow: hidden;
          background: ${COLOR.bg};
        }

        .qx-chart-canvas {
          display: block;
          width: 100%;
          height: 100%;
          touch-action: none;
          cursor: grab;
        }

        .qx-back-live {
          position: absolute;
          bottom: 34px;
          right: 82px;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 7px 10px;
          font-size: 11px;
          background: ${COLOR.blue};
        }

        .qx-order-panel {
          background: ${COLOR.panel};
          border: 1px solid ${COLOR.border};
          border-radius: 7px;
          padding: 14px;
        }

        .qx-order-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 13px;
        }

        .qx-order-pair-desktop {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .qx-order-pair-desktop strong {
          font-size: 16px;
        }

        .qx-order-pair-desktop small {
          font-size: 10px;
          color: ${COLOR.muted};
        }

        .qx-mobile-pair-selector {
          display: none;
        }

        .qx-feed-connected,
        .qx-feed-disconnected {
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
        }

        .qx-feed-connected {
          color: ${COLOR.green};
        }

        .qx-feed-disconnected {
          color: ${COLOR.red};
        }

        .qx-order-fields {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 9px;
        }

        .qx-order-field {
          display: flex;
          flex-direction: column;
          gap: 7px;
          min-width: 0;
          padding: 11px;
          border: 1px solid ${COLOR.border};
          border-radius: 5px;
        }

        .qx-order-field span {
          font-size: 11px;
          color: ${COLOR.muted};
        }

        .qx-order-field strong {
          font-size: 13px;
          white-space: nowrap;
        }

        .qx-investment {
          margin-top: 14px;
        }

        .qx-investment-label {
          display: block;
          font-size: 12px;
          color: ${COLOR.muted};
          margin-bottom: 7px;
        }

        .qx-investment-control {
          display: flex;
          align-items: center;
          gap: 7px;
          border: 1px solid ${COLOR.border};
          border-radius: 5px;
          padding: 5px;
        }

        .qx-investment-input {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 0;
        }

        .qx-investment-input span {
          font-size: 17px;
          font-weight: 800;
        }

        .qx-investment-input input {
          width: 75px;
          min-width: 0;
          margin: 0;
          padding: 4px;
          background: transparent;
          border: 0;
          text-align: center;
          font-size: 17px;
          font-weight: 800;
          outline: none;
        }

        .qx-profit-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 0;
          font-size: 12px;
        }

        .qx-profit-row span {
          color: ${COLOR.muted};
        }

        .qx-trade-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .qx-buy-btn,
        .qx-sell-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          min-width: 0;
          height: 55px;
          border-radius: 5px;
          font-size: 16px;
          font-weight: 800;
          color: white;
        }

        .qx-buy-btn {
          background: ${COLOR.green};
        }

        .qx-sell-btn {
          background: ${COLOR.red};
        }

        .qx-content-page {
          width: min(1100px, 100%);
          margin: auto;
          padding: 20px;
          padding-bottom: 90px;
        }

        .qx-page-card {
          background: ${COLOR.panel};
          border: 1px solid ${COLOR.border};
          border-radius: 8px;
          padding: 18px;
          margin-bottom: 15px;
        }

        .qx-ticket {
          padding: 12px 0;
          border-bottom: 1px solid ${COLOR.border};
        }

        .qx-notice {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin: 6px 10px;
          padding: 9px 12px;
          background: #35394a;
          border-left: 3px solid ${COLOR.blue};
          border-radius: 5px;
          font-size: 12px;
        }

        .qx-notice button {
          background: transparent;
          padding: 2px;
        }

        .qx-notification-popup {
          position: absolute;
          top: 55px;
          right: 10px;
          z-index: 100;
          width: 220px;
          background: ${COLOR.panel};
          border: 1px solid ${COLOR.border};
          border-radius: 7px;
          padding: 15px;
          box-shadow: 0 10px 30px #0008;
        }

        .qx-notification-popup p {
          color: ${COLOR.muted};
          font-size: 12px;
        }

        .qx-exit-button {
          background: ${COLOR.blue};
          padding: 7px 12px;
          font-size: 11px;
        }

        .qx-empty {
          padding: 15px;
          color: ${COLOR.muted};
          text-align: center;
          font-size: 12px;
        }

        .qx-loading {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: ${COLOR.bg};
          color: white;
        }

        @media (min-width: 768px) {
          .qx-mobile-nav {
            display: none !important;
          }

          .qx-trading-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 300px;
            gap: 12px;
          }

          .qx-order-panel {
            position: sticky;
            top: 12px;
          }
        }

        @media (max-width: 767px) {
          .qx-app {
            padding-bottom: 60px;
          }

          .qx-app-header {
            height: 48px !important;
            min-height: 48px !important;
            padding: 5px 9px !important;
            gap: 7px;
            flex-wrap: nowrap !important;
          }

          .qx-brand,
          .qx-header-nav,
          .qx-pair-tabs {
            display: none !important;
          }

          .qx-balance {
            height: 36px;
            padding: 6px 10px;
            font-size: 13px;
          }

          .qx-deposit-btn {
            height: 36px;
            padding: 7px 12px !important;
            margin-left: auto;
          }

          .qx-offer {
            height: 33px;
            min-height: 33px;
            margin: 4px 9px 5px;
            padding: 4px 27px 4px 9px;
            font-size: 11px;
          }

          .qx-trading-main {
            padding: 0 !important;
          }

          .qx-trading-grid {
            display: flex !important;
            flex-direction: column;
            gap: 0 !important;
          }

          .qx-chart-column {
            width: 100%;
          }

          .qx-chart-card {
            border: 0 !important;
            border-radius: 0 !important;
          }

          .qx-chart-toolbar {
            height: 35px !important;
            min-height: 35px !important;
            padding: 3px 7px !important;
          }

          .qx-chart-actions button {
            width: 25px !important;
            height: 25px !important;
          }

          .qx-pair-feed {
            display: none;
          }

          /*
            Screen allocation:
            Header       48px
            Offer        42px
            Chart tools  35px
            Order panel 220px
            Bottom nav   60px

            Chart receives remaining height.
          */
          .qx-chart-viewport {
            height: max(
              155px,
              calc(100dvh - 405px)
            ) !important;
            min-height: 155px !important;
            max-height: none !important;
          }

          .qx-order-panel {
            width: 100%;
            height: 220px;
            padding: 7px 9px !important;
            border-radius: 0 !important;
            border-left: 0 !important;
            border-right: 0 !important;
            overflow: hidden;
          }

          .qx-order-header {
            height: 30px;
            margin-bottom: 5px;
          }

          .qx-mobile-pair-selector {
            display: block;
            width: 150px;
          }

          .qx-mobile-pair-selector select {
            width: 100%;
            height: 29px;
            min-height: 29px;
            padding: 4px 8px;
            margin: 0;
            font-size: 12px;
            font-weight: 700;
            border: 1px solid ${COLOR.border};
            background: ${COLOR.panel2};
          }

          .qx-order-pair-desktop {
            display: none;
          }

          .qx-feed-connected,
          .qx-feed-disconnected {
            font-size: 9px;
          }

          .qx-order-fields {
            gap: 7px;
          }

          .qx-order-field {
            height: 43px;
            gap: 4px;
            padding: 5px 8px;
          }

          .qx-order-field span {
            font-size: 10px;
          }

          .qx-order-field strong {
            font-size: 12px;
          }

          .qx-investment {
            margin-top: 5px;
          }

          .qx-investment-label {
            font-size: 10px;
            margin-bottom: 3px;
          }

          .qx-investment-control {
            height: 39px;
            padding: 3px;
          }

          .qx-investment-control button {
            width: 30px !important;
            height: 29px !important;
          }

          .qx-investment-input input {
            font-size: 15px;
            padding: 2px;
            height: 27px;
          }

          .qx-profit-row {
            padding: 6px 0;
            font-size: 10px;
          }

          .qx-trade-buttons {
            gap: 9px;
          }

          .qx-buy-btn,
          .qx-sell-btn {
            height: 48px !important;
            min-height: 48px !important;
            padding: 0 8px !important;
            font-size: 15px !important;
            border-radius: 5px !important;
          }

          .qx-mobile-nav {
            position: fixed;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1000;
            height: 60px;
            display: flex !important;
            justify-content: space-around;
            align-items: center;
            background: ${COLOR.bg};
            border-top: 1px solid ${COLOR.border};
          }

          .qx-mobile-nav button {
            flex: 1;
            height: 52px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 4px;
            background: transparent;
            border-radius: 0;
            color: #969bad;
            font-size: 10px;
            padding: 4px;
          }

          .qx-mobile-nav button.active {
            color: white;
          }

          .qx-section {
            margin: 10px;
          }
        }

        @media (max-width: 767px) and (max-height: 650px) {
          .qx-chart-viewport {
            height: max(
              120px,
              calc(100dvh - 405px)
            ) !important;
            min-height: 120px !important;
          }
        }
      `}</style>
    </div>
  );
}

createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
