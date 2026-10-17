// // // import "dotenv/config";
// // // import express from "express";
// // // import mongoose from "mongoose";
// // // import bcrypt from "bcryptjs";
// // // import jwt from "jsonwebtoken";
// // // import cors from "cors";
// // // import helmet from "helmet";
// // // import rateLimit from "express-rate-limit";
// // // import { z } from "zod";

// // // import {
// // //   User, Deposit, Withdrawal, Trade, Pair,
// // //   Bonus, Ticket, Notice, Setting, Audit
// // // } from "./models.js";

// // // if (!process.env.MONGO_URI ||
// // //     !process.env.JWT_SECRET ||
// // //     process.env.JWT_SECRET.length < 32) {
// // //   throw Error("Set MONGO_URI and strong JWT_SECRET in server/.env");
// // // }

// // // await mongoose.connect(process.env.MONGO_URI);
// // // console.log("MongoDB connected");

// // // const app = express();

// // // app.use(helmet());
// // // app.use(cors({
// // //   origin: [
// // //     process.env.CLIENT_ORIGIN || "http://localhost:5173",
// // //     process.env.ADMIN_ORIGIN || "http://localhost:5174"
// // //   ]
// // // }));
// // // app.use(express.json({ limit: "100kb" }));

// // // app.use("/api/auth", rateLimit({
// // //   windowMs: 15 * 60 * 1000,
// // //   limit: 30,
// // //   standardHeaders: "draft-7",
// // //   legacyHeaders: false
// // // }));

// // // const asyncH = fn => (req, res, next) =>
// // //   Promise.resolve(fn(req, res, next)).catch(next);

// // // const fail = (message, statusCode = 400) =>
// // //   Object.assign(new Error(message), { statusCode });

// // // const token = user => jwt.sign(
// // //   { sub: String(user._id), role: user.role },
// // //   process.env.JWT_SECRET,
// // //   { expiresIn: "8h" }
// // // );

// // // const safeUser = user => ({
// // //   id: user._id,
// // //   email: user.email,
// // //   name: user.name,
// // //   country: user.country,
// // //   currency: user.currency,
// // //   role: user.role,
// // //   status: user.status,
// // //   balance: user.balance
// // // });

// // // const audit = (req, action, entity, id, details = {}) =>
// // //   Audit.create({
// // //     actor: req.user?._id,
// // //     action,
// // //     entity,
// // //     entityId: String(id),
// // //     details
// // //   });

// // // const auth = asyncH(async (req, res, next) => {
// // //   const accessToken = (req.headers.authorization || "")
// // //     .replace(/^Bearer /, "");

// // //   if (!accessToken) throw fail("Authentication required", 401);

// // //   let payload;
// // //   try {
// // //     payload = jwt.verify(accessToken, process.env.JWT_SECRET);
// // //   } catch {
// // //     throw fail("Invalid or expired session", 401);
// // //   }

// // //   req.user = await User.findById(payload.sub)
// // //     .select("-passwordHash");

// // //   if (!req.user || req.user.status !== "active") {
// // //     throw fail("Account inactive", 401);
// // //   }

// // //   next();
// // // });

// // // const admin = (req, res, next) =>
// // //   req.user.role === "admin"
// // //     ? next()
// // //     : next(fail("Admin only", 403));

// // // app.get("/api/health", (req, res) =>
// // //   res.json({ ok: true, db: mongoose.connection.readyState === 1 })
// // // );

// // // // AUTH

// // // app.post("/api/auth/register", asyncH(async (req, res) => {
// // //   const data = z.object({
// // //     email: z.string().email(),
// // //     password: z.string().min(10).max(128),
// // //     name: z.string().max(80).optional(),
// // //     country: z.string().max(60).optional()
// // //   }).parse(req.body);

// // //   const email = data.email.toLowerCase();

// // //   if (await User.exists({ email })) {
// // //     throw fail("Email already registered", 409);
// // //   }

// // //   const user = await User.create({
// // //     email,
// // //     passwordHash: await bcrypt.hash(data.password, 12),
// // //     name: data.name || "",
// // //     country: data.country || "India"
// // //   });

// // //   res.status(201).json({ token: token(user), user: safeUser(user) });
// // // }));

// // // app.post("/api/auth/login", asyncH(async (req, res) => {
// // //   const data = z.object({
// // //     email: z.string().email(),
// // //     password: z.string()
// // //   }).parse(req.body);

// // //   const user = await User.findOne({
// // //     email: data.email.toLowerCase()
// // //   });

// // //   if (!user || user.status !== "active" ||
// // //       !(await bcrypt.compare(data.password, user.passwordHash))) {
// // //     throw fail("Invalid credentials", 401);
// // //   }

// // //   res.json({ token: token(user), user: safeUser(user) });
// // // }));

// // // app.get("/api/auth/me", auth, (req, res) =>
// // //   res.json({ user: safeUser(req.user) })
// // // );

// // // app.post("/api/auth/change-password", auth, asyncH(async (req, res) => {
// // //   const data = z.object({
// // //     oldPassword: z.string(),
// // //     newPassword: z.string().min(10)
// // //   }).parse(req.body);

// // //   const user = await User.findById(req.user._id);

// // //   if (!(await bcrypt.compare(data.oldPassword, user.passwordHash))) {
// // //     throw fail("Old password incorrect");
// // //   }

// // //   user.passwordHash = await bcrypt.hash(data.newPassword, 12);
// // //   await user.save();
// // //   res.json({ ok: true });
// // // }));

// // // // USER DATA

// // // app.get("/api/pairs", auth, asyncH(async (req, res) => {
// // //   res.json(await Pair.find({ enabled: true }).sort({ symbol: 1 }));
// // // }));

// // // app.get("/api/notices", auth, asyncH(async (req, res) => {
// // //   res.json(await Notice.find({ enabled: true })
// // //     .sort({ createdAt: -1 }).limit(30));
// // // }));

// // // app.get("/api/me/overview", auth, asyncH(async (req, res) => {
// // //   const id = req.user._id;

// // //   const [deposits, withdrawals, trades, tickets, freshUser] =
// // //     await Promise.all([
// // //       Deposit.find({ user: id }).sort({ createdAt: -1 }).limit(50),
// // //       Withdrawal.find({ user: id }).sort({ createdAt: -1 }).limit(50),
// // //       Trade.find({ user: id }).sort({ createdAt: -1 }).limit(100),
// // //       Ticket.find({ user: id }).sort({ createdAt: -1 }).limit(50),
// // //       User.findById(id)
// // //     ]);

// // //   res.json({
// // //     user: safeUser(freshUser),
// // //     deposits,
// // //     withdrawals,
// // //     trades,
// // //     tickets
// // //   });
// // // }));

// // // app.post("/api/me/deposits", auth, asyncH(async (req, res) => {
// // //   const data = z.object({
// // //     amountUSD: z.number().min(10).max(952),
// // //     method: z.string().min(2).max(80),
// // //     reference: z.string().max(100).optional()
// // //   }).parse(req.body);

// // //   const row = await Deposit.create({ ...data, user: req.user._id });
// // //   await audit(req, "request", "deposit", row.id);
// // //   res.status(201).json(row);
// // // }));

// // // app.post("/api/me/withdrawals", auth, asyncH(async (req, res) => {
// // //   const data = z.object({
// // //     amountUSD: z.number().positive(),
// // //     method: z.string().min(2).max(80),
// // //     destination: z.string().min(3).max(180)
// // //   }).parse(req.body);

// // //   const row = await Withdrawal.create({
// // //     ...data,
// // //     user: req.user._id
// // //   });

// // //   await audit(req, "request", "withdrawal", row.id);
// // //   res.status(201).json(row);
// // // }));

// // // app.post("/api/me/tickets", auth, asyncH(async (req, res) => {
// // //   const data = z.object({
// // //     subject: z.string().min(3).max(120),
// // //     message: z.string().min(3).max(2000)
// // //   }).parse(req.body);

// // //   const row = await Ticket.create({
// // //     ...data,
// // //     user: req.user._id
// // //   });

// // //   res.status(201).json(row);
// // // }));

// // // // =============================================
// // // // 2-MINUTE DEMO TRADING
// // // // =============================================

// // // const DURATION = 120;
// // // const PAYOUT = 85;

// // // const SYMBOLS = {
// // //   "EUR/USD": { base: 1.085, decimals: 5 },
// // //   "GBP/USD": { base: 1.27, decimals: 5 },
// // //   "BTC/USD": { base: 65000, decimals: 2 }
// // // };

// // // // Deterministic synthetic prices.
// // // // Same symbol and timestamp always produce same price.
// // // // NOT real financial market data.
// // // function demoPrice(symbol, timestamp = Date.now()) {
// // //   const config = SYMBOLS[symbol];
// // //   if (!config) throw fail("Unsupported demo symbol");

// // //   const t = timestamp / 1000;
// // //   const offset = Object.keys(SYMBOLS).indexOf(symbol) * 17;

// // //   const movement =
// // //     Math.sin(t / 27 + offset) * 0.0014 +
// // //     Math.sin(t / 8.7 + offset * 0.7) * 0.0006 +
// // //     Math.sin(t / 3.1 + offset * 1.3) * 0.0002;

// // //   return Number(
// // //     (config.base * (1 + movement))
// // //       .toFixed(config.decimals)
// // //   );
// // // }

// // // // Historical synthetic chart candles
// // // app.get("/api/trading/chart", auth, (req, res) => {
// // //   const symbol = String(req.query.symbol || "EUR/USD");

// // //   if (!SYMBOLS[symbol]) {
// // //     return res.status(400).json({ error: "Unsupported symbol" });
// // //   }

// // //   const now = Date.now();
// // //   const bucket = Math.floor(now / 5000) * 5000;

// // //   const candles = [];

// // //   for (let i = 79; i >= 0; i--) {
// // //     const start = bucket - i * 5000;
// // //     const values = [];

// // //     for (let j = 0; j <= 5; j++) {
// // //       values.push(demoPrice(symbol, start + j * 1000));
// // //     }

// // //     candles.push({
// // //       time: start,
// // //       open: values[0],
// // //       high: Math.max(...values),
// // //       low: Math.min(...values),
// // //       close: values[5]
// // //     });
// // //   }

// // //   res.json({
// // //     symbol,
// // //     simulated: true,
// // //     candles,
// // //     currentPrice: demoPrice(symbol, now),
// // //     serverTime: now
// // //   });
// // // });

// // // app.get("/api/trading/prices", auth, (req, res) => {
// // //   const now = Date.now();

// // //   res.json({
// // //     simulated: true,
// // //     timestamp: new Date(now).toISOString(),
// // //     prices: Object.fromEntries(
// // //       Object.keys(SYMBOLS).map(symbol => [
// // //         symbol,
// // //         demoPrice(symbol, now)
// // //       ])
// // //     )
// // //   });
// // // });

// // // // Place demo trade with atomic wallet debit
// // // app.post("/api/trading/place", auth, asyncH(async (req, res) => {
// // //   const data = z.object({
// // //     symbol: z.enum(["EUR/USD", "GBP/USD", "BTC/USD"]),
// // //     direction: z.enum(["buy", "sell"]),
// // //     amountUSD: z.number().min(1).max(1000)
// // //       .refine(v => Number.isInteger(v * 100), "Use at most 2 decimals"),
// // //     durationSeconds: z.literal(120)
// // //   }).parse(req.body);

// // //   const session = await mongoose.startSession();
// // //   let result;

// // //   try {
// // //     await session.withTransaction(async () => {
// // //       const user = await User.findOneAndUpdate(
// // //         {
// // //           _id: req.user._id,
// // //           status: "active",
// // //           balance: { $gte: data.amountUSD }
// // //         },
// // //         { $inc: { balance: -data.amountUSD } },
// // //         { new: true, session }
// // //       );

// // //       if (!user) throw fail("Insufficient demo balance");

// // //       const openedAt = new Date();
// // //       const expiresAt = new Date(
// // //         openedAt.getTime() + DURATION * 1000
// // //       );

// // //       const [trade] = await Trade.create([{
// // //         user: user._id,
// // //         symbol: data.symbol,
// // //         direction: data.direction,
// // //         amountUSD: data.amountUSD,
// // //         durationSeconds: DURATION,
// // //         payoutPercent: PAYOUT,
// // //         entryPrice: demoPrice(
// // //           data.symbol,
// // //           openedAt.getTime()
// // //         ),
// // //         status: "open",
// // //         openedAt,
// // //         expiresAt
// // //       }], { session });

// // //       result = {
// // //         trade,
// // //         balance: user.balance
// // //       };
// // //     });

// // //     res.status(201).json(result);
// // //   } finally {
// // //     await session.endSession();
// // //   }
// // // }));

// // // // Settle one trade and wallet credit in one transaction
// // // async function settleOneTrade(id) {
// // //   const session = await mongoose.startSession();

// // //   try {
// // //     await session.withTransaction(async () => {
// // //       const trade = await Trade.findOne({
// // //         _id: id,
// // //         status: "open",
// // //         expiresAt: { $lte: new Date() }
// // //       }).session(session);

// // //       if (!trade) return;

// // //       const exitPrice = demoPrice(
// // //         trade.symbol,
// // //         new Date(trade.expiresAt).getTime()
// // //       );

// // //       const entry = trade.entryPrice;

// // //       const draw = exitPrice === entry;

// // //       const won = !draw && (
// // //         trade.direction === "buy"
// // //           ? exitPrice > entry
// // //           : exitPrice < entry
// // //       );

// // //       const profit = draw
// // //         ? 0
// // //         : won
// // //           ? Number(
// // //               (trade.amountUSD * trade.payoutPercent / 100)
// // //                 .toFixed(2)
// // //             )
// // //           : -trade.amountUSD;

// // //       const credit = draw
// // //         ? trade.amountUSD
// // //         : won
// // //           ? trade.amountUSD + profit
// // //           : 0;

// // //       trade.exitPrice = exitPrice;
// // //       trade.status = draw ? "draw" : won ? "won" : "lost";
// // //       trade.profitUSD = profit;
// // //       trade.settledAt = new Date();

// // //       await trade.save({ session });

// // //       if (credit > 0) {
// // //         const updated = await User.updateOne(
// // //           { _id: trade.user },
// // //           { $inc: { balance: credit } },
// // //           { session }
// // //         );

// // //         if (!updated.matchedCount) {
// // //           throw fail("Trade user not found", 404);
// // //         }
// // //       }

// // //       await Audit.create([{
// // //         actor: trade.user,
// // //         action: "settle",
// // //         entity: "trade",
// // //         entityId: String(trade._id),
// // //         details: {
// // //           status: trade.status,
// // //           amountUSD: trade.amountUSD,
// // //           profitUSD: profit,
// // //           exitPrice
// // //         }
// // //       }], { session });
// // //     });
// // //   } finally {
// // //     await session.endSession();
// // //   }
// // // }

// // // async function settleExpiredTrades() {
// // //   const rows = await Trade.find({
// // //     status: "open",
// // //     expiresAt: { $lte: new Date() }
// // //   }).select("_id").limit(100);

// // //   for (const row of rows) {
// // //     try {
// // //       await settleOneTrade(row._id);
// // //     } catch (error) {
// // //       console.error("Settlement error:", row.id, error.message);
// // //     }
// // //   }
// // // }

// // // setInterval(() => {
// // //   settleExpiredTrades().catch(console.error);
// // // }, 3000);

// // // // =============================================
// // // // ADMIN PANEL
// // // // =============================================

// // // app.get("/api/admin/overview", auth, admin, asyncH(async (req, res) => {
// // //   const [
// // //     users, deposits, pendingDeposits,
// // //     withdrawals, pendingWithdrawals, trades, tickets
// // //   ] = await Promise.all([
// // //     User.countDocuments(),
// // //     Deposit.countDocuments(),
// // //     Deposit.countDocuments({ status: "pending" }),
// // //     Withdrawal.countDocuments(),
// // //     Withdrawal.countDocuments({ status: "pending" }),
// // //     Trade.countDocuments(),
// // //     Ticket.countDocuments({ status: "open" })
// // //   ]);

// // //   res.json({
// // //     users, deposits, pendingDeposits,
// // //     withdrawals, pendingWithdrawals, trades, tickets
// // //   });
// // // }));

// // // const entities = {
// // //   users: User,
// // //   deposits: Deposit,
// // //   withdrawals: Withdrawal,
// // //   trades: Trade,
// // //   pairs: Pair,
// // //   bonuses: Bonus,
// // //   tickets: Ticket,
// // //   notices: Notice,
// // //   settings: Setting,
// // //   audit: Audit
// // // };

