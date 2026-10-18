import { installGateways } from './gateways.js';

import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import path from "node:path";
import {
  User, Deposit, Withdrawal, Trade, Pair, Bonus,
  Ticket, Notice, Setting, Audit, MarketSchedule, DirectionNote, MinuteDirection
} from './models.js';
if (
  !process.env.MONGO_URI ||
  !process.env.JWT_SECRET ||
  process.env.JWT_SECRET.length < 32
) {
  throw Error('Set MONGO_URI and JWT_SECRET (32+ chars)');
}
await mongoose.connect(process.env.MONGO_URI);
console.log('MongoDB connected');
const app = express();
app.use(helmet());
app.use(express.static(path.resolve("public")));
app.use(cors({
  origin: [
    process.env.CLIENT_ORIGIN || 'https\://qu.vkmster.com',
    process.env.ADMIN_ORIGIN || 'https\://quadmin.vkmster.com'
  ]
}));
app.use(express.json({ limit: '500kb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false
}));
const asyncH = fn => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
const fail = (message, statusCode = 400) =>
  Object.assign(new Error(message), { statusCode });
const roundMoney = value =>
  Math.round((value + Number.EPSILON) * 100) / 100;
const safeUser = user => ({
  id: user._id,
  email: user.email,
  name: user.name,
  country: user.country,
  currency: user.currency,
  role: user.role,
  status: user.status,
  balance: user.balance,
  demoBalance: user.demoBalance ?? 10000,
  popup: user.popup ?? "none"
});
const issueToken = user =>
  jwt.sign(
    { sub: String(user._id), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
const auth = asyncH(async (req, res, next) => {
  const bearer = (
    req.headers.authorization || ''
  ).replace(/^Bearer\s+/i, '');
  if (!bearer) throw fail('Authentication required', 401);
  let payload;
  try {
    payload = jwt.verify(bearer, process.env.JWT_SECRET);
  } catch {
    throw fail('Invalid or expired token', 401);
  }
  req.user = await User.findById(payload.sub)
    .select('-passwordHash');
  if (!req.user || req.user.status !== 'active') {
    throw fail('Account inactive', 401);
  }
  next();
});
const admin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return next(fail('Admin only', 403));
  }
  next();
};
const audit = (req, action, entity, id, details = {}) =>
  Audit.create({
    actor: req.user?._id,
    action,
    entity,
    entityId: String(id),
    details
  });
