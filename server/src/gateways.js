// // import crypto from 'node:crypto';
// // import express from 'express';
// // import mongoose, { Schema, model } from 'mongoose';
// // import { User } from './models.js';

// // const Payment = model('GatewayPayment', new Schema({
// //  user:{type:Schema.Types.ObjectId,ref:'User',required:true}, gateway:{type:String,required:true},
// //  orderId:{type:String,unique:true,required:true}, amountINR:{type:Number,required:true},
// //  rateINR:{type:Number,required:true}, creditUSDT:{type:Number,required:true},
// //  status:{type:String,enum:['pending','paid','failed'],default:'pending'},
// //  offerAmountINR:{type:Number,default:null}, providerResponse:{type:Schema.Types.Mixed}, callbackReceivedAt:Date, callbackStatus:String, providerOrderNo:String
// // },{timestamps:true}));
// // const md5=s=>crypto.createHash('md5').update(s).digest('hex');
// // const sortedSign=(data,key,upper=false)=>{const s=Object.keys(data).sort().map(k=>`${k}=${data[k]}`).join('&')+`&key=${key}`;const h=md5(s);return upper?h.toUpperCase():h};
// // const requireEnv=k=>{if(!process.env[k])throw Error(`${k} not configured`);return process.env[k]};
// // const root=()=>requireEnv('PUBLIC_BASE_URL').replace(/\/$/,'');
// // const safeUrl=u=>{const v=new URL(u);if(!['https:','http:'].includes(v.protocol))throw Error('Invalid provider URL');return v.href};
// // let rateCache={rate:0,at:0};
// // async function rate(){if(rateCache.rate&&Date.now()-rateCache.at<60000)return rateCache.rate;
// //  const response=await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=inr',{signal:AbortSignal.timeout(10000)});
// //  if(!response.ok)throw Error('USDT rate service unavailable');const r=Number((await response.json())?.tether?.inr);
// //  if(!Number.isFinite(r)||r<=0)throw Error('Invalid USDT rate');rateCache={rate:r,at:Date.now()};return r;
// // }
// // async function post(url,data,form=false){const response=await fetch(url,{method:'POST',headers:{'content-type':form?'application/x-www-form-urlencoded':'application/json'},body:form?new URLSearchParams(data):JSON.stringify(data),signal:AbortSignal.timeout(20000)});const raw=await response.text();let json;try{json=JSON.parse(raw)}catch{throw Error('Invalid gateway response')}if(!response.ok)throw Error('Gateway rejected request');return json}
// // function providerUrl(result,gateway){const url=gateway==='lg'?result?.data?.pay_url:gateway==='bond'?result?.payment_url:result?.url;return safeUrl(url)}
// // async function createProvider(gateway,orderId,amount,ip){
// //  const amountText=amount.toFixed(2);
// //  if(gateway==='lg'||gateway==='usdt'){
// //   const params={app_id:requireEnv('LG_APP_ID'),trade_type:gateway==='usdt'?'USDT':'INRUPI',order_sn:orderId,money:Math.round(amount*100),notify_url:`${root()}/api/payments/callback/lg`,return_url:`${root()}/`,subject:'Quotexx deposit',user_id:orderId,ip:ip||'127.0.0.1'};
// //   const result=await post('https://www.lg-pay.com/api/order/create',{...params,sign:sortedSign(params,requireEnv('LG_API_KEY'),true)},true);
// //   if(String(result.status)!=='1')throw Error('LG-Pay declined order');return providerUrl(result,'lg');
// //  }
// //  if(gateway==='watch'){
// //   const params={merchant_id:requireEnv('WATCH_MERCHANT_ID'),order_no:orderId,amount:amountText,notify_url:`${root()}/api/payments/callback/watch`,return_url:`${root()}/`,timestamp:String(Math.floor(Date.now()/1000))};
// //   const payload={...params,sign:sortedSign(params,requireEnv('WATCH_API_KEY'),true)};
// //   const result=await post('https://watchpayss.com/api/public/v1/payin/create',payload);
// //   if(Number(result.code)!==0||!result.data?.pay_url)throw Error(result.msg||'WatchPay declined order');
// //   return safeUrl(result.data.pay_url);
// //  }
// //  if(gateway==='bond'){
// //   const params={merchant_id:requireEnv('BOND_MERCHANT_ID'),api_key:requireEnv('BOND_API_KEY'),amount:amountText,merchant_order_no:orderId,callback_url:`${root()}/api/payments/callback/bond`,extra:0};
// //   params.signature=md5(params.merchant_id+params.amount+params.merchant_order_no+params.api_key+params.callback_url);
// //   const result=await post('https://api.bond-payss.com/v1/create',params);
// //   if(!result.success)throw Error('BondPay declined order');return providerUrl(result,'bond');
// //  }
// //  throw Error('Unknown gateway');
// // }
// // // Payment status and wallet increment must commit together. Requires MongoDB replica set.
// // async function credit(payment){
// //  const session=await mongoose.startSession();
// //  try {
// //   let credited=false;
// //   await session.withTransaction(async()=>{
// //    const claimed=await Payment.findOneAndUpdate({_id:payment._id,status:'pending'},{$set:{status:'paid'}},{new:true,session});
// //    if(!claimed)return;
// //    const result=await User.updateOne({_id:claimed.user},{$inc:{balance:claimed.creditUSDT}},{session});
// //    if(result.matchedCount!==1)throw Error('Wallet user missing');
// //    if(claimed.offerAmountINR===1999){
// //     await User.updateOne({_id:claimed.user,popup:'1999'},{$set:{popup:'waiting_approval'}},{session});
// //    }else if(claimed.offerAmountINR===1399){
// //     await User.updateOne({_id:claimed.user,popup:'1399'},{$set:{popup:'done'}},{session});
// //    }else{
// //     await User.updateOne({_id:claimed.user,popup:{$in:['none',null]}},{$set:{popup:'1999'}},{session});
// //    }
// //    credited=true;
// //   });
// //   return credited;
// //  } finally {await session.endSession()}
// // }
// // // BondPay and WatchPay send merchantOrder, orderNo, status and amount.
// // // These fields are NOT proof of payment. Preserve callbacks for later authenticated reconciliation.
// // async function recordUnverifiedCallback(gateway,req,res){
// //  const body=req.body && typeof req.body==='object' ? req.body : {};
// //  const orderId=String(body.merchantOrder ?? '').trim();
// //  const providerOrderNo=String(body.orderNo ?? '').trim();
// //  const status=String(body.status ?? '').trim().toLowerCase();
// //  const rawAmount=String(body.amount ?? '').trim();
// //  const amount=Number(rawAmount);
// //  if(!orderId || orderId.length>128 || !providerOrderNo || providerOrderNo.length>128 ||
// //     !['success','pending','failed'].includes(status) || !/^\d+(?:\.\d{1,2})?$/.test(rawAmount) ||
// //     !Number.isSafeInteger(Math.round(amount*100)) || amount<=0)
// //    return res.status(400).send('invalid_request');
// //  const payment=await Payment.findOne({orderId,gateway});
// //  if(!payment)return res.status(404).send('order_not_found');
// //  if(Math.round(amount*100)!==Math.round(payment.amountINR*100))
// //    return res.status(400).send('amount_mismatch');
// //  // A paid order cannot be downgraded or credited again by a repeated callback.
// //  if(payment.status==='paid')return res.status(200).send('success');
// //  await Payment.updateOne({_id:payment._id,status:{$ne:'paid'}},{$set:{
// //    callbackReceivedAt:new Date(),callbackStatus:status,providerOrderNo,
// //    providerResponse:{orderNo:providerOrderNo,merchantOrder:orderId,status,amount,
// //      ...(gateway==='bond'?{createtime:body.createtime,updatetime:body.updatetime}:{})}
// //  }});
// //  // Acknowledge receipt. Wallet credit requires provider-authenticated verification.
// //  return res.status(200).send(gateway==='bond'?'ok':'success');
// // }
// // export function installGateways(app,auth,asyncH){
// //  app.get('/api/payments/rate',asyncH(async(req,res)=>res.json({rateINR:await rate(),currency:'USDT',asOf:new Date(rateCache.at).toISOString()})));
// //  app.post('/api/payments/create',auth,asyncH(async(req,res)=>{
// //   const gateway=String(req.body.gateway||'');const amount=Number(req.body.amountINR);
// //   if(!['lg','watch','bond','usdt'].includes(gateway)||!Number.isFinite(amount)||amount<100||amount>100000||Math.round(amount*100)!==amount*100) return res.status(400).json({error:'Invalid gateway or INR amount (min ₹100)'});
// //   const r=await rate(),orderId=`QX${Date.now()}${crypto.randomBytes(5).toString('hex')}`;
// //   const creditUSDT=Math.floor(amount/r*1e6)/1e6;
// //   const offerAmountINR=[1999,1399].includes(Number(req.body.offerAmountINR)) && Number(req.body.offerAmountINR)===amount ? Number(req.body.offerAmountINR) : null;
// //   const payment=await Payment.create({user:req.user._id,gateway,orderId,amountINR:amount,rateINR:r,creditUSDT,offerAmountINR});
// //   try{const paymentUrl=await createProvider(gateway,orderId,amount,req.ip);res.json({orderId,paymentUrl,rateINR:r,creditUSDT,status:'pending'})}
// //   catch(e){await Payment.updateOne({_id:payment._id},{$set:{status:'failed'}});res.status(502).json({error:e.message})}
// //  }));
// //  app.get('/api/payments/:orderId',auth,asyncH(async(req,res)=>{
// //   const p=await Payment.findOne({orderId:req.params.orderId,user:req.user._id}).select('orderId status creditUSDT amountINR gateway');
// //   if(!p)return res.status(404).json({error:'Order not found'});res.json(p);
// //  }));
// //  // IMPORTANT: Never credit on unverified callbacks. LG signs only after its callback key is configured.
// //  app.post('/api/payments/callback/lg',asyncH(async(req,res)=>{
// //   const body=req.body;const {sign,...data}=body;
// //   if(!sign||!process.env.LG_CALLBACK_KEY||!crypto.timingSafeEqual(Buffer.from(String(sign).toUpperCase().padEnd(32,'0').slice(0,32)),Buffer.from(sortedSign(data,process.env.LG_CALLBACK_KEY,true))))return res.status(403).send('invalid sign');
// //   const p=await Payment.findOne({orderId:String(body.order_sn),gateway:{$in:['lg','usdt']}});
// //   if(!p||Number(body.money)!==Math.round(p.amountINR*100))return res.status(400).send('order mismatch');
// //   if(String(body.status)!=='1')return res.send('ok');
// //   await credit(p);res.send('ok');
// //  }));
// //  // Receive and store callbacks, but do NOT credit until authenticated using official provider specs.
// //  app.post('/api/payments/callback/watch',asyncH((req,res)=>recordUnverifiedCallback('watch',req,res)));
// //  app.post('/api/payments/callback/bond',asyncH((req,res)=>recordUnverifiedCallback('bond',req,res)));
// // }