// // // const editable = {
// // //   users: ["name", "country", "currency", "status"],
// // //   deposits: ["note"],
// // //   withdrawals: ["status"],
// // //   trades: [],
// // //   pairs: [
// // //     "symbol", "category", "enabled",
// // //     "payout1", "payout5", "source"
// // //   ],
// // //   bonuses: ["code", "percent", "minUSD", "enabled"],
// // //   tickets: ["status", "reply"],
// // //   notices: ["title", "message", "enabled"],
// // //   settings: ["key", "value"]
// // // };

// // // const creatable = [
// // //   "pairs", "bonuses", "notices", "settings"
// // // ];

// // // // Admin deposit approval with wallet credit
// // // // Admin MUST verify actual payment before invoking.
// // // app.patch(
// // //   "/api/admin/deposits/:id/approve",
// // //   auth,
// // //   admin,
// // //   asyncH(async (req, res) => {
// // //     if (!mongoose.isValidObjectId(req.params.id)) {
// // //       throw fail("Invalid deposit ID");
// // //     }

// // //     const session = await mongoose.startSession();
// // //     let result;

// // //     try {
// // //       await session.withTransaction(async () => {
// // //         const deposit = await Deposit.findOneAndUpdate(
// // //           {
// // //             _id: req.params.id,
// // //             status: "pending"
// // //           },
// // //           {
// // //             $set: {
// // //               status: "approved",
// // //               note: String(
// // //                 req.body?.note || "Payment manually verified"
// // //               ).slice(0, 500)
// // //             }
// // //           },
// // //           { new: true, session, runValidators: true }
// // //         );

// // //         if (!deposit) {
// // //           throw fail("Deposit not found or already processed", 409);
// // //         }

// // //         const amount = deposit.amountUSD;

// // //         if (!Number.isFinite(amount) || amount <= 0) {
// // //           throw fail("Invalid deposit amount");
// // //         }

// // //         const user = await User.findByIdAndUpdate(
// // //           deposit.user,
// // //           { $inc: { balance: amount } },
// // //           { new: true, session }
// // //         );

// // //         if (!user) throw fail("User not found", 404);

// // //         await Audit.create([{
// // //           actor: req.user._id,
// // //           action: "approve",
// // //           entity: "deposit",
// // //           entityId: String(deposit._id),
// // //           details: {
// // //             amountUSD: amount,
// // //             userId: String(user._id)
// // //           }
// // //         }], { session });

// // //         result = {
// // //           ok: true,
// // //           status: "approved",
// // //           creditedAmount: amount,
// // //           newBalance: user.balance
// // //         };
// // //       });

// // //       res.json(result);
// // //     } finally {
// // //       await session.endSession();
// // //     }
// // //   })
// // // );

// // // app.get("/api/admin/:entity", auth, admin, asyncH(async (req, res) => {
// // //   const key = req.params.entity;
// // //   const Model = entities[key];

// // //   if (!Model) throw fail("Unknown entity", 404);

// // //   const page = Math.min(
// // //     Math.max(Number(req.query.page) || 1, 1), 100000
// // //   );

// // //   const limit = Math.min(
// // //     Math.max(Number(req.query.limit) || 30, 1), 100
// // //   );

// // //   const rows = await Model.find()
// // //     .select(key === "users" ? "-passwordHash" : "")
// // //     .sort({ createdAt: -1 })
// // //     .skip((page - 1) * limit)
// // //     .limit(limit)
// // //     .lean();

// // //   res.json({
// // //     rows,
// // //     total: await Model.countDocuments(),
// // //     page,
// // //     limit
// // //   });
// // // }));

// // // app.post("/api/admin/:entity", auth, admin, asyncH(async (req, res) => {
// // //   const key = req.params.entity;

// // //   if (!creatable.includes(key)) {
// // //     throw fail("Cannot create this entity", 405);
// // //   }

// // //   const data = Object.fromEntries(
// // //     Object.entries(req.body).filter(([field]) =>
// // //       editable[key].includes(field)
// // //     )
// // //   );

// // //   const row = await entities[key].create(data);
// // //   await audit(req, "create", key, row.id);
// // //   res.status(201).json(row);
// // // }));

// // // app.patch("/api/admin/:entity/:id", auth, admin, asyncH(async (req, res) => {
// // //   const key = req.params.entity;

// // //   if (!editable[key]?.length) {
// // //     throw fail("Read only", 405);
// // //   }

// // //   const data = Object.fromEntries(
// // //     Object.entries(req.body).filter(([field]) =>
// // //       editable[key].includes(field)
// // //     )
// // //   );

// // //   if (!Object.keys(data).length) {
// // //     throw fail("No allowed fields");
// // //   }

// // //   if (
// // //     key === "users" &&
// // //     String(req.user.id) === req.params.id &&
// // //     data.status === "suspended"
// // //   ) {
// // //     throw fail("Cannot suspend yourself");
// // //   }

// // //   const row = await entities[key].findByIdAndUpdate(
// // //     req.params.id,
// // //     { $set: data },
// // //     { new: true, runValidators: true }
// // //   );

// // //   if (!row) throw fail("Not found", 404);

// // //   await audit(req, "update", key, row.id, data);
// // //   res.json(row);
// // // }));

// // // app.delete("/api/admin/:entity/:id", auth, admin, asyncH(async (req, res) => {
// // //   const key = req.params.entity;

// // //   if (!creatable.includes(key)) {
// // //     throw fail("Cannot delete financial or user records", 405);
// // //   }

// // //   const row = await entities[key].findByIdAndDelete(
// // //     req.params.id
// // //   );

// // //   if (!row) throw fail("Not found", 404);

// // //   await audit(req, "delete", key, row.id);
// // //   res.json({ ok: true });
// // // }));

// // // app.use((error, req, res, next) => {
// // //   if (error instanceof z.ZodError) {
// // //     return res.status(400).json({
// // //       error: "Invalid fields",
// // //       details: error.flatten()
// // //     });
// // //   }

// // //   if (error.code === 11000) {
// // //     return res.status(409).json({
// // //       error: "Duplicate record"
// // //     });
// // //   }

// // //   if (error.name === "CastError") {
// // //     return res.status(400).json({
// // //       error: "Invalid identifier"
// // //     });
// // //   }

// // //   if (error.statusCode) {
// // //     return res.status(error.statusCode).json({
// // //       error: error.message
// // //     });
// // //   }

// // //   console.error(error);

// // //   res.status(500).json({
// // //     error: "Internal server error"
// // //   });
// // // });

// // // const PORT = Number(process.env.PORT || 4000);

// // // app.listen(PORT, () => {
// // //   console.log(`API running on http://localhost:${PORT}`);
// // //   settleExpiredTrades().catch(console.error);
// // // });


// // import 'dotenv/config';
// // import express from 'express';
// // import mongoose from 'mongoose';
// // import bcrypt from 'bcryptjs';
// // import jwt from 'jsonwebtoken';
// // import cors from 'cors';
// // import helmet from 'helmet';
// // import rateLimit from 'express-rate-limit';
// // import { z } from 'zod';

// // import {
// //   User, Deposit, Withdrawal, Trade, Pair,
// //   Bonus, Ticket, Notice, Setting, Audit
// // } from './models.js';

// // if (!process.env.MONGO_URI ||
// //     !process.env.JWT_SECRET ||
// //     process.env.JWT_SECRET.length < 32) {
// //   throw Error('Set MONGO_URI and JWT_SECRET (32+ chars)');
// // }

// // await mongoose.connect(process.env.MONGO_URI);

// // const app = express();

// // app.use(helmet());
// // app.use(cors({
// //   origin: [
// //     process.env.CLIENT_ORIGIN || 'http://localhost:5173',
// //     process.env.ADMIN_ORIGIN || 'http://localhost:5174'
// //   ]
// // }));
// // app.use(express.json({ limit: '100kb' }));

// // app.use('/api/auth', rateLimit({
// //   windowMs: 15 * 60 * 1000,
// //   limit: 30,
// //   standardHeaders: 'draft-7',
// //   legacyHeaders: false
// // }));

// // const asyncH = fn => (req, res, next) =>
// //   Promise.resolve(fn(req, res, next)).catch(next);

// // const fail = (message, statusCode = 400) =>
// //   Object.assign(new Error(message), { statusCode });

// // const safeUser = u => ({
// //   id: u._id,
// //   email: u.email,
// //   name: u.name,
// //   country: u.country,
// //   currency: u.currency,
// //   role: u.role,
// //   status: u.status,
// //   balance: u.balance,
// //   demoBalance: u.demoBalance ?? 10000
// // });

// // const issueToken = u => jwt.sign(
// //   { sub: String(u._id), role: u.role },
// //   process.env.JWT_SECRET,
// //   { expiresIn: '8h' }
// // );

// // const auth = asyncH(async (req, res, next) => {
// //   const bearer = (req.headers.authorization || '')
// //     .replace(/^Bearer\s+/i, '');

// //   if (!bearer) {
// //     throw fail('Authentication required', 401);
// //   }

// //   let payload;

// //   try {
// //     payload = jwt.verify(
// //       bearer,
// //       process.env.JWT_SECRET
// //     );
// //   } catch {
// //     throw fail('Invalid or expired token', 401);
// //   }

// //   req.user = await User.findById(payload.sub)
// //     .select('-passwordHash');

// //   if (!req.user || req.user.status !== 'active') {
// //     throw fail('Account inactive', 401);
// //   }

// //   next();
// // });

// // const admin = (req, res, next) =>
// //   req.user.role === 'admin'
// //     ? next()
// //     : next(fail('Admin only', 403));

// // const audit = (req, action, entity, id, details = {}) =>
// //   Audit.create({
// //     actor: req.user?._id,
// //     action,
// //     entity,
// //     entityId: String(id),
// //     details
// //   });

// // app.get('/api/health', (req, res) =>
// //   res.json({
// //     ok: true,
// //     db: mongoose.connection.readyState === 1
// //   })
// // );

// // // AUTH

// // app.post('/api/auth/register', asyncH(async (req, res) => {
// //   const d = z.object({
// //     email: z.string().email(),
// //     password: z.string().min(10).max(128),
// //     name: z.string().max(80).optional(),
// //     country: z.string().max(60).optional()
// //   }).parse(req.body);

// //   if (await User.exists({
// //     email: d.email.toLowerCase()
// //   })) {
// //     throw fail('Email already registered', 409);
// //   }

// //   const u = await User.create({
// //     email: d.email.toLowerCase(),
// //     passwordHash: await bcrypt.hash(d.password, 12),
// //     name: d.name || '',
// //     country: d.country || 'India',
// //     demoBalance: 10000
// //   });

// //   res.status(201).json({
// //     token: issueToken(u),
// //     user: safeUser(u)
// //   });
// // }));

// // app.post('/api/auth/login', asyncH(async (req, res) => {
// //   const d = z.object({
// //     email: z.string().email(),
// //     password: z.string()
// //   }).parse(req.body);

// //   const u = await User.findOne({
// //     email: d.email.toLowerCase()
// //   });

// //   if (!u ||
// //       u.status !== 'active' ||
// //       !await bcrypt.compare(d.password, u.passwordHash)) {
// //     throw fail('Invalid credentials', 401);
// //   }

// //   res.json({
// //     token: issueToken(u),
// //     user: safeUser(u)
// //   });
// // }));

// // app.get('/api/auth/me', auth, (req, res) =>
// //   res.json({ user: safeUser(req.user) })
// // );

// // app.post('/api/auth/change-password', auth,
// //   asyncH(async (req, res) => {
// //     const d = z.object({
// //       oldPassword: z.string(),
// //       newPassword: z.string().min(10)
// //     }).parse(req.body);

// //     const u = await User.findById(req.user._id);

// //     if (!await bcrypt.compare(
// //       d.oldPassword,
// //       u.passwordHash
// //     )) {
// //       throw fail('Old password incorrect');
// //     }

// //     u.passwordHash = await bcrypt.hash(
// //       d.newPassword,
// //       12
// //     );

// //     await u.save();
// //     res.json({ ok: true });
// //   })
// // );

// // // USER ROUTES

// // app.get('/api/pairs', auth, asyncH(async (req, res) =>
// //   res.json(
// //     await Pair.find({ enabled: true })
// //       .sort({ symbol: 1 })
// //   )
// // ));

// // app.get('/api/notices', auth, asyncH(async (req, res) =>
// //   res.json(
// //     await Notice.find({ enabled: true })
// //       .sort({ createdAt: -1 })
// //       .limit(30)
// //   )
// // ));

// // app.get('/api/me/overview', auth,
// //   asyncH(async (req, res) => {
// //     const id = req.user._id;

// //     const [
// //       user, deposits, withdrawals, trades, tickets
// //     ] = await Promise.all([
// //       User.findById(id),
// //       Deposit.find({ user: id })
// //         .sort({ createdAt: -1 }).limit(50),
// //       Withdrawal.find({ user: id })
// //         .sort({ createdAt: -1 }).limit(50),
// //       Trade.find({ user: id })
// //         .sort({ createdAt: -1 }).limit(100),
// //       Ticket.find({ user: id })
// //         .sort({ createdAt: -1 }).limit(50)
// //     ]);

// //     res.json({
// //       user: safeUser(user),
// //       deposits,
// //       withdrawals,
// //       trades,
// //       tickets
// //     });
// //   })
// // );

// // app.post('/api/me/deposits', auth,
// //   asyncH(async (req, res) => {
// //     const d = z.object({
// //       amountUSD: z.number().min(10).max(952),
// //       method: z.string().min(2).max(80),
// //       reference: z.string().max(100).optional()
// //     }).parse(req.body);

// //     const row = await Deposit.create({
// //       ...d,
// //       user: req.user._id
// //     });

// //     await audit(req, 'request', 'deposit', row.id);
// //     res.status(201).json(row);
// //   })
// // );

// // app.post('/api/me/withdrawals', auth,
// //   asyncH(async (req, res) => {
// //     const d = z.object({
// //       amountUSD: z.number().positive(),
// //       method: z.string().min(2).max(80),
// //       destination: z.string().min(3).max(180)
// //     }).parse(req.body);

// //     const row = await Withdrawal.create({
// //       ...d,
// //       user: req.user._id
// //     });

// //     await audit(req, 'request', 'withdrawal', row.id);
// //     res.status(201).json(row);
// //   })
// // );

// // app.post('/api/me/tickets', auth,
// //   asyncH(async (req, res) => {
// //     const d = z.object({
// //       subject: z.string().min(3).max(120),
// //       message: z.string().min(3).max(2000)
// //     }).parse(req.body);

// //     res.status(201).json(
// //       await Ticket.create({
// //         ...d,
// //         user: req.user._id
// //       })
// //     );
// //   })
// // );

// // // 2-MINUTE DEMO TRADING

// // const symbols = {
// //   'EUR/USD': { base: 1.085, decimals: 5 },
// //   'GBP/USD': { base: 1.27, decimals: 5 },
// //   'BTC/USD': { base: 65000, decimals: 2 }
// // };

// // // Synthetic price feed, not real market data.
// // function demoPrice(symbol, time = Date.now()) {
// //   const c = symbols[symbol];

// //   if (!c) throw fail('Unsupported symbol');

// //   const t = time / 1000;
// //   const offset =
// //     Object.keys(symbols).indexOf(symbol) * 17;

// //   const movement =
// //     Math.sin(t / 27 + offset) * 0.0014 +
// //     Math.sin(t / 8.7 + offset * 0.7) * 0.0006 +
// //     Math.sin(t / 3.1 + offset * 1.3) * 0.0002;

// //   return Number(
// //     (c.base * (1 + movement))
// //       .toFixed(c.decimals)
// //   );
// // }

// // // Chart uses the same synthetic price function.
// // app.get('/api/trading/chart', auth, (req, res) => {
// //   const symbol = String(
// //     req.query.symbol || 'EUR/USD'
// //   );

// //   if (!symbols[symbol]) {
// //     return res.status(400).json({
// //       error: 'Unsupported symbol'
// //     });
// //   }

// //   const now = Date.now();
// //   const bucket = Math.floor(now / 5000) * 5000;
// //   const candles = [];

// //   for (let i = 79; i >= 0; i--) {
// //     const start = bucket - i * 5000;

// //     // Current candle cannot contain future prices.
// //     const end = Math.min(start + 4999, now);

// //     const values = [];
// //     const steps = Math.max(
// //       1,
// //       Math.ceil((end - start) / 1000)
// //     );

// //     for (let j = 0; j <= steps; j++) {
// //       const timestamp = Math.min(
// //         start + j * 1000,
// //         end
// //       );

// //       values.push(demoPrice(symbol, timestamp));
// //     }

// //     // Include the exact latest point.
// //     values.push(demoPrice(symbol, end));

// //     candles.push({
// //       time: start,
// //       open: values[0],
// //       high: Math.max(...values),
// //       low: Math.min(...values),
// //       close: values[values.length - 1]
// //     });
// //   }

// //   res.set('Cache-Control', 'no-store');