// ================= HEALTH =================
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    db: mongoose.connection.readyState === 1
  });
});
app.get("/", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});
// ================= AUTH =================
app.post('/api/auth/register', asyncH(async (req, res) => {
  const data = z.object({
    email: z.string().email(),
    password: z.string().min(10).max(128),
    name: z.string().max(80).optional(),
    country: z.string().max(60).optional()
  }).parse(req.body);
  const email = data.email.toLowerCase();
  if (await User.exists({ email })) {
    throw fail('Email already registered', 409);
  }
  const user = await User.create({
    email,
    passwordHash: await bcrypt.hash(data.password, 12),
    name: data.name || '',
    country: data.country || 'India',
    demoBalance: 10000
  });
  res.status(201).json({
    token: issueToken(user),
    user: safeUser(user)
  });
}));
app.post('/api/auth/login', asyncH(async (req, res) => {
  const data = z.object({
    email: z.string().email(),
    password: z.string()
  }).parse(req.body);
  const user = await User.findOne({
    email: data.email.toLowerCase()
  });
  if (
    !user ||
    user.status !== 'active' ||
    !(await bcrypt.compare(data.password, user.passwordHash))
  ) {
    throw fail('Invalid credentials', 401);
  }
  res.json({
    token: issueToken(user),
    user: safeUser(user)
  });
}));
app.get('/api/auth/me', auth, (req, res) => {
  res.json({ user: safeUser(req.user) });
});
app.post(
  '/api/auth/change-password',
  auth,
  asyncH(async (req, res) => {
    const data = z.object({
      oldPassword: z.string(),
      newPassword: z.string().min(10).max(128)
    }).parse(req.body);
    const user = await User.findById(req.user._id);
    if (
      !(await bcrypt.compare(
        data.oldPassword,
        user.passwordHash
      ))
    ) {
      throw fail('Old password incorrect');
    }
    user.passwordHash = await bcrypt.hash(
      data.newPassword,
      12
    );
    await user.save();
    res.json({ ok: true });
  })
);
// ================= PAIRS / NOTICES =================
app.get('/api/pairs', auth, asyncH(async (req, res) => {
  const pairs = await Pair.find({ enabled: true })
    .sort({ symbol: 1 });
  res.json(pairs);
}));
app.get('/api/notices', auth, asyncH(async (req, res) => {
  const notices = await Notice.find({ enabled: true })
    .sort({ createdAt: -1 })
    .limit(30);
  res.json(notices);
}));
// ================= USER OVERVIEW =================
app.get('/api/me/overview', auth, asyncH(async (req, res) => {
  const id = req.user._id;
  const [
    user, deposits, withdrawals, trades, tickets
  ] = await Promise.all([
    User.findById(id),
    Deposit.find({ user: id })
      .sort({ createdAt: -1 }).limit(50),
    Withdrawal.find({ user: id })
      .sort({ createdAt: -1 }).limit(50),
    Trade.find({ user: id })
      .sort({ createdAt: -1 }).limit(100),
    Ticket.find({ user: id })
      .sort({ createdAt: -1 }).limit(50)
  ]);
  res.json({
    user: safeUser(user),
    deposits,
    withdrawals,
    trades,
    tickets
  });
}));
installGateways(app, auth, asyncH);
// ================= DEPOSITS =================
app.post('/api/me/deposits', auth, asyncH(async (req, res) => {
  const data = z.object({
    amountUSD: z.number().min(10).max(952),
    method: z.string().min(2).max(80),
    reference: z.string().max(100).optional()
  }).parse(req.body);
  const deposit = await Deposit.create({
    ...data,
    user: req.user._id
  });
  await audit(req, 'request', 'deposit', deposit.id);
  res.status(201).json(deposit);
}));
// ================= WITHDRAWALS =================
app.post(
  '/api/me/withdrawals',
  auth,
  asyncH(async (req, res) => {
    const data = z.object({
      amountUSD: z.number().positive(),
      method: z.string().min(2).max(80),
      destination: z.string().min(3).max(180)
    }).parse(req.body);
    const withdrawal = await Withdrawal.create({
      ...data,
      user: req.user._id
    });
    await audit(req, 'request', 'withdrawal', withdrawal.id);
    res.status(201).json(withdrawal);
  })
);
// ================= SUPPORT =================
app.post('/api/me/tickets', auth, asyncH(async (req, res) => {
  const data = z.object({
    subject: z.string().min(3).max(120),
    message: z.string().min(3).max(2000)
  }).parse(req.body);
  const ticket = await Ticket.create({
    ...data,
    user: req.user._id
  });
  res.status(201).json(ticket);
}));
// END PART 1
const symbols = {
  'EUR/USD': { base: 1.085, decimals: 5, pointSize: 0.00001 },
  'GBP/USD': { base: 1.27, decimals: 5, pointSize: 0.00001 },
  'BTC/USD': { base: 65000, decimals: 2, pointSize: 1 }
};
function calculateFixedReturn(trade, exitPrice) {
  const difference = exitPrice - trade.entryPrice;
  const win = (trade.direction === 'buy' && difference > 0) ||
    (trade.direction === 'sell' && difference < 0);
  const draw = Math.abs(difference) < 1e-10;
  const payoutPercent = Number(trade.payoutPercent ?? 85);
  const profitUSD = draw ? 0 : win ? roundMoney(trade.amountUSD * payoutPercent / 100) : -trade.amountUSD;
  return {
    signedPoints: 0, demoMultiplier: 0,
    creditUSD: draw ? trade.amountUSD : win ? roundMoney(trade.amountUSD + profitUSD) : 0,
    profitUSD,
    status: draw ? 'draw' : win ? 'won' : 'lost'
  };
}
const FIXED_PAYOUT = Object.freeze({ 'EUR/USD': 85, 'GBP/USD': 87, 'BTC/USD': 85 });
const MIN_TRADE_DURATION = 1;
const MAX_TRADE_DURATION = 86400;
// ================= IST SESSION =================
const IST_OFFSET = 330 * 60 * 1000;
const START_MINUTE = 7 * 60;
const END_MINUTE = 24 * 60;
const SLOT_MINUTES = 10;
const SLOT_COUNT = 102;
function istInfo(timestamp = Date.now()) {
  const date = new Date(timestamp + IST_OFFSET);
  return {
    date: date.toISOString().slice(0, 10),
    minute:
      date.getUTCHours() * 60 +
      date.getUTCMinutes() +
      date.getUTCSeconds() / 60 +
      date.getUTCMilliseconds() / 60000
  };
}
function todayIST() {
  return istInfo().date;
}
function nextDate(dateString) {
  const date = new Date(dateString + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}
function validDate(dateString) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(dateString) &&
    !Number.isNaN(Date.parse(dateString + 'T00:00:00Z')) &&
    new Date(dateString + 'T00:00:00Z')
      .toISOString().slice(0, 10) === dateString
  );
}
function validateSymbol(symbol) {
  if (!symbols[symbol]) throw fail('Unsupported symbol');
  return symbol;
}
function isDemoSession(timestamp) {
  const { minute } = istInfo(timestamp);
  return minute >= START_MINUTE && minute < END_MINUTE;
}
// ================= RANDOM SLOTS =================
function makeSlots(symbol) {
  validateSymbol(symbol);
  const config = symbols[symbol];
  const round = value =>
    Number(value.toFixed(config.decimals));
  const random = (min, max) =>
    min + Math.random() * (max - min);
  const isBTC = symbol === 'BTC/USD';
  let previousExit = config.base;
  return Array.from({ length: SLOT_COUNT }, (_, index) => {
    const gap = index === 0 ? 0 : random(
      isBTC ? -100 : -0.003,
      isBTC ? 100 : 0.003
    );
    const entryPrice = round(
      Math.max(config.pointSize, previousExit + gap)
    );
    const direction = Math.random() < 0.5 ? -1 : 1;
    const movement = random(
      isBTC ? 20 : 0.0005,
      isBTC ? 200 : 0.005
    );
    const exitPrice = round(Math.max(
      config.pointSize,
      entryPrice + direction * movement
    ));
    previousExit = exitPrice;
    return {
      startMinute: START_MINUTE + index * SLOT_MINUTES,
      endMinute: START_MINUTE + (index + 1) * SLOT_MINUTES,
      entryPrice,
      exitPrice
    };
  });
}
function checkSlots(slots) {
  if (!Array.isArray(slots) || slots.length !== SLOT_COUNT) {
    throw fail('Exactly 102 ten-minute slots required');
  }
  for (let i = 0; i < SLOT_COUNT; i++) {
    const slot = slots[i];
    if (
      !slot ||
      slot.startMinute !== START_MINUTE + i * SLOT_MINUTES ||
      slot.endMinute !== START_MINUTE + (i + 1) * SLOT_MINUTES ||
      !Number.isFinite(slot.entryPrice) ||
      !Number.isFinite(slot.exitPrice) ||
      slot.entryPrice <= 0 ||
      slot.exitPrice <= 0
    ) {
      throw fail(`Invalid schedule slot ${i + 1}`);
    }
  }
  return slots;
}
// ================= PRICE ENGINE =================
function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}
// Deterministic simulated noise.
// Same symbol + timestamp => same result.
function stableNoise(symbol, timestamp) {
  const seed = Object.keys(symbols).indexOf(symbol) + 1;
  const t = timestamp / 1000;
  return (
    Math.sin(t * 0.71 + seed * 19.13) * 0.50 +
    Math.sin(t * 0.19 + seed * 5.71) * 0.30 +
    Math.sin(t * 0.047 + seed * 11.27) * 0.20
  );
}
// Automatic simulated price for overnight hours
// or days without a published schedule.
function legacyPrice(symbol, timestamp = Date.now()) {
  const config = symbols[symbol];
  if (!config) throw fail('Unsupported symbol');
  const t = timestamp / 1000;
  const offset = Object.keys(symbols).indexOf(symbol) * 17;
  const movement =
    Math.sin(t / 27 + offset) * 0.0014 +
    Math.sin(t / 8.7 + offset * 0.7) * 0.0006 +
    Math.sin(t / 3.1 + offset * 1.3) * 0.0002;
  const price = config.base * (1 + movement);
  return Number(price.toFixed(config.decimals));
}
// IMPORTANT: signature is (schedule, timestamp).
function scheduledPrice(schedule, timestamp) {
  if (
    !schedule ||
    !Array.isArray(schedule.slots) ||
    schedule.slots.length !== SLOT_COUNT
  ) {
    return null;
  }
  const timeMs = timestamp instanceof Date
    ? timestamp.getTime()
    : Number(timestamp);
  if (!Number.isFinite(timeMs)) return null;
  const info = istInfo(timeMs);
  if (
    info.date !== schedule.date ||
    info.minute < START_MINUTE ||
    info.minute >= END_MINUTE
  ) {
    return null;
  }
  const index = Math.floor(
    (info.minute - START_MINUTE) / SLOT_MINUTES
  );
  const slot = schedule.slots[index];
  const nextSlot = schedule.slots[index + 1];
  if (!slot) return null;
  const entry = Number(slot.entryPrice);
  const exit = Number(slot.exitPrice);
  const nextEntry = nextSlot
    ? Number(nextSlot.entryPrice)
    : exit;
  if (
    ![entry, exit, nextEntry].every(
      value => Number.isFinite(value) && value > 0
    )
  ) {
    return null;
  }
  const elapsed =
    (info.minute - Number(slot.startMinute)) * 60;
  const slotSeconds = SLOT_MINUTES * 60;
  const targetSeconds = 150;
  let price;
  let envelope;
  if (elapsed <= targetSeconds) {
    const progress = elapsed / targetSeconds;
    price =
      entry +
      (exit - entry) * smoothstep(progress);
    envelope = Math.sin(Math.PI * Math.max(
      0, Math.min(1, progress)
    ));
  } else {
    const progress =
      (elapsed - targetSeconds) /
      (slotSeconds - targetSeconds);
    price =
      exit +
      (nextEntry - exit) * smoothstep(progress);
    envelope = Math.sin(Math.PI * Math.max(
      0, Math.min(1, progress)
    ));
  }
  const volatility = Math.max(
    Math.abs(exit - entry),
    Math.abs(nextEntry - exit)
  );
  price +=
    stableNoise(schedule.symbol, timeMs) *
    volatility * 0.015 * envelope;
  if (!Number.isFinite(price) || price <= 0) {
    return null;
  }
  const decimals = symbols[schedule.symbol]?.decimals ?? 5;
  return Number(price.toFixed(decimals));
}
function marketPrice(
  schedule,
  symbol,
  timestamp = Date.now()
) {
  const scheduled = schedule
    ? scheduledPrice(schedule, timestamp)
    : null;
  return scheduled ?? legacyPrice(symbol, timestamp);
}
// ================= SCHEDULE LOOKUP =================
const scheduleCache = new Map();
async function getSchedule(symbol, timestamp = Date.now()) {
  validateSymbol(symbol);
  const { date } = istInfo(timestamp);
  const key = `${date}|${symbol}`;
  const cached = scheduleCache.get(key);
  if (cached && Date.now() - cached.at < 2000) {
    return cached.data;
  }
  const schedule = await MarketSchedule.findOne({
    date,
    symbol,
    status: 'published'
  }).lean();
  scheduleCache.set(key, {
    at: Date.now(),
    data: schedule
  });
  return schedule;
}
// Shared deterministic SIMULATION engine. Not real forex/crypto market data.
// No administrator prediction, entry/exit slot or published schedule is consulted.
function simHash(symbol, n, salt=0) {
  let x=2166136261;
  for(const c of `${symbol}|${n}|${salt}`){x^=c.charCodeAt(0);x=Math.imul(x,16777619)}
  x^=x>>>16;x=Math.imul(x,2246822507);x^=x>>>13;
  return (x>>>0)/4294967295*2-1;
}
function simClose(symbol, minute) {
  const base={ 'EUR/USD':1.0845,'GBP/USD':1.2685,'BTC/USD':67500 }[symbol]||1;
  const unit=symbol==='BTC/USD'?12:0.000075;
  const wave=(period,salt)=>{const n=Math.floor(minute/period),f=minute/period-n;
    const t=f*f*(3-2*f);return simHash(symbol,n,salt)*(1-t)+simHash(symbol,n+1,salt)*t;};
  // Smooth multiscale drift + local variability; continuous at every minute boundary.
  return Math.max(unit*20,base+unit*(wave(720,1)*12+wave(145,2)*6+wave(23,3)*3+wave(4,4)*1.7+simHash(symbol,minute,5)*1.1));
}
function simPrice(symbol, timestamp=Date.now()) {
  const minute=Math.floor(timestamp/60000), f=(timestamp-minute*60000)/60000;
  const start=simClose(symbol,minute-1), target=simClose(symbol,minute);
  const t=f*f*(3-2*f);
  const unit=symbol==='BTC/USD'?12:0.000075;
  const micro=unit*.22*Math.sin(Math.PI*f)*Math.sin(f*15+simHash(symbol,minute,8)*5);
  return Number((start+(target-start)*t+micro).toFixed(symbols[symbol].decimals));
}
function simulationCandles(symbol,now,count=120) {
  const bucket=Math.floor(now/60000)*60000;
  return Array.from({length:count},(_,i)=>{
    const start=bucket-(count-1-i)*60000,end=Math.min(start+59999,now);
    const values=[];
    for(let t=start;t<end;t+=2000)values.push(simPrice(symbol,t));
    values.push(simPrice(symbol,end));
    const open=values[0],close=values.at(-1),high=Math.max(...values),low=Math.min(...values);
    return {time:start,open,high,low,close,color:close>=open?'green':'red',isCurrent:start===bucket,intervalSeconds:60};
  });
}
// function sendSimulationChart(req,res){
//   const symbol=validateSymbol(String(req.query.symbol||'EUR/USD'));
//   const offset=Math.min(10080,Math.max(0,Number.parseInt(req.query.offsetMinutes,10)||0));
//   const now=Date.now()-offset*60000,bucket=Math.floor(now/60000)*60000;
//   const candles=simulationCandles(symbol,now);
//   res.set('Cache-Control','no-store');
//   res.json({symbol,simulated:true,marketType:'simulation',priceSource:'deterministic-random-simulation',
//     scheduleStatus:'disabled',marketOpen:true,timezone:'Asia/Kolkata',
//     candleIntervalSeconds:60,candleCount:candles.length,historyOffsetMinutes:offset,candles,
//     currentPrice:simPrice(symbol,now),serverTime:now,candleStart:bucket,
//     nextCandleAt:bucket+60000,remainingSeconds:Math.ceil((bucket+60000-now)/1000)});
// }