// import crypto from 'node:crypto';
// import mongoose, { Schema, model } from 'mongoose';
// import { User } from './models.js';

// const Payment = mongoose.models.GatewayPayment || model(
//   'GatewayPayment',
//   new Schema({
//     user: {
//       type: Schema.Types.ObjectId,
//       ref: 'User',
//       required: true
//     },
//     gateway: {
//       type: String,
//       required: true
//     },
//     orderId: {
//       type: String,
//       unique: true,
//       required: true
//     },

//     // Existing INR gateways
//     amountINR: {
//       type: Number,
//       default: null
//     },
//     rateINR: {
//       type: Number,
//       default: null
//     },

//     // Separate USDT gateway
//     amountUSDT: {
//       type: Number,
//       default: null
//     },

//     creditUSDT: {
//       type: Number,
//       required: true
//     },

//     status: {
//       type: String,
//       enum: ['pending', 'paid', 'failed'],
//       default: 'pending'
//     },

//     offerAmountINR: {
//       type: Number,
//       default: null
//     },

//     providerResponse: Schema.Types.Mixed,
//     callbackReceivedAt: Date,
//     callbackStatus: String,
//     providerOrderNo: String
//   }, { timestamps: true })
// );

// const md5 = value =>
//   crypto.createHash('md5')
//     .update(value)
//     .digest('hex');