// //   res.json({
// //     symbol,
// //     simulated: true,
// //     candles,
// //     currentPrice: demoPrice(symbol, now),
// //     serverTime: now
// //   });
// // });

// // app.get('/api/trading/prices', auth, (req, res) => {
// //   const now = Date.now();

// //   res.json({
// //     simulated: true,
// //     timestamp: new Date(now).toISOString(),
// //     prices: Object.fromEntries(
// //       Object.keys(symbols).map(s => [
// //         s,
// //         demoPrice(s, now)
// //       ])
// //     )
// //   });
// // });

// // // BUY / SELL order
// // app.post('/api/trading/place', auth,
// //   asyncH(async (req, res) => {
// //     const d = z.object({
// //       symbol: z.enum([
// //         'EUR/USD',
// //         'GBP/USD',
// //         'BTC/USD'
// //       ]),
// //       direction: z.enum(['buy', 'sell']),
// //       amountUSD: z.number()
// //         .min(1)
// //         .max(1000)
// //         .refine(
// //           v => Math.abs(
// //             v * 100 - Math.round(v * 100)
// //           ) < 1e-7,
// //           'At most 2 decimal places'
// //         ),
// //       durationSeconds: z.literal(120)
// //     }).parse(req.body);

// //     const session = await mongoose.startSession();
// //     let result;

// //     try {
// //       await session.withTransaction(async () => {
// //         // Initialize existing users once.
// //         await User.updateOne(
// //           {
// //             _id: req.user._id,
// //             demoBalance: { $exists: false }
// //           },
// //           { $set: { demoBalance: 10000 } },
// //           { session }
// //         );

// //         const user = await User.findOneAndUpdate(
// //           {
// //             _id: req.user._id,
// //             status: 'active',
// //             demoBalance: { $gte: d.amountUSD }
// //           },
// //           {
// //             $inc: {
// //               demoBalance: -d.amountUSD
// //             }
// //           },
// //           {
// //             new: true,
// //             session
// //           }
// //         );

// //         if (!user) {
// //           throw fail('Insufficient demo balance');
// //         }

// //         const openedAt = new Date();
// //         const expiresAt = new Date(
// //           openedAt.getTime() + 120000
// //         );

// //         const [trade] = await Trade.create([{
// //           user: user._id,
// //           symbol: d.symbol,
// //           direction: d.direction,
// //           amountUSD: d.amountUSD,
// //           durationSeconds: 120,
// //           payoutPercent: 85,
// //           entryPrice: demoPrice(
// //             d.symbol,
// //             openedAt.getTime()
// //           ),
// //           openedAt,
// //           expiresAt,
// //           status: 'open'
// //         }], { session });

// //         result = {
// //           trade,
// //           demoBalance: user.demoBalance
// //         };
// //       });

// //       res.status(201).json(result);
// //     } finally {
// //       await session.endSession();
// //     }
// //   })
// // );

// // // AUTOMATIC PROFIT / LOSS SETTLEMENT

// // async function settleTrade(id) {
// //   const session = await mongoose.startSession();

// //   try {
// //     await session.withTransaction(async () => {
// //       const t = await Trade.findOne({
// //         _id: id,
// //         status: 'open',
// //         expiresAt: { $lte: new Date() }
// //       }).session(session);

// //       if (!t) return;

// //       const exit = demoPrice(
// //         t.symbol,
// //         new Date(t.expiresAt).getTime()
// //       );

// //       const draw = exit === t.entryPrice;

// //       const won = !draw && (
// //         t.direction === 'buy'
// //           ? exit > t.entryPrice
// //           : exit < t.entryPrice
// //       );

// //       const profit = draw
// //         ? 0
// //         : won
// //           ? Math.round(
// //               t.amountUSD * t.payoutPercent
// //             ) / 100
// //           : -t.amountUSD;

// //       const credit = draw
// //         ? t.amountUSD
// //         : won
// //           ? Math.round(
// //               (t.amountUSD + profit) * 100
// //             ) / 100
// //           : 0;

// //       t.exitPrice = exit;
// //       t.status = draw
// //         ? 'draw'
// //         : won
// //           ? 'won'
// //           : 'lost';
// //       t.profitUSD = profit;
// //       t.settledAt = new Date();

// //       await t.save({ session });

// //       if (credit > 0) {
// //         const u = await User.updateOne(
// //           { _id: t.user },
// //           { $inc: { demoBalance: credit } },
// //           { session }
// //         );

// //         if (!u.matchedCount) {
// //           throw fail('User missing', 404);
// //         }
// //       }

// //       await Audit.create([{
// //         actor: t.user,
// //         action: 'settle',
// //         entity: 'trade',
// //         entityId: String(t._id),
// //         details: {
// //           status: t.status,
// //           profitUSD: profit,
// //           credit,
// //           exitPrice: exit
// //         }
// //       }], { session });
// //     });
// //   } finally {
// //     await session.endSession();
// //   }
// // }

// // async function settleExpired() {
// //   const rows = await Trade.find({
// //     status: 'open',
// //     expiresAt: { $lte: new Date() }
// //   }).select('_id').limit(100);

// //   for (const row of rows) {
// //     try {
// //       await settleTrade(row._id);
// //     } catch (e) {
// //       console.error(
// //         'Trade settlement failed',
// //         row.id,
// //         e.message
// //       );
// //     }
// //   }
// // }

// // setInterval(
// //   () => settleExpired().catch(console.error),
// //   3000
// // );

// // // ADMIN

// // app.get('/api/admin/overview', auth, admin,
// //   asyncH(async (req, res) => {
// //     const [
// //       users, deposits, pendingDeposits,
// //       withdrawals, pendingWithdrawals,
// //       trades, tickets
// //     ] = await Promise.all([
// //       User.countDocuments(),
// //       Deposit.countDocuments(),
// //       Deposit.countDocuments({ status: 'pending' }),
// //       Withdrawal.countDocuments(),
// //       Withdrawal.countDocuments({ status: 'pending' }),
// //       Trade.countDocuments(),
// //       Ticket.countDocuments({ status: 'open' })
// //     ]);

// //     res.json({
// //       users,
// //       deposits,
// //       pendingDeposits,
// //       withdrawals,
// //       pendingWithdrawals,
// //       trades,
// //       tickets
// //     });
// //   })
// // );

// // const entities = {
// //   users: User,
// //   deposits: Deposit,
// //   withdrawals: Withdrawal,
// //   trades: Trade,
// //   pairs: Pair,
// //   bonuses: Bonus,
// //   tickets: Ticket,
// //   notices: Notice,
// //   settings: Setting,
// //   audit: Audit
// // };

// // const editable = {
// //   users: ['name', 'country', 'currency', 'status'],
// //   deposits: ['note'],
// //   withdrawals: ['status'],
// //   trades: [],
// //   pairs: [
// //     'symbol', 'category', 'enabled',
// //     'payout1', 'payout5', 'source'
// //   ],
// //   bonuses: [
// //     'code', 'percent', 'minUSD', 'enabled'
// //   ],
// //   tickets: ['status', 'reply'],
// //   notices: ['title', 'message', 'enabled'],
// //   settings: ['key', 'value']
// // };

// // const creatable = [
// //   'pairs', 'bonuses', 'notices', 'settings'
// // ];

// // // DEPOSIT APPROVAL — CREDIT DEPOSIT WALLET ONLY

// // app.patch('/api/admin/deposits/:id/approve',
// //   auth,
// //   admin,
// //   asyncH(async (req, res) => {
// //     if (!mongoose.isValidObjectId(req.params.id)) {
// //       throw fail('Invalid deposit ID');
// //     }

// //     const session = await mongoose.startSession();
// //     let result;

// //     try {
// //       await session.withTransaction(async () => {
// //         const d = await Deposit.findOneAndUpdate(
// //           {
// //             _id: req.params.id,
// //             status: 'pending'
// //           },
// //           {
// //             $set: {
// //               status: 'approved',
// //               note: String(
// //                 req.body?.note ||
// //                 'Payment manually verified'
// //               ).slice(0, 500)
// //             }
// //           },
// //           {
// //             new: true,
// //             session,
// //             runValidators: true
// //           }
// //         );

// //         if (!d) {
// //           throw fail(
// //             'Deposit already processed or not found',
// //             409
// //           );
// //         }

// //         if (!Number.isFinite(d.amountUSD) ||
// //             d.amountUSD <= 0) {
// //           throw fail('Invalid amount');
// //         }

// //         const u = await User.findByIdAndUpdate(
// //           d.user,
// //           { $inc: { balance: d.amountUSD } },
// //           { new: true, session }
// //         );

// //         if (!u) {
// //           throw fail('User not found', 404);
// //         }

// //         await Audit.create([{
// //           actor: req.user._id,
// //           action: 'approve',
// //           entity: 'deposit',
// //           entityId: String(d._id),
// //           details: {
// //             amountUSD: d.amountUSD,
// //             userId: String(u._id)
// //           }
// //         }], { session });

// //         result = {
// //           ok: true,
// //           status: 'approved',
// //           creditedAmount: d.amountUSD,
// //           newBalance: u.balance
// //         };
// //       });

// //       res.json(result);
// //     } finally {
// //       await session.endSession();
// //     }
// //   })
// // );

// // // ADMIN CRUD

// // app.get('/api/admin/:entity', auth, admin,
// //   asyncH(async (req, res) => {
// //     const key = req.params.entity;
// //     const Model = entities[key];

// //     if (!Model) throw fail('Unknown entity', 404);

// //     const page = Math.min(
// //       Math.max(Number(req.query.page) || 1, 1),
// //       100000
// //     );

// //     const limit = Math.min(
// //       Math.max(Number(req.query.limit) || 30, 1),
// //       100
// //     );

// //     const rows = await Model.find()
// //       .select(
// //         key === 'users' ? '-passwordHash' : ''
// //       )
// //       .sort({ createdAt: -1 })
// //       .skip((page - 1) * limit)
// //       .limit(limit)
// //       .lean();

// //     res.json({
// //       rows,
// //       total: await Model.countDocuments(),
// //       page,
// //       limit
// //     });
// //   })
// // );

// // app.post('/api/admin/:entity', auth, admin,
// //   asyncH(async (req, res) => {
// //     const key = req.params.entity;

// //     if (!creatable.includes(key)) {
// //       throw fail('Cannot create entity', 405);
// //     }

// //     const d = Object.fromEntries(
// //       Object.entries(req.body || {})
// //         .filter(([k]) => editable[key].includes(k))
// //     );

// //     const row = await entities[key].create(d);

// //     await audit(
// //       req, 'create', key, row.id
// //     );

// //     res.status(201).json(row);
// //   })
// // );

// // app.patch('/api/admin/:entity/:id', auth, admin,
// //   asyncH(async (req, res) => {
// //     const key = req.params.entity;

// //     if (!editable[key]?.length) {
// //       throw fail('Read only', 405);
// //     }

// //     const d = Object.fromEntries(
// //       Object.entries(req.body || {})
// //         .filter(([k]) => editable[key].includes(k))
// //     );

// //     if (!Object.keys(d).length) {
// //       throw fail('No allowed fields');
// //     }

// //     if (
// //       key === 'users' &&
// //       String(req.user._id) === req.params.id &&
// //       d.status === 'suspended'
// //     ) {
// //       throw fail('Cannot suspend yourself');
// //     }

// //     const row = await entities[key]
// //       .findByIdAndUpdate(
// //         req.params.id,
// //         { $set: d },
// //         {
// //           new: true,
// //           runValidators: true
// //         }
// //       );

// //     if (!row) throw fail('Not found', 404);

// //     await audit(
// //       req, 'update', key, row.id, d
// //     );

// //     res.json(row);
// //   })
// // );

// // app.delete('/api/admin/:entity/:id',
// //   auth,
// //   admin,
// //   asyncH(async (req, res) => {
// //     const key = req.params.entity;

// //     if (!creatable.includes(key)) {
// //       throw fail(
// //         'Cannot delete this record',
// //         405
// //       );
// //     }

// //     const row = await entities[key]
// //       .findByIdAndDelete(req.params.id);

// //     if (!row) throw fail('Not found', 404);

// //     await audit(
// //       req, 'delete', key, row.id
// //     );

// //     res.json({ ok: true });
// //   })
// // );

// // // ERRORS

// // app.use((err, req, res, next) => {
// //   if (err instanceof z.ZodError) {
// //     return res.status(400).json({
// //       error: 'Invalid fields',
// //       details: err.flatten()
// //     });
// //   }

// //   if (err.code === 11000) {
// //     return res.status(409).json({
// //       error: 'Duplicate record'
// //     });
// //   }

// //   if (err.name === 'CastError') {
// //     return res.status(400).json({
// //       error: 'Invalid identifier'
// //     });
// //   }

// //   if (err.statusCode) {
// //     return res.status(err.statusCode).json({
// //       error: err.message
// //     });
// //   }

// //   console.error(err);

// //   res.status(500).json({
// //     error: 'Internal server error'
// //   });
// // });

// // const PORT = Number(process.env.PORT || 4000);

// // app.listen(PORT, () => {
// //   console.log(`API listening on ${PORT}`);
// //   settleExpired().catch(console.error);
// // });





// // import 'dotenv/config';
// // import express from 'express';
// // import mongoose from 'mongoose';
// // import bcrypt from 'bcryptjs';
// // import jwt from 'jsonwebtoken';
// // import cors from 'cors';
// // import helmet from 'helmet';
// // import rateLimit from 'express-rate-limit';
// // import { z } from 'zod';

// // import {
// //   User,
// //   Deposit,
// //   Withdrawal,
// //   Trade,
// //   Pair,
// //   Bonus,
// //   Ticket,
// //   Notice,
// //   Setting,
// //   Audit,
// //   MarketSchedule
// // } from './models.js';

// // // =====================================================
// // // CONFIGURATION
// // // =====================================================

// // if (
// //   !process.env.MONGO_URI ||
// //   !process.env.JWT_SECRET ||
// //   process.env.JWT_SECRET.length < 32
// // ) {
// //   throw Error(
// //     'Set MONGO_URI and JWT_SECRET (32+ chars)'
// //   );
// // }

// // await mongoose.connect(process.env.MONGO_URI);

// // console.log('MongoDB connected');

// // const app = express();

// // app.use(helmet());

// // app.use(cors({
// //   origin: [
// //     process.env.CLIENT_ORIGIN ||
// //       'http://localhost:5173',
// //     process.env.ADMIN_ORIGIN ||
// //       'http://localhost:5174'
// //   ]
// // }));

// // app.use(express.json({ limit: '500kb' }));

// // app.use('/api/auth', rateLimit({
// //   windowMs: 15 * 60 * 1000,
// //   limit: 30,
// //   standardHeaders: 'draft-7',
// //   legacyHeaders: false
// // }));

// // const asyncH = fn => (req, res, next) =>
// //   Promise.resolve(fn(req, res, next)).catch(next);

// // const fail = (message, statusCode = 400) =>
// //   Object.assign(new Error(message), {
// //     statusCode
// //   });

// // const safeUser = user => ({
// //   id: user._id,
// //   email: user.email,
// //   name: user.name,
// //   country: user.country,
// //   currency: user.currency,
// //   role: user.role,
// //   status: user.status,
// //   balance: user.balance,
// //   demoBalance: user.demoBalance ?? 10000
// // });

// // const issueToken = user =>
// //   jwt.sign(
// //     {
// //       sub: String(user._id),
// //       role: user.role
// //     },
// //     process.env.JWT_SECRET,
// //     { expiresIn: '8h' }
// //   );

// // const auth = asyncH(async (req, res, next) => {
// //   const bearer = (
// //     req.headers.authorization || ''
// //   ).replace(/^Bearer\s+/i, '');

// //   if (!bearer) {
// //     throw fail('Authentication required', 401);
// //   }

// //   let payload;

// //   try {
// //     payload = jwt.verify(
// //       bearer,
// //       process.env.JWT_SECRET
// //     );
// //   } catch {
// //     throw fail('Invalid or expired token', 401);
// //   }

// //   req.user = await User.findById(payload.sub)
// //     .select('-passwordHash');

// //   if (!req.user || req.user.status !== 'active') {
// //     throw fail('Account inactive', 401);
// //   }

// //   next();
// // });

// // const admin = (req, res, next) => {
// //   if (req.user.role !== 'admin') {
// //     return next(fail('Admin only', 403));
// //   }

// //   next();
// // };

// // const audit = (
// //   req,
// //   action,
// //   entity,
// //   id,
// //   details = {}
// // ) => Audit.create({
// //   actor: req.user?._id,
// //   action,
// //   entity,
// //   entityId: String(id),
// //   details
// // });

// // const roundMoney = value =>
// //   Math.round((value + Number.EPSILON) * 100) / 100;

