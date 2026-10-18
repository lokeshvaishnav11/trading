import mongoose from 'mongoose';
const { Schema, model } = mongoose;
const opts = { timestamps: true };

export const User = model('User', new Schema({
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, default: '' },
  country: { type: String, default: 'India' },
  currency: { type: String, default: 'USD' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  balance: { type: Number, default: 0 },
  demoBalance: { type: Number, default: 10000, min: 0 },
  popup: { type: String, enum: ['none', '1999', 'waiting_approval', '1399', 'done'], default: 'none' }
}, opts));

export const Deposit = model('Deposit', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amountUSD: { type: Number, required: true },
  method: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reference: { type: String, default: '' },
  note: { type: String, default: '' }
}, opts));

export const Withdrawal = model('Withdrawal', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  amountUSD: { type: Number, required: true },
  method: { type: String, required: true },
  destination: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, opts));

export const Pair = model('Pair', new Schema({
  symbol: { type: String, unique: true, required: true },
  category: { type: String, default: 'Currencies' },
  enabled: { type: Boolean, default: true },
  payout1: { type: Number, default: 80 },
  payout5: { type: Number, default: 80 },
  source: { type: String, default: 'simulation' }
}, opts));

export const Bonus = model('Bonus', new Schema({
  code: { type: String, unique: true, required: true },
  percent: { type: Number, default: 50 },
  minUSD: { type: Number, default: 100 },
  enabled: { type: Boolean, default: true }
}, opts));

export const Ticket = model('Ticket', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  reply: { type: String, default: '' },
  status: { type: String, enum: ['open', 'answered', 'closed'], default: 'open' }
}, opts));

export const Notice = model('Notice', new Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  enabled: { type: Boolean, default: true }
}, opts));

export const Setting = model('Setting', new Schema({
  key: { type: String, unique: true, required: true },
  value: Schema.Types.Mixed
}, opts));

export const Audit = model('Audit', new Schema({
  actor: { type: Schema.Types.ObjectId, ref: 'User' },
  action: String,
  entity: String,
  entityId: String,
  details: Schema.Types.Mixed
}, opts));

export const Trade = model('Trade', new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  symbol: { type: String, enum: ['EUR/USD', 'GBP/USD', 'BTC/USD', 'USD/BRL (OTC)'], required: true },
  direction: { type: String, enum: ['buy', 'sell'], required: true },
  amountUSD: { type: Number, required: true, min: 1, max: 1000 },
  durationSeconds: { type: Number, min: 1, max: 86400, default: 60 },
  payoutPercent: { type: Number, min: 0, max: 100, default: 85 },
  entryPrice: { type: Number, required: true },
  exitPrice: { type: Number, default: null },
  status: { type: String, enum: ['open', 'won', 'lost', 'draw'], default: 'open', index: true },
  profitUSD: { type: Number, default: 0 },
  openedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null, index: true },
  settledAt: { type: Date, default: null },
  schedule: { type: Schema.Types.ObjectId, ref: 'MarketSchedule', default: null },
  scheduleVersion: { type: Number, default: null },
  signedPoints: { type: Number, default: null },
  demoMultiplier: { type: Number, default: null }
}, opts));

const marketSlot = new Schema({
  startMinute: { type: Number, required: true },
  endMinute: { type: Number, required: true },
  entryPrice: { type: Number, required: true, min: 0 },
  exitPrice: { type: Number, required: true, min: 0 }
}, { _id: false });

const marketScheduleSchema = new Schema({
  date: { type: String, required: true },
  symbol: { type: String, enum: ['EUR/USD', 'GBP/USD', 'BTC/USD', 'USD/BRL (OTC)'], required: true },
  timezone: { type: String, default: 'Asia/Kolkata' },
  pointSize: { type: Number, required: true },
  version: { type: Number, default: 0 },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  slots: { type: [marketSlot], required: true },
  publishedAt: { type: Date, default: null },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, opts);
marketScheduleSchema.index({ date: 1, symbol: 1 }, { unique: true });
export const MarketSchedule = model('MarketSchedule', marketScheduleSchema);

const directionNoteSchema = new Schema({
  date: {type:String,required:true,match:/^\d{4}-\d{2}-\d{2}$/},
  symbol: {type:String,required:true,enum:['EUR/USD','GBP/USD','BTC/USD','USD/BRL (OTC)']},
  minute: {type:Number,required:true,min:420,max:1430},
  direction: {type:String,required:true,enum:['UP','DOWN']},
  updatedBy: {type:Schema.Types.ObjectId,ref:'User'}
},{timestamps:true});
directionNoteSchema.index({date:1,symbol:1,minute:1},{unique:true});
export const DirectionNote = model('DirectionNote',directionNoteSchema);

const minuteDirectionSchema = new Schema({
  symbol:{type:String,required:true,enum:['EUR/USD','GBP/USD','BTC/USD','USD/BRL (OTC)']},
  minute:{type:Number,required:true,min:420,max:1430},
  direction:{type:String,required:true,enum:['UP','DOWN']},
  updatedBy:{type:Schema.Types.ObjectId,ref:'User'}
},{timestamps:true});
minuteDirectionSchema.index({symbol:1,minute:1},{unique:true});
export const MinuteDirection = model('MinuteDirection',minuteDirectionSchema);