// const sortedSign = (data, key, upper = false) => {
//   const str = Object.keys(data)
//     .sort()
//     .map(k => `${k}=${data[k]}`)
//     .join('&') + `&key=${key}`;

//   const hash = md5(str);
//   return upper ? hash.toUpperCase() : hash;
// };

// const requireEnv = key => {
//   if (!process.env[key]) {
//     throw Error(`${key} not configured`);
//   }
//   return process.env[key];
// };

// const root = () =>
//   requireEnv('PUBLIC_BASE_URL').replace(/\/+$/, '');

// const safeUrl = url => {
//   const value = new URL(url);

//   if (!['https:', 'http:'].includes(value.protocol)) {
//     throw Error('Invalid provider URL');
//   }

//   return value.href;
// };

// let rateCache = {
//   rate: 0,
//   at: 0
// };

// // Existing INR to USDT conversion
// async function rate() {
//   if (
//     rateCache.rate &&
//     Date.now() - rateCache.at < 60000
//   ) {
//     return rateCache.rate;
//   }

//   const response = await fetch(
//     'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=inr',
//     { signal: AbortSignal.timeout(10000) }
//   );

//   if (!response.ok) {
//     throw Error('USDT rate service unavailable');
//   }

//   const result = await response.json();
//   const value = Number(result?.tether?.inr);

//   if (!Number.isFinite(value) || value <= 0) {
//     throw Error('Invalid USDT rate');
//   }

//   rateCache = {
//     rate: value,
//     at: Date.now()
//   };

//   return value;
// }

// async function post(url, data, form = false) {
//   const response = await fetch(url, {
//     method: 'POST',
//     headers: {
//       'content-type': form
//         ? 'application/x-www-form-urlencoded'
//         : 'application/json'
//     },
//     body: form
//       ? new URLSearchParams(data)
//       : JSON.stringify(data),
//     signal: AbortSignal.timeout(20000)
//   });

//   const raw = await response.text();

//   let json;

//   try {
//     json = JSON.parse(raw);
//   } catch {
//     throw Error('Invalid gateway response');
//   }

//   if (!response.ok) {
//     throw Error('Gateway rejected request');
//   }

//   return json;
// }

// function providerUrl(result, gateway) {
//   const url = gateway === 'lg'
//     ? result?.data?.pay_url
//     : gateway === 'bond'
//       ? result?.payment_url
//       : result?.url;

//   return safeUrl(url);
// }

// // =================================================
// // CREATE PAYMENT AT PROVIDER
// // =================================================

// async function createProvider(
//   gateway,
//   orderId,
//   amount,
//   ip
// ) {
//   const amountText = amount.toFixed(2);

//   // -----------------------------------------------
//   // 1. EXISTING LG-PAY INR
//   // -----------------------------------------------

