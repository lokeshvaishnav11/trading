
// @ts-nocheck
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
const API = "/api";
const C = {
  bg: "#080e18",
  panel: "#101a29",
  panel2: "#172437",
  border: "#27364b",
  grid: "#1c2b3e",
  text: "#eef4ff",
  muted: "#8195ad",
  green: "#00c896",
  red: "#ff4968",
  blue: "#397bfa",
  yellow: "#ffca60"
};
const PAIRS = ["EUR/USD", "GBP/USD", "BTC/USD"];
const fmt = n => Number(n || 0).toFixed(2);
const decimals = s => s === "BTC/USD" ? 2 : 5;
function token() {
  return sessionStorage.getItem("qx_token") || "";
}
async function api(path, method = "GET", body) {
  const response = await fetch(API + path, {
    method,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(token()
        ? { Authorization: `Bearer ${token()}` }
        : {})
    },
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {})
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw Error(result.error || `HTTP ${response.status}`);
  }
  return result;
}
const buttonStyle = {
  border: 0,
  borderRadius: 9,
  padding: "12px 16px",
  fontWeight: 800,
  color: "white",
  cursor: "pointer"
};
const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 14px",
  marginTop: 7,
  background: C.bg,
  border: `1px solid ${C.border}`,
  borderRadius: 9,
  color: C.text,
  outline: "none"
};
function Panel({ children, style }) {
  return (
    <div style={{
      background: C.panel,
      border: `1px solid ${C.border}`,
      borderRadius: 13,
      padding: 18,
      ...style
    }}>
      {children}
    </div>
  );
}
function Field({ label, ...props }) {
  return (
    <label style={{
      display: "block",
      color: C.muted,
      fontSize: 13,
      marginBottom: 16
    }}>
      {label}
      <input {...props} style={{
        ...inputStyle,
        ...(props.style || {})
      }} />
    </label>
  );
}