async function sendSimulationChart(req, res) {
  const symbol = validateSymbol(
    String(req.query.symbol || "EUR/USD")
  );

  const offset = Math.min(
    10080,
    Math.max(
      0,
      Number.parseInt(req.query.offsetMinutes, 10) || 0
    )
  );

  const now = Date.now() - offset * 60000;
  const bucket = Math.floor(now / 60000) * 60000;

  // Original random simulation candles
  const candles = simulationCandles(symbol, now);

  // Saved admin directions from MongoDB
  const settings = await MinuteDirection.find({
    symbol
  }).lean();

  const directionByMinute = new Map(
    settings.map(item => [
      Number(item.minute),
      String(item.direction).toUpperCase()
    ])
  );

  const IST_OFFSET = 330 * 60000;
  const minimumMove =
    symbol === "BTC/USD" ? 0.01 : 0.00001;

  const adjustedCandles = candles.map(candle => {
    const candleTime = Number(candle.time);

    // Convert candle timestamp to IST minute
    const ist = new Date(candleTime + IST_OFFSET);

    const minute =
      ist.getUTCHours() * 60 +
      ist.getUTCMinutes();

    const direction = directionByMinute.get(minute);

    // No admin setting: keep random candle
    if (direction !== "UP" && direction !== "DOWN") {
      return candle;
    }

    const open = Number(candle.open);
    const originalClose = Number(candle.close);

    const movement = Math.max(
      Math.abs(originalClose - open),
      minimumMove
    );

    const close = direction === "UP"
      ? open + movement
      : open - movement;

    return {
      ...candle,
      open,
      close,
      high: Math.max(
        Number(candle.high),
        open,
        close
      ),
      low: Math.min(
        Number(candle.low),
        open,
        close
      )
    };
  });

  // Current candle's displayed close
  const latestCandle = adjustedCandles[
    adjustedCandles.length - 1
  ];

  const currentPrice = latestCandle
    ? Number(latestCandle.close)
    : simPrice(symbol, now);

  res.set("Cache-Control", "no-store");

  return res.json({
    symbol,
    simulated: true,
    marketType: "simulation",
   priceSource:'deterministic-random-simulation',
    scheduleStatus: "directions",
    marketOpen: true,
    timezone: "Asia/Kolkata",
    candleIntervalSeconds: 60,
    candleCount: adjustedCandles.length,
    historyOffsetMinutes: offset,
    candles: adjustedCandles,
    currentPrice,
    serverTime: now,
    candleStart: bucket,
    nextCandleAt: bucket + 60000,
    remainingSeconds: Math.ceil(
      (bucket + 60000 - now) / 1000
    )
  });
}