//   if (gateway === 'lg') {
//     const params = {
//       app_id: requireEnv('LG_APP_ID'),
//       trade_type: 'INRUPI',
//       order_sn: orderId,
//       money: Math.round(amount * 100),
//       notify_url: `${root()}/api/payments/callback/lg`,
//       return_url: `${root()}/`,
//       subject: 'Quotexx deposit',
//       user_id: orderId,
//       ip: ip || '127.0.0.1'
//     };

//     const result = await post(
//       'https://www.lg-pay.com/api/order/create',
//       {
//         ...params,
//         sign: sortedSign(
//           params,
//           requireEnv('LG_API_KEY'),
//           true
//         )
//       },
//       true
//     );

//     console.log(result,"FGHJKl")

//     if (String(result.status) !== '1') {
//       throw Error('LG-Pay declined order');
//     }

//     return providerUrl(result, 'lg');
//   }

//   // -----------------------------------------------
//   // 2. NEW LG-PAY USDT
//   // -----------------------------------------------

//   if (gateway === 'usdt') {
//     const params = {
//       app_id: requireEnv('LG_USDT_APP_ID'),
//       trade_type: 'usdt',
//       order_sn: orderId,

//       // Direct USDT amount, no INR exchange rate.
//       // Assumes provider uses 100 minor units.
//       money: Math.round(amount * 100),

//       notify_url:
//         `${root()}/api/payments/callback/lg/usdt`,
//       return_url: `${root()}/`,
//       subject: 'Quotexx USDT deposit',
//       user_id: orderId,
//       ip: ip || '127.0.0.1'
//     };

//     const result = await post(
//       'https://www.lg-pay.com/api/order/create',
//       {
//         ...params,
//         sign: sortedSign(
//           params,
//           requireEnv('LG_USDT_API_KEY'),
//           true
//         )
//       },
//       true
//     );

//      console.log(result,"FGHJKl")

//     if (String(result.status) !== '1') {
//       throw Error('LG-Pay USDT declined order');
//     }

//     return providerUrl(result, 'lg');
//   }

//   // -----------------------------------------------
//   // 3. EXISTING WATCHPAY
//   // -----------------------------------------------

//   if (gateway === 'watch') {
//     const params = {
//       merchant_id: requireEnv('WATCH_MERCHANT_ID'),
//       order_no: orderId,
//       amount: amountText,
//       notify_url:
//         `${root()}/api/payments/callback/watch`,
//       return_url: `${root()}/`,
//       timestamp: String(
//         Math.floor(Date.now() / 1000)
//       )
//     };

//     const payload = {
//       ...params,
//       sign: sortedSign(
//         params,
//         requireEnv('WATCH_API_KEY'),
//         true
//       )
//     };

//     const result = await post(
//       'https://watchpayss.com/api/public/v1/payin/create',
//       payload
//     );

//     if (
//       Number(result.code) !== 0 ||
//       !result.data?.pay_url
//     ) {
//       throw Error(
//         result.msg || 'WatchPay declined order'
//       );
//     }

//     return safeUrl(result.data.pay_url);
//   }

//   // -----------------------------------------------
//   // 4. EXISTING BONDPAY
//   // -----------------------------------------------

//   if (gateway === 'bond') {
//     const params = {
//       merchant_id: requireEnv('BOND_MERCHANT_ID'),
//       api_key: requireEnv('BOND_API_KEY'),
//       amount: amountText,
//       merchant_order_no: orderId,
//       callback_url:
//         `${root()}/api/payments/callback/bond`,
//       extra: 0
//     };

//     params.signature = md5(
//       params.merchant_id +
//       params.amount +
//       params.merchant_order_no +
//       params.api_key +
//       params.callback_url
//     );

//     const result = await post(
//       'https://api.bond-payss.com/v1/create',
//       params
//     );

//     if (!result.success) {
//       throw Error('BondPay declined order');
//     }

//     return providerUrl(result, 'bond');
//   }

//   throw Error('Unknown gateway');
// }

// // =================================================
// // WALLET CREDIT
// // MongoDB transaction requires replica set.
// // =================================================

// async function credit(payment) {
//   const session = await mongoose.startSession();

//   try {
//     let credited = false;

//     await session.withTransaction(async () => {
//       const claimed = await Payment.findOneAndUpdate(
//         {
//           _id: payment._id,
//           status: 'pending'
//         },
//         {
//           $set: { status: 'paid' }
//         },
//         {
//           new: true,
//           session
//         }
//       );

//       if (!claimed) return;

//       const result = await User.updateOne(
//         { _id: claimed.user },
//         {
//           $inc: {
//             balance: claimed.creditUSDT
//           }
//         },
//         { session }
//       );

//       if (result.matchedCount !== 1) {
//         throw Error('Wallet user missing');
//       }

//       // Keep payment credit independent from
//       // unrelated withdrawal or verification fees.
//       credited = true;
//     });

//     return credited;
//   } finally {
//     await session.endSession();
//   }
// }

// // =================================================
// // WATCHPAY / BONDPAY CALLBACK RECORDING
// // Existing behavior: no unverified wallet credit.
// // =================================================

// async function recordUnverifiedCallback(
//   gateway,
//   req,
//   res
// ) {
//   const body =
//     req.body && typeof req.body === 'object'
//       ? req.body
//       : {};