function LiveTradingChart({
  symbol,
  candles = [],
  currentPrice,
  trades = [],
  connected = false,
  now
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const crosshairRef = useRef(null);
  const dragRef = useRef(null);
  const scaleRef = useRef(null);
  const dataRef = useRef({});
  const scrollRef = useRef(0);

  const [size, setSize] = useState({
    width: 900,
    height: 560
  });

  const [spacing, setSpacing] = useState(12);
  const [scrollOffset, setScrollOffset] = useState(0);

  const spacingRef = useRef(spacing);
  spacingRef.current = spacing;
  scrollRef.current = scrollOffset;

  const priceDecimals =
    symbol === "BTC/USD" ? 2 : 5;

  const colors = {
    background: "#080e18",
    panel: "#111c2b",
    border: "#203047",
    grid: "#1b2a3d",
    text: "#e8f0fa",
    muted: "#91a4bd",
    green: "#00c896",
    red: "#ff4968",
    crosshair: "#72839b",
    blue: "#315d95"
  };

  const validCandles = useMemo(() => {
    const result = candles
      .filter(c =>
        c &&
        Number.isFinite(Number(c.time)) &&
        ["open", "high", "low", "close"].every(
          key =>
            c[key] !== null &&
            c[key] !== undefined &&
            Number.isFinite(Number(c[key]))
        )
      )
      .map(c => ({
        time: Number(c.time),
        open: Number(c.open),
        high: Number(c.high),
        low: Number(c.low),
        close: Number(c.close)
      }))
      .sort((a, b) => a.time - b.time);

    // Avoid duplicate timestamps.
    return result.filter(
      (c, index) =>
        index === result.length - 1 ||
        c.time !== result[index + 1].time
    );
  }, [candles]);

  const visibleCount = Math.max(
    8,
    Math.floor(
      Math.max(100, size.width - 120) / spacing
    )
  );

  const maxScroll = Math.max(
    0,
    validCandles.length - visibleCount
  );

  const effectiveScroll = Math.min(
    scrollOffset,
    maxScroll
  );

  dataRef.current = {
    symbol,
    candles: validCandles,
    currentPrice,
    trades,
    connected,
    scrollOffset: effectiveScroll,
    spacing
  };

  const zoomIn = () => {
    setSpacing(v => Math.min(32, v + 2));
    scaleRef.current = null;
  };

  const zoomOut = () => {
    setSpacing(v => Math.max(5, v - 2));
    scaleRef.current = null;
  };

  const goLive = () => {
    setScrollOffset(0);
    scrollRef.current = 0;
    scaleRef.current = null;
  };

  const resetChart = () => {
    setSpacing(12);
    setScrollOffset(0);
    scrollRef.current = 0;
    scaleRef.current = null;
  };

  const scrollChart = delta => {
    setScrollOffset(previous =>
      Math.max(
        0,
        Math.min(maxScroll, previous + delta)
      )
    );
  };

  // Responsive sizing.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      setSize({
        width: Math.max(280, element.clientWidth),
        height: Math.max(400, element.clientHeight)
      });
    };

    updateSize();

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    scaleRef.current = null;
    setScrollOffset(0);
  }, [symbol]);

  // Canvas renderer.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = Math.min(
      window.devicePixelRatio || 1,
      2
    );

    const width = size.width;
    const height = size.height;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    let animationFrame;
    let active = true;
    let smoothPrice = null;

    const priceText = value =>
      Number(value).toFixed(priceDecimals);

    const timeText = timestamp =>
      new Date(timestamp).toLocaleTimeString(
        "en-GB",
        {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit"
        }
      );

    const draw = () => {
      if (!active) return;

      const {
        candles: all = [],
        currentPrice: livePrice,
        trades: activeTrades = [],
        scrollOffset: offset = 0,
        spacing: candleGap = 12
      } = dataRef.current;

      const ctx = context;

      const left = 14;
      const right = width < 480 ? 77 : 90;
      const top = 18;
      const bottom = 34;

      const plotRight = width - right;
      const plotBottom = height - bottom;
      const plotWidth = plotRight - left;
      const plotHeight = plotBottom - top;

      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, width, height);

      if (!all.length) {
        ctx.fillStyle = colors.muted;
        ctx.font = "14px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          "Waiting for candle data...",
          width / 2,
          height / 2
        );

        animationFrame = requestAnimationFrame(draw);
        return;
      }

      // Reserve 4 candle spaces after latest candle.
      const futureSpace = Math.max(
        20,
        Math.min(60, candleGap * 4)
      );

      const capacity = Math.max(
        8,
        Math.floor(
          Math.max(
            candleGap * 8,
            plotWidth - futureSpace
          ) / candleGap
        )
      );

      const safeOffset = Math.min(
        offset,
        Math.max(0, all.length - capacity)
      );

      const endIndex = all.length - safeOffset;
      const startIndex = Math.max(
        0,
        endIndex - capacity
      );

      const rows = all.slice(
        startIndex,
        endIndex
      );

      if (!rows.length) {
        animationFrame = requestAnimationFrame(draw);
        return;
      }

      const last = rows[rows.length - 1];

      const lastX = plotRight - futureSpace;

      const xAt = index =>
        lastX -
        (rows.length - 1 - index) * candleGap;

      // Calculate visible price range.
      const values = rows.flatMap(c => [
        c.high,
        c.low
      ]);

      const isLiveView = safeOffset === 0;

      const serverPrice =
        livePrice !== null &&
        livePrice !== undefined &&
        Number.isFinite(Number(livePrice))
          ? Number(livePrice)
          : all[all.length - 1].close;

      if (
        smoothPrice === null ||
        !Number.isFinite(smoothPrice)
      ) {
        smoothPrice = serverPrice;
      }

      smoothPrice +=
        (serverPrice - smoothPrice) * 0.14;

      const markerPrice = isLiveView
        ? smoothPrice
        : last.close;

      values.push(markerPrice);

      const initialMin = Math.min(...values);
      const initialMax = Math.max(...values);

      const initialRange = Math.max(
        initialMax - initialMin,
        symbol === "BTC/USD" ? 1 : 0.00005
      );

      activeTrades.forEach(trade => {
        const entry = Number(trade.entryPrice);

        if (
          trade.entryPrice != null &&
          Number.isFinite(entry) &&
          Math.abs(entry - markerPrice) <
            initialRange * 2
        ) {
          values.push(entry);
        }
      });

      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);

      const range = Math.max(
        maxValue - minValue,
        symbol === "BTC/USD" ? 2 : 0.00008
      );

      const targetMin = minValue - range * 0.22;
      const targetMax = maxValue + range * 0.22;

      // Price scale stays stable while live updates.
      if (!scaleRef.current) {
        scaleRef.current = {
          min: targetMin,
          max: targetMax
        };
      } else {
        const scale = scaleRef.current;

        const minSpeed =
          targetMin < scale.min ? 0.20 : 0.025;

        const maxSpeed =
          targetMax > scale.max ? 0.20 : 0.025;

        scale.min +=
          (targetMin - scale.min) * minSpeed;

        scale.max +=
          (targetMax - scale.max) * maxSpeed;
      }

      const scaleMin = scaleRef.current.min;
      const scaleMax = scaleRef.current.max;

      const scaleRange = Math.max(
        scaleMax - scaleMin,
        0.00000001
      );

      const yAt = price =>
        top +
        ((scaleMax - price) / scaleRange) *
          plotHeight;

      // Clip chart to plotting region.
      ctx.save();
      ctx.beginPath();
      ctx.rect(
        left,
        top,
        plotWidth,
        plotHeight
      );
      ctx.clip();

      // Horizontal grid.
      ctx.lineWidth = 1;
      ctx.strokeStyle = colors.grid;
      ctx.setLineDash([3, 7]);

      for (let i = 0; i <= 6; i++) {
        const y =
          top + (plotHeight * i) / 6;

        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(plotRight, y);
        ctx.stroke();
      }

      // Vertical grid.
      const verticalEvery = Math.max(
        1,
        Math.ceil(100 / candleGap)
      );

      for (
        let i = rows.length - 1;
        i >= 0;
        i -= verticalEvery
      ) {
        const x = xAt(i);

        if (x < left || x > plotRight) continue;

        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.lineTo(x, plotBottom);
        ctx.stroke();
      }

      ctx.setLineDash([]);

      // Candles.
      const candleWidth = Math.max(
        2.5,
        Math.min(11, candleGap * 0.55)
      );

      rows.forEach((c, index) => {
        const x = xAt(index);

        if (
          x < left - candleGap ||
          x > plotRight + candleGap
        ) {
          return;
        }

        const color =
          c.close >= c.open
            ? colors.green
            : colors.red;

        const openY = yAt(c.open);
        const closeY = yAt(c.close);
        const highY = yAt(c.high);
        const lowY = yAt(c.low);

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;

        // Wick
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Body
        ctx.fillStyle = color;
        ctx.fillRect(
          x - candleWidth / 2,
          Math.min(openY, closeY),
          candleWidth,
          Math.max(
            1.5,
            Math.abs(closeY - openY)
          )
        );
      });

      // Trade entry lines.
      activeTrades.forEach(trade => {
        if (
          trade.entryPrice === null ||
          trade.entryPrice === undefined
        ) {
          return;
        }

        const entry = Number(trade.entryPrice);
        if (!Number.isFinite(entry)) return;

        const y = yAt(entry);

        if (y < top || y > plotBottom) return;

        const color =
          trade.direction === "buy"
            ? colors.green
            : colors.red;

        ctx.strokeStyle = color;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([7, 5]);

        ctx.beginPath();
        ctx.moveTo(left, y);
        ctx.lineTo(plotRight, y);
        ctx.stroke();

        ctx.setLineDash([]);

        ctx.fillStyle = color;
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "left";

        const amount = Number(
          trade.amountUSD || 0
        ).toFixed(2);

        ctx.fillText(
          `${trade.direction.toUpperCase()} $${amount}`,
          left + 8,
          Math.max(top + 12, y - 8)
        );
      });

      // Current price line.
      const markerY = yAt(markerPrice);

      const markerColor =
        markerPrice >= last.open
          ? colors.green
          : colors.red;

      ctx.strokeStyle = markerColor;
      ctx.lineWidth = 1.1;
      ctx.setLineDash([5, 5]);

      ctx.beginPath();
      ctx.moveTo(left, markerY);
      ctx.lineTo(plotRight, markerY);
      ctx.stroke();

      ctx.setLineDash([]);

      // Crosshair.
      const crosshair = crosshairRef.current;

      if (crosshair) {
        const cx = Math.max(
          left,
          Math.min(plotRight, crosshair.x)
        );

        const cy = Math.max(
          top,
          Math.min(plotBottom, crosshair.y)
        );

        ctx.strokeStyle = colors.crosshair;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 5]);

        ctx.beginPath();
        ctx.moveTo(cx, top);
        ctx.lineTo(cx, plotBottom);
        ctx.moveTo(left, cy);
        ctx.lineTo(plotRight, cy);
        ctx.stroke();

        ctx.setLineDash([]);
      }

      ctx.restore();

      // Right price axis.
      ctx.fillStyle = colors.muted;
      ctx.font = width < 480
        ? "11px Arial"
        : "12px Arial";
      ctx.textAlign = "left";

      for (let i = 0; i <= 6; i++) {
        const y =
          top + (plotHeight * i) / 6;

        const value =
          scaleMax - (scaleRange * i) / 6;

        ctx.fillText(
          priceText(value),
          plotRight + 7,
          y + 4
        );
      }

      // Price marker tag.
      const labelY = Math.max(
        top + 14,
        Math.min(plotBottom - 14, markerY)
      );

      ctx.fillStyle = markerColor;
      ctx.fillRect(
        plotRight,
        labelY - 14,
        right,
        28
      );

      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px Arial";
      ctx.textAlign = "left";

      ctx.fillText(
        priceText(markerPrice),
        plotRight + 6,
        labelY + 4
      );

      // Time axis.
      ctx.fillStyle = colors.muted;
      ctx.font = "11px Arial";
      ctx.textAlign = "center";

      const timeStep = Math.max(
        1,
        Math.ceil(85 / candleGap)
      );

      for (
        let i = rows.length - 1;
        i >= 0;
        i -= timeStep
      ) {
        const x = xAt(i);

        if (
          x < left + 25 ||
          x > plotRight - 25
        ) {
          continue;
        }

        ctx.fillText(
          timeText(rows[i].time),
          x,
          height - 12
        );
      }

      // Crosshair price label.
      if (crosshair) {
        const cy = Math.max(
          top,
          Math.min(plotBottom, crosshair.y)
        );

        const hoveredPrice =
          scaleMax -
          ((cy - top) / plotHeight) *
            scaleRange;

        ctx.fillStyle = "#34445b";
        ctx.fillRect(
          plotRight,
          cy - 12,
          right,
          24
        );

        ctx.fillStyle = "#fff";
        ctx.font = "11px Arial";
        ctx.textAlign = "left";

        ctx.fillText(
          priceText(hoveredPrice),
          plotRight + 6,
          cy + 4
        );
      }

      // History mode indicator.
      if (!isLiveView) {
        ctx.fillStyle = "rgba(17,28,43,0.9)";
        ctx.fillRect(left + 8, top + 8, 100, 25);

        ctx.fillStyle = colors.muted;
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "left";
        ctx.fillText(
          "HISTORY VIEW",
          left + 17,
          top + 25
        );
      }

      animationFrame = requestAnimationFrame(draw);
    };

    animationFrame = requestAnimationFrame(draw);

    return () => {
      active = false;
      cancelAnimationFrame(animationFrame);
    };
  }, [size, symbol, priceDecimals]);

  const latest = validCandles.at(-1);

  const toolbarButton = {
    border: `1px solid ${colors.border}`,
    background: colors.panel,
    color: colors.text,
    borderRadius: 8,
    padding: "8px 12px",
    fontWeight: 700,
    fontSize: 12,
    cursor: "pointer"
  };

  return (
    <div
      style={{
        width: "100%",
        minWidth: 0,
        background: colors.background,
        border: `1px solid ${colors.border}`,
        borderRadius: 12,
        overflow: "hidden"
      }}
    >
      {/* Chart toolbar */}
      <div
        style={{
          padding: "12px 14px",
          borderBottom: `1px solid ${colors.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexWrap: "wrap"
            }}
          >
            <strong
              style={{
                fontSize: 19,
                color: colors.text
              }}
            >
              {symbol}
            </strong>

            <span
              style={{
                fontSize: 11,
                color: colors.muted
              }}
            >
              5s · Simulated candles
            </span>
          </div>

          {latest && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 7,
                fontSize: 11,
                color: colors.muted
              }}
            >
              <span>
                O {latest.open.toFixed(priceDecimals)}
              </span>
              <span>
                H {latest.high.toFixed(priceDecimals)}
              </span>
              <span>
                L {latest.low.toFixed(priceDecimals)}
              </span>
              <span>
                C {latest.close.toFixed(priceDecimals)}
              </span>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            gap: 7,
            flexWrap: "wrap",
            alignItems: "center"
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: connected
                ? colors.green
                : "#eab85a"
            }}
          >
            ● {connected ? "LIVE FEED" : "CONNECTING"}
          </span>

          <button
            type="button"
            onClick={() => scrollChart(15)}
            style={toolbarButton}
            title="Previous candles"
          >
            ←
          </button>

          <button
            type="button"
            onClick={() => scrollChart(-15)}
            style={toolbarButton}
            title="Newer candles"
          >
            →
          </button>

          <button
            type="button"
            onClick={zoomOut}
            style={toolbarButton}
            title="Zoom out"
          >
            −
          </button>

          <button
            type="button"
            onClick={zoomIn}
            style={toolbarButton}
            title="Zoom in"
          >
            +
          </button>

          <button
            type="button"
            onClick={goLive}
            style={{
              ...toolbarButton,
              background: colors.blue
            }}
          >
            ↪ Live
          </button>

          <button
            type="button"
            onClick={resetChart}
            style={toolbarButton}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Interactive chart */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "clamp(420px, 65vh, 680px)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={event => {
            event.currentTarget.setPointerCapture(
              event.pointerId
            );

            dragRef.current = {
              x: event.clientX,
              startOffset: scrollRef.current
            };
          }}
          onPointerMove={event => {
            const rect =
              event.currentTarget.getBoundingClientRect();

            if (dragRef.current) {
              const distance =
                event.clientX - dragRef.current.x;

              const movedCandles = Math.round(
                distance / spacingRef.current
              );

              setScrollOffset(
                Math.max(
                  0,
                  Math.min(
                    maxScroll,
                    dragRef.current.startOffset +
                      movedCandles
                  )
                )
              );

              crosshairRef.current = null;
            } else {
              crosshairRef.current = {
                x: event.clientX - rect.left,
                y: event.clientY - rect.top
              };
            }
          }}
          onPointerUp={event => {
            if (
              event.currentTarget.hasPointerCapture(
                event.pointerId
              )
            ) {
              event.currentTarget.releasePointerCapture(
                event.pointerId
              );
            }

            dragRef.current = null;
          }}
          onPointerCancel={() => {
            dragRef.current = null;
          }}
          onPointerLeave={() => {
            if (!dragRef.current) {
              crosshairRef.current = null;
            }
          }}
          onWheel={event => {
            event.preventDefault();

            if (event.shiftKey) {
              scrollChart(
                event.deltaY > 0 ? 4 : -4
              );
            } else {
              setSpacing(v =>
                Math.max(
                  5,
                  Math.min(
                    32,
                    v + (event.deltaY < 0 ? 2 : -2)
                  )
                )
              );

              scaleRef.current = null;
            }
          }}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            cursor: "grab",
            touchAction: "none"
          }}
        />
      </div>

      {/* Footer */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          padding: "10px 14px",
          borderTop: `1px solid ${colors.border}`,
          color: colors.muted,
          fontSize: 11
        }}
      >
        <span>5-second OHLC candles</span>
        <span>Drag / Swipe to scroll · Wheel to zoom</span>
        <span>Asia/Kolkata · Simulated</span>
      </div>
    </div>
  );
}

const POINT_SIZE = { "EUR/USD": 0.001, "GBP/USD": 0.001, "BTC/USD": 1 };

function estimateTrade(trade, currentPrice) {
  if (trade.status !== "open" || !Number.isFinite(Number(currentPrice)) || currentPrice === null) return null;
  const pointSize = Number(trade.pointSize) > 0
    ? Number(trade.pointSize) : POINT_SIZE[trade.symbol];
  if (!pointSize) return null;
  const signedPoints = (Number(currentPrice) - Number(trade.entryPrice)) / pointSize;
  const directionalPoints = signedPoints * (trade.direction === "buy" ? 1 : -1);
  const multiplier = directionalPoints > 0 ? Math.min(10, directionalPoints / 100) : directionalPoints === 0 ? 1 : 0;
  const gross = Math.round(Number(trade.amountUSD) * multiplier * 100) / 100;
  return { points: directionalPoints, multiplier, profit: Math.round((gross - Number(trade.amountUSD)) * 100) / 100 };
}

function TradeTable({ trades, now, prices = {}, onClose, closingId }) {
  if (!trades.length) return <p style={{ color: C.muted }}>No trades yet.</p>;
  const th = { padding: 12, borderBottom: `1px solid ${C.border}`, color: C.muted, whiteSpace: "nowrap" };
  const td = { padding: 12, whiteSpace: "nowrap", borderBottom: `1px solid ${C.grid}` };
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", minWidth: 940, borderCollapse: "collapse", textAlign: "left", fontSize: 13 }}>
        <thead><tr>{["Asset", "Side", "Amount", "Entry", "Current / Exit", "Points", "Multiplier", "Net P/L", "Status", "Action"].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead>
        <tbody>{trades.map(t => {
          const isOpen = t.status === "open";
          const current = prices[t.symbol];
          const estimate = estimateTrade(t, current);
          const net = isOpen ? estimate?.profit : Number(t.profitUSD || 0);
          const points = isOpen ? estimate?.points : (Number.isFinite(Number(t.signedPoints)) && t.signedPoints != null ? Number(t.signedPoints) * (t.direction === "buy" ? 1 : -1) : null);
          const multiplier = isOpen ? estimate?.multiplier : t.demoMultiplier;
          const fixedDuration = isOpen && Boolean(t.expiresAt);
          const remaining = fixedDuration ? Math.max(0, Math.ceil((new Date(t.expiresAt).getTime() - now) / 1000)) : null;
          return <tr key={t._id}>
            <td style={td}>{t.symbol}</td>
            <td style={{ ...td, color: t.direction === "buy" ? C.green : C.red, fontWeight: 800 }}>{t.direction.toUpperCase()}</td>
            <td style={td}>${fmt(t.amountUSD)}</td>
            <td style={td}>{Number(t.entryPrice).toFixed(decimals(t.symbol))}</td>
            <td style={td}>{(isOpen ? current : t.exitPrice) == null ? "—" : Number(isOpen ? current : t.exitPrice).toFixed(decimals(t.symbol))}</td>
            <td style={td}>{points == null ? "—" : `${points >= 0 ? "+" : ""}${points.toFixed(2)}`}</td>
            <td style={td}>{multiplier == null ? "—" : `${Number(multiplier).toFixed(2)}×`}</td>
            <td style={{ ...td, color: net == null ? C.muted : net > 0 ? C.green : net < 0 ? C.red : C.muted, fontWeight: 800 }}>
              {net == null ? "—" : `${net > 0 ? "+" : net < 0 ? "−" : ""}$${fmt(Math.abs(net))}`}{isOpen ? " est." : ""}
            </td>
            <td style={td}>{isOpen ? (fixedDuration ? `OPEN · ${remaining}s` : "OPEN · Manual") : t.status.toUpperCase()}</td>
            <td style={td}>{isOpen && !fixedDuration && onClose ? <button type="button" disabled={Boolean(closingId) || current == null} onClick={() => onClose(t._id)} style={{ ...buttonStyle, background: C.blue, opacity: closingId || current == null ? .5 : 1, padding: "9px 16px" }}>{closingId === t._id ? "Closing..." : "EXIT"}</button> : "—"}</td>
          </tr>;
        })}</tbody>
      </table>
      <p style={{ color: C.muted, fontSize: 11, padding: "0 12px" }}>Live P/L is an estimate from the latest simulated price. Final result is calculated by the server on EXIT.</p>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [overview, setOverview] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    email: "",
    password: "",
    name: "",
    country: "India"
  });
  const [page, setPage] = useState("Trading");
  const [symbol, setSymbol] = useState("EUR/USD");
  const [amount, setAmount] = useState("10");
  const [candles, setCandles] = useState([]);
  const [price, setPrice] = useState(null);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [closingId, setClosingId] = useState(null);
  const [prices, setPrices] = useState({});
  const [message, setMessage] = useState("");
  const [depositForm, setDepositForm] = useState({
    amountUSD: "100",
    method: "UPI",
    reference: ""
  });
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    message: ""
  });
  const refresh = useCallback(async () => {
    const data = await api("/me/overview");
    setOverview(data);
    setUser(data.user);
  }, []);
  useEffect(() => {
    if (!token()) return;
    api("/auth/me")
      .then(data => setUser(data.user))
      .catch(() => {
        sessionStorage.removeItem("qx_token");
      });
  }, []);
  useEffect(() => {
    if (!user) return;
    let stopped = false;
    let loading = false;
    const poll = async () => {
      if (stopped || loading) return;
      loading = true;
      try {
        await refresh();
      } catch (error) {
        console.error(error);
      } finally {
        loading = false;
      }
    };
    poll();
    const id = setInterval(poll, 3000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [Boolean(user), refresh]);
  useEffect(() => {
    if (!user) return;
    let stopped = false;
    let loading = false;
    setCandles([]);
    setPrice(null);
    setConnected(false);
    const poll = async () => {
      if (stopped || loading) return;
      loading = true;
      try {
        const data = await api(
          "/trading/chart?symbol=" +
          encodeURIComponent(symbol)
        );
        if (stopped) return;
        if (!Array.isArray(data.candles)) {
          throw Error("Invalid chart data");
        }
        setCandles(data.candles);
        setPrice(data.currentPrice);
      setPrices(prev => ({ ...prev, [symbol]: data.currentPrice }));
setConnected(
  data.marketOpen === true ||
  (
    data.marketOpen === undefined &&
    data.currentPrice !== null &&
    data.currentPrice !== undefined &&
    Number.isFinite(Number(data.currentPrice)) &&
    data.candles.length > 0
  )
);      } catch (error) {
        if (!stopped) {
          setConnected(false);
          console.error("Chart error:", error);
        }
      } finally {
        loading = false;
      }
    };
    poll();
    const id = setInterval(poll, 1000);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [Boolean(user), symbol]);
  useEffect(() => {
    if (!user) return;
    let stopped = false;
    const poll = async () => {
      try {
        const result = await api("/trading/prices");
        if (!stopped && result.prices) setPrices(result.prices);
      } catch (error) { console.error("Price refresh:", error); }
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => { stopped = true; clearInterval(id); };
  }, [Boolean(user)]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  async function submitAuth(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const body = authMode === "register"
        ? authForm
        : {
            email: authForm.email,
            password: authForm.password
          };
      const data = await api(
        "/auth/" + authMode,
        "POST",
        body
      );
      sessionStorage.setItem("qx_token", data.token);
      setUser(data.user);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function place(direction) {
    const investment = Number(amount);
    if (
      !Number.isFinite(investment) ||
      investment < 1 ||
      investment > 1000 ||
      Math.abs(
        investment * 100 - Math.round(investment * 100)
      ) > 1e-7
    ) {
      setMessage("Investment must be $1–$1000.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      await api("/trading/place", "POST", {
        symbol,
        direction,
        amountUSD: investment
      });
      setMessage(
        `${direction.toUpperCase()} demo trade opened. Close it anytime with EXIT.`
      );
      await refresh();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function closeTrade(tradeId) {
    if (closingId) return;
    setClosingId(tradeId);
    setMessage("");
    try {
      const result = await api(`/trading/${tradeId}/close`, "POST");
      setMessage(`Trade closed. Net P/L: ${result.trade.profitUSD >= 0 ? "+" : ""}$${fmt(result.trade.profitUSD)}`);
      await refresh();
    } catch (error) {
      setMessage(error.message || "Could not close trade");
    } finally {
      setClosingId(null);
    }
  }

  async function submitDeposit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await api("/me/deposits", "POST", {
        amountUSD: Number(depositForm.amountUSD),
        method: depositForm.method,
        reference: depositForm.reference
      });
      setMessage("Deposit request submitted.");
      await refresh();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function submitTicket(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      await api("/me/tickets", "POST", ticketForm);
      setTicketForm({ subject: "", message: "" });
      setMessage("Support ticket submitted.");
      await refresh();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }
  function logout() {
    sessionStorage.removeItem("qx_token");
    setUser(null);
    setOverview(null);
    setCandles([]);
    setMessage("");
  }
  const trades = overview?.trades || [];
  const open = trades.filter(t => t.status === "open");
  const closed = trades.filter(t => t.status !== "open");
  const currentOpen = open.filter(t => t.symbol === symbol);
  if (!user) {
    return (
      <div style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        display: "grid",
        placeItems: "center",
        padding: 20,
        fontFamily: "Inter, Arial, sans-serif"
      }}>
        <Panel style={{ width: "100%", maxWidth: 400 }}>
          <h1 style={{ color: C.blue }}>◈ Quotexx</h1>
          <p style={{ color: C.muted }}>
            Independent demo trading simulation
          </p>
          <h2>
            {authMode === "login" ? "Login" : "Register"}
          </h2>
          <form onSubmit={submitAuth}>
            {authMode === "register" && (
              <>
                <Field
                  label="Name"
                  value={authForm.name}
                  onChange={e => setAuthForm({
                    ...authForm,
                    name: e.target.value
                  })}
                />
                <Field
                  label="Country"
                  value={authForm.country}
                  onChange={e => setAuthForm({
                    ...authForm,
                    country: e.target.value
                  })}
                />
              </>
            )}
            <Field
              label="Email"
              type="email"
              required
              value={authForm.email}
              onChange={e => setAuthForm({
                ...authForm,
                email: e.target.value
              })}
            />
            <Field
              label="Password"
              type="password"
              required
              minLength={authMode === "register" ? 10 : 1}
              value={authForm.password}
              onChange={e => setAuthForm({
                ...authForm,
                password: e.target.value
              })}
            />
            <button
              disabled={busy}
              style={{
                ...buttonStyle,
                width: "100%",
                background: C.blue
              }}
            >
              {authMode === "login" ? "Login" : "Register"}
            </button>
          </form>
          {message && (
            <p style={{ color: C.red }}>{message}</p>
          )}
          <button
            onClick={() => {
              setAuthMode(
                authMode === "login" ? "register" : "login"
              );
              setMessage("");
            }}
            style={{
              background: "none",
              border: 0,
              color: C.blue,
              marginTop: 18,
              cursor: "pointer"
            }}
          >
            {authMode === "login"
              ? "Create account"
              : "Already have an account? Login"}
          </button>
        </Panel>
      </div>
    );
  }
  return (
    <div style={{
      minHeight: "100vh",
      background: C.bg,
      color: C.text,
      fontFamily: "Inter, Arial, sans-serif"
    }}>
      <header style={{
        background: C.panel,
        borderBottom: `1px solid ${C.border}`,
        padding: "13px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 14
      }}>
        <strong style={{ fontSize: 24, color: C.blue }}>
          ◈ Quotexx
        </strong>
        <nav style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 7
        }}>
          {["Trading", "Wallet", "Support", "Account"]
            .map(item => (
              <button
                key={item}
                onClick={() => {
                  setPage(item);
                  setMessage("");
                }}
                style={{
                  ...buttonStyle,
                  background: page === item
                    ? C.blue
                    : C.panel2
                }}
              >
                {item}
              </button>
            ))}
        </nav>
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 16
        }}>
          <div>
            <small style={{
              display: "block",
              color: C.muted
            }}>
              Demo Balance
            </small>
            <strong style={{
              fontSize: 19,
              color: C.green
            }}>
              ${fmt(user.demoBalance ?? 10000)}
            </strong>
          </div>
          <button
            onClick={logout}
            style={{
              ...buttonStyle,
              background: C.panel2
            }}
          >
            Logout
          </button>
        </div>
      </header>
      <div style={{
        background: "#2b2416",
        color: C.yellow,
        padding: "8px 12px",
        textAlign: "center",
        fontSize: 12
      }}>
        DEMO TRADING · Simulated prices ·
        Not connected to real financial markets
      </div>
      {page === "Trading" && (
        <main style={{
          padding: 16,
          maxWidth: 1800,
          margin: "auto"
        }}>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 9,
            marginBottom: 14
          }}>
            {PAIRS.map(pair => (
              <button
                key={pair}
                onClick={() => setSymbol(pair)}
                style={{
                  ...buttonStyle,
                  background: pair === symbol
                    ? C.blue
                    : C.panel,
                  border: `1px solid ${C.border}`,
                  padding: "12px 22px"
                }}
              >
                {pair}
              </button>
            ))}
          </div>
          <div className="qx-trading-grid">
            <div style={{ minWidth: 0 }}>
              <div style={{color:'#9db4d0',fontSize:12,marginBottom:8}}>Admin-defined scheduled demo prices · Not live market data · Virtual funds only</div>
              <LiveTradingChart
                symbol={symbol}
                candles={candles}
                currentPrice={price}
                trades={currentOpen}
                connected={connected}
                now={now}
              />
            </div>
            <Panel style={{ alignSelf: "start" }}>
              <h2 style={{ marginTop: 0 }}>
                Place Demo Trade
              </h2>
              <div style={{
                padding: 15,
                background: C.panel2,
                borderRadius: 10,
                marginBottom: 18
              }}>
                <small style={{ color: C.muted }}>
                  Available Demo Funds
                </small>
                <h2 style={{
                  color: C.green,
                  margin: "7px 0 0"
                }}>
                  ${fmt(user.demoBalance ?? 10000)}
                </h2>
              </div>
              <Field
                label="Investment ($)"
                type="number"
                min="1"
                max="1000"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
              <Field
                label="Trade Mode"
                readOnly
                value="Manual EXIT · No fixed expiry"
              />
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                color: C.muted,
                fontSize: 14
              }}>
                <span>Demo return formula</span>
                <strong style={{ color: C.green }}>
                  Points ÷ 100
                </strong>
              </div>
              <div style={{
                background: "#102c27",
                border: "1px solid #205747",
                borderRadius: 10,
                padding: 17,
                margin: "16px 0"
              }}>
                <small style={{ color: C.muted }}>
                  Variable Demo Return
                </small>
                <h1 style={{
                  color: C.green,
                  margin: "8px 0"
                }}>
                  Depends on exit price
                </h1>
                <small style={{ color: C.muted }}>
                  200 points = 2x gross · 300 points = 3x gross · max 10x; losses can be 100%
                </small>
              </div>
              <button
                disabled={busy || !connected}
                onClick={() => place("buy")}
                style={{
                  ...buttonStyle,
                  background: C.green,
                  width: "100%",
                  padding: 19,
                  fontSize: 17,
                  marginBottom: 12,
                  opacity: busy || !connected ? 0.5 : 1
                }}
              >
                ↑ BUY / UP
              </button>
              <button
                disabled={busy || !connected}
                onClick={() => place("sell")}
                style={{
                  ...buttonStyle,
                  background: C.red,
                  width: "100%",
                  padding: 19,
                  fontSize: 17,
                  opacity: busy || !connected ? 0.5 : 1
                }}
              >
                ↓ SELL / DOWN
              </button>
              <p style={{
                color: C.muted,
                fontSize: 12,
                lineHeight: 1.7
              }}>
                No fixed duration. Use EXIT in Active Trades to close at the server-calculated demo price.
              </p>
            </Panel>
          </div>
          {message && (
            <Panel style={{ marginTop: 15 }}>
              {message}
            </Panel>
          )}
          <Panel style={{ marginTop: 16 }}>
            <h2>Active Trades ({open.length})</h2>
            <TradeTable trades={open} now={now} prices={prices} onClose={closeTrade} closingId={closingId} />
          </Panel>
          <Panel style={{ marginTop: 16 }}>
            <h2>Trade History</h2>
            <TradeTable trades={closed} now={now} prices={prices} />
          </Panel>
        </main>
      )}
      {page === "Wallet" && (
        <main style={{
          maxWidth: 950,
          margin: "auto",
          padding: 20
        }}>
          <h2>Wallet</h2>
          <div className="qx-wallet-grid">
            <Panel>
              <p style={{ color: C.muted }}>Demo Balance</p>
              <h1 style={{ color: C.green }}>
                ${fmt(user.demoBalance ?? 10000)}
              </h1>
            </Panel>
            <Panel>
              <p style={{ color: C.muted }}>Deposit Wallet</p>
              <h1>${fmt(user.balance)}</h1>
            </Panel>
          </div>
          <Panel style={{ marginTop: 18 }}>
            <h3>Deposit Request</h3>
            <p style={{ color: C.muted }}>
              This form records a request only.
              No payment is collected automatically.
            </p>
            <form onSubmit={submitDeposit}>
              <Field
                label="Amount ($)"
                type="number"
                min="10"
                max="952"
                required
                value={depositForm.amountUSD}
                onChange={e => setDepositForm({
                  ...depositForm,
                  amountUSD: e.target.value
                })}
              />
              <label style={{
                display: "block",
                marginBottom: 15,
                color: C.muted
              }}>
                Method
                <select
                  value={depositForm.method}
                  onChange={e => setDepositForm({
                    ...depositForm,
                    method: e.target.value
                  })}
                  style={inputStyle}
                >
                  <option>UPI</option>
                  <option>PhonePe</option>
                  <option>PayTM</option>
                  <option>USDT</option>
                </select>
              </label>
              <Field
                label="Reference"
                value={depositForm.reference}
                onChange={e => setDepositForm({
                  ...depositForm,
                  reference: e.target.value
                })}
              />
              <button
                disabled={busy}
                style={{
                  ...buttonStyle,
                  background: C.blue
                }}
              >
                Submit Request
              </button>
            </form>
            {message && <p>{message}</p>}
          </Panel>
          <Panel style={{ marginTop: 18 }}>
            <h3>Deposit History</h3>
            {(overview?.deposits || []).map(d => (
              <p key={d._id}>
                ${fmt(d.amountUSD)} · {d.method} · {d.status}
              </p>
            ))}
          </Panel>
          <Panel style={{ marginTop: 18 }}>
            <h3>Withdrawal History</h3>
            {(overview?.withdrawals || []).map(d => (
              <p key={d._id}>
                ${fmt(d.amountUSD)} · {d.method} · {d.status}
              </p>
            ))}
          </Panel>
        </main>
      )}
      {page === "Support" && (
        <main style={{
          maxWidth: 850,
          margin: "auto",
          padding: 20
        }}>
          <Panel>
            <h2>Support</h2>
            <form onSubmit={submitTicket}>
              <Field
                label="Subject"
                required
                value={ticketForm.subject}
                onChange={e => setTicketForm({
                  ...ticketForm,
                  subject: e.target.value
                })}
              />
              <label style={{ color: C.muted }}>
                Message
                <textarea
                  required
                  value={ticketForm.message}
                  onChange={e => setTicketForm({
                    ...ticketForm,
                    message: e.target.value
                  })}
                  style={{
                    ...inputStyle,
                    minHeight: 120,
                    marginBottom: 15
                  }}
                />
              </label>
              <button
                disabled={busy}
                style={{
                  ...buttonStyle,
                  background: C.blue
                }}
              >
                Send Ticket
              </button>
            </form>
            {message && <p>{message}</p>}
          </Panel>
          <Panel style={{ marginTop: 18 }}>
            <h3>My Tickets</h3>
            {(overview?.tickets || []).map(t => (
              <div key={t._id} style={{
                borderBottom: `1px solid ${C.border}`,
                padding: "12px 0"
              }}>
                <b>{t.subject}</b>
                <p>{t.message}</p>
                <small style={{ color: C.muted }}>
                  {t.status}
                </small>
                {t.reply && <p>Reply: {t.reply}</p>}
              </div>
            ))}
          </Panel>
        </main>
      )}
      {page === "Account" && (
        <main style={{
          maxWidth: 1100,
          margin: "auto",
          padding: 20
        }}>
          <Panel>
            <h2>Account</h2>
            <p>Email: {user.email}</p>
            <p>Name: {user.name || "—"}</p>
            <p>Country: {user.country}</p>
            <p>Status: {user.status}</p>
            <p>Demo Balance: ${fmt(user.demoBalance ?? 10000)}</p>
            <p>Deposit Balance: ${fmt(user.balance)}</p>
          </Panel>
          <Panel style={{ marginTop: 18 }}>
            <h2>All Trades</h2>
            <TradeTable trades={trades} now={now} prices={prices} onClose={closeTrade} closingId={closingId} />
          </Panel>
        </main>
      )}
    </div>
  );
}
createRoot(
  document.getElementById("root")
).render(<App />);
