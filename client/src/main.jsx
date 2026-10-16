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
  const pointersRef = useRef(new Map());
  const pinchRef = useRef(null);
  const scaleRef = useRef(null);
  const dataRef = useRef({});
  const scrollRef = useRef(0);

  const [size, setSize] = useState({
    width: 900,
    height: 560
  });

  const [spacing, setSpacing] = useState(38);
  const [scrollOffset, setScrollOffset] = useState(0);

  const spacingRef = useRef(spacing);
  spacingRef.current = spacing;
  scrollRef.current = scrollOffset;

  const priceDecimals =
    symbol === "BTC/USD" ? 2 : 5;

  const colors = {
    background: "#1d202c",
    panel: "#303343",
    border: "#343849",
    grid: "#414451",
    text: "#f0f0f3",
    muted: "#b1b2bd",
    green: "#0da45d",
    red: "#ed584b",
    crosshair: "#9094a2",
    blue: "#2899f5"
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
    setSpacing(v => Math.min(90, v + 5));
    scaleRef.current = null;
  };

  const zoomOut = () => {
    setSpacing(v => Math.max(9, v - 5));
    scaleRef.current = null;
  };

  const goLive = () => {
    setScrollOffset(0);
    scrollRef.current = 0;
    scaleRef.current = null;
  };

  const resetChart = () => {
    setSpacing(38);
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
        height: Math.max(180, element.clientHeight)
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
      const futureSpace = Math.min(plotWidth * 0.42, Math.max(88, plotWidth * 0.30));

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
      ctx.setLineDash([]);

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
        4,
        Math.min(76, candleGap * 0.9)
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

      // Screenshot-style beginning-of-trade guide and future expiry marker.
      const tradeLineX = lastX + candleGap * 0.5;
      ctx.save();
      ctx.strokeStyle = "#f4f4f5";
      ctx.lineWidth = 1.3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(tradeLineX, top);
      ctx.lineTo(tradeLineX, plotBottom);
      ctx.stroke();
      ctx.restore();
      // Only display a real expiry marker when the server supplies expiresAt.
      const nextExpiry = activeTrades.find(t => t.expiresAt);
      if (nextExpiry && rows.length > 1) {
        const interval = Math.max(1000, rows[rows.length - 1].time - rows[rows.length - 2].time);
        const expiry = new Date(nextExpiry.expiresAt).getTime();
        const endLineX = lastX + ((expiry - last.time) / interval) * candleGap;
        if (Number.isFinite(endLineX) && endLineX > left && endLineX < plotRight) {
          ctx.save();
          ctx.strokeStyle = "#626674";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(endLineX, top);
          ctx.lineTo(endLineX, plotBottom);
          ctx.stroke();
          ctx.restore();
        }
      }

      // Current price line.
      const markerY = yAt(markerPrice);

      const markerColor =
        markerPrice >= last.open
          ? colors.green
          : colors.red;

      ctx.strokeStyle = "#f4f4f5";
      ctx.lineWidth = 1.4;
      ctx.setLineDash([7, 6]);

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
        ? "10px Arial"
        : "11px Arial";
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

      ctx.fillStyle = colors.blue;
      ctx.beginPath();
      ctx.roundRect(plotRight + 2, labelY - 15, right - 4, 30, 14);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.font = "12px Arial";
      ctx.textAlign = "center";

      ctx.fillText(
        priceText(markerPrice),
        plotRight + right / 2,
        labelY + 4
      );

      // Time axis.
      ctx.fillStyle = colors.muted;
      ctx.font = "10px Arial";
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
        border: "none",
        borderRadius: 0,
        height: "100%",
        overflow: "hidden"
      }}
    >
      {/* Interactive chart */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={event => {
            event.currentTarget.setPointerCapture(event.pointerId);
            pointersRef.current.set(event.pointerId, {x:event.clientX,y:event.clientY});
            if (pointersRef.current.size === 2) {
              const [a,b] = [...pointersRef.current.values()];
              pinchRef.current = {distance:Math.hypot(a.x-b.x,a.y-b.y),spacing:spacingRef.current};
              dragRef.current = null;
            } else if (pointersRef.current.size === 1) {
              dragRef.current = {x:event.clientX,startOffset:scrollRef.current};
            }
          }}
          onPointerMove={event => {
            const rect = event.currentTarget.getBoundingClientRect();
            if (pointersRef.current.has(event.pointerId)) {
              pointersRef.current.set(event.pointerId,{x:event.clientX,y:event.clientY});
            }
            if (pointersRef.current.size === 2 && pinchRef.current) {
              const [a,b] = [...pointersRef.current.values()];
              const distance = Math.hypot(a.x-b.x,a.y-b.y);
              if (pinchRef.current.distance > 0) {
                setSpacing(Math.max(9,Math.min(90,pinchRef.current.spacing * distance/pinchRef.current.distance)));
                scaleRef.current = null;
              }
              crosshairRef.current = null;
            } else if (dragRef.current) {
              const distance = event.clientX - dragRef.current.x;
              const movedCandles = Math.round(distance / spacingRef.current);
              setScrollOffset(Math.max(0,Math.min(maxScroll,dragRef.current.startOffset+movedCandles)));
              crosshairRef.current = null;
            } else if (event.pointerType === "mouse") {
              crosshairRef.current = {x:event.clientX-rect.left,y:event.clientY-rect.top};
            }
          }}
          onPointerUp={event => {
            pointersRef.current.delete(event.pointerId);
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
            pinchRef.current = null;
            dragRef.current = null;
            if (pointersRef.current.size === 1) {
              const a = [...pointersRef.current.values()][0];
              dragRef.current = {x:a.x,startOffset:scrollRef.current};
            }
          }}
          onPointerCancel={event => {
            pointersRef.current.delete(event.pointerId);
            pinchRef.current = null;
            dragRef.current = null;
          }}
          onPointerLeave={() => {
            if (!dragRef.current && !pinchRef.current) crosshairRef.current = null;
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
                  9,
                  Math.min(
                    90,
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

const PAIR_CATALOG = [
  {symbol:"USD/COP", category:"CURRENCIES", flags:"🇺🇸🇨🇴"},
  {symbol:"USD/ZAR", category:"CURRENCIES", flags:"🇺🇸🇿🇦"},
  {symbol:"USD/INR", category:"CURRENCIES", flags:"🇺🇸🇮🇳"},
  {symbol:"USD/NGN", category:"CURRENCIES", flags:"🇺🇸🇳🇬"},
  {symbol:"EUR/GBP", category:"CURRENCIES", flags:"🇪🇺🇬🇧"},
  {symbol:"EUR/JPY", category:"CURRENCIES", flags:"🇪🇺🇯🇵"},
  {symbol:"NZD/CHF", category:"CURRENCIES", flags:"🇳🇿🇨🇭"},
  {symbol:"USD/MXN", category:"CURRENCIES", flags:"🇺🇸🇲🇽"},
  {symbol:"USD/PHP", category:"CURRENCIES", flags:"🇺🇸🇵🇭"},
  {symbol:"USD/ARS", category:"CURRENCIES", flags:"🇺🇸🇦🇷"},
  {symbol:"CAD/JPY", category:"CURRENCIES", flags:"🇨🇦🇯🇵"},
  {symbol:"EUR/USD", category:"CURRENCIES", flags:"🇪🇺🇺🇸"},
  {symbol:"GBP/USD", category:"CURRENCIES", flags:"🇬🇧🇺🇸"},
  {symbol:"BTC/USD", category:"CRYPTO", flags:"₿"}
];
const TIMER_OPTIONS = ["00:05","00:10","00:15","00:30","01:00","02:00","05:00","10:00","15:00","30:00","01:00:00","02:00:00"];
function formatDuration(seconds) {
  const h=Math.floor(seconds/3600),m=Math.floor(seconds%3600/60),s=seconds%60;
  return h ? [h,m,s].map(n=>String(n).padStart(2,"0")).join(":") : [m,s].map(n=>String(n).padStart(2,"0")).join(":");
}
function BottomNav({page,setPage}) {
  return <nav className="qx-bottom qx-global-bottom">
    {[["Trading","▣"],["Support","❔"],["Account","♟"],["Tournaments","🏆"],["More","•••"]].map(([name,icon])=><button key={name} aria-label={name} className={page===name?"selected":""} onClick={()=>setPage(name)}>{icon}</button>)}
  </nav>;
}
function PairPicker({onClose,onSelect,symbol,availablePairs,prices,candles}) {
  const [tab,setTab]=useState("CURRENCIES");
  const [query,setQuery]=useState("");
  const [favorites,setFavorites]=useState(()=>{try{return JSON.parse(localStorage.getItem("qx_favorite_pairs")||"[]")}catch{return []}});
  useEffect(()=>{localStorage.setItem("qx_favorite_pairs",JSON.stringify(favorites))},[favorites]);
  const [onlyFavorites,setOnlyFavorites]=useState(false);
  const [sort,setSort]=useState("Name");
  const rows=[...PAIR_CATALOG,...availablePairs.filter(sym=>!PAIR_CATALOG.some(p=>p.symbol===sym)).map(sym=>({symbol:sym,category:sym.includes("BTC")||sym.includes("ETH")?"CRYPTO":"CURRENCIES",flags:"🌐"}))].filter(p=>(tab==="CRYPTO"?p.category==="CRYPTO":tab==="CURRENCIES"?p.category==="CURRENCIES":false)).filter(p=>p.symbol.toLowerCase().includes(query.toLowerCase())).filter(p=>!onlyFavorites||favorites.includes(p.symbol)).sort((a,b)=>sort==="Name"?a.symbol.localeCompare(b.symbol):0);
  const first=Number(candles?.[0]?.open),last=Number(candles?.[candles.length-1]?.close);
  return <div className="qx-overlay" role="dialog" aria-label="Select trade pair">
    <div className="qx-overlay-head"><strong>Select trade pair</strong><button onClick={onClose}>×</button></div>
    <div className="qx-category-tabs">{["CURRENCIES","CRYPTO","COMMODITIES","STOCKS"].map(t=><button className={tab===t?"active":""} key={t} onClick={()=>setTab(t)}>{t}</button>)}</div>
    <div className="qx-pair-search"><button className={onlyFavorites?"active":""} onClick={()=>setOnlyFavorites(v=>!v)}>★ {favorites.length}</button><input placeholder="⌕   Search" value={query} onChange={e=>setQuery(e.target.value)}/></div>
    <div className="qx-sort">Sort by: <button onClick={()=>setSort(v=>v==="Name"?"Default":"Name")}>{sort} ▾</button></div>
    <div className="qx-pair-list">{rows.length?rows.map(p=>{
      const enabled=availablePairs.includes(p.symbol);
      const change=p.symbol===symbol&&Number.isFinite(first)&&first!==0&&Number.isFinite(last)?(last-first)/first*100:null;
      return <div className="qx-pair-item" key={p.symbol}>
        <button className={favorites.includes(p.symbol)?"qx-star active":"qx-star"} onClick={()=>setFavorites(f=>f.includes(p.symbol)?f.filter(x=>x!==p.symbol):[...f,p.symbol])}>☆</button>
        <button className="qx-pair-choice" onClick={()=>enabled&&onSelect(p.symbol)} disabled={!enabled}>
          <span className="qx-pair-name"><span>{p.flags}</span> {p.symbol}{p.symbol.includes("USD/")||p.symbol==="EUR/USD"||p.symbol==="GBP/USD"?" (OTC)":""}</span>
          <small>{enabled?"Available to trade · Points-based":"Not enabled by trading server"}</small>
        </button>
        {p.symbol===symbol&&<span className="qx-current-pair">✓</span>}
        <span className={change===null?"qx-change muted":change>=0?"qx-change up":"qx-change down"}>{change===null?"—":`${change>=0?"↑ +":"↓ "}${change.toFixed(2)}%`}</span>
      </div>;
    }):<p className="qx-empty">No instruments available in this category.</p>}</div>
  </div>;
}
function MoreScreen({setPage,logout}) {
  const sections=[["Market","▤"],["Analytics","◉"],["TOP","▥"],["Signals","◎"]];
  return <main className="qx-more qx-screen"><h2>More <button onClick={()=>setPage("Trading")}>×</button></h2>
    {sections.map(([name,icon])=><button className="qx-more-card" key={name} onClick={()=>setPage(name)}><span>{icon}</span><b>{name}</b><span className="qx-more-arrow">›</span></button>)}
    <div className="qx-more-links">{[["Deposit","Wallet"],["Withdrawal","Withdrawal"],["Payments","Payments"],["Trades","Trades"]].map(([label,target])=><button key={label} onClick={()=>setPage(target)}>{label}</button>)}</div>
    <div className="qx-more-settings"><button onClick={()=>setPage("Settings")}>⚙ Settings</button><button onClick={logout}>⇥ Logout</button></div>
    <div className="qx-more-foot"><button onClick={()=>setPage("Install App")}> &nbsp; Install App</button><button onClick={()=>setPage("Support")}>▢ &nbsp; Join Us</button></div>
  </main>;
}
function TournamentScreen({overview}) {
  const [tab,setTab]=useState("ACTIVE");
  const tournaments=Array.isArray(overview?.tournaments)?overview.tournaments:[];
  const rows=tournaments.filter(t=>tab==="ACTIVE"?t.status!=="completed":t.status==="completed");
  return <main className="qx-tournaments qx-screen"><div className="qx-tournament-tabs">{["ACTIVE","COMPLETED"].map(t=><button key={t} className={tab===t?"active":""} onClick={()=>setTab(t)}>{t} {t==="ACTIVE"&&tournaments.length>0?tournaments.length:""}</button>)}</div>
    <h3>{tab==="ACTIVE"?"Available for participation":"Completed tournaments"} ({rows.length})</h3>
    {rows.length?rows.map((t,i)=><article className="qx-tournament-card" key={t._id||i}><div className="qx-tournament-banner"><strong>{t.name||"Tournament"}</strong><span>PRIZE POOL<br/><b>{Number(t.prizePoolUSD||0).toLocaleString()} $</b></span></div><div className="qx-tournament-stats"><span><b>{t.entryFeeUSD??0} $</b><small>Entry fee</small></span><span><b>{t.durationDays??"—"} days</b><small>Duration</small></span></div><p>{t.description||"See tournament rules for details."}</p></article>):<p className="qx-empty">No {tab.toLowerCase()} tournaments have been published by your server.</p>}
  </main>;
}
function ProfileScreen({user,onSaved}) {
  const [profile,setProfile]=useState({nickname:user.nickname||user.name||"",firstName:user.firstName||"",lastName:user.lastName||"",dob:user.dob||"",address:user.address||"",country:user.country||"India"});
  const [saving,setSaving]=useState(false);
  async function saveProfile(e){e.preventDefault();setSaving(true);setNotice("");try{await api("/me/profile","PATCH",profile);setNotice("Profile saved successfully.");onSaved?.()}catch(err){setNotice("Could not save profile: "+err.message+". Your changes were not saved.")}finally{setSaving(false)}}
  const [notice,setNotice]=useState("");
  return <main className="qx-profile qx-screen"><h3>Personal data:</h3><div className="qx-profile-user"><span className="qx-avatar">●</span><div><b>{user.email}</b><p>ID: {user._id?String(user._id).slice(-8):"—"}</p><span className="qx-unverified">Verification status: {user.verified?"Verified":"Not verified"}</span></div></div>
    <form onSubmit={saveProfile}>
      {[["Nickname","nickname","text"],["First Name","firstName","text"],["Last Name","lastName","text"],["Date of birth","dob","date"],["Email","email","email"],["Country","country","text"],["Address","address","text"]].map(([label,key,type])=><label className="qx-profile-field" key={key}><span>{label}</span><input type={type} readOnly={key==="email"} value={key==="email"?user.email:profile[key]} placeholder="Empty" onChange={e=>setProfile(p=>({...p,[key]:e.target.value}))}/></label>)}
      <button className="qx-profile-save" disabled={saving}>{saving?"Saving…":"Save"}</button>{notice&&<p className="qx-message">{notice}</p>}
    </form>
  </main>;
}
function MarketScreen({prices,setSymbol,setPage}) {
  const pairs=Object.entries(prices||{}).filter(([,price])=>Number.isFinite(Number(price))&&price!==null);
  return <main className="qx-screen qx-functional-screen"><h2>Market</h2><p>Prices supplied by your connected trading server. These are not independently verified exchange quotes.</p>{pairs.length?<div className="qx-market-list">{pairs.map(([pair,price])=><button key={pair} onClick={()=>{setSymbol(pair);setPage("Trading")}}><strong>{pair}</strong><span>{Number(price).toFixed(decimals(pair))}</span><span>›</span></button>)}</div>:<p>No market prices available from the server.</p>}</main>;
}
function SettingsScreen(){
  const [reduceMotion,setReduceMotion]=useState(()=>localStorage.getItem("qx_reduce_motion")==="true");
  useEffect(()=>{localStorage.setItem("qx_reduce_motion",String(reduceMotion));document.documentElement.classList.toggle("qx-reduce-motion",reduceMotion);return ()=>document.documentElement.classList.remove("qx-reduce-motion")},[reduceMotion]);
  return <main className="qx-screen qx-functional-screen"><h2>Settings</h2><label className="qx-settings-row"><span>Reduce interface animations</span><input type="checkbox" checked={reduceMotion} onChange={e=>setReduceMotion(e.target.checked)}/></label><p>Trading data and execution are controlled by the connected server.</p></main>;
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
  const [bonusVisible, setBonusVisible] = useState(true);
  const [pairMenu, setPairMenu] = useState(false);
  const [timerOpen,setTimerOpen] = useState(false);
  const [timerMode,setTimerMode] = useState("TIMER");
  const [timerSeconds,setTimerSeconds] = useState(60);
  const [manualTimer,setManualTimer] = useState(false);
  const [candles, setCandles] = useState([]);
  const [price, setPrice] = useState(null);
  const [connected, setConnected] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [busy, setBusy] = useState(false);
  const [closingId, setClosingId] = useState(null);
  const [prices, setPrices] = useState({});
  const [message, setMessage] = useState("");
  const [depositStep, setDepositStep] = useState("methods");
  const [depositTab, setDepositTab] = useState("POPULAR");
  const [fxRate, setFxRate] = useState(null);
  const [usdtRate, setUsdtRate] = useState(null);
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

  useEffect(() => {
    let active = true;
    const loadRates = async () => {
      try {
        const [inr, usdt] = await Promise.all([
          fetch("https://open.er-api.com/v6/latest/USD").then(r => r.json()),
          fetch("https://api.coinbase.com/v2/exchange-rates?currency=USDT").then(r => r.json())
        ]);
        if (active && inr?.result === "success") setFxRate(Number(inr.rates.INR));
        if (active && usdt?.data?.rates?.USD) setUsdtRate(Number(usdt.data.rates.USD));
      } catch (error) { console.warn("Exchange rate unavailable", error); }
    };
    loadRates();
    const id = setInterval(loadRates, 60 * 60 * 1000);
    return () => { active = false; clearInterval(id); };
  }, []);
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
       <header className="qx-top">
         <button className="qx-balance" onClick={() => setPage("Wallet")}><span className="qx-plane">➤</span><span className="qx-live">LIVE</span><strong>${fmt(user.balance ?? 0)}</strong><span>⌄</span></button>
         <button className="qx-bell" onClick={() => setPage("Support")}>♧ <span className="qx-count">2</span></button>
         <button className="qx-deposit" onClick={() => setPage("Wallet")}>Deposit</button>
       </header>
       {page === "Trading" && (
         <main className="qx-mobile-shell">
           {bonusVisible && <div className="qx-bonus"><span>🚀</span> Get a 50% bonus on your deposit! <b>50%</b><button onClick={() => setBonusVisible(false)}>×</button></div>}
           <section className="qx-chart-area">
             <div className="qx-chart-meta"><button onClick={() => setPage("More")}>•••</button><span>{new Date(now).toLocaleTimeString("en-GB", {timeZone:"Asia/Kolkata"})}<small>UTC+5:30</small></span><span className="qx-info">●</span></div>
             <LiveTradingChart symbol={symbol} candles={candles} currentPrice={price} trades={currentOpen} connected={connected} now={now} />
           </section>
           <section className="qx-trade-panel">
             <div className="qx-pair-row"><button className="qx-pair" onClick={() => setPairMenu(v => !v)}>🌐 &nbsp;{symbol} (OTC) <span>⌄</span></button><div className="qx-pending">PENDING TRADE <span className="qx-toggle" /></div></div>
             {pairMenu && <PairPicker onClose={()=>setPairMenu(false)} onSelect={p=>{setSymbol(p);setPairMenu(false)}} symbol={symbol} availablePairs={Array.isArray(overview?.pairs)&&overview.pairs.length?overview.pairs.filter(p=>p.enabled!==false).map(p=>typeof p==="string"?p:p.symbol).filter(Boolean):PAIRS} prices={prices} candles={candles}/>}
             <div className="qx-fields"><div className="qx-field qx-timer-field"><span>Timer</span><button className="qx-timer" onClick={()=>setTimerOpen(v=>!v)}>{formatDuration(timerSeconds)}</button>{timerOpen&&<div className="qx-timer-pop"><div className="qx-timer-tabs">{["TIMER","TIME"].map(t=><button key={t} className={timerMode===t?"active":""} onClick={()=>setTimerMode(t)}>{t}</button>)}</div>{timerMode==="TIMER"?<><div className="qx-timer-grid">{TIMER_OPTIONS.map((t,i)=><button className={timerSeconds===[5,10,15,30,60,120,300,600,900,1800,3600,7200][i]?"active":""} key={t} onClick={()=>{setTimerSeconds([5,10,15,30,60,120,300,600,900,1800,3600,7200][i]);setTimerOpen(false)}}>{t}</button>)}</div><button className="qx-timer-manual" onClick={()=>setManualTimer(v=>!v)}>Set manually</button>{manualTimer&&<input type="number" min="5" max="7200" aria-label="Seconds" value={timerSeconds} onChange={e=>setTimerSeconds(Math.max(5,Math.min(7200,Number(e.target.value)||5)))}/>}</>:<div className="qx-time-note">Choose an expiry time from the schedule provided by your trading server.</div>}</div>}</div><label className="qx-field"><span>Investment</span><div className="qx-invest"><button onClick={() => setAmount(String(Math.max(1,Number(amount || 1)-1)))}>−</button><input type="number" min="1" max="1000" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} /><button onClick={() => setAmount(String(Math.min(1000,Number(amount || 0)+1)))}>+</button></div></label></div>
             <div className="qx-payout"><span>Return</span><strong>Points-based</strong></div><p className="qx-timer-disclaimer">Timer is a display preference only. Trade settlement follows the published server schedule.</p>
             <div className="qx-actions"><button className="qx-buy" disabled={busy || !connected} onClick={() => place("buy")}>Buy <span>↑</span></button><button className="qx-sell" disabled={busy || !connected} onClick={() => place("sell")}>Sell <span>↓</span></button></div>
             {message && <div className="qx-message">{message}</div>}
           </section>
           <BottomNav page={page} setPage={setPage}/>
           {open.length > 0 && <details className="qx-history"><summary>Active Trades ({open.length})</summary><TradeTable trades={open} now={now} prices={prices} onClose={closeTrade} closingId={closingId}/></details>}
           {closed.length > 0 && <details className="qx-history"><summary>Trade History</summary><TradeTable trades={closed} now={now} prices={prices}/></details>}
         </main>
       )}
       {page !== "Trading" && page !== "Wallet" && <BottomNav page={page} setPage={setPage}/>}
       {page === "More" && <MoreScreen setPage={setPage} logout={logout}/>}
       {page === "Tournaments" && <TournamentScreen overview={overview}/>}
       {page === "Account" && <ProfileScreen user={user} onSaved={refresh}/>}
       {page === "Market"&&<MarketScreen prices={prices} setSymbol={setSymbol} setPage={setPage}/>}
       {page === "Settings"&&<SettingsScreen/>}
       {["Analytics","TOP","Signals","Withdrawal","Payments","Trades","Install App"].includes(page)&&<main className="qx-screen qx-placeholder"><h2>{page}</h2><p>{page === "Trades" ? "Trade history is shown below." : "This section needs a corresponding backend API to show live account data."}</p>{page === "Trades"&&<TradeTable trades={trades} now={now} prices={prices} onClose={closeTrade} closingId={closingId}/>}<button onClick={()=>setPage("More")}>Back to More</button></main>}
      {page === "Wallet" && (
        <main className="qx-deposit-page">
          <div className="qx-deposit-head"><strong>Deposit</strong><button onClick={() => {setPage("Trading");setDepositStep("methods")}}>×</button></div>
          <div className="qx-deposit-body">
            {depositStep === "methods" ? <>
              <div className="qx-country">◎ &nbsp; India <span>⌄</span></div>
              <div className="qx-deposit-tabs">{[["POPULAR","♨"],["E-PAY","▣"],["CRYPTO","⬡"]].map(([name,icon]) => <button key={name} className={depositTab===name?"active":""} onClick={()=>setDepositTab(name)}><b>{icon}</b>{name}</button>)}</div>
              <h2>{depositTab === "POPULAR" ? "Popular in your region (5)" : depositTab === "E-PAY" ? "E-Pay" : "Crypto"}</h2>
              <div className="qx-method-list">{[
                {name:"PhonePe",type:"E-PAY",icon:"पे",className:"phonepe",min:10},
                {name:"UPI",type:"E-PAY",icon:"UPI",className:"upi",min:10},
                {name:"Binance Pay",type:"CRYPTO",icon:"◆",className:"binance",min:10},
                {name:"PayTM",type:"E-PAY",icon:"paytm",className:"paytm",min:10},
                {name:"USDT (BEP-20)",type:"CRYPTO",icon:"₮",className:"usdt",min:20}
              ].filter(m=>depositTab==="POPULAR"||m.type===depositTab).map(m=><button className="qx-method" key={m.name} onClick={()=>{setDepositForm(f=>({...f,method:m.name}));setDepositStep("amount");setMessage("")}}><span className={"qx-pay-icon "+m.className}>{m.icon}</span><span className="qx-method-name">{m.name}<small>Min. ${m.min.toFixed(2)}</small></span><span className="qx-chevron">›</span></button>)}</div>
            </> : <>
              <div className="qx-method-summary"><div className="qx-summary-top"><span className="qx-pay-icon">{depositForm.method==="PhonePe"?"पे":depositForm.method==="USDT (BEP-20)"?"₮":depositForm.method==="Binance Pay"?"◆":depositForm.method==="UPI"?"UPI":"paytm"}</span><strong>{depositForm.method}</strong><button onClick={()=>setDepositStep("methods")}>CHANGE</button></div><div>Min amount: <strong>${depositForm.method==="USDT (BEP-20)"?"20.00":"10.00"}</strong></div><div>Max amount: <strong>$952.00</strong></div><div>Processing time: <strong>12 hours</strong></div></div>
              <div className="qx-deposit-warning">⚠️ &nbsp;<strong>Minimum amount – {depositForm.method==="USDT (BEP-20)"?20:10} $.</strong> Smaller payments won't be credited.</div>
              <form onSubmit={submitDeposit}>
                <label className="qx-deposit-input-label">Deposit amount <div className="qx-deposit-input"><input type="number" min={depositForm.method==="USDT (BEP-20)"?20:10} max="952" step="0.01" required value={depositForm.amountUSD} onChange={e=>setDepositForm(f=>({...f,amountUSD:e.target.value}))}/><span>$</span></div></label>
                <div className="qx-quick-amount">{[150,200,300,500].map(n=><button type="button" key={n} onClick={()=>setDepositForm(f=>({...f,amountUSD:String(n)}))}>{n} $</button>)}</div>
                <div className="qx-bonus-code">🎟️ &nbsp; Bonus Code <span>50% OFFER</span></div>
                <label className="qx-deposit-input-label">Email <div className="qx-deposit-input"><input type="email" readOnly value={user.email || ""}/></div></label>
                <label className="qx-deposit-input-label">Payment reference (after payment) <div className="qx-deposit-input"><input placeholder="Transaction / UTR ID" value={depositForm.reference} onChange={e=>setDepositForm(f=>({...f,reference:e.target.value}))}/></div></label>
                <div className="qx-deposit-warning">⚠️ Payments may take up to 12 hours to be reviewed. A submitted request does not confirm receipt of funds.</div>
                <div className="qx-conversion">{depositForm.method.includes("USDT")||depositForm.method.includes("Binance") ? <>Estimated USDT: <strong>{usdtRate ? (Number(depositForm.amountUSD||0)/usdtRate).toFixed(2)+" USDT" : "Rate unavailable"}</strong></> : <>Estimated INR: <strong>{fxRate ? "₹"+(Number(depositForm.amountUSD||0)*fxRate).toLocaleString("en-IN",{maximumFractionDigits:2}) : "Rate unavailable"}</strong></>}</div>
                <div className="qx-receive">Deposit request <strong>${fmt(depositForm.amountUSD)}</strong></div>
                <button className="qx-proceed" disabled={busy} type="submit">{busy?"Submitting...":"Submit Deposit Request"}</button>
                <p className="qx-payment-note">Payment gateway is not connected. This button only submits a request; it does not charge you or verify payment. Exchange rates are indicative.</p>
                {message && <p className="qx-message">{message}</p>}
              </form>
            </>}
          </div>
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
      {false && page === "Account" && (
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