// // // =====================================================
// // // HEALTH
// // // =====================================================

// // app.get('/api/health', (req, res) => {
// //   res.json({
// //     ok: true,
// //     db: mongoose.connection.readyState === 1
// //   });
// // });

// // // =====================================================
// // // AUTHENTICATION
// // // =====================================================

// // app.post(
// //   '/api/auth/register',
// //   asyncH(async (req, res) => {
// //     const data = z.object({
// //       email: z.string().email(),
// //       password: z.string().min(10).max(128),
// //       name: z.string().max(80).optional(),
// //       country: z.string().max(60).optional()
// //     }).parse(req.body);

// //     const email = data.email.toLowerCase();

// //     if (await User.exists({ email })) {
// //       throw fail('Email already registered', 409);
// //     }

// //     const user = await User.create({
// //       email,
// //       passwordHash: await bcrypt.hash(
// //         data.password,
// //         12
// //       ),
// //       name: data.name || '',
// //       country: data.country || 'India',
// //       demoBalance: 10000
// //     });

// //     res.status(201).json({
// //       token: issueToken(user),
// //       user: safeUser(user)
// //     });
// //   })
// // );

// // app.post(
// //   '/api/auth/login',
// //   asyncH(async (req, res) => {
// //     const data = z.object({
// //       email: z.string().email(),
// //       password: z.string()
// //     }).parse(req.body);

// //     const user = await User.findOne({
// //       email: data.email.toLowerCase()
// //     });

// //     if (
// //       !user ||
// //       user.status !== 'active' ||
// //       !(await bcrypt.compare(
// //         data.password,
// //         user.passwordHash
// //       ))
// //     ) {
// //       throw fail('Invalid credentials', 401);
// //     }

// //     res.json({
// //       token: issueToken(user),
// //       user: safeUser(user)
// //     });
// //   })
// // );

// // app.get('/api/auth/me', auth, (req, res) => {
// //   res.json({
// //     user: safeUser(req.user)
// //   });
// // });

// // app.post(
// //   '/api/auth/change-password',
// //   auth,
// //   asyncH(async (req, res) => {
// //     const data = z.object({
// //       oldPassword: z.string(),
// //       newPassword: z.string().min(10).max(128)
// //     }).parse(req.body);

// //     const user = await User.findById(
// //       req.user._id
// //     );

// //     if (
// //       !(await bcrypt.compare(
// //         data.oldPassword,
// //         user.passwordHash
// //       ))
// //     ) {
// //       throw fail('Old password incorrect');
// //     }

// //     user.passwordHash = await bcrypt.hash(
// //       data.newPassword,
// //       12
// //     );

// //     await user.save();

// //     res.json({ ok: true });
// //   })
// // );

// // // =====================================================
// // // PAIRS AND NOTICES
// // // =====================================================

// // app.get(
// //   '/api/pairs',
// //   auth,
// //   asyncH(async (req, res) => {
// //     const pairs = await Pair.find({
// //       enabled: true
// //     }).sort({ symbol: 1 });

// //     res.json(pairs);
// //   })
// // );

// // app.get(
// //   '/api/notices',
// //   auth,
// //   asyncH(async (req, res) => {
// //     const notices = await Notice.find({
// //       enabled: true
// //     })
// //       .sort({ createdAt: -1 })
// //       .limit(30);

// //     res.json(notices);
// //   })
// // );

// // // =====================================================
// // // USER OVERVIEW
// // // EXISTING WALLET + DEPOSIT + WITHDRAWAL + SUPPORT
// // // =====================================================

// // app.get(
// //   '/api/me/overview',
// //   auth,
// //   asyncH(async (req, res) => {
// //     const id = req.user._id;

// //     const [
// //       user,
// //       deposits,
// //       withdrawals,
// //       trades,
// //       tickets
// //     ] = await Promise.all([
// //       User.findById(id),

// //       Deposit.find({ user: id })
// //         .sort({ createdAt: -1 })
// //         .limit(50),

// //       Withdrawal.find({ user: id })
// //         .sort({ createdAt: -1 })
// //         .limit(50),

// //       Trade.find({ user: id })
// //         .sort({ createdAt: -1 })
// //         .limit(100),

// //       Ticket.find({ user: id })
// //         .sort({ createdAt: -1 })
// //         .limit(50)
// //     ]);

// //     res.json({
// //       user: safeUser(user),
// //       deposits,
// //       withdrawals,
// //       trades,
// //       tickets
// //     });
// //   })
// // );

// // // =====================================================
// // // DEPOSIT REQUEST
// // // =====================================================

// // app.post(
// //   '/api/me/deposits',
// //   auth,
// //   asyncH(async (req, res) => {
// //     const data = z.object({
// //       amountUSD: z.number()
// //         .min(10)
// //         .max(952),

// //       method: z.string()
// //         .min(2)
// //         .max(80),

// //       reference: z.string()
// //         .max(100)
// //         .optional()
// //     }).parse(req.body);

// //     const deposit = await Deposit.create({
// //       ...data,
// //       user: req.user._id
// //     });

// //     await audit(
// //       req,
// //       'request',
// //       'deposit',
// //       deposit.id
// //     );

// //     res.status(201).json(deposit);
// //   })
// // );

// // // =====================================================
// // // WITHDRAWAL REQUEST
// // // PRESERVES ORIGINAL API CONTRACT
// // // =====================================================

// // app.post(
// //   '/api/me/withdrawals',
// //   auth,
// //   asyncH(async (req, res) => {
// //     const data = z.object({
// //       amountUSD: z.number().positive(),

// //       method: z.string()
// //         .min(2)
// //         .max(80),

// //       destination: z.string()
// //         .min(3)
// //         .max(180)
// //     }).parse(req.body);

// //     const withdrawal = await Withdrawal.create({
// //       ...data,
// //       user: req.user._id
// //     });

// //     await audit(
// //       req,
// //       'request',
// //       'withdrawal',
// //       withdrawal.id
// //     );

// //     res.status(201).json(withdrawal);
// //   })
// // );

// // // =====================================================
// // // SUPPORT TICKET
// // // =====================================================

// // app.post(
// //   '/api/me/tickets',
// //   auth,
// //   asyncH(async (req, res) => {
// //     const data = z.object({
// //       subject: z.string()
// //         .min(3)
// //         .max(120),

// //       message: z.string()
// //         .min(3)
// //         .max(2000)
// //     }).parse(req.body);

// //     const ticket = await Ticket.create({
// //       ...data,
// //       user: req.user._id
// //     });

// //     res.status(201).json(ticket);
// //   })
// // );

// // // =====================================================
// // // SCHEDULED SIMULATED MARKET
// // // =====================================================

// // const symbols = {
// //   'EUR/USD': {
// //     base: 1.085,
// //     decimals: 5,
// //     pointSize: 0.001
// //   },
// //   'GBP/USD': {
// //     base: 1.27,
// //     decimals: 5,
// //     pointSize: 0.001
// //   },
// //   'BTC/USD': {
// //     base: 65000,
// //     decimals: 2,
// //     pointSize: 1
// //   }
// // };

// // const IST_OFFSET = 330 * 60 * 1000;
// // const START_MINUTE = 7 * 60;
// // const END_MINUTE = 24 * 60;
// // const SLOT_MINUTES = 10;
// // const SLOT_COUNT = 102;

// // function istInfo(timestamp = Date.now()) {
// //   const date = new Date(timestamp + IST_OFFSET);

// //   return {
// //     date: date.toISOString().slice(0, 10),

// //     minute:
// //       date.getUTCHours() * 60 +
// //       date.getUTCMinutes() +
// //       date.getUTCSeconds() / 60 +
// //       date.getUTCMilliseconds() / 60000
// //   };
// // }

// // function todayIST() {
// //   return istInfo().date;
// // }

// // function nextDate(dateString) {
// //   const date = new Date(
// //     dateString + 'T00:00:00Z'
// //   );

// //   date.setUTCDate(
// //     date.getUTCDate() + 1
// //   );

// //   return date.toISOString().slice(0, 10);
// // }

// // function validDate(dateString) {
// //   return (
// //     /^\d{4}-\d{2}-\d{2}$/.test(dateString) &&
// //     !Number.isNaN(
// //       Date.parse(dateString + 'T00:00:00Z')
// //     ) &&
// //     new Date(
// //       dateString + 'T00:00:00Z'
// //     ).toISOString().slice(0, 10) === dateString
// //   );
// // }

// // function validateSymbol(symbol) {
// //   if (!symbols[symbol]) {
// //     throw fail('Unsupported symbol');
// //   }

// //   return symbol;
// // }

// // // =====================================================
// // // DEFAULT 102 SLOTS
// // // =====================================================

// // function makeSlots(symbol) {
// //   validateSymbol(symbol);

// //   const config = symbols[symbol];
// //   let price = config.base;

// //   return Array.from(
// //     { length: SLOT_COUNT },
// //     (_, index) => {
// //       const entryPrice = price;

// //       const movement = symbol === 'BTC/USD'
// //         ? (index % 2 ? -125 : 145)
// //         : (index % 2 ? -0.012 : 0.016);

// //       price = Number(
// //         (entryPrice + movement)
// //           .toFixed(config.decimals)
// //       );

// //       return {
// //         startMinute:
// //           START_MINUTE + index * SLOT_MINUTES,

// //         endMinute:
// //           START_MINUTE +
// //           (index + 1) * SLOT_MINUTES,

// //         entryPrice,
// //         exitPrice: price
// //       };
// //     }
// //   );
// // }

// // // =====================================================
// // // VALIDATE SCHEDULE
// // // =====================================================

// // function checkSlots(slots) {
// //   if (
// //     !Array.isArray(slots) ||
// //     slots.length !== SLOT_COUNT
// //   ) {
// //     throw fail(
// //       'Exactly 102 ten-minute slots required'
// //     );
// //   }

// //   for (let i = 0; i < SLOT_COUNT; i++) {
// //     const slot = slots[i];

// //     if (
// //       !slot ||
// //       slot.startMinute !==
// //         START_MINUTE + i * SLOT_MINUTES ||
// //       slot.endMinute !==
// //         START_MINUTE + (i + 1) * SLOT_MINUTES ||
// //       !Number.isFinite(slot.entryPrice) ||
// //       !Number.isFinite(slot.exitPrice) ||
// //       slot.entryPrice <= 0 ||
// //       slot.exitPrice <= 0
// //     ) {
// //       throw fail(
// //         `Invalid schedule slot ${i + 1}`
// //       );
// //     }

// //     if (
// //       i > 0 &&
// //       Math.abs(
// //         slots[i - 1].exitPrice -
// //         slot.entryPrice
// //       ) > 1e-8
// //     ) {
// //       throw fail(
// //         `Slot ${i + 1}: previous exit ` +
// //         'must equal next entry'
// //       );
// //     }
// //   }

// //   return slots;
// // }

// // // =====================================================
// // // SMOOTH PRICE ENGINE
// // // =====================================================

// // function smoothstep(value) {
// //   const t = Math.max(
// //     0,
// //     Math.min(1, value)
// //   );

// //   return t * t * (3 - 2 * t);
// // }

// // function scheduledPrice(schedule, timestamp) {
// //   if (!schedule) return null;

// //   const { date, minute } = istInfo(timestamp);

// //   if (
// //     schedule.date !== date ||
// //     minute < START_MINUTE ||
// //     minute >= END_MINUTE
// //   ) {
// //     return null;
// //   }

// //   const index = Math.floor(
// //     (minute - START_MINUTE) / SLOT_MINUTES
// //   );

// //   const slot = schedule.slots[index];

// //   if (!slot) return null;

// //   const progress =
// //     (minute - slot.startMinute) /
// //     SLOT_MINUTES;

// //   const price =
// //     slot.entryPrice +
// //     (
// //       slot.exitPrice -
// //       slot.entryPrice
// //     ) * smoothstep(progress);

// //   return Number(
// //     price.toFixed(
// //       symbols[schedule.symbol].decimals
// //     )
// //   );
// // }

// // // =====================================================
// // // SCHEDULE LOOKUP
// // // =====================================================

// // const scheduleCache = new Map();

// // async function getSchedule(
// //   symbol,
// //   timestamp = Date.now()
// // ) {
// //   validateSymbol(symbol);

// //   const { date } = istInfo(timestamp);
// //   const key = `${date}|${symbol}`;

// //   const cached = scheduleCache.get(key);

// //   if (
// //     cached &&
// //     Date.now() - cached.at < 2000
// //   ) {
// //     return cached.data;
// //   }

// //   const schedule = await MarketSchedule.findOne({
// //     date,
// //     symbol,
// //     status: 'published'
// //   }).lean();

// //   scheduleCache.set(key, {
// //     at: Date.now(),
// //     data: schedule
// //   });

// //   return schedule;
// // }

// // // =====================================================
// // // DEMO CHART
// // // =====================================================

// // app.get(
// //   '/api/trading/chart',
// //   auth,
// //   asyncH(async (req, res) => {
// //     const symbol = validateSymbol(
// //       String(req.query.symbol || 'EUR/USD')
// //     );

// //     const now = Date.now();
// //     const schedule = await getSchedule(symbol, now);

// //     const candles = [];
// //     const bucket = Math.floor(now / 5000) * 5000;

// //     for (let i = 79; i >= 0; i--) {
// //       const start = bucket - i * 5000;
// //       const end = Math.min(start + 4999, now);

// //       const values = [];

// //       for (
// //         let timestamp = start;
// //         timestamp < end;
// //         timestamp += 1000
// //       ) {
// //         const price = getDemoPrice(
// //           symbol,
// //           timestamp,
// //           schedule
// //         );

// //         if (price !== null) {
// //           values.push(price);
// //         }
// //       }

// //       const last = getDemoPrice(
// //         symbol,
// //         end,
// //         schedule
// //       );

// //       if (last !== null) {
// //         values.push(last);
// //       }

// //       if (!values.length) continue;

// //       candles.push({
// //         time: start,
// //         open: values[0],
// //         high: Math.max(...values),
// //         low: Math.min(...values),
// //         close: values.at(-1)
// //       });
// //     }

// //     const currentPrice = getDemoPrice(
// //       symbol,
// //       now,
// //       schedule
// //     );

// //     res.set('Cache-Control', 'no-store');

// //     res.json({
// //       symbol,
// //       simulated: true,
// //       marketType: 'scheduled-demo',
// //       scheduleStatus: schedule
// //         ? 'published'
// //         : 'unavailable',
// //       priceSource: schedule
// //         ? 'published-schedule'
// //         : 'automatic-demo',
// //       timezone: 'Asia/Kolkata',
// //       candles,
// //       currentPrice,
// //       serverTime: now
// //     });
// //   })
// // );

// // // =====================================================
// // // DEMO PRICES
// // // =====================================================

// // app.get(
// //   '/api/trading/prices',
// //   auth,
// //   asyncH(async (req, res) => {
// //     const now = Date.now();

// //     const prices = {};
// //     const priceSources = {};

// //     for (const symbol of Object.keys(symbols)) {
// //       const schedule = await getSchedule(
// //         symbol,
// //         now
// //       );

// //       prices[symbol] = getDemoPrice(
// //         symbol,
// //         now,
// //         schedule
// //       );

// //       priceSources[symbol] = schedule
// //         ? 'published-schedule'
// //         : 'automatic-demo';
// //     }

// //     res.set('Cache-Control', 'no-store');

// //     res.json({
// //       simulated: true,
// //       marketType: 'scheduled-demo',
// //       timestamp: new Date(now).toISOString(),
// //       prices,
// //       priceSources
// //     });
// //   })
// // );

// // // =====================================================
// // // ADMIN: READ SCHEDULE
// // // =====================================================

// // app.get(
// //   '/api/admin/schedules/:date/:symbol',
// //   auth,
// //   admin,
// //   asyncH(async (req, res) => {
// //     const { date, symbol } = req.params;

// //     if (!validDate(date)) {
// //       throw fail('Invalid date');
// //     }

// //     validateSymbol(symbol);

// //     const schedule =
// //       await MarketSchedule.findOne({
// //         date,
// //         symbol
// //       }).lean();

// //     if (schedule) {
// //       return res.json(schedule);
// //     }

// //     res.json({
// //       date,
// //       symbol,
// //       timezone: 'Asia/Kolkata',
// //       pointSize: symbols[symbol].pointSize,
// //       status: 'new',
// //       version: 0,
// //       slots: makeSlots(symbol)
// //     });
// //   })
// // );

// // // =====================================================
// // // ADMIN: SAVE DRAFT
// // // =====================================================

// // app.put(
// //   '/api/admin/schedules/:date/:symbol',
// //   auth,
// //   admin,
// //   asyncH(async (req, res) => {
// //     const { date, symbol } = req.params;

// //     if (!validDate(date)) {
// //       throw fail('Invalid date');
// //     }