//   const orderId = String(
//     body.merchantOrder ?? ''
//   ).trim();

//   const providerOrderNo = String(
//     body.orderNo ?? ''
//   ).trim();

//   const status = String(
//     body.status ?? ''
//   ).trim().toLowerCase();

//   const rawAmount = String(
//     body.amount ?? ''
//   ).trim();

//   const amount = Number(rawAmount);

//   if (
//     !orderId ||
//     orderId.length > 128 ||
//     !providerOrderNo ||
//     providerOrderNo.length > 128 ||
//     !['success', 'pending', 'failed'].includes(status) ||
//     !/^\d+(?:\.\d{1,2})?$/.test(rawAmount) ||
//     !Number.isSafeInteger(Math.round(amount * 100)) ||
//     amount <= 0
//   ) {
//     return res.status(400).send('invalid_request');
//   }

//   const payment = await Payment.findOne({
//     orderId,
//     gateway
//   });

//   if (!payment) {
//     return res.status(404).send('order_not_found');
//   }

//   if (
//     Math.round(amount * 100) !==
//     Math.round(payment.amountINR * 100)
//   ) {
//     return res.status(400).send('amount_mismatch');
//   }

//   if (payment.status === 'paid') {
//     return res.status(200).send('success');
//   }

//   await Payment.updateOne(
//     {
//       _id: payment._id,
//       status: { $ne: 'paid' }
//     },
//     {
//       $set: {
//         callbackReceivedAt: new Date(),
//         callbackStatus: status,
//         providerOrderNo,
//         providerResponse: {
//           orderNo: providerOrderNo,
//           merchantOrder: orderId,
//           status,
//           amount,
//           ...(gateway === 'bond'
//             ? {
//                 createtime: body.createtime,
//                 updatetime: body.updatetime
//               }
//             : {})
//         }
//       }
//     }
//   );

//   return res.status(200).send(
//     gateway === 'bond' ? 'ok' : 'success'
//   );
// }

// // =================================================
// // LG CALLBACK SIGNATURE CHECK
// // =================================================

// function validLGSignature(body, key) {
//   if (
//     !body ||
//     typeof body !== 'object' ||
//     Array.isArray(body)
//   ) {
//     return false;
//   }

//   const { sign, ...data } = body;

//   if (
//     typeof sign !== 'string' ||
//     !/^[0-9a-f]{32}$/i.test(sign)
//   ) {
//     return false;
//   }

//   const expected = Buffer.from(
//     sortedSign(data, key, true),
//     'hex'
//   );

//   const received = Buffer.from(sign, 'hex');

//   return (
//     expected.length === received.length &&
//     crypto.timingSafeEqual(expected, received)
//   );
// }

// // =================================================
// // LG INR / LG USDT CALLBACK HANDLER
// // =================================================

// async function handleLGCallback(gateway, req, res) {
//   const body = req.body || {};

//   const keyName = gateway === 'usdt'
//     ? 'LG_USDT_CALLBACK_KEY'
//     : 'LG_CALLBACK_KEY';

//   if (
//     !validLGSignature(
//       body,
//       requireEnv(keyName)
//     )
//   ) {
//     return res.status(403).send('invalid sign');
//   }

//   const orderId = String(
//     body.order_sn || ''
//   );

//   const payment = await Payment.findOne({
//     orderId,
//     gateway
//   });

//   if (!payment) {
//     return res.status(404).send('order not found');
//   }

//   const amount = gateway === 'usdt'
//     ? payment.amountUSDT
//     : payment.amountINR;

//   if (
//     !Number.isFinite(amount) ||
//     Number(body.money) !== Math.round(amount * 100)
//   ) {
//     return res.status(400).send('amount mismatch');
//   }

//   await Payment.updateOne(
//     { _id: payment._id },
//     {
//       $set: {
//         callbackReceivedAt: new Date(),
//         callbackStatus: String(body.status),
//         providerResponse: body
//       }
//     }
//   );

//   if (String(body.status) !== '1') {
//     return res.send('ok');
//   }

//   // IMPORTANT:
//   // Enable automatic credit only after verifying
//   // the provider's official signing specification,
//   // settlement status, currency and amount units.
//   //
//   // Then call:
//   // await credit(payment);

//   return res.send('ok');
// }

// // =================================================
// // ALL PAYMENT ROUTES
// // =================================================

// export function installGateways(app, auth, asyncH) {

//   // -----------------------------------------------
//   // Existing INR / USDT exchange rate
//   // -----------------------------------------------

//   app.get(
//     '/api/payments/rate',
//     asyncH(async (req, res) => {
//       res.json({
//         rateINR: await rate(),
//         currency: 'USDT',
//         asOf: new Date(
//           rateCache.at
//         ).toISOString()
//       });
//     })
//   );

//   // -----------------------------------------------
//   // CREATE PAYMENT
//   // -----------------------------------------------

 
// app.post(
//   '/api/payments/create',
//   auth,
//   asyncH(async (req, res) => {
//     const gateway = String(req.body.gateway || '');
//     const isUSDT = gateway === 'usdt';