app.get('/api/trading/practice-chart',auth,asyncH(async(req,res)=>sendSimulationChart(req,res)));
// Both visual accounts use the same clearly labeled simulated chart.
// Neither endpoint represents actual market quotes.
app.get('/api/trading/chart',auth,asyncH(async(req,res)=>sendSimulationChart(req,res)));
app.get('/api/trading/prices',auth,asyncH(async(req,res)=>{
 const now=Date.now(),prices={};
 for(const symbol of Object.keys(symbols))prices[symbol]=simPrice(symbol,now);
 res.set('Cache-Control','no-store');
 res.json({simulated:true,marketType:'simulation',timestamp:new Date(now).toISOString(),prices,
  priceSources:Object.fromEntries(Object.keys(prices).map(k=>[k,'random-simulation']))});
}));
// Daily admin-only direction notes; not consumed by chart or trade settlement.
// Daily admin-only direction notes
// GET /api/admin/minute-directions?symbol=EUR%2FUSD

app.get('/api/admin/minute-directions', auth, admin, asyncH(async (req, res) => {
  const symbol = String(req.query.symbol || '');

  validateSymbol(symbol);

  const rows = await MinuteDirection.find({ symbol })
    .select('minute direction -_id')
    .sort({ minute: 1 })
    .lean();

  res.set('Cache-Control', 'no-store');
  res.json({ symbol, rows });
}));