// //     validateSymbol(symbol);

// //     if (date <= todayIST()) {
// //       throw fail(
// //         'Only future schedules can be edited',
// //         409
// //       );
// //     }

// //     const slots = checkSlots(
// //       req.body.slots
// //     );

// //     const version = Number(
// //       req.body.version
// //     );

// //     if (
// //       !Number.isInteger(version) ||
// //       version < 0
// //     ) {
// //       throw fail('Invalid schedule version');
// //     }

// //     const existing =
// //       await MarketSchedule.findOne({
// //         date,
// //         symbol
// //       });

// //     if (
// //       existing &&
// //       existing.status === 'published'
// //     ) {
// //       throw fail(
// //         'Published schedule is locked',
// //         409
// //       );
// //     }

// //     let schedule;

// //     if (existing) {
// //       schedule =
// //         await MarketSchedule.findOneAndUpdate(
// //           {
// //             _id: existing._id,
// //             status: 'draft',
// //             version
// //           },
// //           {
// //             $set: {
// //               slots,
// //               pointSize:
// //                 symbols[symbol].pointSize
// //             },
// //             $inc: {
// //               version: 1
// //             }
// //           },
// //           {
// //             new: true,
// //             runValidators: true
// //           }
// //         );

// //       if (!schedule) {
// //         throw fail(
// //           'Schedule changed. Reload and retry.',
// //           409
// //         );
// //       }
// //     } else {
// //       if (version !== 0) {
// //         throw fail(
// //           'Reload schedule and retry',
// //           409
// //         );
// //       }

// //       schedule = await MarketSchedule.create({
// //         date,
// //         symbol,
// //         timezone: 'Asia/Kolkata',
// //         pointSize:
// //           symbols[symbol].pointSize,
// //         status: 'draft',
// //         version: 1,
// //         slots,
// //         createdBy: req.user._id
// //       });
// //     }

// //     await audit(
// //       req,
// //       'save',
// //       'marketSchedule',
// //       schedule.id,
// //       {
// //         date,
// //         symbol,
// //         version: schedule.version
// //       }
// //     );

// //     scheduleCache.delete(
// //       `${date}|${symbol}`
// //     );

// //     res.json(schedule);
// //   })
// // );

// // // =====================================================
// // // ADMIN: PUBLISH SCHEDULE
// // // =====================================================

// // app.post(
// //   '/api/admin/schedules/:date/:symbol/publish',
// //   auth,
// //   admin,
// //   asyncH(async (req, res) => {
// //     const { date, symbol } = req.params;

// //     if (!validDate(date)) {
// //       throw fail('Invalid date');
// //     }

// //     validateSymbol(symbol);

// //     if (date <= todayIST()) {
// //       throw fail(
// //         'Only future schedules can be published',
// //         409
// //       );
// //     }

// //     const version = Number(
// //       req.body.version
// //     );

// //     if (!Number.isInteger(version)) {
// //       throw fail('Invalid version');
// //     }

// //     const schedule =
// //       await MarketSchedule.findOneAndUpdate(
// //         {
// //           date,
// //           symbol,
// //           status: 'draft',
// //           version
// //         },
// //         {
// //           $set: {
// //             status: 'published',
// //             publishedAt: new Date()
// //           }
// //         },
// //         { new: true }
// //       );

// //     if (!schedule) {
// //       throw fail(
// //         'Draft missing, changed or already published',
// //         409
// //       );
// //     }

// //     await audit(
// //       req,
// //       'publish',
// //       'marketSchedule',
// //       schedule.id,
// //       {
// //         date,
// //         symbol,
// //         version
// //       }
// //     );

// //     scheduleCache.delete(
// //       `${date}|${symbol}`
// //     );

// //     res.json(schedule);
// //   })
// // );

// // // =====================================================
// // // DEMO TRADE PLACEMENT
// // // =====================================================

// // app.post(
// //   '/api/trading/place',
// //   auth,
// //   asyncH(async (req, res) => {
// //     const data = z.object({
// //       symbol: z.enum([
// //         'EUR/USD',
// //         'GBP/USD',
// //         'BTC/USD'
// //       ]),

// //       direction: z.enum([
// //         'buy',
// //         'sell'
// //       ]),

// //       amountUSD: z.number()
// //         .min(1)
// //         .max(1000)
// //         .refine(
// //           value =>
// //             Math.abs(
// //               value * 100 -
// //               Math.round(value * 100)
// //             ) < 1e-7,
// //           'Maximum 2 decimal places'
// //         ),

// //       durationSeconds: z.literal(120)
// //     }).parse(req.body);

// //     const openedAt = new Date();
// //     const expiresAt = new Date(
// //       openedAt.getTime() + 120000
// //     );

// //     // Get today's published schedule, if available.
// //     const schedule = await getSchedule(
// //       data.symbol,
// //       openedAt.getTime()
// //     );

// //     // Same price engine as the demo chart.
// //     const entryPrice = getDemoPrice(
// //       data.symbol,
// //       openedAt.getTime(),
// //       schedule
// //     );

// //     const exitAvailable = getDemoPrice(
// //       data.symbol,
// //       expiresAt.getTime(),
// //       schedule
// //     );

// //     // Prevent trades outside the demo market session.
// //     if (
// //       entryPrice === null ||
// //       exitAvailable === null
// //     ) {
// //       throw fail(
// //         'Demo market closed or expiry outside session',
// //         409
// //       );
// //     }

// //     const session = await mongoose.startSession();
// //     let result;

// //     try {
// //       await session.withTransaction(async () => {
// //         const user = await User.findOneAndUpdate(
// //           {
// //             _id: req.user._id,
// //             status: 'active',
// //             demoBalance: {
// //               $gte: data.amountUSD
// //             }
// //           },
// //           {
// //             $inc: {
// //               demoBalance: -data.amountUSD
// //             }
// //           },
// //           {
// //             new: true,
// //             session
// //           }
// //         );

// //         if (!user) {
// //           throw fail('Insufficient demo balance');
// //         }

// //         const [trade] = await Trade.create(
// //           [{
// //             user: user._id,
// //             symbol: data.symbol,
// //             direction: data.direction,
// //             amountUSD: data.amountUSD,
// //             durationSeconds: 120,
// //             payoutPercent: 85,
// //             entryPrice,

// //             // Null when using automatic demo prices.
// //             schedule: schedule?._id ?? null,
// //             scheduleVersion: schedule?.version ?? 0,

// //             openedAt,
// //             expiresAt,
// //             status: 'open'
// //           }],
// //           { session }
// //         );

// //         result = {
// //           trade,
// //           demoBalance: user.demoBalance
// //         };
// //       });

// //       res.status(201).json(result);
// //     } finally {
// //       await session.endSession();
// //     }
// //   })
// // );


// // // =====================================================
// // // LEGACY DEMO PRICE
// // // FOR PRE-EXISTING OPEN TRADES ONLY
// // // =====================================================

// // function legacyPrice(
// //   symbol,
// //   timestamp = Date.now()
// // ) {
// //   const config = symbols[symbol];

// //   if (!config) {
// //     throw fail('Unsupported symbol');
// //   }

// //   const time = timestamp / 1000;

// //   const offset =
// //     Object.keys(symbols).indexOf(symbol) * 17;

// //   const movement =
// //     Math.sin(time / 27 + offset) * 0.0014 +
// //     Math.sin(time / 8.7 + offset * 0.7) * 0.0006 +
// //     Math.sin(time / 3.1 + offset * 1.3) * 0.0002;

// //   return Number(
// //     (
// //       config.base * (1 + movement)
// //     ).toFixed(config.decimals)
// //   );
// // }

// // function getDemoPrice(symbol, timestamp, schedule = null) {
// //   validateSymbol(symbol);

// //   // Published schedule takes priority.
// //   if (schedule) {
// //     return scheduledPrice(schedule, timestamp);
// //   }

// //   // Fallback only for dates without a published schedule.
// //   const { minute } = istInfo(timestamp);

// //   if (minute < START_MINUTE || minute >= END_MINUTE) {
// //     return null;
// //   }

// //   return legacyPrice(symbol, timestamp);
// // }

// // // =====================================================
// // // TRADE SETTLEMENT
// // // =====================================================

// // async function settleTrade(tradeId) {
// //   const session = await mongoose.startSession();

// //   try {
// //     await session.withTransaction(async () => {
// //       const trade = await Trade.findOne({
// //         _id: tradeId,
// //         status: 'open',
// //         expiresAt: {
// //           $lte: new Date()
// //         }
// //       }).session(session);

// //       if (!trade) return;

// //       let exitPrice;
// //       let schedule = null;

// //       if (trade.schedule) {
// //         schedule = await MarketSchedule
// //           .findById(trade.schedule)
// //           .session(session);

// //         if (
// //           !schedule ||
// //           schedule.status !== 'published' ||
// //           schedule.version !==
// //             trade.scheduleVersion
// //         ) {
// //           throw fail(
// //             'Trade schedule unavailable',
// //             409
// //           );
// //         }

// //         exitPrice = scheduledPrice(
// //           schedule,
// //           trade.expiresAt.getTime()
// //         );
// //       } else {
// //         // Preserve settlement for older demo trades.
// //         exitPrice = legacyPrice(
// //           trade.symbol,
// //           trade.expiresAt.getTime()
// //         );
// //       }

// //       if (exitPrice === null) {
// //         throw fail(
// //           'Exit price unavailable',
// //           409
// //         );
// //       }

// //       const difference =
// //         exitPrice - trade.entryPrice;

// //       const draw =
// //         exitPrice === trade.entryPrice;

// //       const won = !draw && (
// //         trade.direction === 'buy'
// //           ? difference > 0
// //           : difference < 0
// //       );

// //       // Point score is informational only.
// //       if (schedule) {
// //         const pointSize =
// //           symbols[trade.symbol].pointSize;

// //         const signedPoints =
// //           difference / pointSize;

// //         trade.signedPoints = Number(
// //           signedPoints.toFixed(4)
// //         );

// //         trade.demoMultiplier = Number(
// //           (
// //             Math.abs(signedPoints) / 100
// //           ).toFixed(4)
// //         );
// //       }

// //       // Original fixed 85% demo payout.
// //       const profitUSD = draw
// //         ? 0
// //         : won
// //           ? roundMoney(
// //               trade.amountUSD *
// //               trade.payoutPercent / 100
// //             )
// //           : -trade.amountUSD;

// //       const creditUSD = draw
// //         ? trade.amountUSD
// //         : won
// //           ? roundMoney(
// //               trade.amountUSD + profitUSD
// //             )
// //           : 0;

// //       trade.exitPrice = exitPrice;

// //       trade.status = draw
// //         ? 'draw'
// //         : won
// //           ? 'won'
// //           : 'lost';

// //       trade.profitUSD = profitUSD;
// //       trade.settledAt = new Date();

// //       await trade.save({ session });

// //       if (creditUSD > 0) {
// //         const update = await User.updateOne(
// //           { _id: trade.user },
// //           {
// //             $inc: {
// //               demoBalance: creditUSD
// //             }
// //           },
// //           { session }
// //         );

// //         if (update.matchedCount !== 1) {
// //           throw fail(
// //             'Trade user unavailable',
// //             404
// //           );
// //         }
// //       }

// //       await Audit.create(
// //         [{
// //           actor: trade.user,
// //           action: 'settle',
// //           entity: 'trade',
// //           entityId: String(trade._id),
// //           details: {
// //             status: trade.status,
// //             profitUSD,
// //             creditUSD,
// //             entryPrice: trade.entryPrice,
// //             exitPrice,
// //             signedPoints:
// //               trade.signedPoints,
// //             demoMultiplier:
// //               trade.demoMultiplier
// //           }
// //         }],
// //         { session }
// //       );
// //     });
// //   } finally {
// //     await session.endSession();
// //   }
// // }

// // // =====================================================
// // // AUTO SETTLEMENT
// // // =====================================================

// // let settlementRunning = false;

// // async function settleExpired() {
// //   if (settlementRunning) return;

// //   settlementRunning = true;

// //   try {
// //     const rows = await Trade.find({
// //       status: 'open',
// //       expiresAt: {
// //         $lte: new Date()
// //       }
// //     })
// //       .sort({ expiresAt: 1 })
// //       .select('_id')
// //       .limit(100)
// //       .lean();

// //     for (const row of rows) {
// //       try {
// //         await settleTrade(row._id);
// //       } catch (error) {
// //         console.error(
// //           'Trade settlement failed:',
// //           row._id,
// //           error.message
// //         );
// //       }
// //     }
// //   } finally {
// //     settlementRunning = false;
// //   }
// // }

// // setInterval(
// //   () => settleExpired().catch(console.error),
// //   3000
// // );

// // // =====================================================
// // // ADMIN OVERVIEW
// // // =====================================================

// // app.get(
// //   '/api/admin/overview',
// //   auth,
// //   admin,
// //   asyncH(async (req, res) => {
// //     const [
// //       users,
// //       deposits,
// //       pendingDeposits,
// //       withdrawals,
// //       pendingWithdrawals,
// //       trades,
// //       tickets
// //     ] = await Promise.all([
// //       User.countDocuments(),

// //       Deposit.countDocuments(),

// //       Deposit.countDocuments({
// //         status: 'pending'
// //       }),

// //       Withdrawal.countDocuments(),

// //       Withdrawal.countDocuments({
// //         status: 'pending'
// //       }),

// //       Trade.countDocuments(),

// //       Ticket.countDocuments({
// //         status: 'open'
// //       })
// //     ]);

// //     res.json({
// //       users,
// //       deposits,
// //       pendingDeposits,
// //       withdrawals,
// //       pendingWithdrawals,
// //       trades,
// //       tickets
// //     });
// //   })
// // );

// // // =====================================================
// // // ADMIN ENTITY CONFIGURATION
// // // =====================================================

// // const entities = {
// //   users: User,
// //   deposits: Deposit,
// //   withdrawals: Withdrawal,
// //   trades: Trade,
// //   pairs: Pair,
// //   bonuses: Bonus,
// //   tickets: Ticket,
// //   notices: Notice,
// //   settings: Setting,
// //   audit: Audit
// // };

// // const editable = {
// //   users: [
// //     'name',
// //     'country',
// //     'currency',
// //     'status'
// //   ],

// //   deposits: [
// //     'note'
// //   ],

// //   withdrawals: [
// //     'status'
// //   ],

// //   trades: [],

// //   pairs: [
// //     'symbol',
// //     'category',
// //     'enabled',
// //     'payout1',
// //     'payout5',
// //     'source'
// //   ],

// //   bonuses: [
// //     'code',
// //     'percent',
// //     'minUSD',
// //     'enabled'
// //   ],

// //   tickets: [
// //     'status',
// //     'reply'
// //   ],

// //   notices: [
// //     'title',
// //     'message',
// //     'enabled'
// //   ],

// //   settings: [
// //     'key',
// //     'value'
// //   ]
// // };

// // const creatable = [
// //   'pairs',
// //   'bonuses',
// //   'notices',
// //   'settings'
// // ];

// // // =====================================================
// // // ADMIN DEPOSIT APPROVAL
// // // PRESERVES REAL WALLET CREDIT
// // // =====================================================

// // app.patch(
// //   '/api/admin/deposits/:id/approve',
// //   auth,
// //   admin,
// //   asyncH(async (req, res) => {
// //     if (
// //       !mongoose.isValidObjectId(req.params.id)
// //     ) {
// //       throw fail('Invalid deposit ID');
// //     }

// //     const session = await mongoose.startSession();
// //     let result;

// //     try {
// //       await session.withTransaction(async () => {
// //         const deposit =
// //           await Deposit.findOneAndUpdate(
// //             {
// //               _id: req.params.id,
// //               status: 'pending'
// //             },
// //             {
// //               $set: {
// //                 status: 'approved',
// //                 note: String(
// //                   req.body?.note ||
// //                   'Payment manually verified'
// //                 ).slice(0, 500)
// //               }
// //             },
// //             {
// //               new: true,
// //               session,
// //               runValidators: true
// //             }
// //           );

// //         if (!deposit) {
// //           throw fail(
// //             'Deposit already processed or not found',
// //             409
// //           );
// //         }

// //         if (
// //           !Number.isFinite(deposit.amountUSD) ||
// //           deposit.amountUSD <= 0
// //         ) {
// //           throw fail('Invalid deposit amount');
// //         }

// //         const user =
// //           await User.findByIdAndUpdate(
// //             deposit.user,
// //             {
// //               $inc: {
// //                 balance: deposit.amountUSD
// //               }
// //             },
// //             {
// //               new: true,
// //               session
// //             }
// //           );

// //         if (!user) {
// //           throw fail(
// //             'User not found',
// //             404
// //           );
// //         }