//     // Validate gateway
//     if (!['lg', 'watch', 'bond', 'usdt'].includes(gateway)) {
//       return res.status(400).json({
//         error: 'Invalid gateway'
//       });
//     }

//     // Existing frontend sends amountINR for all gateways.
//     // For USDT, interpret its value directly as USDT.
//     const amount = Number(req.body.amountINR);

//     if (
//       !Number.isFinite(amount) ||
//       amount < (isUSDT ? 1 : 100) ||
//       amount > (isUSDT ? 10000 : 100000) ||
//       Math.round(amount * 100) !== amount * 100
//     ) {
//       return res.status(400).json({
//         error: isUSDT
//           ? 'Invalid USDT amount (min 1 USDT)'
//           : 'Invalid INR amount (min ₹100)'
//       });
//     }

//     // INR gateways: convert INR to USDT.
//     // USDT gateway: no conversion.
//     const r = isUSDT ? null : await rate();

//     const creditUSDT = isUSDT
//       ? amount
//       : Math.floor((amount / r) * 1e6) / 1e6;

//     const orderId =
//       `QX${Date.now()}${crypto.randomBytes(5).toString('hex')}`;

//     // Existing INR offer logic unchanged
//     const offerAmountINR = !isUSDT &&
//       [1999, 1399].includes(Number(req.body.offerAmountINR)) &&
//       Number(req.body.offerAmountINR) === amount
//         ? amount
//         : null;

//     // Save payment
//     const payment = await Payment.create({
//       user: req.user._id,
//       gateway,
//       orderId,

//       // Keep INR and USDT amounts separate in DB
//       amountINR: isUSDT ? null : amount,
//       amountUSDT: isUSDT ? amount : null,

//       rateINR: r,
//       creditUSDT,
//       offerAmountINR,
//       status: 'pending'
//     });

//     try {
//       // createProvider uses separate USDT credentials
//       // and separate USDT callback when gateway='usdt'.
//       const paymentUrl = await createProvider(
//         gateway,
//         orderId,
//         amount,
//         req.ip
//       );

//       return res.json({
//         orderId,
//         paymentUrl,
//         gateway,
//         currency: isUSDT ? 'USDT' : 'INR',

//         // Keep existing frontend response compatibility
//         amountINR: amount,

//         // Also return explicit USDT amount
//         amountUSDT: isUSDT ? amount : null,

//         rateINR: r,
//         creditUSDT,
//         status: 'pending'
//       });

//     } catch (error) {
//       await Payment.updateOne(
//         { _id: payment._id },
//         {
//           $set: {
//             status: 'failed'
//           }
//         }
//       );

//       return res.status(502).json({
//         error: error.message
//       });
//     }
//   })
// );

//   // -----------------------------------------------
//   // PAYMENT STATUS
//   // -----------------------------------------------

//   app.get(
//     '/api/payments/:orderId',
//     auth,
//     asyncH(async (req, res) => {
//       const payment = await Payment.findOne({
//         orderId: req.params.orderId,
//         user: req.user._id
//       }).select(
//         'orderId status creditUSDT amountINR amountUSDT gateway'
//       );

//       if (!payment) {
//         return res.status(404).json({
//           error: 'Order not found'
//         });
//       }

//       return res.json(payment);
//     })
//   );

//   // -----------------------------------------------
//   // NORMAL LG INR CALLBACK
//   // -----------------------------------------------

//   app.post(
//     '/api/payments/callback/lg',
//     asyncH(async (req, res) => {
//       return handleLGCallback(
//         'lg',
//         req,
//         res
//       );
//     })
//   );

//   // -----------------------------------------------
//   // NEW LG USDT CALLBACK
//   // -----------------------------------------------

//   app.post(
//     '/api/payments/callback/lg/usdt',
//     asyncH(async (req, res) => {
//       return handleLGCallback(
//         'usdt',
//         req,
//         res
//       );
//     })
//   );

//   // -----------------------------------------------
//   // EXISTING WATCHPAY CALLBACK
//   // -----------------------------------------------

//   app.post(
//     '/api/payments/callback/watch',
//     asyncH(async (req, res) => {
//       return recordUnverifiedCallback(
//         'watch',
//         req,
//         res
//       );
//     })
//   );

//   // -----------------------------------------------
//   // EXISTING BONDPAY CALLBACK
//   // -----------------------------------------------

//   app.post(
//     '/api/payments/callback/bond',
//     asyncH(async (req, res) => {
//       return recordUnverifiedCallback(
//         'bond',
//         req,
//         res
//       );
//     })
//   );
// }



import crypto from 'node:crypto';
import express from 'express';
import mongoose, { Schema, model } from 'mongoose';
import { User } from './models.js';