// PUT /api/admin/minute-directions?symbol=EUR%2FUSD

app.put('/api/admin/minute-directions', auth, admin, asyncH(async (req, res) => {
  const symbol = String(req.query.symbol || '');

  validateSymbol(symbol);

  const items = req.body?.rows;

  if (!Array.isArray(items) || items.length > 102) {
    throw fail('Invalid rows');
  }

  const seen = new Set();

  for (const item of items) {
    if (
      !Number.isInteger(item.minute) ||
      item.minute < 420 ||
      item.minute > 1430 ||
      item.minute % 10 !== 0 ||
      !['UP', 'DOWN'].includes(item.direction) ||
      seen.has(item.minute)
    ) {
      throw fail('Invalid time or direction');
    }

    seen.add(item.minute);
  }

  await mongoose.connection.transaction(async (session) => {
    const operations = items.map((item) => ({
      updateOne: {
        filter: { symbol, minute: item.minute },
        update: {
          $set: {
            direction: item.direction,
            updatedBy: req.user._id
          }
        },
        upsert: true
      }
    }));

    if (operations.length) {
      await MinuteDirection.bulkWrite(operations, { session });
    }

    await MinuteDirection.deleteMany(
      { symbol, minute: { $nin: [...seen] } },
      { session }
    );
  });

  res.set('Cache-Control', 'no-store');
  res.json({ ok: true, count: items.length });
}));
// Retired date-based direction notes are kept in their old collection for archival purposes.
// Retain old schedule records only to settle previously opened trades.
// Schedule administration is retired and cannot affect any new chart/trade.
app.all('/api/admin/schedules/:date/:symbol',auth,admin,(req,res)=>res.status(410).json({error:'Prediction schedules retired; simulation prices are independent.'}));
app.all('/api/admin/schedules/:date/:symbol/publish',auth,admin,(req,res)=>res.status(410).json({error:'Prediction schedules retired.'}));
// ================= READ SCHEDULE =================
app.get(
  '/api/admin/schedules/:date/:symbol',
  auth,
  admin,
  asyncH(async (req, res) => {
    const { date, symbol } = req.params;
    if (!validDate(date)) throw fail('Invalid date');
    validateSymbol(symbol);
    const schedule = await MarketSchedule.findOne({
      date,
      symbol
    }).lean();
    if (schedule) return res.json(schedule);
    res.json({
      date,
      symbol,
      timezone: 'Asia/Kolkata',
      pointSize: symbols[symbol].pointSize,
      status: 'new',
      version: 0,
      slots: makeSlots(symbol)
    });
  })
);
// ================= SAVE SCHEDULE =================
app.put(
  '/api/admin/schedules/:date/:symbol',
  auth,
  admin,
  asyncH(async (req, res) => {
    const { date, symbol } = req.params;
    if (!validDate(date)) throw fail('Invalid date');
    validateSymbol(symbol);
    if (date <= todayIST()) {
      throw fail(
        'Only future schedules can be edited',
        409
      );
    }
    const slots = checkSlots(req.body.slots);
    const version = Number(req.body.version);
    if (!Number.isInteger(version) || version < 0) {
      throw fail('Invalid schedule version');
    }
    const existing = await MarketSchedule.findOne({
      date,
      symbol
    });
    if (existing?.status === 'published') {
      throw fail('Published schedule is locked', 409);
    }
    let schedule;
    if (existing) {
      schedule = await MarketSchedule.findOneAndUpdate(
        {
          _id: existing._id,
          status: 'draft',
          version
        },
        {
          $set: {
            slots,
            pointSize: symbols[symbol].pointSize
          },
          $inc: { version: 1 }
        },
        {
          new: true,
          runValidators: true
        }
      );
      if (!schedule) {
        throw fail(
          'Schedule changed. Reload and retry.',
          409
        );
      }
    } else {
      if (version !== 0) {
        throw fail('Reload schedule and retry', 409);
      }
      schedule = await MarketSchedule.create({
        date,
        symbol,
        timezone: 'Asia/Kolkata',
        pointSize: symbols[symbol].pointSize,
        status: 'draft',
        version: 1,
        slots,
        createdBy: req.user._id
      });
    }
    await audit(
      req,
      'save',
      'marketSchedule',
      schedule.id,
      { date, symbol, version: schedule.version }
    );
    scheduleCache.delete(`${date}|${symbol}`);
    res.json(schedule);
  })
);
// ================= PUBLISH SCHEDULE =================
app.post(
  '/api/admin/schedules/:date/:symbol/publish',
  auth,
  admin,
  asyncH(async (req, res) => {
    const { date, symbol } = req.params;
    if (!validDate(date)) throw fail('Invalid date');
    validateSymbol(symbol);
    if (date <= todayIST()) {
      throw fail(
        'Only future schedules can be published',
        409
      );
    }
    const version = Number(req.body.version);
    if (!Number.isInteger(version)) {
      throw fail('Invalid version');
    }
    const schedule = await MarketSchedule.findOneAndUpdate(
      {
        date,
        symbol,
        status: 'draft',
        version
      },
      {
        $set: {
          status: 'published',
          publishedAt: new Date()
        }
      },
      { new: true }
    );
    if (!schedule) {
      throw fail(
        'Draft missing, changed or already published',
        409
      );
    }
    await audit(
      req,
      'publish',
      'marketSchedule',
      schedule.id,
      { date, symbol, version }
    );
    scheduleCache.delete(`${date}|${symbol}`);
    res.json(schedule);
  })
);
// END PART 2
app.post('/api/trading/place', auth, asyncH(async (req, res) => {
  const data = z.object({
    symbol: z.enum(['EUR/USD','GBP/USD','BTC/USD']),
    direction: z.enum(['buy','sell']),
    amountUSD: z.number().min(1).max(1000).refine(v => Math.abs(v*100-Math.round(v*100))<1e-7),
    durationSeconds: z.number().int().min(MIN_TRADE_DURATION).max(MAX_TRADE_DURATION)
  }).parse(req.body);
  const openedAt = new Date();
  const schedule = null; // Published entry/exit schedules no longer affect new demo trades.
  const entryPrice = simPrice(data.symbol,openedAt.getTime());
  if (!Number.isFinite(entryPrice)) {
    throw fail('Demo market closed', 409);
  }
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const user = await User.findOneAndUpdate(
        {
          _id: req.user._id,
          status: 'active',
          demoBalance: { $gte: data.amountUSD }
        },
        {
          $inc: { demoBalance: -data.amountUSD }
        },
        { new: true, session }
      );
      if (!user) {
        throw fail('Insufficient demo balance');
      }
      const [trade] = await Trade.create(
        [{
          user: user._id,
          symbol: data.symbol,
          direction: data.direction,
          amountUSD: data.amountUSD,
          durationSeconds: data.durationSeconds,
          payoutPercent: FIXED_PAYOUT[data.symbol],
          pointSize: symbols[data.symbol].pointSize,
          entryPrice,
          schedule: schedule?._id ?? null,
          scheduleVersion: schedule?.version ?? null,
          openedAt,
          expiresAt: new Date(openedAt.getTime() + data.durationSeconds * 1000),
          status: 'open'
        }],
        { session }
      );
      result = {
        trade,
        demoBalance: user.demoBalance
      };
    });
    res.status(201).json(result);
  } finally {
    await session.endSession();
  }
}));
// ================= MANUAL EXIT =================
app.post(
  '/api/trading/:id/close',
  auth,
  asyncH(async (req, res) => {
 throw fail('Manual exit is disabled. Trades settle automatically at expiry.', 409);
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw fail('Invalid trade ID', 400);
    }
    const session = await mongoose.startSession();
    let result;
    try {
      await session.withTransaction(async () => {
        const trade = await Trade.findOne({
          _id: req.params.id,
          user: req.user._id,
          status: 'open'
        }).session(session);
        if (!trade) {
          throw fail(
            'Trade not found or already closed',
            409
          );
        }
        if (trade.expiresAt) {
          throw fail(
            'Fixed-duration trade cannot be manually closed',
            409
          );
        }
        const closedAt = new Date();
        let schedule = null;
        if (trade.schedule) {
          schedule = await MarketSchedule
            .findById(trade.schedule)
            .session(session);
          if (
            !schedule ||
            schedule.status !== 'published' ||
            schedule.version !== trade.scheduleVersion
          ) {
            throw fail('Trade schedule unavailable', 409);
          }
        }
        const exitPrice = marketPrice(
          schedule,
          trade.symbol,
          closedAt.getTime()
        );
        if (!Number.isFinite(exitPrice)) {
          throw fail(
            'Demo market closed; cannot price exit',
            409
          );
        }
        const {
          signedPoints,
          demoMultiplier,
          creditUSD,
          profitUSD,
          status
        } = calculateFixedReturn(trade, exitPrice);
        trade.exitPrice = exitPrice;
        trade.status = status;
        trade.profitUSD = profitUSD;
        trade.settledAt = closedAt;
        trade.signedPoints = signedPoints;
        trade.demoMultiplier = demoMultiplier;
        await trade.save({ session });
        const user = await User.findOneAndUpdate(
          {
            _id: trade.user,
            status: 'active'
          },
          {
            $inc: { demoBalance: creditUSD }
          },
          {
            new: true,
            session
          }
        );
        if (!user) {
          throw fail('Trade user unavailable', 404);
        }
        await Audit.create(
          [{
            actor: trade.user,
            action: 'manual-close',
            entity: 'trade',
            entityId: String(trade._id),
            details: {
              entryPrice: trade.entryPrice,
              exitPrice,
              signedPoints,
              demoMultiplier,
              profitUSD,
              creditUSD
            }
          }],
          { session }
        );
        result = {
          trade,
          demoBalance: user.demoBalance
        };
      });
      res.json(result);
    } finally {
      await session.endSession();
    }
  })
);
// ================= AUTO SETTLEMENT =================
// For existing fixed-duration trades.
async function settleTrade(tradeId) {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const trade = await Trade.findOne({
        _id: tradeId,
        status: 'open',
        expiresAt: { $lte: new Date() }
      }).session(session);
      if (!trade) return;
      let exitPrice;
      let schedule = null;
      if (trade.schedule) {
        schedule = await MarketSchedule
          .findById(trade.schedule)
          .session(session);
        if (
          !schedule ||
          schedule.status !== 'published' ||
          schedule.version !== trade.scheduleVersion
        ) {
          throw fail('Trade schedule unavailable', 409);
        }
        exitPrice = marketPrice(
          schedule,
          trade.symbol,
          trade.expiresAt.getTime()
        );
      } else {
        exitPrice = simPrice(trade.symbol,trade.expiresAt.getTime());
      }
      if (!Number.isFinite(exitPrice)) {
        throw fail('Exit price unavailable', 409);
      }
      const {
        signedPoints,
        demoMultiplier,
        creditUSD,
        profitUSD,
        status
      } = calculateFixedReturn(trade, exitPrice);
      trade.signedPoints = signedPoints;
      trade.demoMultiplier = demoMultiplier;
      trade.exitPrice = exitPrice;
      trade.status = status;
      trade.profitUSD = profitUSD;
      trade.settledAt = new Date();
      await trade.save({ session });
      if (creditUSD > 0) {
        const update = await User.updateOne(
          { _id: trade.user },
          {
            $inc: { demoBalance: creditUSD }
          },
          { session }
        );
        if (update.matchedCount !== 1) {
          throw fail('Trade user unavailable', 404);
        }
      }
      await Audit.create(
        [{
          actor: trade.user,
          action: 'settle',
          entity: 'trade',
          entityId: String(trade._id),
          details: {
            status: trade.status,
            profitUSD,
            creditUSD,
            entryPrice: trade.entryPrice,
            exitPrice,
            signedPoints,
            demoMultiplier
          }
        }],
        { session }
      );
    });
  } finally {
    await session.endSession();
  }
}
let settlementRunning = false;
async function settleExpired() {
  if (settlementRunning) return;
  settlementRunning = true;
  try {
    const rows = await Trade.find({
      status: 'open',
      expiresAt: { $lte: new Date() }
    })
      .sort({ expiresAt: 1 })
      .select('_id')
      .limit(100)
      .lean();
    for (const row of rows) {
      try {
        await settleTrade(row._id);
      } catch (error) {
        console.error(
          'Trade settlement failed:',
          row._id,
          error.message
        );
      }
    }
  } finally {
    settlementRunning = false;
  }
}
setInterval(
  () => settleExpired().catch(console.error),
  3000
);
// END PART 3
app.get(
  '/api/admin/overview',
  auth,
  admin,
  asyncH(async (req, res) => {
    const [
      users,
      deposits,
      pendingDeposits,
      withdrawals,
      pendingWithdrawals,
      trades,
      tickets
    ] = await Promise.all([
      User.countDocuments(),
      Deposit.countDocuments(),
      Deposit.countDocuments({ status: 'pending' }),
      Withdrawal.countDocuments(),
      Withdrawal.countDocuments({ status: 'pending' }),
      Trade.countDocuments(),
      Ticket.countDocuments({ status: 'open' })
    ]);
    res.json({
      users,
      deposits,
      pendingDeposits,
      withdrawals,
      pendingWithdrawals,
      trades,
      tickets
    });
  })
);
// ================= ADMIN ENTITIES =================
const entities = {
  users: User,
  deposits: Deposit,
  withdrawals: Withdrawal,
  trades: Trade,
  pairs: Pair,
  bonuses: Bonus,
  tickets: Ticket,
  notices: Notice,
  settings: Setting,
  audit: Audit
};
const editable = {
  users: ['name', 'country', 'currency', 'status'],
  deposits: ['note'],
  withdrawals: ['status'],
  trades: [],
  pairs: [
    'symbol',
    'category',
    'enabled',
    'payout1',
    'payout5',
    'source'
  ],
  bonuses: [
    'code',
    'percent',
    'minUSD',
    'enabled'
  ],
  tickets: ['status', 'reply'],
  notices: ['title', 'message', 'enabled'],
  settings: ['key', 'value']
};
const creatable = [
  'pairs',
  'bonuses',
  'notices',
  'settings'
];
// ================= DEPOSIT APPROVAL =================
app.patch(
  '/api/admin/deposits/:id/approve',
  auth,
  admin,
  asyncH(async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
      throw fail('Invalid deposit ID');
    }
    const session = await mongoose.startSession();
    let result;
    try {
      await session.withTransaction(async () => {
        const deposit = await Deposit.findOneAndUpdate(
          {
            _id: req.params.id,
            status: 'pending'
          },
          {
            $set: {
              status: 'approved',
              note: String(
                req.body?.note ||
                'Payment manually verified'
              ).slice(0, 500)
            }
          },
          {
            new: true,
            session,
            runValidators: true
          }
        );
        if (!deposit) {
          throw fail(
            'Deposit already processed or not found',
            409
          );
        }
        if (
          !Number.isFinite(deposit.amountUSD) ||
          deposit.amountUSD <= 0
        ) {
          throw fail('Invalid deposit amount');
        }
        const user = await User.findByIdAndUpdate(
          deposit.user,
          {
            $inc: { balance: deposit.amountUSD }
          },
          {
            new: true,
            session
          }
        );
        if (!user) {
          throw fail('User not found', 404);
        }
        await User.updateOne({_id:user._id,popup:{$in:['none',null]}},{$set:{popup:'1999'}},{session});
        await Audit.create(
          [{
            actor: req.user._id,
            action: 'approve',
            entity: 'deposit',
            entityId: String(deposit._id),
            details: {
              amountUSD: deposit.amountUSD,
              userId: String(user._id)
            }
          }],
          { session }
        );
        result = {
          ok: true,
          status: 'approved',
          creditedAmount: deposit.amountUSD,
          newBalance: user.balance
        };
      });
      res.json(result);
    } finally {
      await session.endSession();
    }
  })
);
// ================= LIST ADMIN RECORDS =================
app.get(
  '/api/admin/:entity',
  auth,
  admin,
  asyncH(async (req, res) => {
    const key = req.params.entity;
    const Model = entities[key];
    if (!Model) {
      throw fail('Unknown entity', 404);
    }
    const page = Math.min(
      Math.max(Number(req.query.page) || 1, 1),
      100000
    );
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 30, 1),
      100
    );
    const rows = await Model.find()
      .select(key === 'users' ? '-passwordHash' : '')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    res.json({
      rows,
      total: await Model.countDocuments(),
      page,
      limit
    });
  })
);
// ================= CREATE ADMIN RECORD =================
app.post(
  '/api/admin/:entity',
  auth,
  admin,
  asyncH(async (req, res) => {
    const key = req.params.entity;
    if (!creatable.includes(key)) {
      throw fail('Cannot create entity', 405);
    }
    const data = Object.fromEntries(
      Object.entries(req.body || {})
        .filter(([field]) => editable[key].includes(field))
    );
    const row = await entities[key].create(data);
    await audit(req, 'create', key, row.id);
    res.status(201).json(row);
  })
);
// ================= UPDATE ADMIN RECORD =================
app.patch(
  '/api/admin/:entity/:id',
  auth,
  admin,
  asyncH(async (req, res) => {
    const key = req.params.entity;
    if (!editable[key]?.length) {
      throw fail('Read only', 405);
    }
    const data = Object.fromEntries(
      Object.entries(req.body || {})
        .filter(([field]) => editable[key].includes(field))
    );
    if (!Object.keys(data).length) {
      throw fail('No allowed fields');
    }
    if (
      key === 'users' &&
      String(req.user._id) === req.params.id &&
      data.status === 'suspended'
    ) {
      throw fail('Cannot suspend yourself');
    }
    const row = await entities[key].findByIdAndUpdate(
      req.params.id,
      { $set: data },
      {
        new: true,
        runValidators: true
      }
    );
    if (!row) {
      throw fail('Not found', 404);
    }
    if(key==='withdrawals' && data.status==='approved' && row.user){
      await User.updateOne({_id:row.user,popup:'waiting_approval'},{$set:{popup:'1399'}});
    }
    await audit(req, 'update', key, row.id, data);
    res.json(row);
  })
);
// ================= DELETE ADMIN RECORD =================
app.delete(
  '/api/admin/:entity/:id',
  auth,
  admin,
  asyncH(async (req, res) => {
    const key = req.params.entity;
    if (!creatable.includes(key)) {
      throw fail('Cannot delete this record', 405);
    }
    const row = await entities[key].findByIdAndDelete(
      req.params.id
    );
    if (!row) {
      throw fail('Not found', 404);
    }
    await audit(req, 'delete', key, row.id);
    res.json({ ok: true });
  })
);
// ================= ERROR HANDLING =================
app.use((err, req, res, next) => {
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Invalid fields',
      details: err.flatten()
    });
  }
  if (err.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate record'
    });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid identifier'
    });
  }
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.message
    });
  }
  console.error(err);
  res.status(500).json({
    error: 'Internal server error'
  });
});
// ================= START SERVER =================
const PORT = Number(process.env.PORT || 4000);
app.listen(PORT, () => {
  console.log(`Quotexx API listening on port ${PORT}`);
  settleExpired().catch(console.error);
});
// END PART 4