// //         await Audit.create(
// //           [{
// //             actor: req.user._id,
// //             action: 'approve',
// //             entity: 'deposit',
// //             entityId: String(deposit._id),
// //             details: {
// //               amountUSD: deposit.amountUSD,
// //               userId: String(user._id)
// //             }
// //           }],
// //           { session }
// //         );

// //         result = {
// //           ok: true,
// //           status: 'approved',
// //           creditedAmount: deposit.amountUSD,
// //           newBalance: user.balance
// //         };
// //       });

// //       res.json(result);
// //     } finally {
// //       await session.endSession();
// //     }
// //   })
// // );

// // // =====================================================
// // // ADMIN LIST ENTITIES
// // // =====================================================

// // app.get(
// //   '/api/admin/:entity',
// //   auth,
// //   admin,
// //   asyncH(async (req, res) => {
// //     const key = req.params.entity;
// //     const Model = entities[key];

// //     if (!Model) {
// //       throw fail('Unknown entity', 404);
// //     }

// //     const page = Math.min(
// //       Math.max(
// //         Number(req.query.page) || 1,
// //         1
// //       ),
// //       100000
// //     );

// //     const limit = Math.min(
// //       Math.max(
// //         Number(req.query.limit) || 30,
// //         1
// //       ),
// //       100
// //     );

// //     const rows = await Model.find()
// //       .select(
// //         key === 'users'
// //           ? '-passwordHash'
// //           : ''
// //       )
// //       .sort({ createdAt: -1 })
// //       .skip((page - 1) * limit)
// //       .limit(limit)
// //       .lean();

// //     res.json({
// //       rows,
// //       total: await Model.countDocuments(),
// //       page,
// //       limit
// //     });
// //   })
// // );

// // // =====================================================
// // // ADMIN CREATE ENTITY
// // // =====================================================

// // app.post(
// //   '/api/admin/:entity',
// //   auth,
// //   admin,
// //   asyncH(async (req, res) => {
// //     const key = req.params.entity;

// //     if (!creatable.includes(key)) {
// //       throw fail(
// //         'Cannot create entity',
// //         405
// //       );
// //     }

// //     const data = Object.fromEntries(
// //       Object.entries(req.body || {})
// //         .filter(
// //           ([field]) =>
// //             editable[key].includes(field)
// //         )
// //     );

// //     const row = await entities[key].create(data);

// //     await audit(
// //       req,
// //       'create',
// //       key,
// //       row.id
// //     );

// //     res.status(201).json(row);
// //   })
// // );

// // // =====================================================
// // // ADMIN UPDATE ENTITY
// // // =====================================================

// // app.patch(
// //   '/api/admin/:entity/:id',
// //   auth,
// //   admin,
// //   asyncH(async (req, res) => {
// //     const key = req.params.entity;

// //     if (!editable[key]?.length) {
// //       throw fail('Read only', 405);
// //     }

// //     const data = Object.fromEntries(
// //       Object.entries(req.body || {})
// //         .filter(
// //           ([field]) =>
// //             editable[key].includes(field)
// //         )
// //     );

// //     if (!Object.keys(data).length) {
// //       throw fail('No allowed fields');
// //     }

// //     if (
// //       key === 'users' &&
// //       String(req.user._id) === req.params.id &&
// //       data.status === 'suspended'
// //     ) {
// //       throw fail(
// //         'Cannot suspend yourself'
// //       );
// //     }

// //     const row =
// //       await entities[key].findByIdAndUpdate(
// //         req.params.id,
// //         { $set: data },
// //         {
// //           new: true,
// //           runValidators: true
// //         }
// //       );

// //     if (!row) {
// //       throw fail('Not found', 404);
// //     }

// //     await audit(
// //       req,
// //       'update',
// //       key,
// //       row.id,
// //       data
// //     );

// //     res.json(row);
// //   })
// // );

// // // =====================================================
// // // ADMIN DELETE CONFIGURATION ENTITY
// // // =====================================================

// // app.delete(
// //   '/api/admin/:entity/:id',
// //   auth,
// //   admin,
// //   asyncH(async (req, res) => {
// //     const key = req.params.entity;

// //     if (!creatable.includes(key)) {
// //       throw fail(
// //         'Cannot delete this record',
// //         405
// //       );
// //     }

// //     const row =
// //       await entities[key].findByIdAndDelete(
// //         req.params.id
// //       );

// //     if (!row) {
// //       throw fail('Not found', 404);
// //     }

// //     await audit(
// //       req,
// //       'delete',
// //       key,
// //       row.id
// //     );

// //     res.json({ ok: true });
// //   })
// // );

// // // =====================================================
// // // ERROR HANDLING
// // // =====================================================

// // app.use((err, req, res, next) => {
// //   if (err instanceof z.ZodError) {
// //     return res.status(400).json({
// //       error: 'Invalid fields',
// //       details: err.flatten()
// //     });
// //   }

// //   if (err.code === 11000) {
// //     return res.status(409).json({
// //       error: 'Duplicate record'
// //     });
// //   }

// //   if (err.name === 'CastError') {
// //     return res.status(400).json({
// //       error: 'Invalid identifier'
// //     });
// //   }

// //   if (err.statusCode) {
// //     return res.status(err.statusCode).json({
// //       error: err.message
// //     });
// //   }

// //   console.error(err);

// //   res.status(500).json({
// //     error: 'Internal server error'
// //   });
// // });

// // // =====================================================
// // // START SERVER
// // // =====================================================

// // const PORT = Number(
// //   process.env.PORT || 4000
// // );

// // app.listen(PORT, () => {
// //   console.log(
// //     `Quotexx API listening on port ${PORT}`
// //   );

// //   settleExpired().catch(console.error);
// // });




// import 'dotenv/config';
// import express from 'express';
// import mongoose from 'mongoose';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import cors from 'cors';
// import helmet from 'helmet';
// import rateLimit from 'express-rate-limit';
// import { z } from 'zod';

// import {
//   User, Deposit, Withdrawal, Trade, Pair, Bonus,
//   Ticket, Notice, Setting, Audit, MarketSchedule
// } from './models.js';

// // ================= CONFIG =================

// if (
//   !process.env.MONGO_URI ||
//   !process.env.JWT_SECRET ||
//   process.env.JWT_SECRET.length < 32
// ) {
//   throw Error('Set MONGO_URI and JWT_SECRET (32+ chars)');
// }

// await mongoose.connect(process.env.MONGO_URI);
// console.log('MongoDB connected');

// const app = express();

// app.use(helmet());
// app.use(cors({
//   origin: [
//     process.env.CLIENT_ORIGIN || 'http://localhost:5173',
//     process.env.ADMIN_ORIGIN || 'http://localhost:5174'
//   ]
// }));
// app.use(express.json({ limit: '500kb' }));

// app.use('/api/auth', rateLimit({
//   windowMs: 15 * 60 * 1000,
//   limit: 30,
//   standardHeaders: 'draft-7',
//   legacyHeaders: false
// }));

// const asyncH = fn => (req, res, next) =>
//   Promise.resolve(fn(req, res, next)).catch(next);

// const fail = (message, statusCode = 400) =>
//   Object.assign(new Error(message), { statusCode });

// const roundMoney = value =>
//   Math.round((value + Number.EPSILON) * 100) / 100;

// const safeUser = user => ({
//   id: user._id,
//   email: user.email,
//   name: user.name,
//   country: user.country,
//   currency: user.currency,
//   role: user.role,
//   status: user.status,
//   balance: user.balance,
//   demoBalance: user.demoBalance ?? 10000
// });

// const issueToken = user =>
//   jwt.sign(
//     { sub: String(user._id), role: user.role },
//     process.env.JWT_SECRET,
//     { expiresIn: '8h' }
//   );

// const auth = asyncH(async (req, res, next) => {
//   const bearer = (
//     req.headers.authorization || ''
//   ).replace(/^Bearer\s+/i, '');

//   if (!bearer) throw fail('Authentication required', 401);

//   let payload;
//   try {
//     payload = jwt.verify(bearer, process.env.JWT_SECRET);
//   } catch {
//     throw fail('Invalid or expired token', 401);
//   }

//   req.user = await User.findById(payload.sub)
//     .select('-passwordHash');

//   if (!req.user || req.user.status !== 'active') {
//     throw fail('Account inactive', 401);
//   }
//   next();
// });

// const admin = (req, res, next) => {
//   if (req.user.role !== 'admin') {
//     return next(fail('Admin only', 403));
//   }
//   next();
// };

// const audit = (req, action, entity, id, details = {}) =>
//   Audit.create({
//     actor: req.user?._id,
//     action,
//     entity,
//     entityId: String(id),
//     details
//   });

// // ================= HEALTH =================

// app.get('/api/health', (req, res) => {
//   res.json({
//     ok: true,
//     db: mongoose.connection.readyState === 1
//   });
// });

// // ================= AUTH =================

// app.post('/api/auth/register', asyncH(async (req, res) => {
//   const data = z.object({
//     email: z.string().email(),
//     password: z.string().min(10).max(128),
//     name: z.string().max(80).optional(),
//     country: z.string().max(60).optional()
//   }).parse(req.body);

//   const email = data.email.toLowerCase();

//   if (await User.exists({ email })) {
//     throw fail('Email already registered', 409);
//   }

//   const user = await User.create({
//     email,
//     passwordHash: await bcrypt.hash(data.password, 12),
//     name: data.name || '',
//     country: data.country || 'India',
//     demoBalance: 10000
//   });

//   res.status(201).json({
//     token: issueToken(user),
//     user: safeUser(user)
//   });
// }));

// app.post('/api/auth/login', asyncH(async (req, res) => {
//   const data = z.object({
//     email: z.string().email(),
//     password: z.string()
//   }).parse(req.body);

//   const user = await User.findOne({
//     email: data.email.toLowerCase()
//   });

//   if (
//     !user ||
//     user.status !== 'active' ||
//     !(await bcrypt.compare(data.password, user.passwordHash))
//   ) {
//     throw fail('Invalid credentials', 401);
//   }

//   res.json({
//     token: issueToken(user),
//     user: safeUser(user)
//   });
// }));

// app.get('/api/auth/me', auth, (req, res) => {
//   res.json({ user: safeUser(req.user) });
// });

// app.post(
//   '/api/auth/change-password',
//   auth,
//   asyncH(async (req, res) => {
//     const data = z.object({
//       oldPassword: z.string(),
//       newPassword: z.string().min(10).max(128)
//     }).parse(req.body);

//     const user = await User.findById(req.user._id);

//     if (
//       !(await bcrypt.compare(
//         data.oldPassword,
//         user.passwordHash
//       ))
//     ) {
//       throw fail('Old password incorrect');
//     }

//     user.passwordHash = await bcrypt.hash(
//       data.newPassword,
//       12
//     );

//     await user.save();
//     res.json({ ok: true });
//   })
// );

// // ================= PAIRS / NOTICES =================

// app.get('/api/pairs', auth, asyncH(async (req, res) => {
//   const pairs = await Pair.find({ enabled: true })
//     .sort({ symbol: 1 });
//   res.json(pairs);
// }));

// app.get('/api/notices', auth, asyncH(async (req, res) => {
//   const notices = await Notice.find({ enabled: true })
//     .sort({ createdAt: -1 })
//     .limit(30);
//   res.json(notices);
// }));

// // ================= USER OVERVIEW =================

// app.get('/api/me/overview', auth, asyncH(async (req, res) => {
//   const id = req.user._id;

//   const [
//     user, deposits, withdrawals, trades, tickets
//   ] = await Promise.all([
//     User.findById(id),
//     Deposit.find({ user: id })
//       .sort({ createdAt: -1 }).limit(50),
//     Withdrawal.find({ user: id })
//       .sort({ createdAt: -1 }).limit(50),
//     Trade.find({ user: id })
//       .sort({ createdAt: -1 }).limit(100),
//     Ticket.find({ user: id })
//       .sort({ createdAt: -1 }).limit(50)
//   ]);

//   res.json({
//     user: safeUser(user),
//     deposits,
//     withdrawals,
//     trades,
//     tickets
//   });
// }));

// // ================= DEPOSITS =================

// app.post('/api/me/deposits', auth, asyncH(async (req, res) => {
//   const data = z.object({
//     amountUSD: z.number().min(10).max(952),
//     method: z.string().min(2).max(80),
//     reference: z.string().max(100).optional()
//   }).parse(req.body);

//   const deposit = await Deposit.create({
//     ...data,
//     user: req.user._id
//   });

//   await audit(req, 'request', 'deposit', deposit.id);
//   res.status(201).json(deposit);
// }));

// // ================= WITHDRAWALS =================

// app.post(
//   '/api/me/withdrawals',
//   auth,
//   asyncH(async (req, res) => {
//     const data = z.object({
//       amountUSD: z.number().positive(),
//       method: z.string().min(2).max(80),
//       destination: z.string().min(3).max(180)
//     }).parse(req.body);

//     const withdrawal = await Withdrawal.create({
//       ...data,
//       user: req.user._id
//     });

//     await audit(req, 'request', 'withdrawal', withdrawal.id);
//     res.status(201).json(withdrawal);
//   })
// );

// // ================= SUPPORT =================

// app.post('/api/me/tickets', auth, asyncH(async (req, res) => {
//   const data = z.object({
//     subject: z.string().min(3).max(120),
//     message: z.string().min(3).max(2000)
//   }).parse(req.body);

//   const ticket = await Ticket.create({
//     ...data,
//     user: req.user._id
//   });

//   res.status(201).json(ticket);
// }));

// // END PART 1
 
// // ================= SYMBOL CONFIG =================

// const symbols = {
//   'EUR/USD': {
//     base: 1.085,
//     decimals: 5,
//     pointSize: 0.001
//   },
//   'GBP/USD': {
//     base: 1.27,
//     decimals: 5,
//     pointSize: 0.001
//   },
//   'BTC/USD': {
//     base: 65000,
//     decimals: 2,
//     pointSize: 1
//   }
// };

// // ================= POINTS RETURN =================

// // 100 points = 1x gross
// // 200 points = 2x gross
// // 300 points = 3x gross
// // Max gross return = 10x
// // Wrong direction = 100% stake loss
// // No movement = full stake refund


// function calculatePointReturn(trade, exitPrice) {
//   const pointSize =
//     trade.pointSize || symbols[trade.symbol]?.pointSize;

//   if (!Number.isFinite(pointSize) || pointSize <= 0) {
//     throw fail("Invalid symbol point size", 500);
//   }

//   const signedPoints =
//     (exitPrice - trade.entryPrice) / pointSize;

//   const directionalPoints =
//     signedPoints * (trade.direction === "buy" ? 1 : -1);

//   let profitUSD;
//   let multiplier;

//   if (directionalPoints > 0) {
//     multiplier = Math.min(10, directionalPoints / 100);

//     // Positive movement = positive net profit
//     profitUSD = roundMoney(
//       trade.amountUSD * multiplier
//     );
//   } else if (directionalPoints < 0) {
//     multiplier = 0;
//     profitUSD = -trade.amountUSD;
//   } else {
//     multiplier = 0;
//     profitUSD = 0;
//   }

//   const creditUSD = roundMoney(
//     trade.amountUSD + profitUSD
//   );

//   return {
//     signedPoints: Number(signedPoints.toFixed(4)),
//     demoMultiplier: Number(multiplier.toFixed(4)),
//     creditUSD,
//     profitUSD,
//     status:
//       profitUSD > 0 ? "won" :
//       profitUSD < 0 ? "lost" : "draw"
//   };
// }


// // ================= IST SESSION =================

// const IST_OFFSET = 330 * 60 * 1000;
// const START_MINUTE = 7 * 60;
// const END_MINUTE = 24 * 60;
// const SLOT_MINUTES = 10;
// const SLOT_COUNT = 102;

// function istInfo(timestamp = Date.now()) {
//   const date = new Date(timestamp + IST_OFFSET);

//   return {
//     date: date.toISOString().slice(0, 10),
//     minute:
//       date.getUTCHours() * 60 +
//       date.getUTCMinutes() +
//       date.getUTCSeconds() / 60 +
//       date.getUTCMilliseconds() / 60000
//   };
// }

// function todayIST() {
//   return istInfo().date;
// }

// function nextDate(dateString) {
//   const date = new Date(dateString + 'T00:00:00Z');
//   date.setUTCDate(date.getUTCDate() + 1);
//   return date.toISOString().slice(0, 10);
// }

// function validDate(dateString) {
//   return (
//     /^\d{4}-\d{2}-\d{2}$/.test(dateString) &&
//     !Number.isNaN(Date.parse(dateString + 'T00:00:00Z')) &&
//     new Date(dateString + 'T00:00:00Z')
//       .toISOString().slice(0, 10) === dateString
//   );
// }

// function validateSymbol(symbol) {
//   if (!symbols[symbol]) {
//     throw fail('Unsupported symbol');
//   }
//   return symbol;
// }