const Payment = model('GatewayPayment', new Schema({
 user:{type:Schema.Types.ObjectId,ref:'User',required:true}, gateway:{type:String,required:true},
 orderId:{type:String,unique:true,required:true}, amountINR:{type:Number,required:true},
 rateINR:{type:Number,required:true}, creditUSDT:{type:Number,required:true},
 status:{type:String,enum:['pending','paid','failed'],default:'pending'},
 providerResponse:{type:Schema.Types.Mixed}, callbackReceivedAt:Date, callbackStatus:String, providerOrderNo:String
},{timestamps:true}));
const md5=s=>crypto.createHash('md5').update(s).digest('hex');
const sortedSign=(data,key,upper=false)=>{const s=Object.keys(data).sort().map(k=>`${k}=${data[k]}`).join('&')+`&key=${key}`;const h=md5(s);return upper?h.toUpperCase():h};
const requireEnv=k=>{if(!process.env[k])throw Error(`${k} not configured`);return process.env[k]};
const root=()=>requireEnv('PUBLIC_BASE_URL').replace(/\/$/,'');
const safeUrl=u=>{const v=new URL(u);if(!['https:','http:'].includes(v.protocol))throw Error('Invalid provider URL');return v.href};
let rateCache={rate:0,at:0};
async function rate(){if(rateCache.rate&&Date.now()-rateCache.at<60000)return rateCache.rate;
 const response=await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=inr',{signal:AbortSignal.timeout(10000)});
 if(!response.ok)throw Error('USDT rate service unavailable');const r=Number((await response.json())?.tether?.inr);
 if(!Number.isFinite(r)||r<=0)throw Error('Invalid USDT rate');rateCache={rate:r,at:Date.now()};return r;
}
async function post(url,data,form=false){const response=await fetch(url,{method:'POST',headers:{'content-type':form?'application/x-www-form-urlencoded':'application/json'},body:form?new URLSearchParams(data):JSON.stringify(data),signal:AbortSignal.timeout(20000)});const raw=await response.text();let json;try{json=JSON.parse(raw)}catch{throw Error('Invalid gateway response')}if(!response.ok)throw Error('Gateway rejected request');return json}
function providerUrl(result,gateway){const url=gateway==='lg'?result?.data?.pay_url:gateway==='bond'?result?.payment_url:result?.url;return safeUrl(url)}
async function createProvider(gateway,orderId,amount,ip){
 const amountText=amount.toFixed(2);
 if(gateway==='lg'||gateway==='usdt'){
  const params={app_id:requireEnv('LG_APP_ID'),trade_type:gateway==='usdt'?'USDT':'INRUPI',order_sn:orderId,money:Math.round(amount*100),notify_url:`${root()}/api/payments/callback/lg`,return_url:`${root()}/`,subject:'Quotexx deposit',user_id:orderId,ip:ip||'127.0.0.1'};
  const result=await post('https://www.lg-pay.com/api/order/create',{...params,sign:sortedSign(params,requireEnv('LG_API_KEY'),true)},true);
  if(String(result.status)!=='1')throw Error('LG-Pay declined order');return providerUrl(result,'lg');
 }
 if(gateway==='watch'){
  const params={amount:amountText,callback_url:`${root()}/api/payments/callback/watch`,merchant_id:requireEnv('WATCH_MERCHANT_ID'),merchant_order_no:orderId};
  const payload={...params,api_key:requireEnv('WATCH_API_KEY'),extra:'Quotexx',signature:sortedSign(params,requireEnv('WATCH_API_KEY'))};
  const result=await post('https://api.mpxpays.com/api/payIn',payload);
  if(!result.status)throw Error('WatchPay declined order');return providerUrl(result,'watch');
 }
 if(gateway==='bond'){
  const params={merchant_id:requireEnv('BOND_MERCHANT_ID'),api_key:requireEnv('BOND_API_KEY'),amount:amountText,merchant_order_no:orderId,callback_url:`${root()}/api/payments/callback/bond`,extra:0};
  params.signature=md5(params.merchant_id+params.amount+params.merchant_order_no+params.api_key+params.callback_url);
  const result=await post('https://api.bond-payss.com/v1/create',params);
  if(!result.success)throw Error('BondPay declined order');return providerUrl(result,'bond');
 }
 throw Error('Unknown gateway');
}
// Payment status and wallet increment must commit together. Requires MongoDB replica set.
async function credit(payment){
 const session=await mongoose.startSession();
 try {
  let credited=false;
  await session.withTransaction(async()=>{
   const claimed=await Payment.findOneAndUpdate({_id:payment._id,status:'pending'},{$set:{status:'paid'}},{new:true,session});
   if(!claimed)return;
   const result=await User.updateOne({_id:claimed.user},{$inc:{balance:claimed.creditUSDT}},{session});
   if(result.matchedCount!==1)throw Error('Wallet user missing');
   credited=true;
  });
  return credited;
 } finally {await session.endSession()}
}
// BondPay and WatchPay send merchantOrder, orderNo, status and amount.
// These fields are NOT proof of payment. Preserve callbacks for later authenticated reconciliation.
async function recordUnverifiedCallback(gateway,req,res){
 const body=req.body && typeof req.body==='object' ? req.body : {};
 const orderId=String(body.merchantOrder ?? '').trim();
 const providerOrderNo=String(body.orderNo ?? '').trim();
 const status=String(body.status ?? '').trim().toLowerCase();
 const rawAmount=String(body.amount ?? '').trim();
 const amount=Number(rawAmount);
 if(!orderId || orderId.length>128 || !providerOrderNo || providerOrderNo.length>128 ||
    !['success','pending','failed'].includes(status) || !/^\d+(?:\.\d{1,2})?$/.test(rawAmount) ||
    !Number.isSafeInteger(Math.round(amount*100)) || amount<=0)
   return res.status(400).send('invalid_request');
 const payment=await Payment.findOne({orderId,gateway});
 if(!payment)return res.status(404).send('order_not_found');
 if(Math.round(amount*100)!==Math.round(payment.amountINR*100))
   return res.status(400).send('amount_mismatch');
 // A paid order cannot be downgraded or credited again by a repeated callback.
 if(payment.status==='paid')return res.status(200).send('success');
 await Payment.updateOne({_id:payment._id,status:{$ne:'paid'}},{$set:{
   callbackReceivedAt:new Date(),callbackStatus:status,providerOrderNo,
   providerResponse:{orderNo:providerOrderNo,merchantOrder:orderId,status,amount,
     ...(gateway==='bond'?{createtime:body.createtime,updatetime:body.updatetime}:{})}
 }});
 // Acknowledge receipt. Wallet credit requires provider-authenticated verification.
 return res.status(200).send(gateway==='bond'?'ok':'success');
}
export function installGateways(app,auth,asyncH){
 // Reuse the existing GatewayPayment model and credit(payment) used by callbacks.
 const adminOnly=(req,res,next)=>req.user?.role==='admin'?next():res.status(403).json({error:'Admin only'});
 app.get('/api/admin/gateway-payments',auth,adminOnly,asyncH(async(req,res)=>{
  const rows=await Payment.find().sort({createdAt:-1}).limit(200).populate('user','email name').lean();
  res.json({rows});
 }));
 app.patch('/api/admin/gateway-payments/:id/approve',auth,adminOnly,asyncH(async(req,res)=>{
  if(req.body?.paymentVerified!==true)return res.status(400).json({error:'Independent provider payment verification required'});
  if(!/^[a-f0-9]{24}$/i.test(req.params.id))return res.status(400).json({error:'Invalid payment ID'});
  const payment=await Payment.findById(req.params.id);
  if(!payment)return res.status(404).json({error:'Payment not found'});
  if(payment.status!=='pending')return res.status(409).json({error:'Payment already processed or failed'});
  // Both callback and admin approval enter the same transactional credit() function.
  const credited=await credit(payment);
  if(!credited)return res.status(409).json({error:'Payment already processed'});
  res.json({ok:true,creditedAmount:payment.creditUSDT});
 }));

 app.get('/api/payments/rate',asyncH(async(req,res)=>res.json({rateINR:await rate(),currency:'USDT',asOf:new Date(rateCache.at).toISOString()})));
 app.post('/api/payments/create',auth,asyncH(async(req,res)=>{
  const gateway=String(req.body.gateway||'');const amount=Number(req.body.amountINR);
  if(!['lg','watch','bond','usdt'].includes(gateway)||!Number.isFinite(amount)||amount<100||amount>100000||Math.round(amount*100)!==amount*100) return res.status(400).json({error:'Invalid gateway or INR amount (min ₹100)'});
  const r=await rate(),orderId=`QX${Date.now()}${crypto.randomBytes(5).toString('hex')}`;
  const creditUSDT=Math.floor(amount/r*1e6)/1e6;
  const payment=await Payment.create({user:req.user._id,gateway,orderId,amountINR:amount,rateINR:r,creditUSDT});
  try{const paymentUrl=await createProvider(gateway,orderId,amount,req.ip);res.json({orderId,paymentUrl,rateINR:r,creditUSDT,status:'pending'})}
  catch(e){await Payment.updateOne({_id:payment._id},{$set:{status:'failed'}});res.status(502).json({error:e.message})}
 }));
 app.get('/api/payments/:orderId',auth,asyncH(async(req,res)=>{
  const p=await Payment.findOne({orderId:req.params.orderId,user:req.user._id}).select('orderId status creditUSDT amountINR gateway');
  if(!p)return res.status(404).json({error:'Order not found'});res.json(p);
 }));
 // IMPORTANT: Never credit on unverified callbacks. LG signs only after its callback key is configured.
 app.post('/api/payments/callback/lg',asyncH(async(req,res)=>{
  const body=req.body;const {sign,...data}=body;
  if(!sign||!process.env.LG_CALLBACK_KEY||!crypto.timingSafeEqual(Buffer.from(String(sign).toUpperCase().padEnd(32,'0').slice(0,32)),Buffer.from(sortedSign(data,process.env.LG_CALLBACK_KEY,true))))return res.status(403).send('invalid sign');
  const p=await Payment.findOne({orderId:String(body.order_sn),gateway:{$in:['lg','usdt']}});
  if(!p||Number(body.money)!==Math.round(p.amountINR*100))return res.status(400).send('order mismatch');
  if(String(body.status)!=='1')return res.send('ok');
  await credit(p);res.send('ok');
 }));
 // Receive and store callbacks, but do NOT credit until authenticated using official provider specs.
 app.post('/api/payments/callback/watch',asyncH((req,res)=>recordUnverifiedCallback('watch',req,res)));
 app.post('/api/payments/callback/bond',asyncH((req,res)=>recordUnverifiedCallback('bond',req,res)));
}