// function isDemoSession(timestamp) {
//   const { minute } = istInfo(timestamp);
//   return minute >= START_MINUTE && minute < END_MINUTE;
// }

// // ================= DEFAULT SLOTS =================

// function makeSlots(symbol) {
//   validateSymbol(symbol);

//   const config = symbols[symbol];
//   let price = config.base;

//   return Array.from({ length: SLOT_COUNT }, (_, index) => {
//     const entryPrice = price;

//     const movement = symbol === 'BTC/USD'
//       ? (index % 2 ? -125 : 145)
//       : (index % 2 ? -0.012 : 0.016);

//     price = Number(
//       (entryPrice + movement).toFixed(config.decimals)
//     );

//     return {
//       startMinute: START_MINUTE + index * SLOT_MINUTES,
//       endMinute: START_MINUTE + (index + 1) * SLOT_MINUTES,
//       entryPrice,
//       exitPrice: price
//     };
//   });
// }


// function checkSlots(slots) {
//   if (!Array.isArray(slots) || slots.length !== SLOT_COUNT) {
//     throw fail("Exactly 102 ten-minute slots required");
//   }

//   for (let i = 0; i < SLOT_COUNT; i++) {
//     const slot = slots[i];

//     if (
//       !slot ||
//       slot.startMinute !== START_MINUTE + i * SLOT_MINUTES ||
//       slot.endMinute !== START_MINUTE + (i + 1) * SLOT_MINUTES ||
//       !Number.isFinite(slot.entryPrice) ||
//       !Number.isFinite(slot.exitPrice) ||
//       slot.entryPrice <= 0 ||
//       slot.exitPrice <= 0
//     ) {
//       throw fail(`Invalid schedule slot ${i + 1}`);
//     }
//   }

//   return slots;
// }


// // ================= SMOOTH SCHEDULE PRICE =================



// function smoothstep(t) {
//   const x = Math.max(0, Math.min(1, t));
//   return x * x * (3 - 2 * x);
// }

// function scheduledPrice(
//   currentSlot,
//   nextSlot,
//   elapsedSeconds,
//   targetSeconds = 150
// ) {
//   const entry = Number(currentSlot.entryPrice);
//   const exit = Number(currentSlot.exitPrice);

 

//   const nextEntry = nextSlot
//     ? Number(nextSlot.entryPrice)
//     : exit;

//   const slotSeconds = 600; // 10 minutes

//   const elapsed = Math.max(
//     0,
//     Math.min(slotSeconds, elapsedSeconds)
//   );

//   let price;

//   if (elapsed <= targetSeconds) {
//     // Phase 1: Achieve EXIT within 2.5 minutes
//     const progress = elapsed / targetSeconds;

//     price =
//       entry +
//       (exit - entry) * smoothstep(progress);
//   } else {
//     // Phase 2: Move towards NEXT slot ENTRY
//     const progress =
//       (elapsed - targetSeconds) /
//       (slotSeconds - targetSeconds);

//     price =
//       exit +
//       (nextEntry - exit) * smoothstep(progress);
//   }

//    console.log("SCHEDULE DEBUG", {
//   currentSlot,
//   nextSlot,
//   elapsedSeconds,
//   price,
//   isValid: Number.isFinite(price)
// });

//   return Number(price.toFixed(5));
// }


// // ================= AUTO DEMO PRICE =================

// function legacyPrice(symbol, timestamp = Date.now()) {
//   const config = symbols[symbol];

//   if (!config) throw fail('Unsupported symbol');

//   const time = timestamp / 1000;
//   const offset = Object.keys(symbols).indexOf(symbol) * 17;

//   const movement =
//     Math.sin(time / 27 + offset) * 0.0014 +
//     Math.sin(time / 8.7 + offset * 0.7) * 0.0006 +
//     Math.sin(time / 3.1 + offset * 1.3) * 0.0002;

//   return Number(
//     (config.base * (1 + movement)).toFixed(config.decimals)
//   );
// }

// function marketPrice(schedule, symbol, timestamp) {
//   if (!isDemoSession(timestamp)) return null;

//   return schedule
//     ? scheduledPrice(schedule, timestamp)
//     : legacyPrice(symbol, timestamp);
// }

// // ================= SCHEDULE LOOKUP =================

// const scheduleCache = new Map();

// async function getSchedule(symbol, timestamp = Date.now()) {
//   validateSymbol(symbol);

//   const { date } = istInfo(timestamp);
//   const key = `${date}|${symbol}`;

//   const cached = scheduleCache.get(key);

//   if (cached && Date.now() - cached.at < 2000) {
//     return cached.data;
//   }

//   const schedule = await MarketSchedule.findOne({
//     date,
//     symbol,
//     status: 'published'
//   }).lean();

//   scheduleCache.set(key, {
//     at: Date.now(),
//     data: schedule
//   });

//   return schedule;
// }

// // ================= TRADING CHART =================

// app.get('/api/trading/chart', auth, asyncH(async (req, res) => {
//   const symbol = validateSymbol(
//     String(req.query.symbol || 'EUR/USD')
//   );

//   const now = Date.now();
//   const schedule = await getSchedule(symbol, now);
//   const candles = [];
//   const bucket = Math.floor(now / 5000) * 5000;

//   if (isDemoSession(now)) {
//     for (let i = 79; i >= 0; i--) {
//       const start = bucket - i * 5000;
//       const end = Math.min(start + 4999, now);
//       const values = [];

//       for (
//         let timestamp = start;
//         timestamp < end;
//         timestamp += 1000
//       ) {
//         const value = marketPrice(
//           schedule, symbol, timestamp
//         );

//         if (value !== null) values.push(value);
//       }

//       const last = marketPrice(schedule, symbol, end);
//       if (last !== null) values.push(last);

//       if (!values.length) continue;

//       candles.push({
//         time: start,
//         open: values[0],
//         high: Math.max(...values),
//         low: Math.min(...values),
//         close: values.at(-1)
//       });
//     }
//   }

//   const currentPrice = marketPrice(
//     schedule, symbol, now
//   );

//   res.set('Cache-Control', 'no-store');

//   res.json({
//     symbol,
//     simulated: true,
//     marketType: schedule
//       ? 'scheduled-demo'
//       : 'automatic-demo',
//     scheduleStatus: schedule
//       ? 'published'
//       : 'automatic-demo',
//     priceSource: schedule
//       ? 'published-schedule'
//       : 'automatic-demo',
//     timezone: 'Asia/Kolkata',
//     marketOpen: currentPrice !== null,
//     candles,
//     currentPrice,
//     serverTime: now
//   });
// }));

// // ================= ALL DEMO PRICES =================

// app.get('/api/trading/prices', auth, asyncH(async (req, res) => {
//   const now = Date.now();
//   const prices = {};
//   const priceSources = {};

//   for (const symbol of Object.keys(symbols)) {
//     const schedule = await getSchedule(symbol, now);

//     prices[symbol] = marketPrice(
//       schedule, symbol, now
//     );

//     priceSources[symbol] = schedule
//       ? 'published-schedule'
//       : 'automatic-demo';
//   }

//   res.set('Cache-Control', 'no-store');

//   res.json({
//     simulated: true,
//     marketType: 'demo',
//     timestamp: new Date(now).toISOString(),
//     prices,
//     priceSources
//   });
// }));

// // ================= READ SCHEDULE =================

// app.get(
//   '/api/admin/schedules/:date/:symbol',
//   auth,
//   admin,
//   asyncH(async (req, res) => {
//     const { date, symbol } = req.params;

//     if (!validDate(date)) throw fail('Invalid date');
//     validateSymbol(symbol);

//     const schedule = await MarketSchedule.findOne({
//       date,
//       symbol
//     }).lean();

//     if (schedule) return res.json(schedule);

//     res.json({
//       date,
//       symbol,
//       timezone: 'Asia/Kolkata',
//       pointSize: symbols[symbol].pointSize,
//       status: 'new',
//       version: 0,
//       slots: makeSlots(symbol)
//     });
//   })
// );

// // ================= SAVE DRAFT =================

// app.put(
//   '/api/admin/schedules/:date/:symbol',
//   auth,
//   admin,
//   asyncH(async (req, res) => {
//     const { date, symbol } = req.params;

//     if (!validDate(date)) throw fail('Invalid date');
//     validateSymbol(symbol);

//     if (date <= todayIST()) {
//       throw fail('Only future schedules can be edited', 409);
//     }

//     const slots = checkSlots(req.body.slots);
//     const version = Number(req.body.version);

//     if (!Number.isInteger(version) || version < 0) {
//       throw fail('Invalid schedule version');
//     }

//     const existing = await MarketSchedule.findOne({
//       date,
//       symbol
//     });

//     if (existing?.status === 'published') {
//       throw fail('Published schedule is locked', 409);
//     }

//     let schedule;

//     if (existing) {
//       schedule = await MarketSchedule.findOneAndUpdate(
//         {
//           _id: existing._id,
//           status: 'draft',
//           version
//         },
//         {
//           $set: {
//             slots,
//             pointSize: symbols[symbol].pointSize
//           },
//           $inc: { version: 1 }
//         },
//         {
//           new: true,
//           runValidators: true
//         }
//       );

//       if (!schedule) {
//         throw fail('Schedule changed. Reload and retry.', 409);
//       }
//     } else {
//       if (version !== 0) {
//         throw fail('Reload schedule and retry', 409);
//       }

//       schedule = await MarketSchedule.create({
//         date,
//         symbol,
//         timezone: 'Asia/Kolkata',
//         pointSize: symbols[symbol].pointSize,
//         status: 'draft',
//         version: 1,
//         slots,
//         createdBy: req.user._id
//       });
//     }

//     await audit(req, 'save', 'marketSchedule', schedule.id, {
//       date,
//       symbol,
//       version: schedule.version
//     });

//     scheduleCache.delete(`${date}|${symbol}`);
//     res.json(schedule);
//   })
// );

// // ================= PUBLISH SCHEDULE =================

// app.post(
//   '/api/admin/schedules/:date/:symbol/publish',
//   auth,
//   admin,
//   asyncH(async (req, res) => {
//     const { date, symbol } = req.params;

//     if (!validDate(date)) throw fail('Invalid date');
//     validateSymbol(symbol);

//     if (date <= todayIST()) {
//       throw fail('Only future schedules can be published', 409);
//     }

//     const version = Number(req.body.version);
//     if (!Number.isInteger(version)) {
//       throw fail('Invalid version');
//     }

//     const schedule = await MarketSchedule.findOneAndUpdate(
//       {
//         date,
//         symbol,
//         status: 'draft',
//         version
//       },
//       {
//         $set: {
//           status: 'published',
//           publishedAt: new Date()
//         }
//       },
//       { new: true }
//     );

//     if (!schedule) {
//       throw fail(
//         'Draft missing, changed or already published',
//         409
//       );
//     }

//     await audit(
//       req,
//       'publish',
//       'marketSchedule',
//       schedule.id,
//       { date, symbol, version }
//     );

//     scheduleCache.delete(`${date}|${symbol}`);
//     res.json(schedule);
//   })
// );

// // END PART 2

// // ================= PLACE TRADE =================

// app.post('/api/trading/place', auth, asyncH(async (req, res) => {
//   const data = z.object({
//     symbol: z.enum(['EUR/USD', 'GBP/USD', 'BTC/USD']),
//     direction: z.enum(['buy', 'sell']),
//     amountUSD: z.number()
//       .min(1)
//       .max(1000)
//       .refine(
//         value =>
//           Math.abs(
//             value * 100 - Math.round(value * 100)
//           ) < 1e-7,
//         'Maximum 2 decimal places'
//       )
//   }).parse(req.body);

//   const openedAt = new Date();

//   const schedule = await getSchedule(
//     data.symbol,
//     openedAt.getTime()
//   );

//   const entryPrice = marketPrice(
//     schedule,
//     data.symbol,
//     openedAt.getTime()
//   );

//   if (entryPrice === null) {
//     throw fail('Demo market closed', 409);
//   }

//   const session = await mongoose.startSession();
//   let result;

//   try {
//     await session.withTransaction(async () => {
//       const user = await User.findOneAndUpdate(
//         {
//           _id: req.user._id,
//           status: 'active',
//           demoBalance: { $gte: data.amountUSD }
//         },
//         {
//           $inc: { demoBalance: -data.amountUSD }
//         },
//         { new: true, session }
//       );

//       if (!user) {
//         throw fail('Insufficient demo balance');
//       }

//       const [trade] = await Trade.create(
//         [{
//           user: user._id,
//           symbol: data.symbol,
//           direction: data.direction,
//           amountUSD: data.amountUSD,
//           durationSeconds: null,
//           payoutPercent: null,
//           pointSize: schedule?.pointSize ||
//             symbols[data.symbol].pointSize,
//           entryPrice,
//           schedule: schedule?._id ?? null,
//           scheduleVersion: schedule?.version ?? null,
//           openedAt,
//           expiresAt: null,
//           status: 'open'
//         }],
//         { session }
//       );

//       result = {
//         trade,
//         demoBalance: user.demoBalance
//       };
//     });

//     res.status(201).json(result);
//   } finally {
//     await session.endSession();
//   }
// }));

// // ================= MANUAL EXIT =================

// app.post(
//   '/api/trading/:id/close',
//   auth,
//   asyncH(async (req, res) => {
//     if (!mongoose.isValidObjectId(req.params.id)) {
//       throw fail('Invalid trade ID', 400);
//     }

//     const session = await mongoose.startSession();
//     let result;

//     try {
//       await session.withTransaction(async () => {
//         const trade = await Trade.findOne({
//           _id: req.params.id,
//           user: req.user._id,
//           status: 'open'
//         }).session(session);

//         if (!trade) {
//           throw fail(
//             'Trade not found or already closed',
//             409
//           );
//         }

//         // Existing fixed-duration trades
//         // continue using automatic settlement.
//         if (trade.expiresAt) {
//           throw fail(
//             'Fixed-duration trade cannot be manually closed',
//             409
//           );
//         }

//         const closedAt = new Date();
//         let schedule = null;

//         if (trade.schedule) {
//           schedule = await MarketSchedule
//             .findById(trade.schedule)
//             .session(session);

//           if (
//             !schedule ||
//             schedule.status !== 'published' ||
//             schedule.version !== trade.scheduleVersion
//           ) {
//             throw fail('Trade schedule unavailable', 409);
//           }
//         }

//         // Exit price comes from server, never client.
//         const exitPrice = marketPrice(
//           schedule,
//           trade.symbol,
//           closedAt.getTime()
//         );

//         if (exitPrice === null) {
//           throw fail(
//             'Demo market closed; cannot price exit',
//             409
//           );
//         }

//         const {
//           signedPoints,
//           demoMultiplier,
//           creditUSD,
//           profitUSD,
//           status
//         } = calculatePointReturn(trade, exitPrice);

//         trade.exitPrice = exitPrice;
//         trade.status = status;
//         trade.profitUSD = profitUSD;
//         trade.settledAt = closedAt;
//         trade.signedPoints = signedPoints;
//         trade.demoMultiplier = demoMultiplier;

//         await trade.save({ session });

//         const user = await User.findOneAndUpdate(
//           {
//             _id: trade.user,
//             status: 'active'
//           },
//           {
//             $inc: { demoBalance: creditUSD }
//           },
//           {
//             new: true,
//             session
//           }
//         );

//         if (!user) {
//           throw fail('Trade user unavailable', 404);
//         }

//         await Audit.create(
//           [{
//             actor: trade.user,
//             action: 'manual-close',
//             entity: 'trade',
//             entityId: String(trade._id),
//             details: {
//               entryPrice: trade.entryPrice,
//               exitPrice,
//               signedPoints,
//               demoMultiplier,
//               profitUSD,
//               creditUSD
//             }
//           }],
//           { session }
//         );

//         result = {
//           trade,
//           demoBalance: user.demoBalance
//         };
//       });

//       res.json(result);
//     } finally {
//       await session.endSession();
//     }
//   })
// );

// // ================= AUTO SETTLEMENT =================

// // Only for pre-existing 120-second trades.

// async function settleTrade(tradeId) {
//   const session = await mongoose.startSession();

//   try {
//     await session.withTransaction(async () => {
//       const trade = await Trade.findOne({
//         _id: tradeId,
//         status: 'open',
//         expiresAt: { $lte: new Date() }
//       }).session(session);

//       if (!trade) return;

//       let exitPrice;
//       let schedule = null;

//       if (trade.schedule) {
//         schedule = await MarketSchedule
//           .findById(trade.schedule)
//           .session(session);

//         if (
//           !schedule ||
//           schedule.status !== 'published' ||
//           schedule.version !== trade.scheduleVersion
//         ) {
//           throw fail('Trade schedule unavailable', 409);
//         }

//         exitPrice = scheduledPrice(
//           schedule,
//           trade.expiresAt.getTime()
//         );
//       } else {
//         exitPrice = legacyPrice(
//           trade.symbol,
//           trade.expiresAt.getTime()
//         );
//       }

//       if (exitPrice === null) {
//         throw fail('Exit price unavailable', 409);
//       }

//       const {
//         signedPoints,
//         demoMultiplier,
//         creditUSD,
//         profitUSD,
//         status
//       } = calculatePointReturn(trade, exitPrice);

//       trade.signedPoints = signedPoints;
//       trade.demoMultiplier = demoMultiplier;
//       trade.exitPrice = exitPrice;
//       trade.status = status;
//       trade.profitUSD = profitUSD;
//       trade.settledAt = new Date();

//       await trade.save({ session });

//       if (creditUSD > 0) {
//         const update = await User.updateOne(
//           { _id: trade.user },
//           {
//             $inc: { demoBalance: creditUSD }
//           },
//           { session }
//         );

//         if (update.matchedCount !== 1) {
//           throw fail('Trade user unavailable', 404);
//         }
//       }

//       await Audit.create(
//         [{
//           actor: trade.user,
//           action: 'settle',
//           entity: 'trade',
//           entityId: String(trade._id),
//           details: {
//             status: trade.status,
//             profitUSD,
//             creditUSD,
//             entryPrice: trade.entryPrice,
//             exitPrice,
//             signedPoints,
//             demoMultiplier
//           }
//         }],
//         { session }
//       );
//     });
//   } finally {
//     await session.endSession();
//   }
// }

// let settlementRunning = false;

// async function settleExpired() {
//   if (settlementRunning) return;

//   settlementRunning = true;

//   try {
//     const rows = await Trade.find({
//       status: 'open',
//       expiresAt: { $lte: new Date() }
//     })
//       .sort({ expiresAt: 1 })
//       .select('_id')
//       .limit(100)
//       .lean();

//     for (const row of rows) {
//       try {
//         await settleTrade(row._id);
//       } catch (error) {
//         console.error(
//           'Trade settlement failed:',
//           row._id,
//           error.message
//         );
//       }
//     }
//   } finally {
//     settlementRunning = false;
//   }
// }

// setInterval(
//   () => settleExpired().catch(console.error),
//   3000
// );

// // END PART 3

// // ================= ADMIN OVERVIEW =================

// app.get(
//   '/api/admin/overview',
//   auth,
//   admin,
//   asyncH(async (req, res) => {
//     const [
//       users,
//       deposits,
//       pendingDeposits,
//       withdrawals,
//       pendingWithdrawals,
//       trades,
//       tickets
//     ] = await Promise.all([
//       User.countDocuments(),
//       Deposit.countDocuments(),
//       Deposit.countDocuments({ status: 'pending' }),
//       Withdrawal.countDocuments(),
//       Withdrawal.countDocuments({ status: 'pending' }),
//       Trade.countDocuments(),
//       Ticket.countDocuments({ status: 'open' })
//     ]);

//     res.json({
//       users,
//       deposits,
//       pendingDeposits,
//       withdrawals,
//       pendingWithdrawals,
//       trades,
//       tickets
//     });
//   })
// );

// // ================= ADMIN ENTITIES =================

// const entities = {
//   users: User,
//   deposits: Deposit,
//   withdrawals: Withdrawal,
//   trades: Trade,
//   pairs: Pair,
//   bonuses: Bonus,
//   tickets: Ticket,
//   notices: Notice,
//   settings: Setting,
//   audit: Audit
// };

// const editable = {
//   users: [
//     'name',
//     'country',
//     'currency',
//     'status'
//   ],
//   deposits: ['note'],
//   withdrawals: ['status'],
//   trades: [],
//   pairs: [
//     'symbol',
//     'category',
//     'enabled',
//     'payout1',
//     'payout5',
//     'source'
//   ],
//   bonuses: [
//     'code',
//     'percent',
//     'minUSD',
//     'enabled'
//   ],
//   tickets: ['status', 'reply'],
//   notices: ['title', 'message', 'enabled'],
//   settings: ['key', 'value']
// };

// const creatable = [
//   'pairs',
//   'bonuses',
//   'notices',
//   'settings'
// ];

// // ================= DEPOSIT APPROVAL =================

// app.patch(
//   '/api/admin/deposits/:id/approve',
//   auth,
//   admin,
//   asyncH(async (req, res) => {
//     if (!mongoose.isValidObjectId(req.params.id)) {
//       throw fail('Invalid deposit ID');
//     }

//     const session = await mongoose.startSession();
//     let result;

//     try {
//       await session.withTransaction(async () => {
//         const deposit = await Deposit.findOneAndUpdate(
//           {
//             _id: req.params.id,
//             status: 'pending'
//           },
//           {
//             $set: {
//               status: 'approved',
//               note: String(
//                 req.body?.note ||
//                 'Payment manually verified'
//               ).slice(0, 500)
//             }
//           },
//           {
//             new: true,
//             session,
//             runValidators: true
//           }
//         );

//         if (!deposit) {
//           throw fail(
//             'Deposit already processed or not found',
//             409
//           );
//         }

//         if (
//           !Number.isFinite(deposit.amountUSD) ||
//           deposit.amountUSD <= 0
//         ) {
//           throw fail('Invalid deposit amount');
//         }

//         const user = await User.findByIdAndUpdate(
//           deposit.user,
//           {
//             $inc: { balance: deposit.amountUSD }
//           },
//           {
//             new: true,
//             session
//           }
//         );

//         if (!user) {
//           throw fail('User not found', 404);
//         }

//         await Audit.create(
//           [{
//             actor: req.user._id,
//             action: 'approve',
//             entity: 'deposit',
//             entityId: String(deposit._id),
//             details: {
//               amountUSD: deposit.amountUSD,
//               userId: String(user._id)
//             }
//           }],
//           { session }
//         );

//         result = {
//           ok: true,
//           status: 'approved',
//           creditedAmount: deposit.amountUSD,
//           newBalance: user.balance
//         };
//       });

//       res.json(result);
//     } finally {
//       await session.endSession();
//     }
//   })
// );

// // ================= LIST ADMIN RECORDS =================

// app.get(
//   '/api/admin/:entity',
//   auth,
//   admin,
//   asyncH(async (req, res) => {
//     const key = req.params.entity;
//     const Model = entities[key];

//     if (!Model) {
//       throw fail('Unknown entity', 404);
//     }

//     const page = Math.min(
//       Math.max(Number(req.query.page) || 1, 1),
//       100000
//     );

//     const limit = Math.min(
//       Math.max(Number(req.query.limit) || 30, 1),
//       100
//     );

//     const rows = await Model.find()
//       .select(key === 'users' ? '-passwordHash' : '')
//       .sort({ createdAt: -1 })
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .lean();

//     res.json({
//       rows,
//       total: await Model.countDocuments(),
//       page,
//       limit
//     });
//   })
// );

// // ================= CREATE ADMIN RECORD =================

// app.post(
//   '/api/admin/:entity',
//   auth,
//   admin,
//   asyncH(async (req, res) => {
//     const key = req.params.entity;

//     if (!creatable.includes(key)) {
//       throw fail('Cannot create entity', 405);
//     }

//     const data = Object.fromEntries(
//       Object.entries(req.body || {})
//         .filter(([field]) => editable[key].includes(field))
//     );

//     const row = await entities[key].create(data);

//     await audit(req, 'create', key, row.id);

//     res.status(201).json(row);
//   })
// );

// // ================= UPDATE ADMIN RECORD =================

// app.patch(
//   '/api/admin/:entity/:id',
//   auth,
//   admin,
//   asyncH(async (req, res) => {
//     const key = req.params.entity;

//     if (!editable[key]?.length) {
//       throw fail('Read only', 405);
//     }

//     const data = Object.fromEntries(
//       Object.entries(req.body || {})
//         .filter(([field]) => editable[key].includes(field))
//     );

//     if (!Object.keys(data).length) {
//       throw fail('No allowed fields');
//     }

//     if (
//       key === 'users' &&
//       String(req.user._id) === req.params.id &&
//       data.status === 'suspended'
//     ) {
//       throw fail('Cannot suspend yourself');
//     }

//     const row = await entities[key].findByIdAndUpdate(
//       req.params.id,
//       { $set: data },
//       {
//         new: true,
//         runValidators: true
//       }
//     );

//     if (!row) {
//       throw fail('Not found', 404);
//     }

//     await audit(req, 'update', key, row.id, data);

//     res.json(row);
//   })
// );

// // ================= DELETE ADMIN RECORD =================

// app.delete(
//   '/api/admin/:entity/:id',
//   auth,
//   admin,
//   asyncH(async (req, res) => {
//     const key = req.params.entity;

//     if (!creatable.includes(key)) {
//       throw fail('Cannot delete this record', 405);
//     }

//     const row = await entities[key].findByIdAndDelete(
//       req.params.id
//     );

//     if (!row) {
//       throw fail('Not found', 404);
//     }

//     await audit(req, 'delete', key, row.id);

//     res.json({ ok: true });
//   })
// );

// // ================= ERROR HANDLING =================

// app.use((err, req, res, next) => {
//   if (err instanceof z.ZodError) {
//     return res.status(400).json({
//       error: 'Invalid fields',
//       details: err.flatten()
//     });
//   }

//   if (err.code === 11000) {
//     return res.status(409).json({
//       error: 'Duplicate record'
//     });
//   }

//   if (err.name === 'CastError') {
//     return res.status(400).json({
//       error: 'Invalid identifier'
//     });
//   }

//   if (err.statusCode) {
//     return res.status(err.statusCode).json({
//       error: err.message
//     });
//   }

//   console.error(err);

//   res.status(500).json({
//     error: 'Internal server error'
//   });
// });

// // ================= START SERVER =================

// const PORT = Number(process.env.PORT || 4000);

// app.listen(PORT, () => {
//   console.log(`Quotexx API listening on port ${PORT}`);
//   settleExpired().catch(console.error);
// });

// // END PART 4



import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import {
  User, Deposit, Withdrawal, Trade, Pair, Bonus,
  Ticket, Notice, Setting, Audit, MarketSchedule
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
app.use(cors({
  origin: [
    process.env.CLIENT_ORIGIN || 'https://qu.vkmster.com',
    process.env.ADMIN_ORIGIN || 'https://quadmin.vkmster.com'
  ]
}));
app.use(express.json({ limit: '500kb' }));

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
  demoBalance: user.demoBalance ?? 10000
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

function calculatePointReturn(trade, exitPrice) {
  const pointSize =
    trade.pointSize || symbols[trade.symbol]?.pointSize;

  if (!Number.isFinite(pointSize) || pointSize <= 0) {
    throw fail('Invalid symbol point size', 500);
  }

  const signedPoints =
    (exitPrice - trade.entryPrice) / pointSize;

  const directionalPoints =
    signedPoints * (trade.direction === 'buy' ? 1 : -1);

  let profitUSD;
  let multiplier;

  if (directionalPoints > 0) {
    multiplier = Math.min(10, directionalPoints / 100);
    profitUSD = roundMoney(trade.amountUSD * multiplier);
  } else if (directionalPoints < 0) {
    multiplier = 0;
    profitUSD = -trade.amountUSD;
  } else {
    multiplier = 0;
    profitUSD = 0;
  }

  return {
    signedPoints: Number(signedPoints.toFixed(4)),
    demoMultiplier: Number(multiplier.toFixed(4)),
    creditUSD: roundMoney(trade.amountUSD + profitUSD),
    profitUSD,
    status:
      profitUSD > 0 ? 'won' :
      profitUSD < 0 ? 'lost' : 'draw'
  };
}

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

// ================= CHART =================


 // ================= 1 MINUTE LIVE CHART =================

const CANDLE_INTERVAL_MS = 60 * 1000;
const CHART_CANDLE_COUNT = 80;

app.get(
  '/api/trading/chart',
  auth,
  asyncH(async (req, res) => {

    const symbol = validateSymbol(
      String(req.query.symbol || 'EUR/USD')
    );

    const now = Date.now();

    // Every candle starts at an exact minute boundary
    const bucket =
      Math.floor(now / CANDLE_INTERVAL_MS) *
      CANDLE_INTERVAL_MS;

    const timestamps = Array.from(
      { length: CHART_CANDLE_COUNT },
      (_, i) =>
        bucket -
        (CHART_CANDLE_COUNT - 1 - i) *
        CANDLE_INTERVAL_MS
    );

    // Load each date's schedule only once
    const scheduleByDate = new Map();

    for (const ts of [...timestamps, now]) {
      const date = istInfo(ts).date;

      if (!scheduleByDate.has(date)) {
        scheduleByDate.set(
          date,
          await getSchedule(symbol, ts)
        );
      }
    }

    // Existing deterministic simulated price engine
    const priceAt = ts => {
      const schedule = scheduleByDate.get(
        istInfo(ts).date
      );

      return marketPrice(
        schedule,
        symbol,
        ts
      );
    };

    // Generate 1-minute OHLC candles
    const candles = timestamps
      .map(start => {

        const end = Math.min(
          start + CANDLE_INTERVAL_MS - 1,
          now
        );

        const values = [];

        // Opening price
        values.push(priceAt(start));

        // Price movement every second
        for (
          let ts = start + 1000;
          ts < end;
          ts += 1000
        ) {
          values.push(priceAt(ts));
        }

        // Closing/current live price
        values.push(priceAt(end));

        const valid = values.filter(
          Number.isFinite
        );

        if (!valid.length) return null;

        const open = valid[0];
        const close = valid.at(-1);

        const high = Math.max(...valid);
        const low = Math.min(...valid);

        return {
          time: start,
          open,
          high,
          low,
          close,
          color:
            close >= open ? 'green' : 'red',
          isCurrent:
            start === bucket
        };
      })
      .filter(Boolean);

    const schedule = scheduleByDate.get(
      istInfo(now).date
    );

    const scheduledNow = Boolean(
      schedule && isDemoSession(now)
    );

    const currentPrice = priceAt(now);

    // Reverse countdown
    const nextCandleAt =
      bucket + CANDLE_INTERVAL_MS;

    const remainingSeconds = Math.ceil(
      (nextCandleAt - now) / 1000
    );

    res.set('Cache-Control', 'no-store');

    res.json({
      symbol,
      simulated: true,

      marketType: scheduledNow
        ? 'scheduled-demo'
        : 'automatic-demo',

      scheduleStatus: scheduledNow
        ? 'published'
        : 'automatic-demo',

      priceSource: scheduledNow
        ? 'published-schedule'
        : 'automatic-demo',

      timezone: 'Asia/Kolkata',

      marketOpen: Number.isFinite(
        currentPrice
      ),

      candleIntervalSeconds: 60,

      candles,
      currentPrice,

      serverTime: now,
      candleStart: bucket,
      nextCandleAt,
      remainingSeconds
    });
  })
);

// ================= ALL PRICES =================


// ================= ALL PRICES =================

app.get('/api/trading/prices', auth, asyncH(async (req, res) => {
  const now = Date.now();
  const prices = {};
  const priceSources = {};

  for (const symbol of Object.keys(symbols)) {
    const schedule = await getSchedule(symbol, now);

    prices[symbol] = marketPrice(
      schedule, symbol, now
    );

    priceSources[symbol] =
      schedule && isDemoSession(now)
        ? 'published-schedule'
        : 'automatic-demo';
  }

  res.set('Cache-Control', 'no-store');

  res.json({
    simulated: true,
    marketType: 'demo',
    timestamp: new Date(now).toISOString(),
    prices,
    priceSources
  });
}));

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
    symbol: z.enum(['EUR/USD', 'GBP/USD', 'BTC/USD']),
    direction: z.enum(['buy', 'sell']),
    amountUSD: z.number()
      .min(1)
      .max(1000)
      .refine(
        value =>
          Math.abs(
            value * 100 - Math.round(value * 100)
          ) < 1e-7,
        'Maximum 2 decimal places'
      )
  }).parse(req.body);

  const openedAt = new Date();

  const schedule = await getSchedule(
    data.symbol,
    openedAt.getTime()
  );

  const entryPrice = marketPrice(
    schedule,
    data.symbol,
    openedAt.getTime()
  );

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
          durationSeconds: null,
          payoutPercent: null,
          pointSize: schedule?.pointSize ||
            symbols[data.symbol].pointSize,
          entryPrice,
          schedule: schedule?._id ?? null,
          scheduleVersion: schedule?.version ?? null,
          openedAt,
          expiresAt: null,
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
        } = calculatePointReturn(trade, exitPrice);

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
        exitPrice = legacyPrice(
          trade.symbol,
          trade.expiresAt.getTime()
        );
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
      } = calculatePointReturn(trade, exitPrice);

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
