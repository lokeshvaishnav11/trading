

// // // const timerChoices=[1,5,10,15,30,60,120,300,600,900,1800,3600];
// // // let timerMode='timer';
// // // function timerText(n){n=Math.max(1,Math.round(n));return n>=3600?String(Math.floor(n/3600)).padStart(2,'0')+':'+String(Math.floor(n%3600/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0'):String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
// // // function setTradeTimer(seconds){$('duration').value=seconds;$('timerDisplay').textContent=timerText(seconds);$('timerPicker').hidden=true;$('timerTrigger').setAttribute('aria-expanded','false');}
// // // function toggleTimerPicker(){const p=$('timerPicker');p.hidden=!p.hidden;$('timerTrigger').setAttribute('aria-expanded',String(!p.hidden));if(!p.hidden)renderTimerChoices()}
// // // function setTimerMode(mode){timerMode=mode;renderTimerChoices()}
// // // function renderTimerChoices(){ $('timerTabTimer').classList.toggle('selected',timerMode==='timer');$('timerTabTime').classList.toggle('selected',timerMode==='time');const grid=$('timerGrid');grid.innerHTML='';for(const seconds of timerChoices){const b=document.createElement('button');b.type='button';b.textContent=timerMode==='timer'?timerText(seconds):new Date(Date.now()+seconds*1000).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});b.className=Number($('duration').value)===seconds?'selected':'';b.onclick=()=>setTradeTimer(seconds);grid.appendChild(b)}}
// // // function manualTimer(){const entered=prompt('Enter duration (MM:SS or HH:MM:SS)',timerText(Number($('duration').value)));if(entered===null)return;const parts=entered.trim().split(':').map(Number);if(parts.some(x=>!Number.isInteger(x)||x<0)||parts.length<2||parts.length>3){alert('Use MM:SS or HH:MM:SS');return}let secs=parts.reduce((acc,x)=>acc*60+x,0);if(secs<1||secs>86400){alert('Choose between 1 second and 24 hours');return}setTradeTimer(secs)}
// // // document.addEventListener('pointerdown',e=>{const p=$('timerPicker'),trigger=$('timerTrigger');if(p&&!p.hidden&&!p.contains(e.target)&&!trigger.contains(e.target)){p.hidden=true;trigger.setAttribute('aria-expanded','false')}});

// // // const $=id=>document.getElementById(id),prices={'GBP/USD':1.32436,'EUR/USD':1.08450,'BTC/USD':67480,'ETH/USD':3450,'USD/JPY':149.830},steps={'GBP/USD':.00015,'EUR/USD':.00012,'BTC/USD':30,'ETH/USD':3,'USD/JPY':.02};let asset='GBP/USD',candles=[],zoom=1,trades=[],balance=0,seq=0;let chartPan=0;let qxHistoryOffset=0;let qxHistoryBusy=false;
// // // let qxMode='live',qxLiveBalance=0,qxDemoBalance=10000;
// // // function toggleAccountMenu(e){if(e)e.stopPropagation();const m=document.getElementById('qxAccountMenu');m.classList.toggle('open');updateAccountMenu()}
// // // function closeAccountMenu(){document.getElementById('qxAccountMenu')?.classList.remove('open')}
// // // // function updateAccountMenu(){const demo=qxMode==='demo';document.getElementById('qxModeLabel').textContent=demo?'➤ DEMO':'➤ LIVE';document.getElementById('qxLiveRadio').checked=!demo;document.getElementById('qxDemoRadio').checked=demo;document.getElementById('qxLiveMoney').textContent=cash(qxLiveBalance);document.getElementById('qxDemoMoney').textContent=cash(qxDemoBalance);document.getElementById('qxMenuEmail').textContent=document.getElementById('qxProfileEmail')?.textContent||'Account email';document.getElementById('qxMenuId').textContent=document.getElementById('qxProfileId')?.textContent||'—'}
// // // function updateAccountMenu() {
// // //   const demo = qxMode === 'demo';

// // //   document.getElementById('qxModeLabel').textContent =
// // //     demo ? '➤ DEMO' : '➤ LIVE';

// // //   document.getElementById('qxLiveRadio').checked = !demo;
// // //   document.getElementById('qxDemoRadio').checked = demo;

// // //   document.getElementById('qxLiveMoney').textContent =
// // //     cash(qxLiveBalance);

// // //   document.getElementById('qxDemoMoney').textContent =
// // //     cash(qxDemoBalance);

// // //   const user = window.qxCurrentUser || {};

// // //   document.getElementById('qxMenuEmail').textContent =
// // //     user.email || 'Account email';

// // //   document.getElementById('qxMenuId').textContent =
// // //     user.id || user._id || '—';
// // // }

// // // function switchAccountMode(mode) {
// // //   if (!['live', 'demo'].includes(mode)) return;

// // //   if (qxMode === mode) {
// // //     closeAccountMenu();
// // //     return;
// // //   }

// // //   if (trades.some(t => t.status === 'Open')) {
// // //     alert('Wait until open demo trades finish.');
// // //     return;
// // //   }

// // //   qxMode = mode;

// // //   balance = mode === 'demo'
// // //     ? qxDemoBalance
// // //     : qxLiveBalance;

// // //   document.getElementById('balance').textContent =
// // //     cash(balance);

// // //   updateAccountMenu();
// // //   closeAccountMenu();
// // // }

// // // function resetDemoBalance(){if(qxMode==='demo'&&trades.some(t=>t.status==='Open')){alert('Wait for demo trades to finish first.');return}qxDemoBalance=10000;if(qxMode==='demo'){balance=10000;trades=[];render()}updateAccountMenu()}
// // // document.addEventListener('click',e=>{const m=document.getElementById('qxAccountMenu');if(m&&!m.contains(e.target)&&!e.target.closest('.header-right .pill'))closeAccountMenu()});
// // // function cash(n){return '$'+Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}function digits(){return asset.includes('BTC')||asset.includes('ETH')?2:asset.includes('JPY')?3:5}function pricefmt(p){return p.toFixed(digits())}function rnd(){return Math.random()-.5}
// // // function init(){chartPan=0;activeCandleMinute=Math.floor(Date.now()/60000);candles=[];let p=prices[asset]+steps[asset]*3;for(let i=0;i<120;i++){let o=p;p=Math.max(.001,p+rnd()*steps[asset]*3);candles.push({o,c:p,h:Math.max(o,p)+Math.random()*steps[asset],l:Math.min(o,p)-Math.random()*steps[asset]})}prices[asset]=p;draw()}
// // // // Smooth, price-following vertical viewport. Uses the latest visible candles,
// // // // never fixed global price boundaries. Shared by price axis and overlays.
// // // let qxViewport=null;
// // // function qxChartRange(view, current, smooth=true){
// // //  const vals=view.flatMap(b=>[Number(b.h),Number(b.l)]).filter(Number.isFinite);
// // //  if(Number.isFinite(current))vals.push(current);
// // //  if(!vals.length)return {lo:0,hi:1};
// // //  const rawLo=Math.min(...vals),rawHi=Math.max(...vals);
// // //  const typical=steps[asset]||Math.max(Math.abs(current)*0.0001,0.00001);
// // //  const span=Math.max(rawHi-rawLo,typical*5,Math.abs(current)*0.000001);
// // //  const pad=span*0.14;
// // //  const desiredLo=rawLo-pad,desiredHi=rawHi+pad;
// // //  if(!smooth||chartPan>0)return {lo:desiredLo,hi:desiredHi};
// // //  if(!qxViewport||qxViewport.asset!==asset){qxViewport={asset,lo:desiredLo,hi:desiredHi};}
// // //  else {
// // //   // Expand immediately so current prices never clip; contract smoothly.
// // //   const alpha=0.12;
// // //   qxViewport.lo=desiredLo<qxViewport.lo?desiredLo:qxViewport.lo+(desiredLo-qxViewport.lo)*alpha;
// // //   qxViewport.hi=desiredHi>qxViewport.hi?desiredHi:qxViewport.hi+(desiredHi-qxViewport.hi)*alpha;
// // //  }
// // //  return {lo:qxViewport.lo,hi:qxViewport.hi};
// // // }
// // // function draw(){
// // // const el=$('chart'),r=el.getBoundingClientRect(),d=window.devicePixelRatio||1,w=r.width,h=r.height;
// // // if(w<20||h<20||!candles.length)return;
// // // el.width=Math.round(w*d);el.height=Math.round(h*d);
// // // const c=el.getContext('2d');c.setTransform(d,0,0,d,0,0);
// // // c.fillStyle='#1c2230';c.fillRect(0,0,w,h);
// // // const right=window.innerWidth<=760?65:72,top=16,bottom=34,left=10,ww=w-left-right,hh=h-top-bottom;
// // // const count=Math.max(5,Math.min(candles.length,Math.round((window.innerWidth<=760?20:27)/zoom)));
// // // chartPan=Math.max(0,Math.min(chartPan,candles.length-count));
// // // const view=candles.slice(Math.max(0,candles.length-count-Math.floor(chartPan)),candles.length-Math.floor(chartPan));
// // // const {lo:low,hi:high}=qxChartRange(view,chartPan>0||qxHistoryOffset>0?NaN:prices[asset]);
// // // const y=p=>top+(high-p)/(high-low)*hh;
// // // c.lineWidth=1;c.strokeStyle='#4b5365';c.font=(w<=760?'13px Arial':'12px Arial');
// // // const priceIntervals=4; // Wider, readable price-axis labels on mobile
// // // for(let i=0;i<=priceIntervals;i++){let yy=top+i*hh/priceIntervals;c.beginPath();c.moveTo(0,yy+.5);c.lineTo(w,yy+.5);c.stroke();c.fillStyle='#f4f5f8';c.font='11px Arial';c.fillText((high-(high-low)*i/priceIntervals).toFixed(digits()),w-right+5,yy+4)}
// // // // Wider 4-minute time labels, aligned to the clock and spaced across the chart.
// // // const axisNow=new Date(view[view.length-1]?.time || Date.now());axisNow.setSeconds(0,0);
// // // const timeSteps=4,axisStep=ww/timeSteps;
// // // c.textAlign='center';c.font='12px Arial';
// // // for(let i=0;i<=timeSteps;i++){
// // //   const x=left+i*axisStep;
// // //   c.strokeStyle='#4b5365';c.lineWidth=1;c.beginPath();c.moveTo(x+.5,0);c.lineTo(x+.5,h-bottom);c.stroke();
// // //   const idx=Math.max(0,Math.min(view.length-1,Math.round(i*(view.length-1)/timeSteps)));
// // //   const dt=new Date(view[idx]?.time || axisNow.getTime());
// // //   c.fillStyle='#e1e4ea';
// // //   if(x>=23&&x<=w-right-23)c.fillText(dt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),x,h-10);
// // // }
// // // c.textAlign='left';
// // // // Screenshot geometry: candles stop at the beginning-of-trade marker;
// // // // the future space to the right stays empty.
// // // // The solid end-of-trade marker advances smoothly across the future area
// // // // during each 60-second cycle, then returns to its start for the next cycle.
// // // const isHistory=qxHistoryOffset>0||chartPan>0;
// // // const beginX=left+ww*(isHistory?1:.79);
// // // const cycleProgress=(Date.now()%60000)/60000;
// // // const endX=left+ww*(.83+.10*cycleProgress);
// // // const slot=(beginX-left)/view.length;
// // // view.forEach((b,i)=>{let x=left+(i+.5)*slot;const color=b.c>=b.o?'#39e85d':'#ff795e';c.strokeStyle=color;c.fillStyle=color;c.lineWidth=1.7;c.beginPath();c.moveTo(x,y(b.h));c.lineTo(x,y(b.l));c.stroke();const bw=Math.max(4,Math.min(15,slot*.78));c.fillRect(x-bw/2,Math.min(y(b.o),y(b.c)),bw,Math.max(1,Math.abs(y(b.o)-y(b.c))))});
// // // const current=(qxHistoryOffset>0||chartPan>0)?view[view.length-1].c:prices[asset],yy=y(current);
// // // // White dotted horizontal price line
// // // c.strokeStyle='#f2f4f8';c.lineWidth=2;c.setLineDash([6,5]);c.beginPath();c.moveTo(0,yy);c.lineTo(w,yy);c.stroke();c.setLineDash([]);
// // // // Two vertical markers, as in the reference
// // // if(!isHistory){
// // // c.strokeStyle='#f6f7f9';c.lineWidth=2;c.setLineDash([6,6]);c.beginPath();c.moveTo(beginX,0);c.lineTo(beginX,h-bottom);c.stroke();c.setLineDash([]);
// // // c.strokeStyle='#b8beca';c.lineWidth=1.5;c.beginPath();c.moveTo(endX,0);c.lineTo(endX,h-bottom);c.stroke();
// // // c.save();c.globalAlpha=0.42;c.fillStyle='#a6adbc';c.font='normal 12px Arial';c.textAlign='right';c.fillText('Beginning of trade',beginX-12,top+28);c.textAlign='left';c.fillText('End of trade',endX+12,top+28);c.restore();
// // // c.fillStyle='#adb6c7';c.beginPath();c.moveTo(beginX-15,top+22);c.lineTo(beginX-8,top+18);c.lineTo(beginX-8,top+26);c.fill();c.beginPath();c.moveTo(endX+8,top+22);c.lineTo(endX+15,top+18);c.lineTo(endX+15,top+26);c.fill();
// // // const remaining=60-new Date().getSeconds();const label='00:'+String(remaining).padStart(2,'0');
// // // c.fillStyle='#586176';c.fillRect(endX-22,yy-12,44,24);c.fillStyle='#fff';c.font='bold 11px Arial';c.textAlign='center';c.fillText(label,endX,yy+4);c.textAlign='left';
// // // }
// // // c.fillStyle='#299ff1';c.beginPath();c.roundRect(w-right,yy-15,right-2,30,14);c.fill();c.fillStyle='white';c.font='bold 11px Arial';c.fillText(pricefmt(current),w-right+5,yy+4);
// // // }
// // // // One OHLC candle per real clock minute; update its high/low/close every second.
// // // let activeCandleMinute=Math.floor(Date.now()/60000);
// // // function update(){
// // //  const minute=Math.floor(Date.now()/60000);
// // //  if(minute!==activeCandleMinute){
// // //    const last=candles[candles.length-1];
// // //    const opening=last?last.c:prices[asset];
// // //    candles.push({o:opening,c:opening,h:opening,l:opening});
// // //    if(candles.length>80)candles.shift();
// // //    activeCandleMinute=minute;
// // //  }
// // //  const c=candles[candles.length-1];
// // //  const v=Math.max(.001,c.c+rnd()*steps[asset]*.65);
// // //  c.c=v;c.h=Math.max(c.h,v);c.l=Math.min(c.l,v);
// // //  prices[asset]=v;draw();settle();
// // // }
// // // function settle(){let changed=false;for(let t of trades){if(t.status!=='Open'||Date.now()<t.expires)continue;let v=prices[t.asset];if(t.asset!==asset)v=t.entry+rnd()*steps[t.asset]*4;t.exit=v;let diff=v-t.entry;if(Math.abs(diff)<1e-10){t.status='Draw';balance+=t.amount}else if((t.direction==='Buy'&&diff>0)||(t.direction==='Sell'&&diff<0)){t.status='Won';balance+=t.amount*(1+t.rate)}else t.status='Lost';changed=true}if(changed)render();else if(trades.some(t=>t.status==='Open'))render()}
// // // function render(){$('balance').textContent=cash(balance);if(qxMode==='demo')qxDemoBalance=balance;else qxLiveBalance=balance;updateAccountMenu();$('tradecount').textContent=trades.length;$('trades').className=trades.length?'':'empty';$('trades').innerHTML=trades.length?[...trades].reverse().slice(0,20).map(t=>'<div class="tradeitem"><b>'+t.asset+'</b> · <span class="'+(t.direction==='Buy'?'up':'down')+'">'+t.direction+'</span> '+cash(t.amount)+'<br><span class="'+(t.status==='Won'?'up':t.status==='Lost'?'down':'')+'">'+(t.status==='Open'?'Open · '+Math.ceil((t.expires-Date.now())/1000)+'s':t.status)+'</span></div>').join(''):"▤<br>You don't have a trade history yet.<br>Open a virtual trade using the form above."}
// // // function adjustAmount(n){const a=document.getElementById("amount");a.value=Math.max(1,(Number(a.value)||1)+n);updatePayout()}
// // // function place(direction){let amount=Number($('amount').value);if(!Number.isInteger(amount)||amount<1||amount>balance){alert('Enter a valid whole-dollar stake within your virtual balance.');return}let rate=.8;balance-=amount;trades.push({asset,amount,direction,entry:prices[asset],expires:Date.now()+Number($('duration').value)*1000,status:'Open',rate});render()}
// // // function setChartZoom(value){
// // //   zoom=Math.max(0.5,Math.min(3.5,value));
// // //   draw();
// // // }
// // // function changeZoom(n){setChartZoom(zoom*(n>0?1.2:1/1.2))}
// // // // Mobile: two-finger pinch to zoom. Desktop: mouse wheel/trackpad.
// // // const chartCanvas=$('chart');
// // // chartCanvas.style.touchAction='none';
// // // let pinchStartDistance=0,pinchStartZoom=zoom;
// // // function fingerDistance(t){return Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY)}
// // // chartCanvas.addEventListener('touchstart',e=>{
// // //   if(e.touches.length===2){e.preventDefault();dragStartX=null;pinchStartDistance=fingerDistance(e.touches);pinchStartZoom=zoom}
// // // },{passive:false});
// // // chartCanvas.addEventListener('touchmove',e=>{
// // //   if(e.touches.length===2){e.preventDefault();if(!pinchStartDistance){pinchStartDistance=fingerDistance(e.touches);pinchStartZoom=zoom}setChartZoom(pinchStartZoom*fingerDistance(e.touches)/pinchStartDistance)}
// // // },{passive:false});
// // // chartCanvas.addEventListener('touchend',e=>{if(e.touches.length<2)pinchStartDistance=0},{passive:true});
// // // chartCanvas.addEventListener('touchcancel',()=>{pinchStartDistance=0},{passive:true});
// // // // Drag left/right to inspect earlier candles; two fingers still pinch-zoom.
// // // let dragStartX=null,dragStartPan=0,dragPointer=null;
// // // const panSlot=()=>Math.max(3,(chartCanvas.getBoundingClientRect().width-75)*.79/Math.max(5,Math.round((window.innerWidth<=760?20:27)/zoom)));
// // // chartCanvas.addEventListener('pointerdown',e=>{
// // //  if(e.pointerType==='touch' && !e.isPrimary)return;
// // //  dragStartX=e.clientX;dragStartPan=chartPan;dragPointer=e.pointerId;
// // //  chartCanvas.setPointerCapture(e.pointerId);
// // // });
// // // chartCanvas.addEventListener('pointermove',e=>{
// // //  if(dragStartX===null||e.pointerId!==dragPointer||pinchStartDistance)return;
// // //  const maxPan=Math.max(0,candles.length-Math.max(5,Math.round((window.innerWidth<=760?20:27)/zoom)));
// // //  const desired=dragStartPan+(e.clientX-dragStartX)/panSlot();
// // //  chartPan=Math.max(0,Math.min(maxPan,desired));
// // //  if(desired>maxPan+3 && !qxHistoryBusy && qxHistoryOffset<1440){
// // //   const previous=qxHistoryOffset;qxHistoryBusy=true;qxHistoryOffset=Math.min(1440,previous+45);
// // //   loadChart().finally(()=>{chartPan=Math.max(0,candles.length-Math.max(5,Math.round((window.innerWidth<=760?20:27)/zoom))-4);dragStartX=null;qxHistoryBusy=false;draw()});
// // //  } 
// // //  draw();
// // // });
// // // function stopChartDrag(e){if(e.pointerId===dragPointer){dragStartX=null;dragPointer=null}}
// // // chartCanvas.addEventListener('pointerup',stopChartDrag);
// // // chartCanvas.addEventListener('pointercancel',stopChartDrag);
// // // chartCanvas.addEventListener('wheel',e=>{
// // //  e.preventDefault();
// // //  if(e.shiftKey){chartPan=Math.max(0,Math.min(candles.length-5,chartPan+e.deltaY/panSlot()));draw()}
// // //  else setChartZoom(zoom*Math.exp(-e.deltaY*.002));
// // // },{passive:false});
// // // $('asset').onchange=e=>{qxHistoryOffset=0;chartPan=0;asset=e.target.value;let rate=asset==='EUR/USD'?80:78;$('sideasset').textContent=asset+' · '+rate+'%';updatePayout();if(window.qxLoadChart)window.qxLoadChart()};function updatePayout(){$('payout').textContent=cash(Math.max(0,Number($('amount').value))*(1.88))}$('amount').oninput=updatePayout;
// // // const paymentMethods=['LG-Pay','WatchPay','BondPay','USDT Pay'];
// // // function menuButtons(items){return items.map(s=>'<button class="menubtn" data-qx-onclick="openModal(\&#x27;&#x27;+s.toLowerCase()+&#x27;\&#x27;)">'+s+'　›</button>').join('')}
// // // function openModal(type){closeAccountMenu();$('overlay').classList.add('visible');let title=type[0].toUpperCase()+type.slice(1),body='';if(type==='menu'){closeModal();toggleMore();return}
// // // else if(type==='deposit'){body='<p class="note">Choose a gateway. Payments are credited only after verified confirmation.</p><label class="field">Country<select><option>India</option></select></label><div class="payment-tabs"><button id="tab-all" data-qx-onclick="showMethods(\&#x27;all\&#x27;)"><span class="tabicon">♨</span>POPULAR</button><button id="tab-epay" data-qx-onclick="showMethods(\&#x27;epay\&#x27;)"><span class="tabicon">▣</span>E-PAY</button><button id="tab-crypto" data-qx-onclick="showMethods(\&#x27;crypto\&#x27;)"><span class="tabicon">⬡</span>CRYPTO</button></div><h3>Popular in your region (4)</h3><div id="methodList"></div>'}
// // // else if(type.startsWith('method:')){let m=type.slice(7);title='Deposit';body=depositDetailHTML(m)}
// // // else if(type==='login'||type==='register'||type==='forgot'){
// // // const reg=type==='register',forgot=type==='forgot';title=forgot?'Password recovery':reg?'Create an account':'Sign in';
// // // body='<div class="auth-logo"><svg aria-hidden="true" width="29" height="29" viewBox="0 0 36 36" style="vertical-align:middle;margin-right:8px"><rect width="36" height="36" rx="9" fill="#075f60"/><path d="M10 11h9l7 7-7 7h-9l7-7z" fill="#b2f3db"/><path d="M20 11h6l-7 7 7 7h-6l-7-7z" fill="#ffffff" opacity=".92"/></svg> Quotexx</div><p class="auth-intro">Independent trading practice platform · Not affiliated with Quotex</p>'+
// // // (forgot?'':'<div class="tabs auth-tabs"><button type="button" class="'+(!reg?'active':'')+'" data-qx-onclick="openModal(\&#x27;login\&#x27;)">Login</button><button type="button" class="'+(reg?'active':'')+'" data-qx-onclick="openModal(\&#x27;register\&#x27;)">Registration</button></div>')+
// // // '<form data-qx-onsubmit="event.preventDefault();alert(\&#x27;Preview only — account authentication needs a secure backend. No credentials have been submitted.\&#x27;)">'+
// // // (reg?'<label class="field">Country / region<select required><option value="">Select country</option><option>India</option><option>United Kingdom</option><option>United Arab Emirates</option><option>Other</option></select></label><label class="field">Account currency<select required><option>USD</option><option>INR</option><option>EUR</option></select></label>':'')+
// // // '<label class="field">Email<input type="email" autocomplete="off" placeholder="Enter your email" required></label>'+
// // // (forgot?'': '<label class="field">Password<input type="password" autocomplete="off" placeholder="'+(reg?'Create a password':'Enter your password')+'" minlength="8" required></label>')+
// // // (reg?'<label class="field">Promo code (optional)<input type="text" placeholder="Promo code"></label><p class="auth-legal"><label><input type="checkbox" required> I am at least 18 years old and accept the terms of this practice platform.</label></p>':forgot?'':'<div class="auth-row"><label class="auth-legal"><input type="checkbox"> Remember me</label><button type="button" class="auth-link" data-qx-onclick="openModal(\&#x27;forgot\&#x27;)">Forgot password?</button></div>')+
// // // '<button class="wide" type="submit">'+(forgot?'Continue':reg?'Registration':'Sign in')+'</button></form>'+
// // // '<div class="auth-disclosure">Quotexx is an independent interface preview, not Quotex. No account is created or accessed here. Do not enter real Quotex passwords.</div>'+
// // // (forgot?'<p style="text-align:center"><button class="auth-link" data-qx-onclick="openModal(\&#x27;login\&#x27;)">← Back to login</button></p>':'');
// // // }

// // // else if(type==='logout'){gateLogout();return}
// // // else if(type==='settings'){body='<label class="field">Language<select><option>English</option><option>Hindi</option></select></label><label class="field">Timezone<select><option>UTC+05:30</option><option>UTC+00:00</option></select></label><h3>TEMPLATE</h3>'+['Light Mode','Twilight','Full Night'].map(x=>'<button class="menubtn" data-qx-onclick="alert(\&#x27;Theme preview: &#x27;+x+&#x27;\&#x27;)">'+x+'</button>').join('')}
// // // else if(type==='profile'||type==='account'){title='Personal data';body=`<div class="qx-profile"><div class="qx-profile-head"><div class="qx-avatar">👤<span>📷</span></div><div class="qx-profile-identity"><strong id="qxProfileEmail">Account email</strong><div>ID: <span id="qxProfileId">—</span></div><b class="qx-unverified">✖ Not verified</b></div></div><form id="qxProfileForm" data-qx-onsubmit="53"><label class="qx-profile-field"><span>Nickname</span><input name="nickname" placeholder="Empty" autocomplete="nickname"></label><label class="qx-profile-field"><span>First Name</span><input name="firstName" placeholder="Empty" autocomplete="given-name"></label><label class="qx-profile-field"><span>Last Name</span><input name="lastName" placeholder="Empty" autocomplete="family-name"></label><label class="qx-profile-field"><span>Date of birth</span><input name="dob" type="date"></label><label class="qx-profile-field"><span>Email</span><input id="qxProfileEmailField" name="email" type="email" required autocomplete="email" placeholder="Enter email"></label><label class="qx-profile-field"><span>Country</span><select name="country"><option>India</option><option>United Kingdom</option><option>United Arab Emirates</option><option>Other</option></select></label><button class="qx-profile-save" type="submit">Save</button><p id="qxProfileStatus" role="status"></p></form></div>`;setTimeout(fillQxProfile,0)}
// // // else if(type==='help'){body=menuButtons(['FAQ','Tutorials','Support'])}
// // // else if(type==='payments'){body='<p class="note">Payment history requires a connected account and backend.</p>'}
// // // else if(type==='trades'){body='<p class="note">Your virtual trades are shown in the trading panel.</p>'+trades.map(t=>'<p>'+t.asset+' · '+t.direction+' · '+t.status+'</p>').join('')}
// // // else{body='<p class="note">This is a preview of the '+title+' section. Live services are not connected.</p>'}
// // // if(type==='account'||type==='profile')body+='<button class="wide" data-qx-onclick="50">Log out</button>';
// // // $('modalTitle').textContent=title;$('modalBody').innerHTML=body;document.querySelector('.modal').classList.toggle('auth-modal',['login','register','forgot'].includes(type));if(type==='deposit')showMethods('all');if(type.startsWith('method:'))initDepositDetail(type.slice(7))}

// // // // Public daily reference rate; never assume an outdated rate is a payable quote.
// // // let depositFxRate=null,depositFxUpdated='',depositFxLoading=false;
// // // const fiatDepositMethods=['PhonePe','UPI','PayTM','UPI Intent'];
// // // function depositDetailHTML(method){
// // //  return `<div class="deposit-detail"><div class="deposit-provider"><strong>${method}</strong></div>
// // //  <label class="field">Deposit amount (INR)<input id="depositInr" type="number" min="100" step="0.01" value="100" data-qx-oninput="55"></label>
// // //  <div class="deposit-rate"><div class="deposit-conversion"><span>Current 1 USDT</span><strong id="depositRateText">Loading…</strong></div>
// // //  <div class="deposit-conversion"><span>Estimated USDT credit</span><strong id="depositReceive">Loading…</strong></div><small id="depositRateDate">Fetching current USDT/INR rate…</small></div>
// // //  <button class="deposit-continue" id="depositProceed" data-qx-onclick="51">Continue to payment</button>
// // //  <p class="deposit-note">Minimum ₹100. USDT amount is locked at payment request creation; LIVE balance credits only after a verified successful callback. DEMO balance is separate.</p></div>`;
// // // }
// // // let qxUSDTINR=0;
// // // function refreshDepositConversion(){
// // //  const n=Number(document.getElementById('depositInr')?.value);
// // //  const valid=Number.isFinite(n)&&n>=100&&n<=100000;
// // //  const r=document.getElementById('depositRateText'),c=document.getElementById('depositReceive'),btn=document.getElementById('depositProceed');
// // //  if(r)r.textContent=qxUSDTINR?'₹'+qxUSDTINR.toFixed(4):'Rate unavailable';
// // //  if(c)c.textContent=valid&&qxUSDTINR?(n/qxUSDTINR).toFixed(6)+' USDT':'—';
// // //  if(btn)btn.disabled=!valid||!qxUSDTINR;
// // // }
// // // async function initDepositDetail(method){
// // //  qxUSDTINR=0;refreshDepositConversion();
// // //  const dateEl=document.getElementById('depositRateDate');
// // //  try{const response=await fetch('/api/payments/rate',{cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error||'Rate unavailable');qxUSDTINR=Number(data.rateINR);if(dateEl)dateEl.textContent='Rate updated: '+new Date(data.asOf).toLocaleString();}
// // //  catch(e){if(dateEl)dateEl.textContent='Rate unavailable. Please retry.'}
// // //  refreshDepositConversion();
// // // }
// // // function showMethods(cat){
// // //  const indices=cat==='crypto'?[3]:cat==='epay'?[0,1,2]:[0,1,2,3];
// // //  const logos=[['₹','phonepe'],['₹','upi'],['₹','paytm'],['₮','usdt']];
// // //  $('methodList').innerHTML=indices.map(i=>'<button class="method payment-3d" data-index="'+i+'"><span class="paylogo '+logos[i][1]+'">'+logos[i][0]+'</span><span class="payname">'+paymentMethods[i]+'<small>Min. ₹100</small></span><span class="paychevron">›</span></button>').join('');
// // //  ['all','epay','crypto'].forEach(x=>{let el=$('tab-'+x);if(el)el.classList.toggle('active',x===cat)});
// // //  document.querySelectorAll('[data-index]').forEach(b=>b.onclick=()=>openModal('method:'+paymentMethods[Number(b.dataset.index)]));
// // // }
// // // function toggleMore(force){let p=$('morepanel'),v=$('moreview');let show=force===undefined?!p.classList.contains('show'):force;p.classList.toggle('show',show);if(!show)v.classList.remove('show')}
// // // function backMore(){$('moreview').classList.remove('show');$('morepanel').classList.add('show')}
// // // function morePage(type){$('morepanel').classList.remove('show');$('moreview').classList.add('show');$('moretitle').textContent=({analytics:'Analytics',top:'TOP',signals:'Signals',market:'Market'})[type];let content='';if(type==='analytics'){let done=trades.filter(t=>t.status!=='Open'),wins=done.filter(t=>t.status==='Won').length,losses=done.filter(t=>t.status==='Lost').length;content='<div class="dataitem">Total trades: <b>'+trades.length+'</b></div><div class="dataitem">Completed: <b>'+done.length+'</b></div><div class="dataitem">Winning trades: <b>'+wins+'</b></div><div class="dataitem">Losing trades: <b>'+losses+'</b></div><div class="dataitem">Win rate: <b>'+(done.length?(wins/done.length*100).toFixed(1):'0')+'%</b></div><p class="muted small">Calculated from trades placed in this browser session, using simulated prices.</p>'}else if(type==='top'){content='<div class="dataitem">Trader leaderboard is not connected.</div><p class="muted small">Verified trader rankings require an authorized backend data source. No invented trader names or profits are displayed.</p>'}else if(type==='signals'){let c=candles.slice(-8),up=c.filter(b=>b.c>b.o).length,down=c.filter(b=>b.c<b.o).length;content='<div class="dataitem">'+asset+'<br><b>Recent candle direction: '+(up>down?'Upward':down>up?'Downward':'Mixed')+'</b><br>Green candles: '+up+' · Red candles: '+down+'</div><p class="muted small">Indicator calculated from locally simulated candles, not a verified market signal or trading recommendation.</p>'}else{content='<div class="dataitem">Selected asset: <b>'+asset+'</b><br>Chart price: <b>'+pricefmt(prices[asset])+'</b></div><div class="dataitem">Assets: '+Object.keys(prices).join(', ')+'</div><p class="muted small">Displayed quotes are simulated. Live exchange data requires a licensed or authorized market-data API; Quotex-specific payouts and account data cannot be inferred from public prices.</p>'}$('morecontent').innerHTML=content}
// // // function closeModal(){$('overlay').classList.remove('visible')}document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});window.addEventListener('resize',draw);
// // // /* Backend-powered bootstrap is installed below; local random-price loop disabled. */

// // // // Forex reference feed plus explicitly simulated values for unsupported pairs and payouts.
// // // const pairCatalog=[
// // // ['GBP/NZD (OTC)','Currencies','🇬🇧🇳🇿',null,null],['USD/INR (OTC)','Currencies','🇺🇸🇮🇳',null,null],['CAD/CHF (OTC)','Currencies','🇨🇦🇨🇭',null,null],['USD/MXN (OTC)','Currencies','🇺🇸🇲🇽',null,null],['USD/NGN (OTC)','Currencies','🇺🇸🇳🇬',null,null],['USD/BDT (OTC)','Currencies','🇺🇸🇧🇩',null,null],
// // // ['EUR/GBP','Currencies','🇪🇺🇬🇧','EUR','GBP'],['GBP/USD','Currencies','🇬🇧🇺🇸','GBP','USD'],['USD/INR','Currencies','🇺🇸🇮🇳','USD','INR'],['EUR/USD','Currencies','🇪🇺🇺🇸','EUR','USD'],['USD/JPY','Currencies','🇺🇸🇯🇵','USD','JPY'],['USD/BRL (OTC)','Currencies','🇺🇸🇧🇷',null,null],['USD/ZAR (OTC)','Currencies','🇺🇸🇿🇦',null,null],
// // // ['BTC/USD','Crypto','₿','BTC','USD'],['ETH/USD','Crypto','Ξ','ETH','USD'],['BNB/USD','Crypto','◆',null,null],['Gold','Commodities','🥇',null,null],['Silver','Commodities','🥈',null,null],['Oil','Commodities','🛢️',null,null],['Apple','Stocks','●',null,null],['Tesla','Stocks','⚡',null,null],['NVIDIA','Stocks','◈',null,null]];
// // // let pairCategory='Currencies',pairFavOnly=false,pairFavorites=new Set(),pairLive={},pairLastFetch=0,pairLoading=false;
// // // // Demonstration values for every listed asset; not broker quotes or real payouts.
// // // const pairDemo={};pairCatalog.forEach((p,i)=>{pairDemo[p[0]]={change:((i*37%91)-45)/100,p1:73+(i*7%22),p5:76+(i*11%19)}});
// // // setInterval(()=>{pairCatalog.forEach(p=>{const d=pairDemo[p[0]];d.change=Math.max(-6,Math.min(6,d.change+(Math.random()-.5)*.15));d.p1=Math.max(65,Math.min(95,d.p1+(Math.random()>.72?(Math.random()>.5?1:-1):0)));d.p5=Math.max(65,Math.min(95,d.p5+(Math.random()>.8?(Math.random()>.5?1:-1):0)))});if(document.getElementById('pairOverlay').classList.contains('open'))renderPairs()},4500);
// // // function openPairs(){document.getElementById('pairOverlay').classList.add('open');renderPairs();fetchPairRates()}
// // // function closePairs(){document.getElementById('pairOverlay').classList.remove('open')}
// // // function selectPairCategory(c){pairCategory=c;pairFavOnly=false;renderPairs()}
// // // function togglePairFavorite(name){if(pairFavorites.has(name))pairFavorites.delete(name);else pairFavorites.add(name);renderPairs()}
// // // function renderPairs(){
// // // const tabs=document.getElementById('pairTabs');if(!tabs)return;
// // // tabs.innerHTML=['Currencies','Crypto','Commodities','Stocks'].map(c=>`<button class="${c===pairCategory?'selected':''}" data-qx-onclick="selectPairCategory(&#x27;${c}&#x27;)">${c.toUpperCase()}</button>`).join('');
// // // document.getElementById('pairFavCount').textContent=pairFavorites.size;
// // // const q=document.getElementById('pairSearch').value.toLowerCase();
// // // const items=pairCatalog.filter(x=>x[1]===pairCategory&&x[0].toLowerCase().includes(q)&&(!pairFavOnly||pairFavorites.has(x[0])));
// // // document.getElementById('pairRows').innerHTML=items.map(x=>{
// // // const name=x[0],data=pairLive[name],demo=pairDemo[name],chg=Number.isFinite(data?.change)?data.change:demo.change;
// // // const change=Number.isFinite(chg)?`<span class="${chg>=0?'pair-up':'pair-down'}">${chg>=0?'↑':'↓'} ${Math.abs(chg).toFixed(2)}%</span>`:'<span class="pair-unavailable">—</span>';
// // // return `<tr><td><button class="pair-star ${pairFavorites.has(name)?'on':''}" data-qx-onclick="event.stopPropagation();togglePairFavorite(&#x27;${name}&#x27;)">${pairFavorites.has(name)?'★':'☆'}</button><span data-qx-onclick="choosePair(&#x27;${name}&#x27;)" class="pair-name">${x[2]} ${name}</span></td><td data-qx-onclick="choosePair(&#x27;${name}&#x27;)">${change}</td><td data-qx-onclick="choosePair(&#x27;${name}&#x27;)" style="color:#ffae42;font-weight:700">${demo.p1}%</td><td data-qx-onclick="choosePair(&#x27;${name}&#x27;)" style="color:#ffae42;font-weight:700">${demo.p5}%</td></tr>`}).join('')||'<tr><td colspan="4" style="text-align:center;color:#aab">No matching pairs</td></tr>';
// // // }
// // // function choosePair(name){
// // // const pair=pairCatalog.find(p=>p[0]===name);if(!pair)return;
// // // // Every pair can be selected for virtual chart practice. Unsupported feeds use simulation.
// // // if(!Object.prototype.hasOwnProperty.call(prices,name)){
// // //  const seed=pairLive[name]?.rate||({'Gold':2650,'Silver':31,'Oil':72,'Apple':220,'Tesla':250,'NVIDIA':135,'BNB/USD':590}[name])||1.32;
// // //  prices[name]=seed;steps[name]=Math.max(seed*.0001,.000001);
// // // }
// // // asset=name;document.getElementById('sideasset').textContent=name+' · '+pairDemo[name].p1+'% (simulated)';
// // // const sel=document.getElementById('asset');if(sel){if(![...sel.options].some(o=>o.value===name))sel.add(new Option(name,name));sel.value=name}
// // // init();closePairs();
// // // }
// // // async function fetchPairRates(){
// // // if(pairLoading||Date.now()-pairLastFetch<60000)return;pairLoading=true;
// // // const status=document.getElementById('pairFeedStatus');status.textContent='SIMULATION: Demo percentages for every pair. Fetching forex reference rates where available…';
// // // try{
// // //  const bases=['USD','GBP','EUR'];const now=new Date(),prev=new Date(now);prev.setDate(now.getDate()-5);const start=prev.toISOString().slice(0,10);
// // //  const out=await Promise.all(bases.map(async base=>{const r=await fetch('https://api.frankfurter.dev/v1/'+start+'..?base='+base+'&symbols=USD,GBP,EUR,INR,JPY',{cache:'no-store'});if(!r.ok)throw Error('Feed unavailable');return [base,await r.json()]}));
// // //  for(const [base,series] of out){const days=Object.keys(series.rates||{}).sort();if(days.length<2)continue;const a=series.rates[days[0]],b=series.rates[days[days.length-1]];
// // //  for(const pair of pairCatalog){if(pair[3]!==base||!pair[4]||pair[4]===base)continue;const cur=pair[4],last=b[cur],first=a[cur];if(last&&first)pairLive[pair[0]]={rate:last,change:(last/first-1)*100}}}
// // //  pairLastFetch=Date.now();status.textContent='SIMULATION: All profit percentages and unsupported asset changes are generated demo values, updating every few seconds. Available forex changes use Frankfurter reference data (not tick-by-tick).';
// // // }catch(e){status.textContent='SIMULATION: Demo percentages and changes are shown for all assets. Live forex feed unavailable.'}finally{pairLoading=false;renderPairs()}
// // // }
// // // // Open the selector from existing asset dropdown, including on mobile.
// // // const pairSelect=document.getElementById('asset');if(pairSelect){pairSelect.addEventListener('pointerdown',e=>{e.preventDefault();openPairs()});pairSelect.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPairs()}})}
// // // document.getElementById('pairOverlay').addEventListener('click',e=>{if(e.target.id==='pairOverlay')closePairs()});

// // // // Local-only prototype: account records stay in this browser; no real OAuth or secure server session.
// // // let gateMode='login';const gateKey='tradevista_local_users_v1',gateSession='tradevista_local_session_v1';
// // // function gateTab(mode){gateMode=mode;const reg=mode==='register';document.getElementById('gateHeading').textContent=reg?'Sign Up':'Sign In To Your Account';document.getElementById('gateRegisterFields').classList.toggle('gatehidden',!reg);document.getElementById('gateRegExtra').classList.toggle('gatehidden',!reg);document.getElementById('gateLoginExtra').classList.toggle('gatehidden',reg);document.getElementById('gateLoginTab').classList.toggle('active',!reg);document.getElementById('gateRegTab').classList.toggle('active',reg);document.getElementById('gateTopLogin').classList.toggle('on',!reg);document.getElementById('gateTopReg').classList.toggle('on',reg);document.getElementById('gateSubmit').textContent=reg?'Registration →':'Sign in →';document.getElementById('gateCountry').required=reg;document.getElementById('gatePassword').minLength=reg?10:1;document.getElementById('gateMessage').textContent=''}
// // // async function gateDigest(value){const bytes=new TextEncoder().encode(value);const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('')}
// // // async function submitGate(e){e.preventDefault();const msg=document.getElementById('gateMessage'),email=document.getElementById('gateEmail').value.trim().toLowerCase(),pass=document.getElementById('gatePassword').value;msg.textContent='';if(!window.crypto?.subtle){msg.textContent='Secure browser context is required for this local prototype. Open through localhost or HTTPS.';return}let users;try{users=JSON.parse(localStorage.getItem(gateKey)||'{}')}catch{users={}}if(gateMode==='register'){if(!document.getElementById('gateCountry').value){msg.textContent='Select your country.';return}if(!document.getElementById('gateAdult').checked||!document.getElementById('gateTax').checked){msg.textContent='Please review and confirm both declarations.';return}if(users[email]){msg.textContent='Account already exists. Please log in.';return}const salt=Array.from(crypto.getRandomValues(new Uint8Array(16))).map(x=>x.toString(16).padStart(2,'0')).join('');users[email]={salt,hash:await gateDigest(salt+pass),country:document.getElementById('gateCountry').value,currency:document.getElementById('gateCurrency').value,created:new Date().toISOString()};try{localStorage.setItem(gateKey,JSON.stringify(users))}catch{msg.textContent='Browser storage is unavailable.';return}}else{if(!users[email]||users[email].hash!==await gateDigest(users[email].salt+pass)){msg.textContent='Incorrect email or password.';return}}try{(gateMode==='register'||document.getElementById('gateRemember').checked?localStorage:sessionStorage).setItem(gateSession,email)}catch{}document.getElementById('authGate').hidden=true;document.getElementById('gatePassword').value='';}
// // // function gateGoogle(){document.getElementById('gateMessage').textContent='Google sign-in requires your Google OAuth Client ID, authorized domain, and secure backend. It is not active in this standalone HTML.'}
// // // function gateHelp(){document.getElementById('gateMessage').textContent='Password recovery needs a verified email service and backend. This local prototype cannot reset passwords securely.'}
// // // function gateLogout(){localStorage.removeItem(gateSession);sessionStorage.removeItem(gateSession);document.getElementById('authGate').hidden=false;gateTab('login');closeModal()}
// // // gateTab('login');document.getElementById('authGate').hidden=false;

// // // ;

// // // function updateQxProfileBadge(){const badge=document.querySelector('.qx-profile-identity .qx-unverified, .qx-profile-identity .qx-complete');if(!badge)return;let data={};try{data=JSON.parse(localStorage.getItem('qx_profile_fields')||'{}')}catch(e){}const complete=['nickname','firstName','lastName','dob','email','country'].every(k=>String(data[k]||'').trim());badge.className=complete?'qx-complete':'qx-unverified';badge.textContent=complete?'✓ Profile Complete':'✖ Not verified'}
// // // function fillQxProfile() {
// // //   const f = document.getElementById('qxProfileForm');
// // //   if (!f) return;

// // //   const user = window.qxCurrentUser || {};

// // //   let saved = {};
// // //   try {
// // //     saved = JSON.parse(
// // //       localStorage.getItem('qx_profile_fields') || '{}'
// // //     );
// // //   } catch (e) {}

// // //   for (const key of [
// // //     'nickname',
// // //     'firstName',
// // //     'lastName',
// // //     'dob',
// // //     'country'
// // //   ]) {
// // //     if (f.elements[key]) {
// // //       f.elements[key].value =
// // //         saved[key] || user[key] || '';
// // //     }
// // //   }

// // //   const email = user.email || '';

// // //   document.getElementById('qxProfileEmail').textContent =
// // //     email || 'Account email';

// // //   document.getElementById('qxProfileEmailField').value =
// // //     email;

// // //   document.getElementById('qxProfileId').textContent =
// // //     user.id || user._id || '—';

// // //   updateQxProfileBadge();
// // // }



// // // function saveQxProfile(e) {
// // //   e.preventDefault();

// // //   const f = e.currentTarget;
// // //   const user = window.qxCurrentUser || {};

// // //   const data = {};

// // //   for (const key of [
// // //     'nickname',
// // //     'firstName',
// // //     'lastName',
// // //     'dob',
// // //     'country'
// // //   ]) {
// // //     data[key] = f.elements[key]?.value || '';
// // //   }

// // //   data.email = user.email || '';

// // //   localStorage.setItem(
// // //     'qx_profile_fields',
// // //     JSON.stringify(data)
// // //   );

// // //   document.getElementById('qxProfileEmail').textContent =
// // //     data.email || 'Account email';

// // //   document.getElementById('qxProfileStatus').textContent =
// // //     'Profile saved in this browser.';

// // //   updateQxProfileBadge();
// // //   updateAccountMenu();
// // // }

// // // (function(){
// // // const page=document.getElementById('qxTournamentPage'),content=document.getElementById('qxTournamentContent');let tab='active';
// // // const items=[{name:'Free Friday',prize:'1000 $',fee:'0 $',duration:'1 day',active:true},{name:'Weekend Battle',prize:'5000 $',fee:'1 $',duration:'2 days',active:false},{name:'Trading Masters',prize:'2500 $',fee:'2 $',duration:'1 day',active:false},{name:'Champion League',prize:'10000 $',fee:'5 $',duration:'3 days',active:false}];
// // // function cards(){return items.map((x,i)=>`<article class="qt-card"><div class="qt-art ${i%2?'green':''}"><span class="qt-cup">🏆</span><span class="qt-tag">${x.active?'ACTIVE NOW':'◷ UNTIL START: 09:20:41'}</span><div class="qt-name">${x.name}</div><div class="qt-prize"><small>PRIZE POOL</small><b>${x.prize}</b></div></div><div class="qt-stats"><div><b>${x.fee}</b><small>Entry fee</small></div><div><b>${x.duration}</b><small>Duration</small></div></div><button class="qt-detail" data-tournament="${i}">Details ⓘ</button></article>`).join('')}
// // // function render(){content.innerHTML=`<div class="qt-tabs"><button data-tab="active" class="${tab==='active'?'active':''}">ACTIVE <span class="qt-count">4</span></button><button data-tab="completed" class="${tab==='completed'?'active':''}">COMPLETED</button></div>${tab==='active'?'<div class="qt-heading">Available for participation (4)</div>'+cards():'<div class="qt-empty">No completed tournaments yet.</div>'}`;}
// // // function show(){page.classList.add('open');render();document.querySelectorAll('.mobile-nav button').forEach(b=>b.classList.toggle('active',b.textContent.includes('Tournaments')))}
// // // function hide(){page.classList.remove('open')}
// // // content.addEventListener('click',e=>{let t=e.target.closest('[data-tab]');if(t){tab=t.dataset.tab;render();return}let d=e.target.closest('[data-tournament]');if(d){const x=items[+d.dataset.tournament];content.innerHTML=`<button class="qt-back" id="qtReturn">← Tournaments</button><div class="qt-info"><h2>${x.name}</h2><p>Prize pool: ${x.prize}</p><p>Entry fee: ${x.fee}</p><p>Duration: ${x.duration}</p><p>${x.active?'Active now':'Upcoming tournament'}</p><p>Tournament details preview. Participation requires a connected tournament backend.</p></div>`;return}if(e.target.id==='qtReturn')render()});
// // // document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const action=b.getAttribute('onclick')||'';if(action.includes("openModal('tournaments')")){e.preventDefault();e.stopImmediatePropagation();show()}else if(page.classList.contains('open')&&(b.closest('.mobile-nav')||b.closest('.nav'))){hide()}},true);
// // // window.openTournamentPage=show;
// // // })();

// // // ;

// // // /* Quotexx API bridge. No external frontend framework required. */
// // // (function(){
// // // 'use strict';
// // // const API_BASE='/api';
// // // const TOKEN_KEY='qx_token';
// // // let account=null, overview=null, backendTrades=[], loadingChart=false, loadingOverview=false;
// // // let latestServerTime=0, latestCandleEnd=0, lastServerReceived=0;
// // // let activeSymbol='GBP/USD';
// // // let ready=false, requestBusy=false;
// // // const supported=new Set(['EUR/USD','GBP/USD','BTC/USD']);
// // // function token(){return sessionStorage.getItem(TOKEN_KEY)||localStorage.getItem(TOKEN_KEY)||''}
// // // async function request(path,method='GET',body){
// // //  const headers={'Accept':'application/json'};
// // //  if(body!==undefined)headers['Content-Type']='application/json';
// // //  if(token())headers.Authorization='Bearer '+token();
// // //  const res=await fetch(API_BASE+path,{method,headers,cache:'no-store',...(body!==undefined?{body:JSON.stringify(body)}:{})});
// // //  const data=await res.json().catch(()=>({}));
// // //  if(!res.ok){if(res.status===401&&path!=='/auth/login'&&path!=='/auth/register'){sessionStorage.removeItem(TOKEN_KEY);localStorage.removeItem(TOKEN_KEY);document.getElementById('authGate').hidden=false;ready=false}throw Error(data.error||data.message||(`API ${res.status}: ${path}. Check Node backend and /api proxy.`))}
// // //  return data;
// // // }
// // // function notify(message){document.getElementById('qxNoticeText').textContent=String(message);const box=document.getElementById('qxNotice');box.classList.add('show');}
// // // function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
// // // function money(n){return '$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
// // // function getLiveBalance(u) {
// // //   return Number(u?.balance ?? 0);
// // // }

// // // function getDemoBalance(u) {
// // //   return Number(u?.demoBalance ?? 10000);
// // // }
// // // function syncAccount() {
// // //   if (!account) return;

// // //   window.qxCurrentUser = account;

// // //   // Always take both balances from backend
// // //   qxLiveBalance = getLiveBalance(account);
// // //   qxDemoBalance = getDemoBalance(account);

// // //   // Show only selected account balance
// // //   balance = qxMode === 'demo'
// // //     ? qxDemoBalance
// // //     : qxLiveBalance;

// // //   document.getElementById('balance').textContent =
// // //     money(balance);

// // //   document.getElementById('qxMenuEmail').textContent =
// // //     account.email || 'Account email';

// // //   document.getElementById('qxMenuId').textContent =
// // //     account.id || account._id || '—';

// // //   updateAccountMenu();
// // // }
// // // let qxSeenStatuses=new Map(),qxSeenInitialized=false;
// // // function qxWinToast(profit,symbol){
// // //  const el=document.createElement('div');el.className='qx-win-toast';el.setAttribute('role','status');
// // //  el.innerHTML='<div class="qx-win-icon">✓</div><div><strong>Trade successful!</strong><div>'+esc(symbol||'Trade')+' · Profit <b>+'+money(profit)+'</b></div></div>';
// // //  document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));
// // //  setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),400)},3500);
// // // }
// // // function qxCheckTradeWins(rows){
// // //  const next=new Map();for(const t of rows){const id=String(t.id||t._id||'');if(!id)continue;
// // //  const status=String(t.status||'').toLowerCase(),old=qxSeenStatuses.get(id);
// // //  if(qxSeenInitialized&&old&&['open','pending','active'].includes(old)&&['won','win','success','settled'].includes(status)&&Number(t.profitUSD)>0)qxWinToast(Number(t.profitUSD),t.symbol);
// // //  next.set(id,status)}qxSeenStatuses=next;qxSeenInitialized=true;
// // // }
// // // async function loadOverview(){
// // //  if(!ready||loadingOverview)return;
// // //  loadingOverview=true;
// // //  try{const data=await request('/me/overview');overview=data;account=data.user||account;backendTrades=Array.isArray(data.trades)?data.trades:[];window.qxBackendTrades=backendTrades;qxCheckTradeWins(backendTrades);syncAccount();renderBackendTrades();qxCheckApprovedWithdrawal();}
// // //  catch(e){console.warn('Overview:',e.message)}finally{loadingOverview=false}
// // // }
// // // function renderBackendTrades(){
// // //  const rows=qxMode==='demo'?trades:backendTrades;
// // //  const box=document.getElementById('trades');
// // //  document.getElementById('tradecount').textContent=rows.length;
// // //  box.className=rows.length?'qx-backend-trades':'empty';
// // //  if(!rows.length){box.textContent='No trades yet.';return}
// // //  if(qxMode==='demo'){
// // //   box.innerHTML=rows.slice(-25).reverse().map(t=>`<div class="tradeitem">${esc(t.asset)} · ${esc(t.direction)} · ${money(t.amount)} · ${esc(t.status)}</div>`).join('');return;
// // //  }
// // //  box.innerHTML=rows.slice(0,40).map(t=>{
// // //   const id=String(t.id||t._id||'');const status=String(t.status||'pending');
// // //   const open=['open','pending','active'].includes(status.toLowerCase());
// // //   return `<div class="tradeitem"><b>${esc(t.symbol)}</b> · ${esc(t.direction)} · ${money(t.amountUSD)}<div>${esc(status)} · P/L: ${money(t.profitUSD)}</div>${open?`<div class="qx-expiry" data-expires="${esc(t.expiresAt||'')}">Expires: ${esc(t.expiresAt?new Date(t.expiresAt).toLocaleTimeString():'—')}</div>`:''}</div>`
// // //  }).join('');
// // // }
// // // async function loadChart(){
// // //  if(!ready||loadingChart)return;
// // //  if(!supported.has(asset)){
// // //   notify('This symbol has no server trading feed. Select EUR/USD, GBP/USD or BTC/USD.');
// // //   return;
// // //  }
// // //  loadingChart=true;
// // //  const symbol=asset;
// // //  try{
// // //   const chartPath='/trading/chart';
// // //   const data=await request(chartPath+'?symbol='+encodeURIComponent(symbol)+'&offsetMinutes='+Math.max(0,Math.floor(qxHistoryOffset)));
// // //   if(asset!==symbol)return;
// // //   if(!Array.isArray(data.candles))throw Error('Invalid candle data from server');
// // //   // One unique OHLC candle for each exact 60-second UTC bucket. Never append
// // //   // candles on 3-second quote polls: only update the current minute's OHLC.
// // //   const minuteBars=new Map();
// // //   for(const raw of data.candles){
// // //    const time=Math.floor(Number(raw.time)/60000)*60000;
// // //    const o=Number(raw.open),h=Number(raw.high),l=Number(raw.low),c=Number(raw.close);
// // //    if(!Number.isFinite(time)||![o,h,l,c].every(Number.isFinite))continue;
// // //    minuteBars.set(time,{time,o,h:Math.max(h,o,c),l:Math.min(l,o,c),c});
// // //   }
// // //   const serverCandles=[...minuteBars.values()].sort((a,b)=>a.time-b.time);
// // //   // A valid chart has exactly one timestamp per minute; repeated fetches
// // //   // replace OHLC values in place rather than adding another candle.
// // //   if(serverCandles.length){candles=serverCandles;window.qxChartFeed='server';const feed=document.querySelector('.toolbar small');if(feed)feed.textContent='● SIMULATED random chart · not real market data';}
// // //   else{window.qxChartFeed='unavailable';const feed=document.querySelector('.toolbar small');if(feed)feed.textContent='● Server quotes unavailable · chart paused';}
// // //   const v=Number(data.currentPrice);
// // //   if(qxHistoryOffset===0&&data.currentPrice!==null&&data.currentPrice!==undefined&&Number.isFinite(v)&&v>0)prices[symbol]=v;
// // //   latestServerTime=Number(data.serverTime)||Date.now();
// // //   latestCandleEnd=Number(data.nextCandleAt)||0;
// // //   lastServerReceived=Date.now();
// // //   draw();
// // //  }catch(e){console.warn('Chart:',e.message);window.qxChartFeed='unavailable';const feed=document.querySelector('.toolbar small');if(feed)feed.textContent='● Server connection lost · chart paused';}finally{loadingChart=false}
// // // }
// // // function updateFallbackCandle(){ /* Offline: keep last verified simulation candle frozen. */ }
// // // window.qxLoadChart=loadChart;
// // // // Preserve the original chart drawing, but use backend candle timing instead of the local timer.
// // // const originalDraw=draw;
// // // draw=function(){
// // //  if(!candles.length)return;
// // //  originalDraw();
// // //  // Countdown drawn at same line as original HTML, synchronized with server.
// // //  const canvas=document.getElementById('chart'),ctx=canvas.getContext('2d');
// // //  const d=window.devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;
// // //  if(w<30||h<30||!supported.has(asset)||qxHistoryOffset>0||chartPan>0)return;
// // //  const right=window.innerWidth<=760?65:72,left=10,ww=w-left-right;
// // //  const endX=left+ww*(.83+.10*((Date.now()%60000)/60000));
// // //  const current=prices[asset];
// // //  const count=Math.max(5,Math.min(candles.length,Math.round((window.innerWidth<=760?20:27)/zoom)));
// // //  const view=candles.slice(Math.max(0,candles.length-count-Math.floor(chartPan)),candles.length-Math.floor(chartPan));
// // //  if(!view.length)return;
// // //  const {lo,hi}=qxChartRange(view,chartPan>0||qxHistoryOffset>0?NaN:current,false);
// // //  const range=qxViewport&&chartPan===0&&qxViewport.asset===asset?qxViewport:{lo,hi};
// // //  const yy=16+(range.hi-current)/(range.hi-range.lo)*(h-50);
// // //  const serverNow=latestServerTime+(Date.now()-lastServerReceived);
// // //  const target=latestCandleEnd>serverNow?latestCandleEnd:Math.floor(serverNow/60000)*60000+60000;
// // //  const seconds=Math.max(1,Math.ceil((target-serverNow)/1000));
// // //  const label=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
// // //  ctx.save();ctx.setTransform(d,0,0,d,0,0);
// // //  ctx.fillStyle='#586176';ctx.fillRect(endX-24,yy-13,48,26);
// // //  ctx.fillStyle='#fff';ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,endX,yy);ctx.restore();
// // // };
// // // async function signIn(e){
// // //  e.preventDefault();e.stopImmediatePropagation();if(requestBusy)return;
// // //  const msg=document.getElementById('gateMessage');msg.textContent='';
// // //  const mode=gateMode==='register'?'register':'login';
// // //  const email=document.getElementById('gateEmail').value.trim().toLowerCase();
// // //  const password=document.getElementById('gatePassword').value;
// // //  if(!email||!email.includes('@')){msg.textContent='Enter a valid email address.';return}
// // //  if(!password){msg.textContent='Enter your password.';return}
// // //  if(mode==='register'&&!document.getElementById('gateCountry').value){msg.textContent='Select your country.';return}
// // //  if(mode==='register'&&password.length<10){msg.textContent='Password must be at least 10 characters.';return}
// // //  if(mode==='register'&&!document.getElementById('gateAdult').checked){msg.textContent='Please confirm age and terms.';return}
// // //  requestBusy=true;document.getElementById('gateSubmit').disabled=true;
// // //  try{
// // //   const body={email,password};
// // //   if(mode==='register'){body.country=document.getElementById('gateCountry').value||'India';body.name=email.split('@')[0]}
// // //   const result=await request('/auth/'+mode,'POST',body);
// // //   if(!result.token)throw Error('Login response did not include token');
// // //   localStorage.setItem(TOKEN_KEY,result.token);
// // //   sessionStorage.removeItem(TOKEN_KEY);
// // //   account=result.user;
// // //   ready=true;
// // //   document.getElementById('authGate').hidden=true;
// // //   qxMode='live';activeSymbol=asset;
// // //   syncAccount();await Promise.all([loadOverview(),loadChart()]);
// // //  }catch(err){msg.textContent=err.message}
// // //  finally{requestBusy=false;document.getElementById('gateSubmit').disabled=false}
// // // }
// // // submitGate=signIn;
// // // document.getElementById('gateForm').addEventListener('submit',signIn,true);
// // // document.getElementById('gateForm').removeAttribute('onsubmit');
// // // for(const [id,mode] of [['gateTopLogin','login'],['gateLoginTab','login'],['gateTopReg','register'],['gateRegTab','register']]){
// // //  const btn=document.getElementById(id);
// // //  btn.removeAttribute('onclick');
// // //  btn.type='button';
// // //  btn.addEventListener('click',()=>gateTab(mode));
// // // }
// // // gateTab('login');
// // // gateGoogle=function(){document.getElementById('gateMessage').textContent='Google OAuth is not configured on this backend. Email login and registration are available.'};
// // // gateHelp=function(){document.getElementById('gateMessage').textContent='Password recovery requires a backend email-reset endpoint.'};
// // // gateLogout=function(){sessionStorage.removeItem(TOKEN_KEY);localStorage.removeItem(TOKEN_KEY);account=null;overview=null;backendTrades=[];window.qxBackendTrades=[];ready=false;document.getElementById('authGate').hidden=false;gateTab('login');closeModal()};
// // // place=async function(direction){
// // //  const amount=Number(document.getElementById('amount').value);
// // //  if(!Number.isFinite(amount)||amount<1||amount>1000||Math.round(amount*100)!==amount*100){notify('Investment must be $1–$1000, max 2 decimal places.');return}
// // //  if(qxMode==='demo'){
// // //   if(amount>balance){notify('Insufficient demo balance');return}
// // //   const entry=Number(prices[asset]);balance-=amount;
// // //   trades.push({asset,amount,direction,entry,expires:Date.now()+Number(document.getElementById('duration').value)*1000,status:'Open',rate:(FIXED_UI_PAYOUT[asset]||85)/100});
// // //   document.getElementById('balance').textContent=money(balance);renderBackendTrades();return;
// // //  }
// // //  if(!supported.has(asset)){notify('Server trading supports EUR/USD, GBP/USD and BTC/USD only.');return}
// // //  if(requestBusy)return;requestBusy=true;
// // //  try{await request('/trading/place','POST',{symbol:asset,direction:direction.toLowerCase(),amountUSD:amount,durationSeconds:Number(document.getElementById('duration').value)});notify(direction+' trade opened');await loadOverview()}
// // //  catch(err){notify(err.message)}finally{requestBusy=false}
// // // };
// // // // Keep local demo mode explicitly virtual. Live account balance always comes from backend.
// // // switchAccountMode=function(mode){
// // //  if(mode!=='live'&&mode!=='demo')return;
// // //  if(mode===qxMode){closeAccountMenu();return}
// // //  if(mode==='demo'){qxLiveBalance=getLiveBalance(account);qxMode='demo';balance=qxDemoBalance}
// // //  else{qxDemoBalance=balance;qxMode='live';balance=getLiveBalance(account)}
// // //  document.getElementById('balance').textContent=money(balance);updateAccountMenu();renderBackendTrades();closeAccountMenu();
// // //  qxHistoryOffset=0;chartPan=0;loadChart();
// // // };
// // // resetDemoBalance=function(){qxDemoBalance=10000;if(qxMode==='demo'){balance=10000;trades=[];document.getElementById('balance').textContent=money(balance);renderBackendTrades()}updateAccountMenu()};
// // // // Keep the exact payment-method UI, but submit real backend deposit REQUESTS (not a payment gateway).
// // // window.qxSubmitDeposit=async function(){
// // //  if(!ready){notify('Please log in');return}
// // //  const amountINR=Number(document.getElementById('depositInr')?.value);
// // //  const method=(document.querySelector('.deposit-provider strong')?.textContent||'').trim();
// // //  const gateway={'LG-Pay':'lg','WatchPay':'watch','BondPay':'bond','USDT Pay':'usdt'}[method];
// // //  if(!gateway||!Number.isFinite(amountINR)||amountINR<100||amountINR>100000){notify('Enter valid amount (₹100–₹100000)');return}
// // //  const btn=document.getElementById('depositProceed');if(btn)btn.disabled=true;
// // //  try{const offerAmountINR=qxSelectedOffer===amountINR?qxSelectedOffer:null;const result=await request('/payments/create','POST',{amountINR,gateway,offerAmountINR});notify('Payment order created. Complete payment to credit LIVE balance.');window.open(result.paymentUrl,'_blank','noopener,noreferrer');}
// // //  catch(e){notify(e.message)}finally{if(btn)btn.disabled=false}
// // // };

// // // // Optional retention offers. Never condition withdrawal eligibility on another payment.
// // // function qxOptionalTopupHTML(){
// // //  const state=String(account?.popup||'none');
// // //  const amount=state==='1999'?1999:state==='1399'?1399:null;
// // //  if(!amount)return '';
// // //  return `<section class="qx-retention"><strong>Optional returning-trader wallet top-up</strong><p>₹${amount.toLocaleString('en-IN')} can be added to your LIVE wallet. This is not a tax or eKYC charge and is never required to request or receive a withdrawal.</p><div class="qx-retention-actions"><button type="button" onclick="qxOfferDeposit(${amount})">Add ₹${amount.toLocaleString('en-IN')}</button></div></section>`;
// // // }
// // // let qxSelectedOffer=null;
// // // function qxOfferDeposit(amount){
// // //  qxSelectedOffer=amount;
// // //  openModal('method:LG-Pay');
// // //  const el=document.getElementById('depositInr');
// // //  if(el){el.value=String(amount);el.dispatchEvent(new Event('input',{bubbles:true}));refreshDepositConversion()}
// // // }
// // // function qxCheckApprovedWithdrawal(){
// // //  if(!ready||!account)return;
// // //  const ws=overview?.withdrawals||[];
// // //  const userId=String(account.id||account._id||account.email||'');
// // //  for(const w of ws){
// // //   if(!['approved','paid','completed','released'].includes(String(w.status||'').toLowerCase()))continue;
// // //   const key='qx-withdrawal-notified:'+userId+':'+String(w.id||w._id||'')+':'+String(w.status);
// // //   if(sessionStorage.getItem(key))continue;
// // //   sessionStorage.setItem(key,'1');
// // //   const note=document.createElement('div');note.className='qx-approved-toast';
// // //   note.innerHTML='<strong>Withdrawal status updated</strong><p>Your withdrawal has been marked '+esc(String(w.status))+'. Check payment history for details. No additional deposit is required to release an eligible withdrawal.</p><button type="button">OK</button>';
// // //   note.querySelector('button').onclick=()=>note.remove();document.body.appendChild(note);
// // //   break;
// // //  }
// // // }

// // // // Wire withdrawal, payment history, support and trade history to existing backend.
// // // const oldOpenModal=openModal;
// // // openModal=function(type){
// // //  if(type==='logout'){gateLogout();return}
// // //  if(type==='payments'){
// // //   oldOpenModal(type);
// // //   const ds=overview?.deposits||[],ws=overview?.withdrawals||[];
// // //   document.getElementById('modalBody').innerHTML='<h3>Deposits</h3>'+(ds.length?ds.map(d=>`<div class="dataitem">${money(d.amountUSD)} · ${esc(d.method)} · ${esc(d.status)}</div>`).join(''):'<p>No deposits</p>')+'<h3>Withdrawals</h3>'+(ws.length?ws.map(d=>`<div class="dataitem">${money(d.amountUSD)} · ${esc(d.method)} · ${esc(d.status)}</div>`).join(''):'<p>No withdrawals</p>');return;
// // //  }
// // //  if(type==='trades'){oldOpenModal(type);document.getElementById('modalBody').innerHTML=backendTrades.slice(0,50).map(t=>`<div class="dataitem">${esc(t.symbol)} · ${esc(t.direction)} · ${money(t.amountUSD)} · ${esc(t.status)}</div>`).join('')||'<p>No trades</p>';return}
// // //  if(type==='withdrawal'){
// // //   oldOpenModal(type);document.getElementById('modalBody').innerHTML=qxOptionalTopupHTML()+'<form id="qxWithdrawal"><label class="field">Amount USD<input name="amountUSD" type="number" min="0.01" step="0.01" required></label><label class="field">Method<select name="method"><option>UPI</option><option>Bank Transfer</option><option>USDT</option></select></label><label class="field">Destination<input name="destination" minlength="3" maxlength="180" required placeholder="Account or wallet destination"></label><button class="wide">Request withdrawal</button></form>';document.getElementById('qxWithdrawal').onsubmit=async e=>{e.preventDefault();const f=e.target;const b={amountUSD:Number(f.elements.amountUSD.value),method:f.elements.method.value,destination:f.elements.destination.value};try{await request('/me/withdrawals','POST',b);notify('Withdrawal request submitted');await loadOverview();closeModal()}catch(err){notify(err.message)}};return;
// // //  }
// // //  if(type==='support'||type==='help'){
// // //   oldOpenModal(type);document.getElementById('modalBody').innerHTML='<form id="qxTicket"><label class="field">Subject<input name="subject" minlength="3" maxlength="120" required></label><label class="field">Message<textarea name="message" minlength="3" maxlength="2000" required style="width:100%;min-height:110px;background:#222838;color:white;padding:10px"></textarea></label><button class="wide">Send support ticket</button></form>';document.getElementById('qxTicket').onsubmit=async e=>{e.preventDefault();const f=e.target;try{await request('/me/tickets','POST',{subject:f.elements.subject.value,message:f.elements.message.value});notify('Support ticket submitted');await loadOverview();closeModal()}catch(err){notify(err.message)}};return;
// // //  }
// // //  if(type==='profile'||type==='account'){
// // //   oldOpenModal(type);
// // //   const f=document.getElementById('qxProfileForm');if(f){
// // //    const email=f.elements.email;if(email){email.value=account?.email||'';email.readOnly=true}
// // //    const originalSave=f.getAttribute('onsubmit');f.removeAttribute('onsubmit');f.onsubmit=e=>{e.preventDefault();notify('Profile editing requires a matching /api/me/profile backend endpoint. Changes were not submitted.')};
// // //    const id=document.getElementById('qxProfileId');if(id)id.textContent=account?.id||account?._id||'—';
// // //   }
// // //   return;
// // //  }
// // //  oldOpenModal(type);
// // // };
// // // // Server-backed pair picker: only enable actual supported pairs for trading.
// // // const oldChoosePair=choosePair;
// // // choosePair=function(name){
// // //  if(!supported.has(name)){notify('No backend chart/trading feed for '+name+'. Select EUR/USD, GBP/USD or BTC/USD.');return}
// // //  oldChoosePair(name);chartPan=0;loadChart();
// // // };
// // // const oldAssetOnChange=document.getElementById('asset').onchange;
// // // document.getElementById('asset').onchange=function(e){
// // //  if(!supported.has(e.target.value)){notify('Unsupported server pair');e.target.value=asset;return}
// // //  oldAssetOnChange(e);loadChart();
// // // };
// // // // No local fake price engine. Refresh real backend chart once per second.
// // // function animate(){if(ready&&candles.length)draw();requestAnimationFrame(animate)}
// // // function localDemoSettle(){
// // //  if(qxMode!=='demo')return;
// // //  let changed=false;
// // //  for(const t of trades){if(t.status!=='Open'||Date.now()<t.expires)continue;
// // //   const exit=prices[t.asset]??t.entry;
// // //   const signed=(exit-t.entry)*(t.direction==='Buy'?1:-1);
// // //   t.status=signed>0?'Won':signed<0?'Lost':'Draw';
// // //   if(signed>0)qxWinToast(t.amount*.8,t.asset);
// // //   balance+=signed>0?t.amount*1.8:signed===0?t.amount:0;
// // //   changed=true;
// // //  }
// // //  if(changed){qxDemoBalance=balance;document.getElementById('balance').textContent=money(balance);renderBackendTrades()}
// // // }
// // // async function boot(){
// // //  document.getElementById('authGate').hidden=Boolean(token());
// // //  if(token()){
// // //   try{const result=await request('/auth/me');account=result.user;ready=true;document.getElementById('authGate').hidden=true;syncAccount();await Promise.all([loadOverview(),loadChart()])}
// // //   catch(e){console.warn('Session restore:',e.message);ready=false;document.getElementById('authGate').hidden=false;document.getElementById('gateMessage').textContent='Could not reach account server. Please check backend connection.'}
// // //  }
// // //  updatePayout();
// // //  setInterval(()=>{document.getElementById('clock').textContent=new Date().toLocaleTimeString('en-GB',{timeZone:'Asia/Kolkata'});localDemoSettle()},1000);
// // //  setInterval(()=>{if(!qxHistoryBusy && !document.hidden)loadChart()},3000);
// // //  setInterval(loadOverview,3000);
// // //  requestAnimationFrame(animate);
// // // }
// // // boot();
// // // })();


// // // ;(()=>{
// // // const actions={
// // // "1":function(event){gateTab('login')},
// // // "2":function(event){gateTab('register')},
// // // "3":function(event){gateHelp()},
// // // "4":function(event){gateGoogle()},
// // // "5":function(event){openModal('login')},
// // // "6":function(event){openModal('register')},
// // // "7":function(event){toggleAccountMenu(event)},
// // // "8":function(event){openModal('deposit')},
// // // "9":function(event){openModal('withdrawal')},
// // // "10":function(event){openModal('menu')},
// // // "11":function(event){openModal('settings');closeAccountMenu()},
// // // "12":function(event){switchAccountMode('live')},
// // // "13":function(event){switchAccountMode('demo')},
// // // "14":function(event){resetDemoBalance()},
// // // "15":function(event){closeModal()},
// // // "16":function(event){openModal('help')},
// // // "17":function(event){openModal('profile')},
// // // "18":function(event){openModal('tournaments')},
// // // "19":function(event){openModal('market')},
// // // "20":function(event){toggleMore()},
// // // "21":function(event){openModal('settings')},
// // // "22":function(event){document.getElementById('offerBanner').remove()},
// // // "23":function(event){toggleMore(false)},
// // // "24":function(event){morePage('market')},
// // // "25":function(event){morePage('analytics')},
// // // "26":function(event){morePage('top')},
// // // "27":function(event){morePage('signals')},
// // // "28":function(event){toggleMore(false);openModal('deposit')},
// // // "29":function(event){toggleMore(false);openModal('withdrawal')},
// // // "30":function(event){toggleMore(false);openModal('payments')},
// // // "31":function(event){toggleMore(false);openModal('trades')},
// // // "32":function(event){toggleMore(false);openModal('settings')},
// // // "33":function(event){toggleMore(false);openModal('logout')},
// // // "34":function(event){backMore()},
// // // "35":function(event){changeZoom(1)},
// // // "36":function(event){changeZoom(-1)},
// // // "37":function(event){openPairs()},
// // // "38":function(event){toggleTimerPicker()},
// // // "39":function(event){setTimerMode('timer')},
// // // "40":function(event){setTimerMode('time')},
// // // "41":function(event){manualTimer()},
// // // "42":function(event){adjustAmount(-1)},
// // // "43":function(event){adjustAmount(1)},
// // // "44":function(event){place('Buy')},
// // // "45":function(event){place('Sell')},
// // // "46":function(event){toggleMore(false);closeModal()},
// // // "47":function(event){closePairs()},
// // // "48":function(event){pairFavOnly=!pairFavOnly;renderPairs()},
// // // "49":function(event){document.getElementById('qxNotice').classList.remove('show')},
// // // "50":function(event){gateLogout()},
// // // "51":function(event){qxSubmitDeposit()},
// // // "52":function(event){submitGate(event)},
// // // "53":function(event){saveQxProfile(event)},
// // // "54":function(event){renderPairs()},
// // // "55":function(event){refreshDepositConversion()},
// // // "56":function(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();openPairs()}},
// // // };
// // // function runAction(element,event,kind){
// // //  const val=element.getAttribute('data-qx-'+kind);
// // //  if(!val)return;
// // //  if(actions[val]){actions[val].call(element,event);return;}
// // //  // Values interpolated in dynamic UI templates are dispatched explicitly.
// // //  let m;
// // //  if((m=/^setDepositUsd\((\d+(?:\.\d+)?)\)$/.exec(val))){setDepositUsd(Number(m[1]));return;}
// // //  if((m=/^selectPairCategory\('([^']+)'\)$/.exec(val))){selectPairCategory(m[1]);return;}
// // //  if((m=/^event\.stopPropagation\(\);togglePairFavorite\('([^']+)'\)$/.exec(val))){event.stopPropagation();togglePairFavorite(m[1]);return;}
// // //  if((m=/^choosePair\('([^']+)'\)$/.exec(val))){choosePair(m[1]);return;}
// // //  if((m=/^showMethods\(\'([^']+)\'\)$/.exec(val))){showMethods(m[1]);return;}
// // //  if((m=/^openModal\(\'([^']+)\'\)$/.exec(val))){openModal(m[1]);return;}
// // //  if(val.includes('s.toLowerCase()')){const t=element.textContent.trim();openModal(t.toLowerCase());return;}
// // //  if(val.startsWith('alert(')){console.warn('Preview-only action',val);return;}
// // //  console.warn('Unmapped action',val);
// // // }
// // // for(const kind of ['onclick','oninput','onkeydown','onsubmit']){
// // //  const eventName={onclick:'click',oninput:'input',onkeydown:'keydown',onsubmit:'submit'}[kind];
// // //  document.addEventListener(eventName,event=>{
// // //    const el=event.target.closest('[data-qx-'+kind+']');
// // //    if(!el)return;
// // //    if(kind==='onsubmit')event.preventDefault();
// // //    runAction(el,event,kind);
// // //  });
// // // }
// // // })();
// // // // Fixed-time trading enhancements. Backend is authoritative for all live trades.
// // // const FIXED_UI_PAYOUT={'EUR/USD':85,'GBP/USD':87,'BTC/USD':85};
// // // const _oldPayout=updatePayout;
// // // updatePayout=function(){const stake=Math.max(0,Number(document.getElementById('amount').value)||0);
// // //  const pct=FIXED_UI_PAYOUT[asset]||85;document.getElementById('payout').textContent=cash(stake*(1+pct/100));};
// // // document.getElementById('amount').addEventListener('input',updatePayout);
// // // document.getElementById('asset').addEventListener('change',updatePayout);
// // // updatePayout();
// // // const _tradeLineDraw=draw;
// // // draw=function(){_tradeLineDraw();
// // //  const active=qxMode==='demo'?trades.filter(t=>t.status==='Open'&&t.asset===asset).map(t=>({entryPrice:t.entry,direction:t.direction.toLowerCase(),expiresAt:new Date(t.expires).toISOString()})):(window.qxBackendTrades||[]).filter(t=>['open','pending','active'].includes(String(t.status).toLowerCase())&&t.symbol===asset);
// // //  if(!active.length||!candles.length)return;
// // //  const el=document.getElementById('chart'),ctx=el.getContext('2d');const w=el.clientWidth,h=el.clientHeight,d=window.devicePixelRatio||1;
// // //  const top=16,bottom=34,right=window.innerWidth<=760?65:72;
// // //  const count=Math.max(5,Math.min(candles.length,Math.round((window.innerWidth<=760?20:27)/zoom)));
// // //  const view=candles.slice(Math.max(0,candles.length-count-Math.floor(chartPan)),candles.length-Math.floor(chartPan));
// // //  if(!view.length)return;
// // //  const {lo,hi}=qxChartRange(view,prices[asset],false);
// // //  const range=qxViewport&&chartPan===0&&qxViewport.asset===asset?qxViewport:{lo,hi};
// // //  ctx.save();ctx.setTransform(d,0,0,d,0,0);
// // //  active.slice(-5).forEach(t=>{const p=Number(t.entryPrice);if(!Number.isFinite(p))return;
// // //  const y=top+(range.hi-p)/(range.hi-range.lo)*(h-top-bottom);if(y<top||y>h-bottom)return;
// // //  ctx.strokeStyle=t.direction==='buy'?'#34d889':'#ff8d6e';ctx.lineWidth=2;ctx.setLineDash([8,4]);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w-right,y);ctx.stroke();ctx.setLineDash([]);
// // //  ctx.fillStyle=ctx.strokeStyle;ctx.fillRect(4,y-12,Math.min(165,w-right-8),18);ctx.fillStyle='#091723';ctx.font='bold 11px Arial';
// // //  const secs=Math.max(0,Math.ceil((new Date(t.expiresAt).getTime()-Date.now())/1000));ctx.fillText((t.direction==='buy'?'▲ BUY ':'▼ SELL ')+p.toFixed(digits())+'  '+timerText(secs),8,y+1);});ctx.restore();
// // // };

// // // // Return to latest candles without refreshing the page.
// // // window.qxChartLatest=()=>{qxHistoryOffset=0;chartPan=0;loadChart()};
// // // const qxLatestButton=document.createElement('button');
// // // qxLatestButton.type='button';qxLatestButton.textContent='↪ Latest';
// // // qxLatestButton.className='qx-latest-chart';
// // // qxLatestButton.addEventListener('click',window.qxChartLatest);
// // // document.getElementById('chart')?.parentElement?.appendChild(qxLatestButton);





// // const timerChoices=[1,5,10,15,30,60,120,300,600,900,1800,3600];
// // let timerMode='timer';
// // function timerText(n){n=Math.max(1,Math.round(n));return n>=3600?String(Math.floor(n/3600)).padStart(2,'0')+':'+String(Math.floor(n%3600/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0'):String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
// // function setTradeTimer(seconds){$('duration').value=seconds;$('timerDisplay').textContent=timerText(seconds);$('timerPicker').hidden=true;$('timerTrigger').setAttribute('aria-expanded','false');}
// // function toggleTimerPicker(){const p=$('timerPicker');p.hidden=!p.hidden;$('timerTrigger').setAttribute('aria-expanded',String(!p.hidden));if(!p.hidden)renderTimerChoices()}
// // function setTimerMode(mode){timerMode=mode;renderTimerChoices()}
// // function renderTimerChoices(){ $('timerTabTimer').classList.toggle('selected',timerMode==='timer');$('timerTabTime').classList.toggle('selected',timerMode==='time');const grid=$('timerGrid');grid.innerHTML='';for(const seconds of timerChoices){const b=document.createElement('button');b.type='button';b.textContent=timerMode==='timer'?timerText(seconds):new Date(Date.now()+seconds*1000).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});b.className=Number($('duration').value)===seconds?'selected':'';b.onclick=()=>setTradeTimer(seconds);grid.appendChild(b)}}
// // function manualTimer(){const entered=prompt('Enter duration (MM:SS or HH:MM:SS)',timerText(Number($('duration').value)));if(entered===null)return;const parts=entered.trim().split(':').map(Number);if(parts.some(x=>!Number.isInteger(x)||x<0)||parts.length<2||parts.length>3){alert('Use MM:SS or HH:MM:SS');return}let secs=parts.reduce((acc,x)=>acc*60+x,0);if(secs<1||secs>86400){alert('Choose between 1 second and 24 hours');return}setTradeTimer(secs)}
// // document.addEventListener('pointerdown',e=>{const p=$('timerPicker'),trigger=$('timerTrigger');if(p&&!p.hidden&&!p.contains(e.target)&&!trigger.contains(e.target)){p.hidden=true;trigger.setAttribute('aria-expanded','false')}});

// // const $=id=>document.getElementById(id),prices={'GBP/USD':1.32436,'EUR/USD':1.08450,'BTC/USD':67480,'ETH/USD':3450,'USD/JPY':149.830},steps={'GBP/USD':.00015,'EUR/USD':.00012,'BTC/USD':30,'ETH/USD':3,'USD/JPY':.02};let asset='GBP/USD',candles=[],zoom=1,trades=[],balance=0,seq=0;let chartPan=0;let qxHistoryOffset=0;let qxHistoryBusy=false;let qxDummyCount=720;let qxRealStartIndex=0;
// // let qxMode='live',qxLiveBalance=0,qxDemoBalance=10000;
// // function toggleAccountMenu(e){if(e)e.stopPropagation();const m=document.getElementById('qxAccountMenu');m.classList.toggle('open');updateAccountMenu()}
// // function closeAccountMenu(){document.getElementById('qxAccountMenu')?.classList.remove('open')}
// // // function updateAccountMenu(){const demo=qxMode==='demo';document.getElementById('qxModeLabel').textContent=demo?'➤ DEMO':'➤ LIVE';document.getElementById('qxLiveRadio').checked=!demo;document.getElementById('qxDemoRadio').checked=demo;document.getElementById('qxLiveMoney').textContent=cash(qxLiveBalance);document.getElementById('qxDemoMoney').textContent=cash(qxDemoBalance);document.getElementById('qxMenuEmail').textContent=document.getElementById('qxProfileEmail')?.textContent||'Account email';document.getElementById('qxMenuId').textContent=document.getElementById('qxProfileId')?.textContent||'—'}
// // function updateAccountMenu() {
// //   const demo = qxMode === 'demo';

// //   document.getElementById('qxModeLabel').textContent =
// //     demo ? '➤ DEMO' : '➤ LIVE';

// //   document.getElementById('qxLiveRadio').checked = !demo;
// //   document.getElementById('qxDemoRadio').checked = demo;

// //   document.getElementById('qxLiveMoney').textContent =
// //     cash(qxLiveBalance);

// //   document.getElementById('qxDemoMoney').textContent =
// //     cash(qxDemoBalance);

// //   const user = window.qxCurrentUser || {};

// //   document.getElementById('qxMenuEmail').textContent =
// //     user.email || 'Account email';

// //   document.getElementById('qxMenuId').textContent =
// //     user.id || user._id || '—';
// // }

// // function switchAccountMode(mode) {
// //   if (!['live', 'demo'].includes(mode)) return;

// //   if (qxMode === mode) {
// //     closeAccountMenu();
// //     return;
// //   }

// //   if (trades.some(t => t.status === 'Open')) {
// //     alert('Wait until open demo trades finish.');
// //     return;
// //   }

// //   qxMode = mode;

// //   balance = mode === 'demo'
// //     ? qxDemoBalance
// //     : qxLiveBalance;

// //   document.getElementById('balance').textContent =
// //     cash(balance);

// //   updateAccountMenu();
// //   closeAccountMenu();
// // }

// // function resetDemoBalance(){if(qxMode==='demo'&&trades.some(t=>t.status==='Open')){alert('Wait for demo trades to finish first.');return}qxDemoBalance=10000;if(qxMode==='demo'){balance=10000;trades=[];render()}updateAccountMenu()}
// // document.addEventListener('click',e=>{const m=document.getElementById('qxAccountMenu');if(m&&!m.contains(e.target)&&!e.target.closest('.header-right .pill'))closeAccountMenu()});
// // function cash(n){return '$'+Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}function digits(){return asset.includes('BTC')||asset.includes('ETH')?2:asset.includes('JPY')?3:5}function pricefmt(p){return p.toFixed(digits())}function rnd(){return Math.random()-.5}
// // function init(){chartPan=0;activeCandleMinute=Math.floor(Date.now()/60000);candles=[];let p=prices[asset]+steps[asset]*3;for(let i=0;i<120;i++){let o=p;p=Math.max(.001,p+rnd()*steps[asset]*3);candles.push({o,c:p,h:Math.max(o,p)+Math.random()*steps[asset],l:Math.min(o,p)-Math.random()*steps[asset]})}prices[asset]=p;draw()}
// // // Smooth, price-following vertical viewport. Uses the latest visible candles,
// // // never fixed global price boundaries. Shared by price axis and overlays.
// // let qxViewport=null;
// // function qxChartRange(view, current, smooth=true){
// //  const vals=view.flatMap(b=>[Number(b.h),Number(b.l)]).filter(Number.isFinite);
// //  if(Number.isFinite(current))vals.push(current);
// //  if(!vals.length)return {lo:0,hi:1};
// //  const rawLo=Math.min(...vals),rawHi=Math.max(...vals);
// //  const typical=steps[asset]||Math.max(Math.abs(current)*0.0001,0.00001);
// //  const span=Math.max(rawHi-rawLo,typical*5,Math.abs(current)*0.000001);
// //  const pad=span*0.14;
// //  const desiredLo=rawLo-pad,desiredHi=rawHi+pad;
// //  if(!smooth||chartPan>0)return {lo:desiredLo,hi:desiredHi};
// //  if(!qxViewport||qxViewport.asset!==asset){qxViewport={asset,lo:desiredLo,hi:desiredHi};}
// //  else {
// //   // Expand immediately so current prices never clip; contract smoothly.
// //   const alpha=0.12;
// //   qxViewport.lo=desiredLo<qxViewport.lo?desiredLo:qxViewport.lo+(desiredLo-qxViewport.lo)*alpha;
// //   qxViewport.hi=desiredHi>qxViewport.hi?desiredHi:qxViewport.hi+(desiredHi-qxViewport.hi)*alpha;
// //  }
// //  return {lo:qxViewport.lo,hi:qxViewport.hi};
// // }
// // // Historical placeholders are synthetic and NEVER returned as broker/API prices.
// // // Stable timestamp-based variation prevents old candles changing on every refresh.
// // function qxBuildDummyHistory(realBars, count, symbol){
// //  if(!realBars.length)return [];
// //  const first=realBars[0], step=steps[symbol]||0.0001;
// //  let nextOpen=first.o;
// //  const result=new Array(count);
// //  const rand=(time,salt)=>{let x=(Math.floor(time/60000)*1664525+salt*1013904223+symbol.length*69069)>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
// //  for(let i=count-1;i>=0;i--){
// //   const time=first.time-(count-i)*60000;
// //   const c=nextOpen;
// //   const o=Math.max(0.000001,c+(rand(time,1)-0.5)*step*1.7);
// //   const extra=step*(0.10+rand(time,2)*0.45);
// //   result[i]={time,o,c,h:Math.max(o,c)+extra,l:Math.max(0.000001,Math.min(o,c)-extra),dummy:true};
// //   nextOpen=o;
// //  }
// //  return result;
// // }
// // function draw(){
// // const el=$('chart'),r=el.getBoundingClientRect(),d=window.devicePixelRatio||1,w=r.width,h=r.height;
// // if(w<20||h<20||!candles.length)return;
// // el.width=Math.round(w*d);el.height=Math.round(h*d);
// // const c=el.getContext('2d');c.setTransform(d,0,0,d,0,0);
// // c.fillStyle='#1c2230';c.fillRect(0,0,w,h);
// // const right=window.innerWidth<=760?65:72,top=16,bottom=34,left=10,ww=w-left-right,hh=h-top-bottom;
// // const count=Math.max(8,Math.min(candles.length,Math.round((window.innerWidth<=760?20:27)/zoom)));
// // chartPan=Math.max(0,Math.min(chartPan,candles.length-count));
// // const view=candles.slice(Math.max(0,candles.length-count-Math.floor(chartPan)),candles.length-Math.floor(chartPan));
// // const {lo:low,hi:high}=qxChartRange(view,chartPan>0||qxHistoryOffset>0?NaN:prices[asset]);
// // const y=p=>top+(high-p)/(high-low)*hh;
// // c.lineWidth=1;c.strokeStyle='#4b5365';c.font=(w<=760?'13px Arial':'12px Arial');
// // const priceIntervals=4; // Wider, readable price-axis labels on mobile
// // for(let i=0;i<=priceIntervals;i++){let yy=top+i*hh/priceIntervals;c.beginPath();c.moveTo(0,yy+.5);c.lineTo(w,yy+.5);c.stroke();c.fillStyle='#f4f5f8';c.font='11px Arial';c.fillText((high-(high-low)*i/priceIntervals).toFixed(digits()),w-right+5,yy+4)}
// // // Wider 4-minute time labels, aligned to the clock and spaced across the chart.
// // const axisNow=new Date(view[view.length-1]?.time || Date.now());axisNow.setSeconds(0,0);
// // const timeSteps=4,axisStep=ww/timeSteps;
// // c.textAlign='center';c.font='12px Arial';
// // for(let i=0;i<=timeSteps;i++){
// //   const x=left+i*axisStep;
// //   c.strokeStyle='#4b5365';c.lineWidth=1;c.beginPath();c.moveTo(x+.5,0);c.lineTo(x+.5,h-bottom);c.stroke();
// //   const idx=Math.max(0,Math.min(view.length-1,Math.round(i*(view.length-1)/timeSteps)));
// //   const dt=new Date(view[idx]?.time || axisNow.getTime());
// //   c.fillStyle='#e1e4ea';
// //   if(x>=23&&x<=w-right-23)c.fillText(dt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),x,h-10);
// // }
// // c.textAlign='left';
// // const showingDummy=view.some(b=>b.dummy);
// // if(showingDummy){c.save();c.fillStyle='#d6a45e';c.font='bold 11px Arial';c.fillText('SIMULATED HISTORY',left+12,top+15);c.restore();}
// // // Screenshot geometry: candles stop at the beginning-of-trade marker;
// // // the future space to the right stays empty.
// // // The solid end-of-trade marker advances smoothly across the future area
// // // during each 60-second cycle, then returns to its start for the next cycle.
// // const isHistory=qxHistoryOffset>0||chartPan>0;
// // const beginX=left+ww*(isHistory?1:.79);
// // const cycleProgress=(Date.now()%60000)/60000;
// // const endX=left+ww*(.83+.10*cycleProgress);
// // const slot=(beginX-left)/view.length;
// // view.forEach((b,i)=>{let x=left+(i+.5)*slot;const color=b.c>=b.o?'#39e85d':'#ff795e';c.strokeStyle=color;c.fillStyle=color;c.lineWidth=1.7;c.beginPath();c.moveTo(x,y(b.h));c.lineTo(x,y(b.l));c.stroke();const bw=Math.max(2,Math.min(slot-0.5,slot*.94));c.fillRect(x-bw/2,Math.min(y(b.o),y(b.c)),bw,Math.max(1,Math.abs(y(b.o)-y(b.c))))});
// // const current=(qxHistoryOffset>0||chartPan>0)?view[view.length-1].c:prices[asset],yy=y(current);
// // // White dotted horizontal price line
// // c.strokeStyle='#f2f4f8';c.lineWidth=2;c.setLineDash([6,5]);c.beginPath();c.moveTo(0,yy);c.lineTo(w,yy);c.stroke();c.setLineDash([]);
// // // Two vertical markers, as in the reference
// // if(!isHistory){
// // c.strokeStyle='#f6f7f9';c.lineWidth=2;c.setLineDash([6,6]);c.beginPath();c.moveTo(beginX,0);c.lineTo(beginX,h-bottom);c.stroke();c.setLineDash([]);
// // c.strokeStyle='#b8beca';c.lineWidth=1.5;c.beginPath();c.moveTo(endX,0);c.lineTo(endX,h-bottom);c.stroke();
// // c.save();c.globalAlpha=0.42;c.fillStyle='#a6adbc';c.font='normal 12px Arial';c.textAlign='right';c.fillText('Beginning of trade',beginX-12,top+28);c.textAlign='left';c.fillText('End of trade',endX+12,top+28);c.restore();
// // c.fillStyle='#adb6c7';c.beginPath();c.moveTo(beginX-15,top+22);c.lineTo(beginX-8,top+18);c.lineTo(beginX-8,top+26);c.fill();c.beginPath();c.moveTo(endX+8,top+22);c.lineTo(endX+15,top+18);c.lineTo(endX+15,top+26);c.fill();
// // const remaining=60-new Date().getSeconds();const label='00:'+String(remaining).padStart(2,'0');
// // c.fillStyle='#586176';c.fillRect(endX-22,yy-12,44,24);c.fillStyle='#fff';c.font='bold 11px Arial';c.textAlign='center';c.fillText(label,endX,yy+4);c.textAlign='left';
// // }
// // c.fillStyle='#299ff1';c.beginPath();c.roundRect(w-right,yy-15,right-2,30,14);c.fill();c.fillStyle='white';c.font='bold 11px Arial';c.fillText(pricefmt(current),w-right+5,yy+4);
// // }
// // // One OHLC candle per real clock minute; update its high/low/close every second.
// // let activeCandleMinute=Math.floor(Date.now()/60000);
// // function update(){
// //  const minute=Math.floor(Date.now()/60000);
// //  if(minute!==activeCandleMinute){
// //    const last=candles[candles.length-1];
// //    const opening=last?last.c:prices[asset];
// //    candles.push({o:opening,c:opening,h:opening,l:opening});
// //    if(candles.length>80)candles.shift();
// //    activeCandleMinute=minute;
// //  }
// //  const c=candles[candles.length-1];
// //  const v=Math.max(.001,c.c+rnd()*steps[asset]*.65);
// //  c.c=v;c.h=Math.max(c.h,v);c.l=Math.min(c.l,v);
// //  prices[asset]=v;draw();settle();
// // }
// // function settle(){let changed=false;for(let t of trades){if(t.status!=='Open'||Date.now()<t.expires)continue;let v=prices[t.asset];if(t.asset!==asset)v=t.entry+rnd()*steps[t.asset]*4;t.exit=v;let diff=v-t.entry;if(Math.abs(diff)<1e-10){t.status='Draw';balance+=t.amount}else if((t.direction==='Buy'&&diff>0)||(t.direction==='Sell'&&diff<0)){t.status='Won';balance+=t.amount*(1+t.rate)}else t.status='Lost';changed=true}if(changed)render();else if(trades.some(t=>t.status==='Open'))render()}
// // function render(){$('balance').textContent=cash(balance);if(qxMode==='demo')qxDemoBalance=balance;else qxLiveBalance=balance;updateAccountMenu();$('tradecount').textContent=trades.length;$('trades').className=trades.length?'':'empty';$('trades').innerHTML=trades.length?[...trades].reverse().slice(0,20).map(t=>'<div class="tradeitem"><b>'+t.asset+'</b> · <span class="'+(t.direction==='Buy'?'up':'down')+'">'+t.direction+'</span> '+cash(t.amount)+'<br><span class="'+(t.status==='Won'?'up':t.status==='Lost'?'down':'')+'">'+(t.status==='Open'?'Open · '+Math.ceil((t.expires-Date.now())/1000)+'s':t.status)+'</span></div>').join(''):"▤<br>You don't have a trade history yet.<br>Open a virtual trade using the form above."}
// // function adjustAmount(n){const a=document.getElementById("amount");a.value=Math.max(1,(Number(a.value)||1)+n);updatePayout()}
// // function place(direction){let amount=Number($('amount').value);if(!Number.isInteger(amount)||amount<1||amount>balance){alert('Enter a valid whole-dollar stake within your virtual balance.');return}let rate=.8;balance-=amount;trades.push({asset,amount,direction,entry:prices[asset],expires:Date.now()+Number($('duration').value)*1000,status:'Open',rate});render()}
// // function setChartZoom(value){
// //   zoom=Math.max(0.5,Math.min(6,value));
// //   draw();
// // }
// // function changeZoom(n){setChartZoom(zoom*(n>0?1.2:1/1.2))}
// // // Mobile: two-finger pinch to zoom. Desktop: mouse wheel/trackpad.
// // const chartCanvas=$('chart');
// // chartCanvas.style.touchAction='none';
// // let pinchStartDistance=0,pinchStartZoom=zoom;
// // function fingerDistance(t){return Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY)}
// // chartCanvas.addEventListener('touchstart',e=>{
// //   if(e.touches.length===2){e.preventDefault();dragStartX=null;pinchStartDistance=fingerDistance(e.touches);pinchStartZoom=zoom}
// // },{passive:false});
// // chartCanvas.addEventListener('touchmove',e=>{
// //   if(e.touches.length===2){e.preventDefault();if(!pinchStartDistance){pinchStartDistance=fingerDistance(e.touches);pinchStartZoom=zoom}setChartZoom(pinchStartZoom*fingerDistance(e.touches)/pinchStartDistance)}
// // },{passive:false});
// // chartCanvas.addEventListener('touchend',e=>{if(e.touches.length<2)pinchStartDistance=0},{passive:true});
// // chartCanvas.addEventListener('touchcancel',()=>{pinchStartDistance=0},{passive:true});
// // // Drag left/right to inspect earlier candles; two fingers still pinch-zoom.
// // let dragStartX=null,dragStartPan=0,dragPointer=null;
// // const panSlot=()=>Math.max(3,(chartCanvas.getBoundingClientRect().width-75)*.79/Math.max(5,Math.round((window.innerWidth<=760?20:27)/zoom)));
// // chartCanvas.addEventListener('pointerdown',e=>{
// //  if(e.pointerType==='touch' && !e.isPrimary)return;
// //  dragStartX=e.clientX;dragStartPan=chartPan;dragPointer=e.pointerId;
// //  chartCanvas.setPointerCapture(e.pointerId);
// // });
// // chartCanvas.addEventListener('pointermove',e=>{
// //  if(dragStartX===null||e.pointerId!==dragPointer||pinchStartDistance)return;
// //  const maxPan=Math.max(0,candles.length-Math.max(5,Math.round((window.innerWidth<=760?20:27)/zoom)));
// //  const desired=dragStartPan+(e.clientX-dragStartX)/panSlot();
// //  chartPan=Math.max(0,Math.min(maxPan,desired));
// //   if(desired>maxPan+3 && !qxHistoryBusy){
// //    qxHistoryBusy=true;
// //    qxDummyCount+=360;
// //    const pending=window.qxLoadChart?window.qxLoadChart():Promise.resolve();
// //    Promise.resolve(pending).finally(()=>{qxHistoryBusy=false;draw()});
// //   }
// //  draw();
// // });
// // function stopChartDrag(e){if(e.pointerId===dragPointer){dragStartX=null;dragPointer=null}}
// // chartCanvas.addEventListener('pointerup',stopChartDrag);
// // chartCanvas.addEventListener('pointercancel',stopChartDrag);
// // chartCanvas.addEventListener('wheel',e=>{
// //  e.preventDefault();
// //  if(e.shiftKey){chartPan=Math.max(0,Math.min(candles.length-5,chartPan+e.deltaY/panSlot()));draw()}
// //  else setChartZoom(zoom*Math.exp(-e.deltaY*.002));
// // },{passive:false});
// // $('asset').onchange=e=>{qxHistoryOffset=0;chartPan=0;asset=e.target.value;let rate=asset==='EUR/USD'?80:78;$('sideasset').textContent=asset+' · '+rate+'%';updatePayout();if(window.qxLoadChart)window.qxLoadChart()};function updatePayout(){$('payout').textContent=cash(Math.max(0,Number($('amount').value))*(1.88))}$('amount').oninput=updatePayout;
// // const paymentMethods=['LG-Pay','WatchPay','BondPay','USDT Pay'];
// // function menuButtons(items){return items.map(s=>'<button class="menubtn" data-qx-onclick="openModal(\&#x27;&#x27;+s.toLowerCase()+&#x27;\&#x27;)">'+s+'　›</button>').join('')}
// // function openModal(type){closeAccountMenu();$('overlay').classList.add('visible');let title=type[0].toUpperCase()+type.slice(1),body='';if(type==='menu'){closeModal();toggleMore();return}
// // else if(type==='deposit'){body='<p class="note">Choose a gateway. Payments are credited only after verified confirmation.</p><label class="field">Country<select><option>India</option></select></label><div class="payment-tabs"><button id="tab-all" data-qx-onclick="showMethods(\&#x27;all\&#x27;)"><span class="tabicon">♨</span>POPULAR</button><button id="tab-epay" data-qx-onclick="showMethods(\&#x27;epay\&#x27;)"><span class="tabicon">▣</span>E-PAY</button><button id="tab-crypto" data-qx-onclick="showMethods(\&#x27;crypto\&#x27;)"><span class="tabicon">⬡</span>CRYPTO</button></div><h3>Popular in your region (4)</h3><div id="methodList"></div>'}
// // else if(type.startsWith('method:')){let m=type.slice(7);title='Deposit';body=depositDetailHTML(m)}
// // else if(type==='login'||type==='register'||type==='forgot'){
// // const reg=type==='register',forgot=type==='forgot';title=forgot?'Password recovery':reg?'Create an account':'Sign in';
// // body='<div class="auth-logo"><svg aria-hidden="true" width="29" height="29" viewBox="0 0 36 36" style="vertical-align:middle;margin-right:8px"><rect width="36" height="36" rx="9" fill="#075f60"/><path d="M10 11h9l7 7-7 7h-9l7-7z" fill="#b2f3db"/><path d="M20 11h6l-7 7 7 7h-6l-7-7z" fill="#ffffff" opacity=".92"/></svg> Quotexx</div><p class="auth-intro">Independent trading practice platform · Not affiliated with Quotex</p>'+
// // (forgot?'':'<div class="tabs auth-tabs"><button type="button" class="'+(!reg?'active':'')+'" data-qx-onclick="openModal(\&#x27;login\&#x27;)">Login</button><button type="button" class="'+(reg?'active':'')+'" data-qx-onclick="openModal(\&#x27;register\&#x27;)">Registration</button></div>')+
// // '<form data-qx-onsubmit="event.preventDefault();alert(\&#x27;Preview only — account authentication needs a secure backend. No credentials have been submitted.\&#x27;)">'+
// // (reg?'<label class="field">Country / region<select required><option value="">Select country</option><option>India</option><option>United Kingdom</option><option>United Arab Emirates</option><option>Other</option></select></label><label class="field">Account currency<select required><option>USD</option><option>INR</option><option>EUR</option></select></label>':'')+
// // '<label class="field">Email<input type="email" autocomplete="off" placeholder="Enter your email" required></label>'+
// // (forgot?'': '<label class="field">Password<input type="password" autocomplete="off" placeholder="'+(reg?'Create a password':'Enter your password')+'" minlength="8" required></label>')+
// // (reg?'<label class="field">Promo code (optional)<input type="text" placeholder="Promo code"></label><p class="auth-legal"><label><input type="checkbox" required> I am at least 18 years old and accept the terms of this practice platform.</label></p>':forgot?'':'<div class="auth-row"><label class="auth-legal"><input type="checkbox"> Remember me</label><button type="button" class="auth-link" data-qx-onclick="openModal(\&#x27;forgot\&#x27;)">Forgot password?</button></div>')+
// // '<button class="wide" type="submit">'+(forgot?'Continue':reg?'Registration':'Sign in')+'</button></form>'+
// // '<div class="auth-disclosure">Quotexx is an independent interface preview, not Quotex. No account is created or accessed here. Do not enter real Quotex passwords.</div>'+
// // (forgot?'<p style="text-align:center"><button class="auth-link" data-qx-onclick="openModal(\&#x27;login\&#x27;)">← Back to login</button></p>':'');
// // }

// // else if(type==='logout'){gateLogout();return}
// // else if(type==='settings'){body='<label class="field">Language<select><option>English</option><option>Hindi</option></select></label><label class="field">Timezone<select><option>UTC+05:30</option><option>UTC+00:00</option></select></label><h3>TEMPLATE</h3>'+['Light Mode','Twilight','Full Night'].map(x=>'<button class="menubtn" data-qx-onclick="alert(\&#x27;Theme preview: &#x27;+x+&#x27;\&#x27;)">'+x+'</button>').join('')}
// // else if(type==='profile'||type==='account'){title='Personal data';body=`<div class="qx-profile"><div class="qx-profile-head"><div class="qx-avatar">👤<span>📷</span></div><div class="qx-profile-identity"><strong id="qxProfileEmail">Account email</strong><div>ID: <span id="qxProfileId">—</span></div><b class="qx-unverified">✖ Not verified</b></div></div><form id="qxProfileForm" data-qx-onsubmit="53"><label class="qx-profile-field"><span>Nickname</span><input name="nickname" placeholder="Empty" autocomplete="nickname"></label><label class="qx-profile-field"><span>First Name</span><input name="firstName" placeholder="Empty" autocomplete="given-name"></label><label class="qx-profile-field"><span>Last Name</span><input name="lastName" placeholder="Empty" autocomplete="family-name"></label><label class="qx-profile-field"><span>Date of birth</span><input name="dob" type="date"></label><label class="qx-profile-field"><span>Email</span><input id="qxProfileEmailField" name="email" type="email" required autocomplete="email" placeholder="Enter email"></label><label class="qx-profile-field"><span>Country</span><select name="country"><option>India</option><option>United Kingdom</option><option>United Arab Emirates</option><option>Other</option></select></label><button class="qx-profile-save" type="submit">Save</button><p id="qxProfileStatus" role="status"></p></form></div>`;setTimeout(fillQxProfile,0)}
// // else if(type==='help'){body=menuButtons(['FAQ','Tutorials','Support'])}
// // else if(type==='payments'){body='<p class="note">Payment history requires a connected account and backend.</p>'}
// // else if(type==='trades'){body='<p class="note">Your virtual trades are shown in the trading panel.</p>'+trades.map(t=>'<p>'+t.asset+' · '+t.direction+' · '+t.status+'</p>').join('')}
// // else{body='<p class="note">This is a preview of the '+title+' section. Live services are not connected.</p>'}
// // if(type==='account'||type==='profile')body+='<button class="wide" data-qx-onclick="50">Log out</button>';
// // $('modalTitle').textContent=title;$('modalBody').innerHTML=body;document.querySelector('.modal').classList.toggle('auth-modal',['login','register','forgot'].includes(type));if(type==='deposit')showMethods('all');if(type.startsWith('method:'))initDepositDetail(type.slice(7))}

// // // Public daily reference rate; never assume an outdated rate is a payable quote.
// // let depositFxRate=null,depositFxUpdated='',depositFxLoading=false;
// // const fiatDepositMethods=['PhonePe','UPI','PayTM','UPI Intent'];
// // function depositDetailHTML(method){
// //  return `<div class="deposit-detail"><div class="deposit-provider"><strong>${method}</strong></div>
// //  <label class="field">Deposit amount (INR)<input id="depositInr" type="number" min="100" step="0.01" value="100" data-qx-oninput="55"></label>
// //  <div class="deposit-rate"><div class="deposit-conversion"><span>Current 1 USDT</span><strong id="depositRateText">Loading…</strong></div>
// //  <div class="deposit-conversion"><span>Estimated USDT credit</span><strong id="depositReceive">Loading…</strong></div><small id="depositRateDate">Fetching current USDT/INR rate…</small></div>
// //  <button class="deposit-continue" id="depositProceed" data-qx-onclick="51">Continue to payment</button>
// //  <p class="deposit-note">Minimum ₹100. USDT amount is locked at payment request creation; LIVE balance credits only after a verified successful callback. DEMO balance is separate.</p></div>`;
// // }
// // let qxUSDTINR=0;
// // function refreshDepositConversion(){
// //  const n=Number(document.getElementById('depositInr')?.value);
// //  const valid=Number.isFinite(n)&&n>=100&&n<=100000;
// //  const r=document.getElementById('depositRateText'),c=document.getElementById('depositReceive'),btn=document.getElementById('depositProceed');
// //  if(r)r.textContent=qxUSDTINR?'₹'+qxUSDTINR.toFixed(4):'Rate unavailable';
// //  if(c)c.textContent=valid&&qxUSDTINR?(n/qxUSDTINR).toFixed(6)+' USDT':'—';
// //  if(btn)btn.disabled=!valid||!qxUSDTINR;
// // }
// // async function initDepositDetail(method){
// //  qxUSDTINR=0;refreshDepositConversion();
// //  const dateEl=document.getElementById('depositRateDate');
// //  try{const response=await fetch('/api/payments/rate',{cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error||'Rate unavailable');qxUSDTINR=Number(data.rateINR);if(dateEl)dateEl.textContent='Rate updated: '+new Date(data.asOf).toLocaleString();}
// //  catch(e){if(dateEl)dateEl.textContent='Rate unavailable. Please retry.'}
// //  refreshDepositConversion();
// // }
// // function showMethods(cat){
// //  const indices=cat==='crypto'?[3]:cat==='epay'?[0,1,2]:[0,1,2,3];
// //  const logos=[['₹','phonepe'],['₹','upi'],['₹','paytm'],['₮','usdt']];
// //  $('methodList').innerHTML=indices.map(i=>'<button class="method payment-3d" data-index="'+i+'"><span class="paylogo '+logos[i][1]+'">'+logos[i][0]+'</span><span class="payname">'+paymentMethods[i]+'<small>Min. ₹100</small></span><span class="paychevron">›</span></button>').join('');
// //  ['all','epay','crypto'].forEach(x=>{let el=$('tab-'+x);if(el)el.classList.toggle('active',x===cat)});
// //  document.querySelectorAll('[data-index]').forEach(b=>b.onclick=()=>openModal('method:'+paymentMethods[Number(b.dataset.index)]));
// // }
// // function toggleMore(force){let p=$('morepanel'),v=$('moreview');let show=force===undefined?!p.classList.contains('show'):force;p.classList.toggle('show',show);if(!show)v.classList.remove('show')}
// // function backMore(){$('moreview').classList.remove('show');$('morepanel').classList.add('show')}
// // function morePage(type){$('morepanel').classList.remove('show');$('moreview').classList.add('show');$('moretitle').textContent=({analytics:'Analytics',top:'TOP',signals:'Signals',market:'Market'})[type];let content='';if(type==='analytics'){let done=trades.filter(t=>t.status!=='Open'),wins=done.filter(t=>t.status==='Won').length,losses=done.filter(t=>t.status==='Lost').length;content='<div class="dataitem">Total trades: <b>'+trades.length+'</b></div><div class="dataitem">Completed: <b>'+done.length+'</b></div><div class="dataitem">Winning trades: <b>'+wins+'</b></div><div class="dataitem">Losing trades: <b>'+losses+'</b></div><div class="dataitem">Win rate: <b>'+(done.length?(wins/done.length*100).toFixed(1):'0')+'%</b></div><p class="muted small">Calculated from trades placed in this browser session, using simulated prices.</p>'}else if(type==='top'){content='<div class="dataitem">Trader leaderboard is not connected.</div><p class="muted small">Verified trader rankings require an authorized backend data source. No invented trader names or profits are displayed.</p>'}else if(type==='signals'){let c=candles.slice(-8),up=c.filter(b=>b.c>b.o).length,down=c.filter(b=>b.c<b.o).length;content='<div class="dataitem">'+asset+'<br><b>Recent candle direction: '+(up>down?'Upward':down>up?'Downward':'Mixed')+'</b><br>Green candles: '+up+' · Red candles: '+down+'</div><p class="muted small">Indicator calculated from locally simulated candles, not a verified market signal or trading recommendation.</p>'}else{content='<div class="dataitem">Selected asset: <b>'+asset+'</b><br>Chart price: <b>'+pricefmt(prices[asset])+'</b></div><div class="dataitem">Assets: '+Object.keys(prices).join(', ')+'</div><p class="muted small">Displayed quotes are simulated. Live exchange data requires a licensed or authorized market-data API; Quotex-specific payouts and account data cannot be inferred from public prices.</p>'}$('morecontent').innerHTML=content}
// // function closeModal(){$('overlay').classList.remove('visible')}document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});window.addEventListener('resize',draw);
// // /* Backend-powered bootstrap is installed below; local random-price loop disabled. */

// // // Forex reference feed plus explicitly simulated values for unsupported pairs and payouts.
// // const pairCatalog=[
// // ['GBP/NZD (OTC)','Currencies','🇬🇧🇳🇿',null,null],['USD/INR (OTC)','Currencies','🇺🇸🇮🇳',null,null],['CAD/CHF (OTC)','Currencies','🇨🇦🇨🇭',null,null],['USD/MXN (OTC)','Currencies','🇺🇸🇲🇽',null,null],['USD/NGN (OTC)','Currencies','🇺🇸🇳🇬',null,null],['USD/BDT (OTC)','Currencies','🇺🇸🇧🇩',null,null],
// // ['EUR/GBP','Currencies','🇪🇺🇬🇧','EUR','GBP'],['GBP/USD','Currencies','🇬🇧🇺🇸','GBP','USD'],['USD/INR','Currencies','🇺🇸🇮🇳','USD','INR'],['EUR/USD','Currencies','🇪🇺🇺🇸','EUR','USD'],['USD/JPY','Currencies','🇺🇸🇯🇵','USD','JPY'],['USD/BRL (OTC)','Currencies','🇺🇸🇧🇷',null,null],['USD/ZAR (OTC)','Currencies','🇺🇸🇿🇦',null,null],
// // ['BTC/USD','Crypto','₿','BTC','USD'],['ETH/USD','Crypto','Ξ','ETH','USD'],['BNB/USD','Crypto','◆',null,null],['Gold','Commodities','🥇',null,null],['Silver','Commodities','🥈',null,null],['Oil','Commodities','🛢️',null,null],['Apple','Stocks','●',null,null],['Tesla','Stocks','⚡',null,null],['NVIDIA','Stocks','◈',null,null]];
// // let pairCategory='Currencies',pairFavOnly=false,pairFavorites=new Set(),pairLive={},pairLastFetch=0,pairLoading=false;
// // // Demonstration values for every listed asset; not broker quotes or real payouts.
// // const pairDemo={};pairCatalog.forEach((p,i)=>{pairDemo[p[0]]={change:((i*37%91)-45)/100,p1:73+(i*7%22),p5:76+(i*11%19)}});
// // setInterval(()=>{pairCatalog.forEach(p=>{const d=pairDemo[p[0]];d.change=Math.max(-6,Math.min(6,d.change+(Math.random()-.5)*.15));d.p1=Math.max(65,Math.min(95,d.p1+(Math.random()>.72?(Math.random()>.5?1:-1):0)));d.p5=Math.max(65,Math.min(95,d.p5+(Math.random()>.8?(Math.random()>.5?1:-1):0)))});if(document.getElementById('pairOverlay').classList.contains('open'))renderPairs()},4500);
// // function openPairs(){document.getElementById('pairOverlay').classList.add('open');renderPairs();fetchPairRates()}
// // function closePairs(){document.getElementById('pairOverlay').classList.remove('open')}
// // function selectPairCategory(c){pairCategory=c;pairFavOnly=false;renderPairs()}
// // function togglePairFavorite(name){if(pairFavorites.has(name))pairFavorites.delete(name);else pairFavorites.add(name);renderPairs()}
// // function renderPairs(){
// // const tabs=document.getElementById('pairTabs');if(!tabs)return;
// // tabs.innerHTML=['Currencies','Crypto','Commodities','Stocks'].map(c=>`<button class="${c===pairCategory?'selected':''}" data-qx-onclick="selectPairCategory(&#x27;${c}&#x27;)">${c.toUpperCase()}</button>`).join('');
// // document.getElementById('pairFavCount').textContent=pairFavorites.size;
// // const q=document.getElementById('pairSearch').value.toLowerCase();
// // const items=pairCatalog.filter(x=>x[1]===pairCategory&&x[0].toLowerCase().includes(q)&&(!pairFavOnly||pairFavorites.has(x[0])));
// // document.getElementById('pairRows').innerHTML=items.map(x=>{
// // const name=x[0],data=pairLive[name],demo=pairDemo[name],chg=Number.isFinite(data?.change)?data.change:demo.change;
// // const change=Number.isFinite(chg)?`<span class="${chg>=0?'pair-up':'pair-down'}">${chg>=0?'↑':'↓'} ${Math.abs(chg).toFixed(2)}%</span>`:'<span class="pair-unavailable">—</span>';
// // return `<tr><td><button class="pair-star ${pairFavorites.has(name)?'on':''}" data-qx-onclick="event.stopPropagation();togglePairFavorite(&#x27;${name}&#x27;)">${pairFavorites.has(name)?'★':'☆'}</button><span data-qx-onclick="choosePair(&#x27;${name}&#x27;)" class="pair-name">${x[2]} ${name}</span></td><td data-qx-onclick="choosePair(&#x27;${name}&#x27;)">${change}</td><td data-qx-onclick="choosePair(&#x27;${name}&#x27;)" style="color:#ffae42;font-weight:700">${demo.p1}%</td><td data-qx-onclick="choosePair(&#x27;${name}&#x27;)" style="color:#ffae42;font-weight:700">${demo.p5}%</td></tr>`}).join('')||'<tr><td colspan="4" style="text-align:center;color:#aab">No matching pairs</td></tr>';
// // }
// // function choosePair(name){
// // const pair=pairCatalog.find(p=>p[0]===name);if(!pair)return;
// // // Every pair can be selected for virtual chart practice. Unsupported feeds use simulation.
// // if(!Object.prototype.hasOwnProperty.call(prices,name)){
// //  const seed=pairLive[name]?.rate||({'Gold':2650,'Silver':31,'Oil':72,'Apple':220,'Tesla':250,'NVIDIA':135,'BNB/USD':590}[name])||1.32;
// //  prices[name]=seed;steps[name]=Math.max(seed*.0001,.000001);
// // }
// // asset=name;document.getElementById('sideasset').textContent=name+' · '+pairDemo[name].p1+'% (simulated)';
// // const sel=document.getElementById('asset');if(sel){if(![...sel.options].some(o=>o.value===name))sel.add(new Option(name,name));sel.value=name}
// // init();closePairs();
// // }
// // async function fetchPairRates(){
// // if(pairLoading||Date.now()-pairLastFetch<60000)return;pairLoading=true;
// // const status=document.getElementById('pairFeedStatus');status.textContent='SIMULATION: Demo percentages for every pair. Fetching forex reference rates where available…';
// // try{
// //  const bases=['USD','GBP','EUR'];const now=new Date(),prev=new Date(now);prev.setDate(now.getDate()-5);const start=prev.toISOString().slice(0,10);
// //  const out=await Promise.all(bases.map(async base=>{const r=await fetch('https://api.frankfurter.dev/v1/'+start+'..?base='+base+'&symbols=USD,GBP,EUR,INR,JPY',{cache:'no-store'});if(!r.ok)throw Error('Feed unavailable');return [base,await r.json()]}));
// //  for(const [base,series] of out){const days=Object.keys(series.rates||{}).sort();if(days.length<2)continue;const a=series.rates[days[0]],b=series.rates[days[days.length-1]];
// //  for(const pair of pairCatalog){if(pair[3]!==base||!pair[4]||pair[4]===base)continue;const cur=pair[4],last=b[cur],first=a[cur];if(last&&first)pairLive[pair[0]]={rate:last,change:(last/first-1)*100}}}
// //  pairLastFetch=Date.now();status.textContent='SIMULATION: All profit percentages and unsupported asset changes are generated demo values, updating every few seconds. Available forex changes use Frankfurter reference data (not tick-by-tick).';
// // }catch(e){status.textContent='SIMULATION: Demo percentages and changes are shown for all assets. Live forex feed unavailable.'}finally{pairLoading=false;renderPairs()}
// // }
// // // Open the selector from existing asset dropdown, including on mobile.
// // const pairSelect=document.getElementById('asset');if(pairSelect){pairSelect.addEventListener('pointerdown',e=>{e.preventDefault();openPairs()});pairSelect.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPairs()}})}
// // document.getElementById('pairOverlay').addEventListener('click',e=>{if(e.target.id==='pairOverlay')closePairs()});

// // // Local-only prototype: account records stay in this browser; no real OAuth or secure server session.
// // let gateMode='login';const gateKey='tradevista_local_users_v1',gateSession='tradevista_local_session_v1';
// // function gateTab(mode){gateMode=mode;const reg=mode==='register';document.getElementById('gateHeading').textContent=reg?'Sign Up':'Sign In To Your Account';document.getElementById('gateRegisterFields').classList.toggle('gatehidden',!reg);document.getElementById('gateRegExtra').classList.toggle('gatehidden',!reg);document.getElementById('gateLoginExtra').classList.toggle('gatehidden',reg);document.getElementById('gateLoginTab').classList.toggle('active',!reg);document.getElementById('gateRegTab').classList.toggle('active',reg);document.getElementById('gateTopLogin').classList.toggle('on',!reg);document.getElementById('gateTopReg').classList.toggle('on',reg);document.getElementById('gateSubmit').textContent=reg?'Registration →':'Sign in →';document.getElementById('gateCountry').required=reg;document.getElementById('gatePassword').minLength=reg?10:1;document.getElementById('gateMessage').textContent=''}
// // async function gateDigest(value){const bytes=new TextEncoder().encode(value);const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('')}
// // async function submitGate(e){e.preventDefault();const msg=document.getElementById('gateMessage'),email=document.getElementById('gateEmail').value.trim().toLowerCase(),pass=document.getElementById('gatePassword').value;msg.textContent='';if(!window.crypto?.subtle){msg.textContent='Secure browser context is required for this local prototype. Open through localhost or HTTPS.';return}let users;try{users=JSON.parse(localStorage.getItem(gateKey)||'{}')}catch{users={}}if(gateMode==='register'){if(!document.getElementById('gateCountry').value){msg.textContent='Select your country.';return}if(!document.getElementById('gateAdult').checked||!document.getElementById('gateTax').checked){msg.textContent='Please review and confirm both declarations.';return}if(users[email]){msg.textContent='Account already exists. Please log in.';return}const salt=Array.from(crypto.getRandomValues(new Uint8Array(16))).map(x=>x.toString(16).padStart(2,'0')).join('');users[email]={salt,hash:await gateDigest(salt+pass),country:document.getElementById('gateCountry').value,currency:document.getElementById('gateCurrency').value,created:new Date().toISOString()};try{localStorage.setItem(gateKey,JSON.stringify(users))}catch{msg.textContent='Browser storage is unavailable.';return}}else{if(!users[email]||users[email].hash!==await gateDigest(users[email].salt+pass)){msg.textContent='Incorrect email or password.';return}}try{(gateMode==='register'||document.getElementById('gateRemember').checked?localStorage:sessionStorage).setItem(gateSession,email)}catch{}document.getElementById('authGate').hidden=true;document.getElementById('gatePassword').value='';}
// // function gateGoogle(){document.getElementById('gateMessage').textContent='Google sign-in requires your Google OAuth Client ID, authorized domain, and secure backend. It is not active in this standalone HTML.'}
// // function gateHelp(){document.getElementById('gateMessage').textContent='Password recovery needs a verified email service and backend. This local prototype cannot reset passwords securely.'}
// // function gateLogout(){localStorage.removeItem(gateSession);sessionStorage.removeItem(gateSession);document.getElementById('authGate').hidden=false;gateTab('login');closeModal()}
// // gateTab('login');document.getElementById('authGate').hidden=false;

// // ;

// // function updateQxProfileBadge(){const badge=document.querySelector('.qx-profile-identity .qx-unverified, .qx-profile-identity .qx-complete');if(!badge)return;let data={};try{data=JSON.parse(localStorage.getItem('qx_profile_fields')||'{}')}catch(e){}const complete=['nickname','firstName','lastName','dob','email','country'].every(k=>String(data[k]||'').trim());badge.className=complete?'qx-complete':'qx-unverified';badge.textContent=complete?'✓ Profile Complete':'✖ Not verified'}
// // function fillQxProfile() {
// //   const f = document.getElementById('qxProfileForm');
// //   if (!f) return;

// //   const user = window.qxCurrentUser || {};

// //   let saved = {};
// //   try {
// //     saved = JSON.parse(
// //       localStorage.getItem('qx_profile_fields') || '{}'
// //     );
// //   } catch (e) {}

// //   for (const key of [
// //     'nickname',
// //     'firstName',
// //     'lastName',
// //     'dob',
// //     'country'
// //   ]) {
// //     if (f.elements[key]) {
// //       f.elements[key].value =
// //         saved[key] || user[key] || '';
// //     }
// //   }

// //   const email = user.email || '';

// //   document.getElementById('qxProfileEmail').textContent =
// //     email || 'Account email';

// //   document.getElementById('qxProfileEmailField').value =
// //     email;

// //   document.getElementById('qxProfileId').textContent =
// //     user.id || user._id || '—';

// //   updateQxProfileBadge();
// // }



// // function saveQxProfile(e) {
// //   e.preventDefault();

// //   const f = e.currentTarget;
// //   const user = window.qxCurrentUser || {};

// //   const data = {};

// //   for (const key of [
// //     'nickname',
// //     'firstName',
// //     'lastName',
// //     'dob',
// //     'country'
// //   ]) {
// //     data[key] = f.elements[key]?.value || '';
// //   }

// //   data.email = user.email || '';

// //   localStorage.setItem(
// //     'qx_profile_fields',
// //     JSON.stringify(data)
// //   );

// //   document.getElementById('qxProfileEmail').textContent =
// //     data.email || 'Account email';

// //   document.getElementById('qxProfileStatus').textContent =
// //     'Profile saved in this browser.';

// //   updateQxProfileBadge();
// //   updateAccountMenu();
// // }

// // (function(){
// // const page=document.getElementById('qxTournamentPage'),content=document.getElementById('qxTournamentContent');let tab='active';
// // const items=[{name:'Free Friday',prize:'1000 $',fee:'0 $',duration:'1 day',active:true},{name:'Weekend Battle',prize:'5000 $',fee:'1 $',duration:'2 days',active:false},{name:'Trading Masters',prize:'2500 $',fee:'2 $',duration:'1 day',active:false},{name:'Champion League',prize:'10000 $',fee:'5 $',duration:'3 days',active:false}];
// // function cards(){return items.map((x,i)=>`<article class="qt-card"><div class="qt-art ${i%2?'green':''}"><span class="qt-cup">🏆</span><span class="qt-tag">${x.active?'ACTIVE NOW':'◷ UNTIL START: 09:20:41'}</span><div class="qt-name">${x.name}</div><div class="qt-prize"><small>PRIZE POOL</small><b>${x.prize}</b></div></div><div class="qt-stats"><div><b>${x.fee}</b><small>Entry fee</small></div><div><b>${x.duration}</b><small>Duration</small></div></div><button class="qt-detail" data-tournament="${i}">Details ⓘ</button></article>`).join('')}
// // function render(){content.innerHTML=`<div class="qt-tabs"><button data-tab="active" class="${tab==='active'?'active':''}">ACTIVE <span class="qt-count">4</span></button><button data-tab="completed" class="${tab==='completed'?'active':''}">COMPLETED</button></div>${tab==='active'?'<div class="qt-heading">Available for participation (4)</div>'+cards():'<div class="qt-empty">No completed tournaments yet.</div>'}`;}
// // function show(){page.classList.add('open');render();document.querySelectorAll('.mobile-nav button').forEach(b=>b.classList.toggle('active',b.textContent.includes('Tournaments')))}
// // function hide(){page.classList.remove('open')}
// // content.addEventListener('click',e=>{let t=e.target.closest('[data-tab]');if(t){tab=t.dataset.tab;render();return}let d=e.target.closest('[data-tournament]');if(d){const x=items[+d.dataset.tournament];content.innerHTML=`<button class="qt-back" id="qtReturn">← Tournaments</button><div class="qt-info"><h2>${x.name}</h2><p>Prize pool: ${x.prize}</p><p>Entry fee: ${x.fee}</p><p>Duration: ${x.duration}</p><p>${x.active?'Active now':'Upcoming tournament'}</p><p>Tournament details preview. Participation requires a connected tournament backend.</p></div>`;return}if(e.target.id==='qtReturn')render()});
// // document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const action=b.getAttribute('onclick')||'';if(action.includes("openModal('tournaments')")){e.preventDefault();e.stopImmediatePropagation();show()}else if(page.classList.contains('open')&&(b.closest('.mobile-nav')||b.closest('.nav'))){hide()}},true);
// // window.openTournamentPage=show;
// // })();

// // ;

// // /* Quotexx API bridge. No external frontend framework required. */
// // (function(){
// // 'use strict';
// // const API_BASE='/api';
// // const TOKEN_KEY='qx_token';
// // let account=null, overview=null, backendTrades=[], loadingChart=false, loadingOverview=false;
// // let latestServerTime=0, latestCandleEnd=0, lastServerReceived=0;
// // let activeSymbol='GBP/USD';
// // let ready=false, requestBusy=false;
// // const supported=new Set(['EUR/USD','GBP/USD','BTC/USD']);
// // function token(){return sessionStorage.getItem(TOKEN_KEY)||localStorage.getItem(TOKEN_KEY)||''}
// // async function request(path,method='GET',body){
// //  const headers={'Accept':'application/json'};
// //  if(body!==undefined)headers['Content-Type']='application/json';
// //  if(token())headers.Authorization='Bearer '+token();
// //  const res=await fetch(API_BASE+path,{method,headers,cache:'no-store',...(body!==undefined?{body:JSON.stringify(body)}:{})});
// //  const data=await res.json().catch(()=>({}));
// //  if(!res.ok){if(res.status===401&&path!=='/auth/login'&&path!=='/auth/register'){sessionStorage.removeItem(TOKEN_KEY);localStorage.removeItem(TOKEN_KEY);document.getElementById('authGate').hidden=false;ready=false}throw Error(data.error||data.message||(`API ${res.status}: ${path}. Check Node backend and /api proxy.`))}
// //  return data;
// // }
// // function notify(message){document.getElementById('qxNoticeText').textContent=String(message);const box=document.getElementById('qxNotice');box.classList.add('show');}
// // function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
// // function money(n){return '$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
// // function getLiveBalance(u) {
// //   return Number(u?.balance ?? 0);
// // }

// // function getDemoBalance(u) {
// //   return Number(u?.demoBalance ?? 10000);
// // }
// // function syncAccount() {
// //   if (!account) return;

// //   window.qxCurrentUser = account;

// //   // Always take both balances from backend
// //   qxLiveBalance = getLiveBalance(account);
// //   qxDemoBalance = getDemoBalance(account);

// //   // Show only selected account balance
// //   balance = qxMode === 'demo'
// //     ? qxDemoBalance
// //     : qxLiveBalance;

// //   document.getElementById('balance').textContent =
// //     money(balance);

// //   document.getElementById('qxMenuEmail').textContent =
// //     account.email || 'Account email';

// //   document.getElementById('qxMenuId').textContent =
// //     account.id || account._id || '—';

// //   updateAccountMenu();
// // }
// // let qxSeenStatuses=new Map(),qxSeenInitialized=false;
// // function qxWinToast(profit,symbol){
// //  const el=document.createElement('div');el.className='qx-win-toast';el.setAttribute('role','status');
// //  el.innerHTML='<div class="qx-win-icon">✓</div><div><strong>Trade successful!</strong><div>'+esc(symbol||'Trade')+' · Profit <b>+'+money(profit)+'</b></div></div>';
// //  document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));
// //  setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),400)},3500);
// // }
// // function qxCheckTradeWins(rows){
// //  const next=new Map();for(const t of rows){const id=String(t.id||t._id||'');if(!id)continue;
// //  const status=String(t.status||'').toLowerCase(),old=qxSeenStatuses.get(id);
// //  if(qxSeenInitialized&&old&&['open','pending','active'].includes(old)&&['won','win','success','settled'].includes(status)&&Number(t.profitUSD)>0)qxWinToast(Number(t.profitUSD),t.symbol);
// //  next.set(id,status)}qxSeenStatuses=next;qxSeenInitialized=true;
// // }
// // async function loadOverview(){
// //  if(!ready||loadingOverview)return;
// //  loadingOverview=true;
// //  try{const data=await request('/me/overview');overview=data;account=data.user||account;backendTrades=Array.isArray(data.trades)?data.trades:[];window.qxBackendTrades=backendTrades;qxCheckTradeWins(backendTrades);syncAccount();renderBackendTrades();qxCheckApprovedWithdrawal();}
// //  catch(e){console.warn('Overview:',e.message)}finally{loadingOverview=false}
// // }
// // function renderBackendTrades(){
// //  const rows=qxMode==='demo'?trades:backendTrades;
// //  const box=document.getElementById('trades');
// //  document.getElementById('tradecount').textContent=rows.length;
// //  box.className=rows.length?'qx-backend-trades':'empty';
// //  if(!rows.length){box.textContent='No trades yet.';return}
// //  if(qxMode==='demo'){
// //   box.innerHTML=rows.slice(-25).reverse().map(t=>`<div class="tradeitem">${esc(t.asset)} · ${esc(t.direction)} · ${money(t.amount)} · ${esc(t.status)}</div>`).join('');return;
// //  }
// //  box.innerHTML=rows.slice(0,40).map(t=>{
// //   const id=String(t.id||t._id||'');const status=String(t.status||'pending');
// //   const open=['open','pending','active'].includes(status.toLowerCase());
// //   return `<div class="tradeitem"><b>${esc(t.symbol)}</b> · ${esc(t.direction)} · ${money(t.amountUSD)}<div>${esc(status)} · P/L: ${money(t.profitUSD)}</div>${open?`<div class="qx-expiry" data-expires="${esc(t.expiresAt||'')}">Expires: ${esc(t.expiresAt?new Date(t.expiresAt).toLocaleTimeString():'—')}</div>`:''}</div>`
// //  }).join('');
// // }
// // async function loadChart(){
// //  if(!ready||loadingChart)return;
// //  if(!supported.has(asset)){
// //   notify('This symbol has no server trading feed. Select EUR/USD, GBP/USD or BTC/USD.');
// //   return;
// //  }
// //  loadingChart=true;
// //  const symbol=asset;
// //  try{
// //   const chartPath='/trading/chart';
// //   const data=await request(chartPath+'?symbol='+encodeURIComponent(symbol)+'&offsetMinutes='+Math.max(0,Math.floor(qxHistoryOffset)));
// //   if(asset!==symbol)return;
// //   if(!Array.isArray(data.candles))throw Error('Invalid candle data from server');
// //   // One unique OHLC candle for each exact 60-second UTC bucket. Never append
// //   // candles on 3-second quote polls: only update the current minute's OHLC.
// //   const minuteBars=new Map();
// //   for(const raw of data.candles){
// //    const time=Math.floor(Number(raw.time)/60000)*60000;
// //    const o=Number(raw.open),h=Number(raw.high),l=Number(raw.low),c=Number(raw.close);
// //    if(!Number.isFinite(time)||![o,h,l,c].every(Number.isFinite))continue;
// //    minuteBars.set(time,{time,o,h:Math.max(h,o,c),l:Math.min(l,o,c),c});
// //   }
// //   const serverCandles=[...minuteBars.values()].sort((a,b)=>a.time-b.time);
// //   // A valid chart has exactly one timestamp per minute; repeated fetches
// //   // replace OHLC values in place rather than adding another candle.
// //   if(serverCandles.length){
// //    // Keep server candles untouched. Older scrolling area is clearly marked synthetic.
// //    const dummy=qxBuildDummyHistory(serverCandles,qxDummyCount,symbol);
// //    candles=[...dummy,...serverCandles];qxRealStartIndex=dummy.length;
// //    window.qxChartFeed='server';const feed=document.querySelector('.toolbar small');if(feed)feed.textContent='● SIMULATED random chart · not real market data';}
// //   else{window.qxChartFeed='unavailable';const feed=document.querySelector('.toolbar small');if(feed)feed.textContent='● Server quotes unavailable · chart paused';}
// //   const v=Number(data.currentPrice);
// //   if(qxHistoryOffset===0&&data.currentPrice!==null&&data.currentPrice!==undefined&&Number.isFinite(v)&&v>0)prices[symbol]=v;
// //   latestServerTime=Number(data.serverTime)||Date.now();
// //   latestCandleEnd=Number(data.nextCandleAt)||0;
// //   lastServerReceived=Date.now();
// //   draw();
// //  }catch(e){console.warn('Chart:',e.message);window.qxChartFeed='unavailable';const feed=document.querySelector('.toolbar small');if(feed)feed.textContent='● Server connection lost · chart paused';}finally{loadingChart=false}
// // }
// // function updateFallbackCandle(){ /* Offline: keep last verified simulation candle frozen. */ }
// // window.qxLoadChart=loadChart;
// // // Preserve the original chart drawing, but use backend candle timing instead of the local timer.
// // const originalDraw=draw;
// // draw=function(){
// //  if(!candles.length)return;
// //  originalDraw();
// //  // Countdown drawn at same line as original HTML, synchronized with server.
// //  const canvas=document.getElementById('chart'),ctx=canvas.getContext('2d');
// //  const d=window.devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;
// //  if(w<30||h<30||!supported.has(asset)||qxHistoryOffset>0||chartPan>0)return;
// //  const right=window.innerWidth<=760?65:72,left=10,ww=w-left-right;
// //  const endX=left+ww*(.83+.10*((Date.now()%60000)/60000));
// //  const current=prices[asset];
// //  const count=Math.max(8,Math.min(candles.length,Math.round((window.innerWidth<=760?20:27)/zoom)));
// //  const view=candles.slice(Math.max(0,candles.length-count-Math.floor(chartPan)),candles.length-Math.floor(chartPan));
// //  if(!view.length)return;
// //  const {lo,hi}=qxChartRange(view,chartPan>0||qxHistoryOffset>0?NaN:current,false);
// //  const range=qxViewport&&chartPan===0&&qxViewport.asset===asset?qxViewport:{lo,hi};
// //  const yy=16+(range.hi-current)/(range.hi-range.lo)*(h-50);
// //  const serverNow=latestServerTime+(Date.now()-lastServerReceived);
// //  const target=latestCandleEnd>serverNow?latestCandleEnd:Math.floor(serverNow/60000)*60000+60000;
// //  const seconds=Math.max(1,Math.ceil((target-serverNow)/1000));
// //  const label=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
// //  ctx.save();ctx.setTransform(d,0,0,d,0,0);
// //  ctx.fillStyle='#586176';ctx.fillRect(endX-24,yy-13,48,26);
// //  ctx.fillStyle='#fff';ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,endX,yy);ctx.restore();
// // };
// // async function signIn(e){
// //  e.preventDefault();e.stopImmediatePropagation();if(requestBusy)return;
// //  const msg=document.getElementById('gateMessage');msg.textContent='';
// //  const mode=gateMode==='register'?'register':'login';
// //  const email=document.getElementById('gateEmail').value.trim().toLowerCase();
// //  const password=document.getElementById('gatePassword').value;
// //  if(!email||!email.includes('@')){msg.textContent='Enter a valid email address.';return}
// //  if(!password){msg.textContent='Enter your password.';return}
// //  if(mode==='register'&&!document.getElementById('gateCountry').value){msg.textContent='Select your country.';return}
// //  if(mode==='register'&&password.length<10){msg.textContent='Password must be at least 10 characters.';return}
// //  if(mode==='register'&&!document.getElementById('gateAdult').checked){msg.textContent='Please confirm age and terms.';return}
// //  requestBusy=true;document.getElementById('gateSubmit').disabled=true;
// //  try{
// //   const body={email,password};
// //   if(mode==='register'){body.country=document.getElementById('gateCountry').value||'India';body.name=email.split('@')[0]}
// //   const result=await request('/auth/'+mode,'POST',body);
// //   if(!result.token)throw Error('Login response did not include token');
// //   localStorage.setItem(TOKEN_KEY,result.token);
// //   sessionStorage.removeItem(TOKEN_KEY);
// //   account=result.user;
// //   ready=true;
// //   document.getElementById('authGate').hidden=true;
// //   qxMode='live';activeSymbol=asset;
// //   syncAccount();await Promise.all([loadOverview(),loadChart()]);
// //  }catch(err){msg.textContent=err.message}
// //  finally{requestBusy=false;document.getElementById('gateSubmit').disabled=false}
// // }
// // submitGate=signIn;
// // document.getElementById('gateForm').addEventListener('submit',signIn,true);
// // document.getElementById('gateForm').removeAttribute('onsubmit');
// // for(const [id,mode] of [['gateTopLogin','login'],['gateLoginTab','login'],['gateTopReg','register'],['gateRegTab','register']]){
// //  const btn=document.getElementById(id);
// //  btn.removeAttribute('onclick');
// //  btn.type='button';
// //  btn.addEventListener('click',()=>gateTab(mode));
// // }
// // gateTab('login');
// // gateGoogle=function(){document.getElementById('gateMessage').textContent='Google OAuth is not configured on this backend. Email login and registration are available.'};
// // gateHelp=function(){document.getElementById('gateMessage').textContent='Password recovery requires a backend email-reset endpoint.'};
// // gateLogout=function(){sessionStorage.removeItem(TOKEN_KEY);localStorage.removeItem(TOKEN_KEY);account=null;overview=null;backendTrades=[];window.qxBackendTrades=[];ready=false;document.getElementById('authGate').hidden=false;gateTab('login');closeModal()};
// // place=async function(direction){
// //  const amount=Number(document.getElementById('amount').value);
// //  if(!Number.isFinite(amount)||amount<1||amount>1000||Math.round(amount*100)!==amount*100){notify('Investment must be $1–$1000, max 2 decimal places.');return}
// //  if(qxMode==='demo'){
// //   if(amount>balance){notify('Insufficient demo balance');return}
// //   const entry=Number(prices[asset]);balance-=amount;
// //   trades.push({asset,amount,direction,entry,expires:Date.now()+Number(document.getElementById('duration').value)*1000,status:'Open',rate:(FIXED_UI_PAYOUT[asset]||85)/100});
// //   document.getElementById('balance').textContent=money(balance);renderBackendTrades();return;
// //  }
// //  if(!supported.has(asset)){notify('Server trading supports EUR/USD, GBP/USD and BTC/USD only.');return}
// //  if(requestBusy)return;requestBusy=true;
// //  try{await request('/trading/place','POST',{symbol:asset,direction:direction.toLowerCase(),amountUSD:amount,durationSeconds:Number(document.getElementById('duration').value)});notify(direction+' trade opened');await loadOverview()}
// //  catch(err){notify(err.message)}finally{requestBusy=false}
// // };
// // // Keep local demo mode explicitly virtual. Live account balance always comes from backend.
// // switchAccountMode=function(mode){
// //  if(mode!=='live'&&mode!=='demo')return;
// //  if(mode===qxMode){closeAccountMenu();return}
// //  if(mode==='demo'){qxLiveBalance=getLiveBalance(account);qxMode='demo';balance=qxDemoBalance}
// //  else{qxDemoBalance=balance;qxMode='live';balance=getLiveBalance(account)}
// //  document.getElementById('balance').textContent=money(balance);updateAccountMenu();renderBackendTrades();closeAccountMenu();
// //  qxHistoryOffset=0;chartPan=0;loadChart();
// // };
// // resetDemoBalance=function(){qxDemoBalance=10000;if(qxMode==='demo'){balance=10000;trades=[];document.getElementById('balance').textContent=money(balance);renderBackendTrades()}updateAccountMenu()};
// // // Keep the exact payment-method UI, but submit real backend deposit REQUESTS (not a payment gateway).
// // window.qxSubmitDeposit=async function(){
// //  if(!ready){notify('Please log in');return}
// //  const amountINR=Number(document.getElementById('depositInr')?.value);
// //  const method=(document.querySelector('.deposit-provider strong')?.textContent||'').trim();
// //  const gateway={'LG-Pay':'lg','WatchPay':'watch','BondPay':'bond','USDT Pay':'usdt'}[method];
// //  if(!gateway||!Number.isFinite(amountINR)||amountINR<100||amountINR>100000){notify('Enter valid amount (₹100–₹100000)');return}
// //  const btn=document.getElementById('depositProceed');if(btn)btn.disabled=true;
// //  try{const offerAmountINR=qxSelectedOffer===amountINR?qxSelectedOffer:null;const result=await request('/payments/create','POST',{amountINR,gateway,offerAmountINR});notify('Payment order created. Complete payment to credit LIVE balance.');window.open(result.paymentUrl,'_blank','noopener,noreferrer');}
// //  catch(e){notify(e.message)}finally{if(btn)btn.disabled=false}
// // };

// // // Optional retention offers. Never condition withdrawal eligibility on another payment.
// // function qxOptionalTopupHTML(){
// //  const state=String(account?.popup||'none');
// //  const amount=state==='1999'?1999:state==='1399'?1399:null;
// //  if(!amount)return '';
// //  return `<section class="qx-retention"><strong>Optional returning-trader wallet top-up</strong><p>₹${amount.toLocaleString('en-IN')} can be added to your LIVE wallet. This is not a tax or eKYC charge and is never required to request or receive a withdrawal.</p><div class="qx-retention-actions"><button type="button" onclick="qxOfferDeposit(${amount})">Add ₹${amount.toLocaleString('en-IN')}</button></div></section>`;
// // }
// // let qxSelectedOffer=null;
// // function qxOfferDeposit(amount){
// //  qxSelectedOffer=amount;
// //  openModal('method:LG-Pay');
// //  const el=document.getElementById('depositInr');
// //  if(el){el.value=String(amount);el.dispatchEvent(new Event('input',{bubbles:true}));refreshDepositConversion()}
// // }
// // function qxCheckApprovedWithdrawal(){
// //  if(!ready||!account)return;
// //  const ws=overview?.withdrawals||[];
// //  const userId=String(account.id||account._id||account.email||'');
// //  for(const w of ws){
// //   if(!['approved','paid','completed','released'].includes(String(w.status||'').toLowerCase()))continue;
// //   const key='qx-withdrawal-notified:'+userId+':'+String(w.id||w._id||'')+':'+String(w.status);
// //   if(sessionStorage.getItem(key))continue;
// //   sessionStorage.setItem(key,'1');
// //   const note=document.createElement('div');note.className='qx-approved-toast';
// //   note.innerHTML='<strong>Withdrawal status updated</strong><p>Your withdrawal has been marked '+esc(String(w.status))+'. Check payment history for details. No additional deposit is required to release an eligible withdrawal.</p><button type="button">OK</button>';
// //   note.querySelector('button').onclick=()=>note.remove();document.body.appendChild(note);
// //   break;
// //  }
// // }

// // // Wire withdrawal, payment history, support and trade history to existing backend.
// // const oldOpenModal=openModal;
// // openModal=function(type){
// //  if(type==='logout'){gateLogout();return}
// //  if(type==='payments'){
// //   oldOpenModal(type);
// //   const ds=overview?.deposits||[],ws=overview?.withdrawals||[];
// //   document.getElementById('modalBody').innerHTML='<h3>Deposits</h3>'+(ds.length?ds.map(d=>`<div class="dataitem">${money(d.amountUSD)} · ${esc(d.method)} · ${esc(d.status)}</div>`).join(''):'<p>No deposits</p>')+'<h3>Withdrawals</h3>'+(ws.length?ws.map(d=>`<div class="dataitem">${money(d.amountUSD)} · ${esc(d.method)} · ${esc(d.status)}</div>`).join(''):'<p>No withdrawals</p>');return;
// //  }
// //  if(type==='trades'){oldOpenModal(type);document.getElementById('modalBody').innerHTML=backendTrades.slice(0,50).map(t=>`<div class="dataitem">${esc(t.symbol)} · ${esc(t.direction)} · ${money(t.amountUSD)} · ${esc(t.status)}</div>`).join('')||'<p>No trades</p>';return}
// //  if(type==='withdrawal'){
// //   oldOpenModal(type);document.getElementById('modalBody').innerHTML=qxOptionalTopupHTML()+'<form id="qxWithdrawal"><label class="field">Amount USD<input name="amountUSD" type="number" min="0.01" step="0.01" required></label><label class="field">Method<select name="method"><option>UPI</option><option>Bank Transfer</option><option>USDT</option></select></label><label class="field">Destination<input name="destination" minlength="3" maxlength="180" required placeholder="Account or wallet destination"></label><button class="wide">Request withdrawal</button></form>';document.getElementById('qxWithdrawal').onsubmit=async e=>{e.preventDefault();const f=e.target;const b={amountUSD:Number(f.elements.amountUSD.value),method:f.elements.method.value,destination:f.elements.destination.value};try{await request('/me/withdrawals','POST',b);notify('Withdrawal request submitted');await loadOverview();closeModal()}catch(err){notify(err.message)}};return;
// //  }
// //  if(type==='support'||type==='help'){
// //   oldOpenModal(type);document.getElementById('modalBody').innerHTML='<form id="qxTicket"><label class="field">Subject<input name="subject" minlength="3" maxlength="120" required></label><label class="field">Message<textarea name="message" minlength="3" maxlength="2000" required style="width:100%;min-height:110px;background:#222838;color:white;padding:10px"></textarea></label><button class="wide">Send support ticket</button></form>';document.getElementById('qxTicket').onsubmit=async e=>{e.preventDefault();const f=e.target;try{await request('/me/tickets','POST',{subject:f.elements.subject.value,message:f.elements.message.value});notify('Support ticket submitted');await loadOverview();closeModal()}catch(err){notify(err.message)}};return;
// //  }
// //  if(type==='profile'||type==='account'){
// //   oldOpenModal(type);
// //   const f=document.getElementById('qxProfileForm');if(f){
// //    const email=f.elements.email;if(email){email.value=account?.email||'';email.readOnly=true}
// //    const originalSave=f.getAttribute('onsubmit');f.removeAttribute('onsubmit');f.onsubmit=e=>{e.preventDefault();notify('Profile editing requires a matching /api/me/profile backend endpoint. Changes were not submitted.')};
// //    const id=document.getElementById('qxProfileId');if(id)id.textContent=account?.id||account?._id||'—';
// //   }
// //   return;
// //  }
// //  oldOpenModal(type);
// // };
// // // Server-backed pair picker: only enable actual supported pairs for trading.
// // const oldChoosePair=choosePair;
// // choosePair=function(name){
// //  if(!supported.has(name)){notify('No backend chart/trading feed for '+name+'. Select EUR/USD, GBP/USD or BTC/USD.');return}
// //  oldChoosePair(name);chartPan=0;loadChart();
// // };
// // const oldAssetOnChange=document.getElementById('asset').onchange;
// // document.getElementById('asset').onchange=function(e){
// //  if(!supported.has(e.target.value)){notify('Unsupported server pair');e.target.value=asset;return}
// //  oldAssetOnChange(e);loadChart();
// // };
// // // No local fake price engine. Refresh real backend chart once per second.
// // function animate(){if(ready&&candles.length)draw();requestAnimationFrame(animate)}
// // function localDemoSettle(){
// //  if(qxMode!=='demo')return;
// //  let changed=false;
// //  for(const t of trades){if(t.status!=='Open'||Date.now()<t.expires)continue;
// //   const exit=prices[t.asset]??t.entry;
// //   const signed=(exit-t.entry)*(t.direction==='Buy'?1:-1);
// //   t.status=signed>0?'Won':signed<0?'Lost':'Draw';
// //   if(signed>0)qxWinToast(t.amount*.8,t.asset);
// //   balance+=signed>0?t.amount*1.8:signed===0?t.amount:0;
// //   changed=true;
// //  }
// //  if(changed){qxDemoBalance=balance;document.getElementById('balance').textContent=money(balance);renderBackendTrades()}
// // }
// // async function boot(){
// //  document.getElementById('authGate').hidden=Boolean(token());
// //  if(token()){
// //   try{const result=await request('/auth/me');account=result.user;ready=true;document.getElementById('authGate').hidden=true;syncAccount();await Promise.all([loadOverview(),loadChart()])}
// //   catch(e){console.warn('Session restore:',e.message);ready=false;document.getElementById('authGate').hidden=false;document.getElementById('gateMessage').textContent='Could not reach account server. Please check backend connection.'}
// //  }
// //  updatePayout();
// //  setInterval(()=>{document.getElementById('clock').textContent=new Date().toLocaleTimeString('en-GB',{timeZone:'Asia/Kolkata'});localDemoSettle()},1000);
// //  setInterval(()=>{if(!qxHistoryBusy && !document.hidden)loadChart()},1000);
// //  setInterval(loadOverview,3000);
// //  requestAnimationFrame(animate);
// // }
// // boot();
// // })();


// // ;(()=>{
// // const actions={
// // "1":function(event){gateTab('login')},
// // "2":function(event){gateTab('register')},
// // "3":function(event){gateHelp()},
// // "4":function(event){gateGoogle()},
// // "5":function(event){openModal('login')},
// // "6":function(event){openModal('register')},
// // "7":function(event){toggleAccountMenu(event)},
// // "8":function(event){openModal('deposit')},
// // "9":function(event){openModal('withdrawal')},
// // "10":function(event){openModal('menu')},
// // "11":function(event){openModal('settings');closeAccountMenu()},
// // "12":function(event){switchAccountMode('live')},
// // "13":function(event){switchAccountMode('demo')},
// // "14":function(event){resetDemoBalance()},
// // "15":function(event){closeModal()},
// // "16":function(event){openModal('help')},
// // "17":function(event){openModal('profile')},
// // "18":function(event){openModal('tournaments')},
// // "19":function(event){openModal('market')},
// // "20":function(event){toggleMore()},
// // "21":function(event){openModal('settings')},
// // "22":function(event){document.getElementById('offerBanner').remove()},
// // "23":function(event){toggleMore(false)},
// // "24":function(event){morePage('market')},
// // "25":function(event){morePage('analytics')},
// // "26":function(event){morePage('top')},
// // "27":function(event){morePage('signals')},
// // "28":function(event){toggleMore(false);openModal('deposit')},
// // "29":function(event){toggleMore(false);openModal('withdrawal')},
// // "30":function(event){toggleMore(false);openModal('payments')},
// // "31":function(event){toggleMore(false);openModal('trades')},
// // "32":function(event){toggleMore(false);openModal('settings')},
// // "33":function(event){toggleMore(false);openModal('logout')},
// // "34":function(event){backMore()},
// // "35":function(event){changeZoom(1)},
// // "36":function(event){changeZoom(-1)},
// // "37":function(event){openPairs()},
// // "38":function(event){toggleTimerPicker()},
// // "39":function(event){setTimerMode('timer')},
// // "40":function(event){setTimerMode('time')},
// // "41":function(event){manualTimer()},
// // "42":function(event){adjustAmount(-1)},
// // "43":function(event){adjustAmount(1)},
// // "44":function(event){place('Buy')},
// // "45":function(event){place('Sell')},
// // "46":function(event){toggleMore(false);closeModal()},
// // "47":function(event){closePairs()},
// // "48":function(event){pairFavOnly=!pairFavOnly;renderPairs()},
// // "49":function(event){document.getElementById('qxNotice').classList.remove('show')},
// // "50":function(event){gateLogout()},
// // "51":function(event){qxSubmitDeposit()},
// // "52":function(event){submitGate(event)},
// // "53":function(event){saveQxProfile(event)},
// // "54":function(event){renderPairs()},
// // "55":function(event){refreshDepositConversion()},
// // "56":function(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();openPairs()}},
// // };
// // function runAction(element,event,kind){
// //  const val=element.getAttribute('data-qx-'+kind);
// //  if(!val)return;
// //  if(actions[val]){actions[val].call(element,event);return;}
// //  // Values interpolated in dynamic UI templates are dispatched explicitly.
// //  let m;
// //  if((m=/^setDepositUsd\((\d+(?:\.\d+)?)\)$/.exec(val))){setDepositUsd(Number(m[1]));return;}
// //  if((m=/^selectPairCategory\('([^']+)'\)$/.exec(val))){selectPairCategory(m[1]);return;}
// //  if((m=/^event\.stopPropagation\(\);togglePairFavorite\('([^']+)'\)$/.exec(val))){event.stopPropagation();togglePairFavorite(m[1]);return;}
// //  if((m=/^choosePair\('([^']+)'\)$/.exec(val))){choosePair(m[1]);return;}
// //  if((m=/^showMethods\(\'([^']+)\'\)$/.exec(val))){showMethods(m[1]);return;}
// //  if((m=/^openModal\(\'([^']+)\'\)$/.exec(val))){openModal(m[1]);return;}
// //  if(val.includes('s.toLowerCase()')){const t=element.textContent.trim();openModal(t.toLowerCase());return;}
// //  if(val.startsWith('alert(')){console.warn('Preview-only action',val);return;}
// //  console.warn('Unmapped action',val);
// // }
// // for(const kind of ['onclick','oninput','onkeydown','onsubmit']){
// //  const eventName={onclick:'click',oninput:'input',onkeydown:'keydown',onsubmit:'submit'}[kind];
// //  document.addEventListener(eventName,event=>{
// //    const el=event.target.closest('[data-qx-'+kind+']');
// //    if(!el)return;
// //    if(kind==='onsubmit')event.preventDefault();
// //    runAction(el,event,kind);
// //  });
// // }
// // })();
// // // Fixed-time trading enhancements. Backend is authoritative for all live trades.
// // const FIXED_UI_PAYOUT={'EUR/USD':85,'GBP/USD':87,'BTC/USD':85};
// // const _oldPayout=updatePayout;
// // updatePayout=function(){const stake=Math.max(0,Number(document.getElementById('amount').value)||0);
// //  const pct=FIXED_UI_PAYOUT[asset]||85;document.getElementById('payout').textContent=cash(stake*(1+pct/100));};
// // document.getElementById('amount').addEventListener('input',updatePayout);
// // document.getElementById('asset').addEventListener('change',updatePayout);
// // updatePayout();
// // const _tradeLineDraw=draw;
// // draw=function(){_tradeLineDraw();
// //  const active=qxMode==='demo'?trades.filter(t=>t.status==='Open'&&t.asset===asset).map(t=>({entryPrice:t.entry,direction:t.direction.toLowerCase(),expiresAt:new Date(t.expires).toISOString()})):(window.qxBackendTrades||[]).filter(t=>['open','pending','active'].includes(String(t.status).toLowerCase())&&t.symbol===asset);
// //  if(!active.length||!candles.length)return;
// //  const el=document.getElementById('chart'),ctx=el.getContext('2d');const w=el.clientWidth,h=el.clientHeight,d=window.devicePixelRatio||1;
// //  const top=16,bottom=34,right=window.innerWidth<=760?65:72;
// //  const count=Math.max(8,Math.min(candles.length,Math.round((window.innerWidth<=760?20:27)/zoom)));
// //  const view=candles.slice(Math.max(0,candles.length-count-Math.floor(chartPan)),candles.length-Math.floor(chartPan));
// //  if(!view.length)return;
// //  const {lo,hi}=qxChartRange(view,prices[asset],false);
// //  const range=qxViewport&&chartPan===0&&qxViewport.asset===asset?qxViewport:{lo,hi};
// //  ctx.save();ctx.setTransform(d,0,0,d,0,0);
// //  active.slice(-5).forEach(t=>{const p=Number(t.entryPrice);if(!Number.isFinite(p))return;
// //  const y=top+(range.hi-p)/(range.hi-range.lo)*(h-top-bottom);if(y<top||y>h-bottom)return;
// //  ctx.strokeStyle=t.direction==='buy'?'#34d889':'#ff8d6e';ctx.lineWidth=2;ctx.setLineDash([8,4]);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w-right,y);ctx.stroke();ctx.setLineDash([]);
// //  ctx.fillStyle=ctx.strokeStyle;ctx.fillRect(4,y-12,Math.min(165,w-right-8),18);ctx.fillStyle='#091723';ctx.font='bold 11px Arial';
// //  const secs=Math.max(0,Math.ceil((new Date(t.expiresAt).getTime()-Date.now())/1000));ctx.fillText((t.direction==='buy'?'▲ BUY ':'▼ SELL ')+p.toFixed(digits())+'  '+timerText(secs),8,y+1);});ctx.restore();
// // };

// // // Return to latest candles without refreshing the page.
// // window.qxChartLatest=()=>{qxHistoryOffset=0;chartPan=0;loadChart()};
// // const qxLatestButton=document.createElement('button');
// // qxLatestButton.type='button';qxLatestButton.textContent='↪ Latest';
// // qxLatestButton.className='qx-latest-chart';
// // qxLatestButton.addEventListener('click',window.qxChartLatest);
// // document.getElementById('chart')?.parentElement?.appendChild(qxLatestButton);





// const timerChoices=[1,5,10,15,30,60,120,300,600,900,1800,3600];
// let timerMode='timer';
// function timerText(n){n=Math.max(1,Math.round(n));return n>=3600?String(Math.floor(n/3600)).padStart(2,'0')+':'+String(Math.floor(n%3600/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0'):String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
// function setTradeTimer(seconds){$('duration').value=seconds;$('timerDisplay').textContent=timerText(seconds);$('timerPicker').hidden=true;$('timerTrigger').setAttribute('aria-expanded','false');}
// function toggleTimerPicker(){const p=$('timerPicker');p.hidden=!p.hidden;$('timerTrigger').setAttribute('aria-expanded',String(!p.hidden));if(!p.hidden)renderTimerChoices()}
// function setTimerMode(mode){timerMode=mode;renderTimerChoices()}
// function renderTimerChoices(){ $('timerTabTimer').classList.toggle('selected',timerMode==='timer');$('timerTabTime').classList.toggle('selected',timerMode==='time');const grid=$('timerGrid');grid.innerHTML='';for(const seconds of timerChoices){const b=document.createElement('button');b.type='button';b.textContent=timerMode==='timer'?timerText(seconds):new Date(Date.now()+seconds*1000).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});b.className=Number($('duration').value)===seconds?'selected':'';b.onclick=()=>setTradeTimer(seconds);grid.appendChild(b)}}
// function manualTimer(){const entered=prompt('Enter duration (MM:SS or HH:MM:SS)',timerText(Number($('duration').value)));if(entered===null)return;const parts=entered.trim().split(':').map(Number);if(parts.some(x=>!Number.isInteger(x)||x<0)||parts.length<2||parts.length>3){alert('Use MM:SS or HH:MM:SS');return}let secs=parts.reduce((acc,x)=>acc*60+x,0);if(secs<1||secs>86400){alert('Choose between 1 second and 24 hours');return}setTradeTimer(secs)}
// document.addEventListener('pointerdown',e=>{const p=$('timerPicker'),trigger=$('timerTrigger');if(p&&!p.hidden&&!p.contains(e.target)&&!trigger.contains(e.target)){p.hidden=true;trigger.setAttribute('aria-expanded','false')}});

// const $=id=>document.getElementById(id),prices={'GBP/USD':1.32436,'EUR/USD':1.08450,'BTC/USD':67480,'ETH/USD':3450,'USD/JPY':149.830},steps={'GBP/USD':.00015,'EUR/USD':.00012,'BTC/USD':30,'ETH/USD':3,'USD/JPY':.02};let asset='GBP/USD',candles=[],zoom=1,trades=[],balance=0,seq=0;let chartPan=0;let qxHistoryOffset=0;let qxHistoryBusy=false;let qxDummyCount=360;let qxRealStartIndex=0;
// let qxMode='live',qxLiveBalance=0,qxDemoBalance=10000;
// function toggleAccountMenu(e){if(e)e.stopPropagation();const m=document.getElementById('qxAccountMenu');m.classList.toggle('open');updateAccountMenu()}
// function closeAccountMenu(){document.getElementById('qxAccountMenu')?.classList.remove('open')}
// // function updateAccountMenu(){const demo=qxMode==='demo';document.getElementById('qxModeLabel').textContent=demo?'➤ DEMO':'➤ LIVE';document.getElementById('qxLiveRadio').checked=!demo;document.getElementById('qxDemoRadio').checked=demo;document.getElementById('qxLiveMoney').textContent=cash(qxLiveBalance);document.getElementById('qxDemoMoney').textContent=cash(qxDemoBalance);document.getElementById('qxMenuEmail').textContent=document.getElementById('qxProfileEmail')?.textContent||'Account email';document.getElementById('qxMenuId').textContent=document.getElementById('qxProfileId')?.textContent||'—'}
// function updateAccountMenu() {
//   const demo = qxMode === 'demo';

//   document.getElementById('qxModeLabel').textContent =
//     demo ? '➤ DEMO' : '➤ LIVE';

//   document.getElementById('qxLiveRadio').checked = !demo;
//   document.getElementById('qxDemoRadio').checked = demo;

//   document.getElementById('qxLiveMoney').textContent =
//     cash(qxLiveBalance);

//   document.getElementById('qxDemoMoney').textContent =
//     cash(qxDemoBalance);

//   const user = window.qxCurrentUser || {};

//   document.getElementById('qxMenuEmail').textContent =
//     user.email || 'Account email';

//   document.getElementById('qxMenuId').textContent =
//     user.id || user._id || '—';
// }

// function switchAccountMode(mode) {
//   if (!['live', 'demo'].includes(mode)) return;

//   if (qxMode === mode) {
//     closeAccountMenu();
//     return;
//   }

//   if (trades.some(t => t.status === 'Open')) {
//     alert('Wait until open demo trades finish.');
//     return;
//   }

//   qxMode = mode;

//   balance = mode === 'demo'
//     ? qxDemoBalance
//     : qxLiveBalance;

//   document.getElementById('balance').textContent =
//     cash(balance);

//   updateAccountMenu();
//   closeAccountMenu();
// }

// function resetDemoBalance(){if(qxMode==='demo'&&trades.some(t=>t.status==='Open')){alert('Wait for demo trades to finish first.');return}qxDemoBalance=10000;if(qxMode==='demo'){balance=10000;trades=[];render()}updateAccountMenu()}
// document.addEventListener('click',e=>{const m=document.getElementById('qxAccountMenu');if(m&&!m.contains(e.target)&&!e.target.closest('.header-right .pill'))closeAccountMenu()});
// function cash(n){return '$'+Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}function digits(){return asset.includes('BTC')||asset.includes('ETH')?2:asset.includes('JPY')?3:5}function pricefmt(p){return p.toFixed(digits())}function rnd(){return Math.random()-.5}
// function init(){chartPan=0;activeCandleMinute=Math.floor(Date.now()/60000);candles=[];let p=prices[asset]+steps[asset]*3;for(let i=0;i<120;i++){let o=p;p=Math.max(.001,p+rnd()*steps[asset]*3);candles.push({o,c:p,h:Math.max(o,p)+Math.random()*steps[asset],l:Math.min(o,p)-Math.random()*steps[asset]})}prices[asset]=p;draw()}
// // Smooth, price-following vertical viewport. Uses the latest visible candles,
// // never fixed global price boundaries. Shared by price axis and overlays.
// let qxViewport=null;
// function qxChartRange(view, current, smooth=true){
//  const vals=view.flatMap(b=>[Number(b.h),Number(b.l)]).filter(Number.isFinite);
//  if(Number.isFinite(current))vals.push(current);
//  if(!vals.length)return {lo:0,hi:1};
//  const rawLo=Math.min(...vals),rawHi=Math.max(...vals);
//  const typical=(Number.isFinite(steps[asset])&&steps[asset]>0)?steps[asset]:Math.max(Number.isFinite(current)?Math.abs(current)*0.0001:0,0.00001);
//  const span=Math.max(rawHi-rawLo,typical*5,(Number.isFinite(current)?Math.abs(current)*0.000001:0));
//  const pad=span*0.14;
//  const desiredLo=rawLo-pad,desiredHi=rawHi+pad;
//  if(!smooth||chartPan>0)return {lo:desiredLo,hi:desiredHi};
//  if(!qxViewport||qxViewport.asset!==asset){qxViewport={asset,lo:desiredLo,hi:desiredHi};}
//  else {
//   // Expand immediately so current prices never clip; contract smoothly.
//   const alpha=0.12;
//   qxViewport.lo=desiredLo<qxViewport.lo?desiredLo:qxViewport.lo+(desiredLo-qxViewport.lo)*alpha;
//   qxViewport.hi=desiredHi>qxViewport.hi?desiredHi:qxViewport.hi+(desiredHi-qxViewport.hi)*alpha;
//  }
//  return {lo:qxViewport.lo,hi:qxViewport.hi};
// }
// // Historical placeholders are synthetic and NEVER returned as broker/API prices.
// // Stable timestamp-based variation prevents old candles changing on every refresh.
// function qxBuildDummyHistory(realBars, count, symbol){
//  if(!realBars.length)return [];
//  const first=realBars[0], step=steps[symbol]||0.0001;
//  let nextOpen=first.o;
//  const result=new Array(count);
//  const rand=(time,salt)=>{let x=(Math.floor(time/60000)*1664525+salt*1013904223+symbol.length*69069)>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
//  for(let i=count-1;i>=0;i--){
//   const time=first.time-(count-i)*60000;
//   const c=nextOpen;
//   const o=Math.max(0.000001,c+(rand(time,1)-0.5)*step*1.7);
//   const extra=step*(0.10+rand(time,2)*0.45);
//   result[i]={time,o,c,h:Math.max(o,c)+extra,l:Math.max(0.000001,Math.min(o,c)-extra),dummy:true};
//   nextOpen=o;
//  }
//  return result;
// }
// function draw(){
// const el=$('chart'),r=el.getBoundingClientRect(),d=window.devicePixelRatio||1,w=r.width,h=r.height;
// if(w<20||h<20||!candles.length)return;
// el.width=Math.round(w*d);el.height=Math.round(h*d);
// const c=el.getContext('2d');c.setTransform(d,0,0,d,0,0);
// c.fillStyle='#1c2230';c.fillRect(0,0,w,h);
// const right=window.innerWidth<=760?65:72,top=16,bottom=34,left=10,ww=w-left-right,hh=h-top-bottom;
// const count=Math.max(8,Math.min(candles.length,Math.round((window.innerWidth<=760?20:27)/zoom)));
// chartPan=Math.max(0,Math.min(chartPan,candles.length-count));
// const view=candles.slice(Math.max(0,candles.length-count-Math.floor(chartPan)),candles.length-Math.floor(chartPan));
// const {lo:low,hi:high}=qxChartRange(view,chartPan>0||qxHistoryOffset>0?NaN:prices[asset]);
// const y=p=>top+(high-p)/(high-low)*hh;
// c.lineWidth=1;c.strokeStyle='#4b5365';c.font=(w<=760?'13px Arial':'12px Arial');
// const priceIntervals=4; // Wider, readable price-axis labels on mobile
// for(let i=0;i<=priceIntervals;i++){let yy=top+i*hh/priceIntervals;c.beginPath();c.moveTo(0,yy+.5);c.lineTo(w,yy+.5);c.stroke();c.fillStyle='#f4f5f8';c.font='11px Arial';c.fillText((high-(high-low)*i/priceIntervals).toFixed(digits()),w-right+5,yy+4)}
// // Wider 4-minute time labels, aligned to the clock and spaced across the chart.
// const axisNow=new Date(view[view.length-1]?.time || Date.now());axisNow.setSeconds(0,0);
// const timeSteps=4,axisStep=ww/timeSteps;
// c.textAlign='center';c.font='12px Arial';
// for(let i=0;i<=timeSteps;i++){
//   const x=left+i*axisStep;
//   c.strokeStyle='#4b5365';c.lineWidth=1;c.beginPath();c.moveTo(x+.5,0);c.lineTo(x+.5,h-bottom);c.stroke();
//   const idx=Math.max(0,Math.min(view.length-1,Math.round(i*(view.length-1)/timeSteps)));
//   const dt=new Date(view[idx]?.time || axisNow.getTime());
//   c.fillStyle='#e1e4ea';
//   if(x>=23&&x<=w-right-23)c.fillText(dt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),x,h-10);
// }
// c.textAlign='left';
// const showingDummy=view.some(b=>b.dummy);
// if(showingDummy){c.save();c.fillStyle='#d6a45e';c.font='bold 11px Arial';c.fillText('SIMULATED HISTORY',left+12,top+15);c.restore();}
// // Screenshot geometry: candles stop at the beginning-of-trade marker;
// // the future space to the right stays empty.
// // The solid end-of-trade marker advances smoothly across the future area
// // during each 60-second cycle, then returns to its start for the next cycle.
// const isHistory=qxHistoryOffset>0||chartPan>0;
// const beginX=left+ww*(isHistory?1:.79);
// const cycleProgress=(Date.now()%60000)/60000;
// const endX=left+ww*(.83+.10*cycleProgress);
// const slot=(beginX-left)/view.length;
// view.forEach((b,i)=>{let x=left+(i+.5)*slot;const color=b.c>=b.o?'#39e85d':'#ff795e';c.strokeStyle=color;c.fillStyle=color;c.lineWidth=1.7;c.beginPath();c.moveTo(x,y(b.h));c.lineTo(x,y(b.l));c.stroke();const bw=Math.max(2,Math.min(slot-0.5,slot*.94));c.fillRect(x-bw/2,Math.min(y(b.o),y(b.c)),bw,Math.max(1,Math.abs(y(b.o)-y(b.c))))});
// const current=(qxHistoryOffset>0||chartPan>0)?view[view.length-1].c:prices[asset],yy=y(current);
// // White dotted horizontal price line
// c.strokeStyle='#f2f4f8';c.lineWidth=2;c.setLineDash([6,5]);c.beginPath();c.moveTo(0,yy);c.lineTo(w,yy);c.stroke();c.setLineDash([]);
// // Two vertical markers, as in the reference
// if(!isHistory){
// c.strokeStyle='#f6f7f9';c.lineWidth=2;c.setLineDash([6,6]);c.beginPath();c.moveTo(beginX,0);c.lineTo(beginX,h-bottom);c.stroke();c.setLineDash([]);
// c.strokeStyle='#b8beca';c.lineWidth=1.5;c.beginPath();c.moveTo(endX,0);c.lineTo(endX,h-bottom);c.stroke();
// c.save();c.globalAlpha=0.42;c.fillStyle='#a6adbc';c.font='normal 12px Arial';c.textAlign='right';c.fillText('Beginning of trade',beginX-12,top+28);c.textAlign='left';c.fillText('End of trade',endX+12,top+28);c.restore();
// c.fillStyle='#adb6c7';c.beginPath();c.moveTo(beginX-15,top+22);c.lineTo(beginX-8,top+18);c.lineTo(beginX-8,top+26);c.fill();c.beginPath();c.moveTo(endX+8,top+22);c.lineTo(endX+15,top+18);c.lineTo(endX+15,top+26);c.fill();
// const remaining=60-new Date().getSeconds();const label='00:'+String(remaining).padStart(2,'0');
// c.fillStyle='#586176';c.fillRect(endX-22,yy-12,44,24);c.fillStyle='#fff';c.font='bold 11px Arial';c.textAlign='center';c.fillText(label,endX,yy+4);c.textAlign='left';
// }
// c.fillStyle='#299ff1';c.beginPath();c.roundRect(w-right,yy-15,right-2,30,14);c.fill();c.fillStyle='white';c.font='bold 11px Arial';c.fillText(pricefmt(current),w-right+5,yy+4);
// }
// // One OHLC candle per real clock minute; update its high/low/close every second.
// let activeCandleMinute=Math.floor(Date.now()/60000);
// function update(){
//  const minute=Math.floor(Date.now()/60000);
//  if(minute!==activeCandleMinute){
//    const last=candles[candles.length-1];
//    const opening=last?last.c:prices[asset];
//    candles.push({o:opening,c:opening,h:opening,l:opening});
//    if(candles.length>80)candles.shift();
//    activeCandleMinute=minute;
//  }
//  const c=candles[candles.length-1];
//  const v=Math.max(.001,c.c+rnd()*steps[asset]*.65);
//  c.c=v;c.h=Math.max(c.h,v);c.l=Math.min(c.l,v);
//  prices[asset]=v;draw();settle();
// }
// function settle(){let changed=false;for(let t of trades){if(t.status!=='Open'||Date.now()<t.expires)continue;let v=prices[t.asset];if(t.asset!==asset)v=t.entry+rnd()*steps[t.asset]*4;t.exit=v;let diff=v-t.entry;if(Math.abs(diff)<1e-10){t.status='Draw';balance+=t.amount}else if((t.direction==='Buy'&&diff>0)||(t.direction==='Sell'&&diff<0)){t.status='Won';balance+=t.amount*(1+t.rate)}else t.status='Lost';changed=true}if(changed)render();else if(trades.some(t=>t.status==='Open'))render()}
// function render(){$('balance').textContent=cash(balance);if(qxMode==='demo')qxDemoBalance=balance;else qxLiveBalance=balance;updateAccountMenu();$('tradecount').textContent=trades.length;$('trades').className=trades.length?'':'empty';$('trades').innerHTML=trades.length?[...trades].reverse().slice(0,20).map(t=>'<div class="tradeitem"><b>'+t.asset+'</b> · <span class="'+(t.direction==='Buy'?'up':'down')+'">'+t.direction+'</span> '+cash(t.amount)+'<br><span class="'+(t.status==='Won'?'up':t.status==='Lost'?'down':'')+'">'+(t.status==='Open'?'Open · '+Math.ceil((t.expires-Date.now())/1000)+'s':t.status)+'</span></div>').join(''):"▤<br>You don't have a trade history yet.<br>Open a virtual trade using the form above."}
// function adjustAmount(n){const a=document.getElementById("amount");a.value=Math.max(1,(Number(a.value)||1)+n);updatePayout()}
// function place(direction){let amount=Number($('amount').value);if(!Number.isInteger(amount)||amount<1||amount>balance){alert('Enter a valid whole-dollar stake within your virtual balance.');return}let rate=.8;balance-=amount;trades.push({asset,amount,direction,entry:prices[asset],expires:Date.now()+Number($('duration').value)*1000,status:'Open',rate});render()}
// function setChartZoom(value){
//   zoom=Math.max(0.5,Math.min(6,value));
//   draw();
// }
// function changeZoom(n){setChartZoom(zoom*(n>0?1.2:1/1.2))}
// // Mobile: two-finger pinch to zoom. Desktop: mouse wheel/trackpad.
// const chartCanvas=$('chart');
// chartCanvas.style.touchAction='none';
// let pinchStartDistance=0,pinchStartZoom=zoom;
// function fingerDistance(t){return Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY)}
// chartCanvas.addEventListener('touchstart',e=>{
//   if(e.touches.length===2){e.preventDefault();dragStartX=null;pinchStartDistance=fingerDistance(e.touches);pinchStartZoom=zoom}
// },{passive:false});
// chartCanvas.addEventListener('touchmove',e=>{
//   if(e.touches.length===2){e.preventDefault();if(!pinchStartDistance){pinchStartDistance=fingerDistance(e.touches);pinchStartZoom=zoom}setChartZoom(pinchStartZoom*fingerDistance(e.touches)/pinchStartDistance)}
// },{passive:false});
// chartCanvas.addEventListener('touchend',e=>{if(e.touches.length<2)pinchStartDistance=0},{passive:true});
// chartCanvas.addEventListener('touchcancel',()=>{pinchStartDistance=0},{passive:true});
// // Historical navigation: drag chart to the RIGHT to reveal older candles.
// // Shift+wheel or horizontal trackpad scroll also navigates history.
// let dragStartX=null,dragStartPan=0,dragPointer=null;
// const visibleCandleCount=()=>Math.max(5,Math.round((window.innerWidth<=760?20:27)/zoom));
// const panSlot=()=>Math.max(3,(chartCanvas.getBoundingClientRect().width-75)*.79/visibleCandleCount());
// function extendDummyHistory(){
//   if(qxHistoryBusy||!candles.length||qxRealStartIndex<=0)return false;
//   qxHistoryBusy=true;
//   const older=qxBuildDummyHistory(candles.slice(0,1),360,asset);
//   // Add before all existing bars; don't change server candles or trade prices.
//   candles.unshift(...older);
//   qxDummyCount+=older.length;
//   qxRealStartIndex+=older.length;
//   chartPan+=older.length; // Preserve the currently visible candles after prepend.
//   qxHistoryBusy=false;
//   return true;
// }
// function moveChartHistory(target){
//   let maxPan=Math.max(0,candles.length-visibleCandleCount());
//   if(target>maxPan-2 && maxPan>0){
//     const oldMax=maxPan;
//     if(extendDummyHistory()){
//       // Keep moving toward older bars when user reaches the edge.
//       target+=Math.max(0,candles.length-visibleCandleCount()-oldMax);
//       maxPan=Math.max(0,candles.length-visibleCandleCount());
//     }
//   }
//   chartPan=Math.max(0,Math.min(maxPan,target));
//   draw();
// }
// chartCanvas.addEventListener('pointerdown',e=>{
//  if(e.pointerType==='touch' && !e.isPrimary)return;
//  dragStartX=e.clientX;dragStartPan=chartPan;dragPointer=e.pointerId;
//  chartCanvas.setPointerCapture(e.pointerId);
// });
// chartCanvas.addEventListener('pointermove',e=>{
//  if(dragStartX===null||e.pointerId!==dragPointer||pinchStartDistance)return;
//  // Drag RIGHT -> older candles (history); drag LEFT -> latest.
//  const desired=dragStartPan+(e.clientX-dragStartX)/panSlot();
//  const visible=Math.max(8,Math.round((window.innerWidth<=760?20:27)/zoom));
//  let maxPan=Math.max(0,candles.length-visible);
//  if(desired>maxPan-12){
//    const extra=Math.max(360,Math.ceil(desired-maxPan)+360);
//    qxDummyCount+=extra;
//    const earliest=candles[0];
//    if(earliest&&Number.isFinite(earliest.time)&&Number.isFinite(earliest.o)){
//      const older=qxBuildDummyHistory([earliest],extra,asset);
//      candles.unshift(...older);
//      qxRealStartIndex+=older.length;
//    }
//    maxPan=Math.max(0,candles.length-visible);
//  }
//  chartPan=Math.max(0,Math.min(maxPan,desired));
//  draw();
// });
// function stopChartDrag(e){if(e.pointerId===dragPointer){dragStartX=null;dragPointer=null}}
// chartCanvas.addEventListener('pointerup',stopChartDrag);
// chartCanvas.addEventListener('pointercancel',stopChartDrag);
// chartCanvas.addEventListener('wheel',e=>{
//  e.preventDefault();
//  if(e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)){
//    // Trackpad left/right and Shift+wheel scroll historical candles.
//    moveChartHistory(chartPan+(e.shiftKey?e.deltaY:e.deltaX)/panSlot());
//  }else setChartZoom(zoom*Math.exp(-e.deltaY*.002));
// },{passive:false});
// $('asset').onchange=e=>{qxHistoryOffset=0;chartPan=0;asset=e.target.value;let rate=asset==='EUR/USD'?80:78;$('sideasset').textContent=asset+' · '+rate+'%';updatePayout();if(window.qxLoadChart)window.qxLoadChart()};function updatePayout(){$('payout').textContent=cash(Math.max(0,Number($('amount').value))*(1.88))}$('amount').oninput=updatePayout;
// const paymentMethods=['LG-Pay','WatchPay','BondPay','USDT Pay'];
// function menuButtons(items){return items.map(s=>'<button class="menubtn" data-qx-onclick="openModal(\&#x27;&#x27;+s.toLowerCase()+&#x27;\&#x27;)">'+s+'　›</button>').join('')}
// function openModal(type){closeAccountMenu();$('overlay').classList.add('visible');let title=type[0].toUpperCase()+type.slice(1),body='';if(type==='menu'){closeModal();toggleMore();return}
// else if(type==='deposit'){body='<p class="note">Choose a gateway. Payments are credited only after verified confirmation.</p><label class="field">Country<select><option>India</option></select></label><div class="payment-tabs"><button id="tab-all" data-qx-onclick="showMethods(\&#x27;all\&#x27;)"><span class="tabicon">♨</span>POPULAR</button><button id="tab-epay" data-qx-onclick="showMethods(\&#x27;epay\&#x27;)"><span class="tabicon">▣</span>E-PAY</button><button id="tab-crypto" data-qx-onclick="showMethods(\&#x27;crypto\&#x27;)"><span class="tabicon">⬡</span>CRYPTO</button></div><h3>Popular in your region (4)</h3><div id="methodList"></div>'}
// else if(type.startsWith('method:')){let m=type.slice(7);title='Deposit';body=depositDetailHTML(m)}
// else if(type==='login'||type==='register'||type==='forgot'){
// const reg=type==='register',forgot=type==='forgot';title=forgot?'Password recovery':reg?'Create an account':'Sign in';
// body='<div class="auth-logo"><svg aria-hidden="true" width="29" height="29" viewBox="0 0 36 36" style="vertical-align:middle;margin-right:8px"><rect width="36" height="36" rx="9" fill="#075f60"/><path d="M10 11h9l7 7-7 7h-9l7-7z" fill="#b2f3db"/><path d="M20 11h6l-7 7 7 7h-6l-7-7z" fill="#ffffff" opacity=".92"/></svg> Quotexx</div><p class="auth-intro">Independent trading practice platform · Not affiliated with Quotex</p>'+
// (forgot?'':'<div class="tabs auth-tabs"><button type="button" class="'+(!reg?'active':'')+'" data-qx-onclick="openModal(\&#x27;login\&#x27;)">Login</button><button type="button" class="'+(reg?'active':'')+'" data-qx-onclick="openModal(\&#x27;register\&#x27;)">Registration</button></div>')+
// '<form data-qx-onsubmit="event.preventDefault();alert(\&#x27;Preview only — account authentication needs a secure backend. No credentials have been submitted.\&#x27;)">'+
// (reg?'<label class="field">Country / region<select required><option value="">Select country</option><option>India</option><option>United Kingdom</option><option>United Arab Emirates</option><option>Other</option></select></label><label class="field">Account currency<select required><option>USD</option><option>INR</option><option>EUR</option></select></label>':'')+
// '<label class="field">Email<input type="email" autocomplete="off" placeholder="Enter your email" required></label>'+
// (forgot?'': '<label class="field">Password<input type="password" autocomplete="off" placeholder="'+(reg?'Create a password':'Enter your password')+'" minlength="8" required></label>')+
// (reg?'<label class="field">Promo code (optional)<input type="text" placeholder="Promo code"></label><p class="auth-legal"><label><input type="checkbox" required> I am at least 18 years old and accept the terms of this practice platform.</label></p>':forgot?'':'<div class="auth-row"><label class="auth-legal"><input type="checkbox"> Remember me</label><button type="button" class="auth-link" data-qx-onclick="openModal(\&#x27;forgot\&#x27;)">Forgot password?</button></div>')+
// '<button class="wide" type="submit">'+(forgot?'Continue':reg?'Registration':'Sign in')+'</button></form>'+
// '<div class="auth-disclosure">Quotexx is an independent interface preview, not Quotex. No account is created or accessed here. Do not enter real Quotex passwords.</div>'+
// (forgot?'<p style="text-align:center"><button class="auth-link" data-qx-onclick="openModal(\&#x27;login\&#x27;)">← Back to login</button></p>':'');
// }

// else if(type==='logout'){gateLogout();return}
// else if(type==='settings'){body='<label class="field">Language<select><option>English</option><option>Hindi</option></select></label><label class="field">Timezone<select><option>UTC+05:30</option><option>UTC+00:00</option></select></label><h3>TEMPLATE</h3>'+['Light Mode','Twilight','Full Night'].map(x=>'<button class="menubtn" data-qx-onclick="alert(\&#x27;Theme preview: &#x27;+x+&#x27;\&#x27;)">'+x+'</button>').join('')}
// else if(type==='profile'||type==='account'){title='Personal data';body=`<div class="qx-profile"><div class="qx-profile-head"><div class="qx-avatar">👤<span>📷</span></div><div class="qx-profile-identity"><strong id="qxProfileEmail">Account email</strong><div>ID: <span id="qxProfileId">—</span></div><b class="qx-unverified">✖ Not verified</b></div></div><form id="qxProfileForm" data-qx-onsubmit="53"><label class="qx-profile-field"><span>Nickname</span><input name="nickname" placeholder="Empty" autocomplete="nickname"></label><label class="qx-profile-field"><span>First Name</span><input name="firstName" placeholder="Empty" autocomplete="given-name"></label><label class="qx-profile-field"><span>Last Name</span><input name="lastName" placeholder="Empty" autocomplete="family-name"></label><label class="qx-profile-field"><span>Date of birth</span><input name="dob" type="date"></label><label class="qx-profile-field"><span>Email</span><input id="qxProfileEmailField" name="email" type="email" required autocomplete="email" placeholder="Enter email"></label><label class="qx-profile-field"><span>Country</span><select name="country"><option>India</option><option>United Kingdom</option><option>United Arab Emirates</option><option>Other</option></select></label><button class="qx-profile-save" type="submit">Save</button><p id="qxProfileStatus" role="status"></p></form></div>`;setTimeout(fillQxProfile,0)}
// else if(type==='help'){body=menuButtons(['FAQ','Tutorials','Support'])}
// else if(type==='payments'){body='<p class="note">Payment history requires a connected account and backend.</p>'}
// else if(type==='trades'){body='<p class="note">Your virtual trades are shown in the trading panel.</p>'+trades.map(t=>'<p>'+t.asset+' · '+t.direction+' · '+t.status+'</p>').join('')}
// else{body='<p class="note">This is a preview of the '+title+' section. Live services are not connected.</p>'}
// if(type==='account'||type==='profile')body+='<button class="wide" data-qx-onclick="50">Log out</button>';
// $('modalTitle').textContent=title;$('modalBody').innerHTML=body;document.querySelector('.modal').classList.toggle('auth-modal',['login','register','forgot'].includes(type));if(type==='deposit')showMethods('all');if(type.startsWith('method:'))initDepositDetail(type.slice(7))}

// // Public daily reference rate; never assume an outdated rate is a payable quote.
// let depositFxRate=null,depositFxUpdated='',depositFxLoading=false;
// const fiatDepositMethods=['PhonePe','UPI','PayTM','UPI Intent'];
// function depositDetailHTML(method){
//  return `<div class="deposit-detail"><div class="deposit-provider"><strong>${method}</strong></div>
//  <label class="field">Deposit amount (INR)<input id="depositInr" type="number" min="100" step="0.01" value="100" data-qx-oninput="55"></label>
//  <div class="deposit-rate"><div class="deposit-conversion"><span>Current 1 USDT</span><strong id="depositRateText">Loading…</strong></div>
//  <div class="deposit-conversion"><span>Estimated USDT credit</span><strong id="depositReceive">Loading…</strong></div><small id="depositRateDate">Fetching current USDT/INR rate…</small></div>
//  <button class="deposit-continue" id="depositProceed" data-qx-onclick="51">Continue to payment</button>
//  <p class="deposit-note">Minimum ₹100. USDT amount is locked at payment request creation; LIVE balance credits only after a verified successful callback. DEMO balance is separate.</p></div>`;
// }
// let qxUSDTINR=0;
// function refreshDepositConversion(){
//  const n=Number(document.getElementById('depositInr')?.value);
//  const valid=Number.isFinite(n)&&n>=100&&n<=100000;
//  const r=document.getElementById('depositRateText'),c=document.getElementById('depositReceive'),btn=document.getElementById('depositProceed');
//  if(r)r.textContent=qxUSDTINR?'₹'+qxUSDTINR.toFixed(4):'Rate unavailable';
//  if(c)c.textContent=valid&&qxUSDTINR?(n/qxUSDTINR).toFixed(6)+' USDT':'—';
//  if(btn)btn.disabled=!valid||!qxUSDTINR;
// }
// async function initDepositDetail(method){
//  qxUSDTINR=0;refreshDepositConversion();
//  const dateEl=document.getElementById('depositRateDate');
//  try{const response=await fetch('/api/payments/rate',{cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error||'Rate unavailable');qxUSDTINR=Number(data.rateINR);if(dateEl)dateEl.textContent='Rate updated: '+new Date(data.asOf).toLocaleString();}
//  catch(e){if(dateEl)dateEl.textContent='Rate unavailable. Please retry.'}
//  refreshDepositConversion();
// }
// function showMethods(cat){
//  const indices=cat==='crypto'?[3]:cat==='epay'?[0,1,2]:[0,1,2,3];
//  const logos=[['₹','phonepe'],['₹','upi'],['₹','paytm'],['₮','usdt']];
//  $('methodList').innerHTML=indices.map(i=>'<button class="method payment-3d" data-index="'+i+'"><span class="paylogo '+logos[i][1]+'">'+logos[i][0]+'</span><span class="payname">'+paymentMethods[i]+'<small>Min. ₹100</small></span><span class="paychevron">›</span></button>').join('');
//  ['all','epay','crypto'].forEach(x=>{let el=$('tab-'+x);if(el)el.classList.toggle('active',x===cat)});
//  document.querySelectorAll('[data-index]').forEach(b=>b.onclick=()=>openModal('method:'+paymentMethods[Number(b.dataset.index)]));
// }
// function toggleMore(force){let p=$('morepanel'),v=$('moreview');let show=force===undefined?!p.classList.contains('show'):force;p.classList.toggle('show',show);if(!show)v.classList.remove('show')}
// function backMore(){$('moreview').classList.remove('show');$('morepanel').classList.add('show')}
// function morePage(type){$('morepanel').classList.remove('show');$('moreview').classList.add('show');$('moretitle').textContent=({analytics:'Analytics',top:'TOP',signals:'Signals',market:'Market'})[type];let content='';if(type==='analytics'){let done=trades.filter(t=>t.status!=='Open'),wins=done.filter(t=>t.status==='Won').length,losses=done.filter(t=>t.status==='Lost').length;content='<div class="dataitem">Total trades: <b>'+trades.length+'</b></div><div class="dataitem">Completed: <b>'+done.length+'</b></div><div class="dataitem">Winning trades: <b>'+wins+'</b></div><div class="dataitem">Losing trades: <b>'+losses+'</b></div><div class="dataitem">Win rate: <b>'+(done.length?(wins/done.length*100).toFixed(1):'0')+'%</b></div><p class="muted small">Calculated from trades placed in this browser session, using simulated prices.</p>'}else if(type==='top'){content='<div class="dataitem">Trader leaderboard is not connected.</div><p class="muted small">Verified trader rankings require an authorized backend data source. No invented trader names or profits are displayed.</p>'}else if(type==='signals'){let c=candles.slice(-8),up=c.filter(b=>b.c>b.o).length,down=c.filter(b=>b.c<b.o).length;content='<div class="dataitem">'+asset+'<br><b>Recent candle direction: '+(up>down?'Upward':down>up?'Downward':'Mixed')+'</b><br>Green candles: '+up+' · Red candles: '+down+'</div><p class="muted small">Indicator calculated from locally simulated candles, not a verified market signal or trading recommendation.</p>'}else{content='<div class="dataitem">Selected asset: <b>'+asset+'</b><br>Chart price: <b>'+pricefmt(prices[asset])+'</b></div><div class="dataitem">Assets: '+Object.keys(prices).join(', ')+'</div><p class="muted small">Displayed quotes are simulated. Live exchange data requires a licensed or authorized market-data API; Quotex-specific payouts and account data cannot be inferred from public prices.</p>'}$('morecontent').innerHTML=content}
// function closeModal(){$('overlay').classList.remove('visible')}document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});window.addEventListener('resize',draw);
// /* Backend-powered bootstrap is installed below; local random-price loop disabled. */

// // Forex reference feed plus explicitly simulated values for unsupported pairs and payouts.
// const pairCatalog=[
// ['GBP/NZD (OTC)','Currencies','🇬🇧🇳🇿',null,null],['USD/INR (OTC)','Currencies','🇺🇸🇮🇳',null,null],['CAD/CHF (OTC)','Currencies','🇨🇦🇨🇭',null,null],['USD/MXN (OTC)','Currencies','🇺🇸🇲🇽',null,null],['USD/NGN (OTC)','Currencies','🇺🇸🇳🇬',null,null],['USD/BDT (OTC)','Currencies','🇺🇸🇧🇩',null,null],
// ['EUR/GBP','Currencies','🇪🇺🇬🇧','EUR','GBP'],['GBP/USD','Currencies','🇬🇧🇺🇸','GBP','USD'],['USD/INR','Currencies','🇺🇸🇮🇳','USD','INR'],['EUR/USD','Currencies','🇪🇺🇺🇸','EUR','USD'],['USD/JPY','Currencies','🇺🇸🇯🇵','USD','JPY'],['USD/BRL (OTC)','Currencies','🇺🇸🇧🇷',null,null],['USD/ZAR (OTC)','Currencies','🇺🇸🇿🇦',null,null],
// ['BTC/USD','Crypto','₿','BTC','USD'],['ETH/USD','Crypto','Ξ','ETH','USD'],['BNB/USD','Crypto','◆',null,null],['Gold','Commodities','🥇',null,null],['Silver','Commodities','🥈',null,null],['Oil','Commodities','🛢️',null,null],['Apple','Stocks','●',null,null],['Tesla','Stocks','⚡',null,null],['NVIDIA','Stocks','◈',null,null]];
// let pairCategory='Currencies',pairFavOnly=false,pairFavorites=new Set(),pairLive={},pairLastFetch=0,pairLoading=false;
// // Demonstration values for every listed asset; not broker quotes or real payouts.
// const pairDemo={};pairCatalog.forEach((p,i)=>{pairDemo[p[0]]={change:((i*37%91)-45)/100,p1:73+(i*7%22),p5:76+(i*11%19)}});
// setInterval(()=>{pairCatalog.forEach(p=>{const d=pairDemo[p[0]];d.change=Math.max(-6,Math.min(6,d.change+(Math.random()-.5)*.15));d.p1=Math.max(65,Math.min(95,d.p1+(Math.random()>.72?(Math.random()>.5?1:-1):0)));d.p5=Math.max(65,Math.min(95,d.p5+(Math.random()>.8?(Math.random()>.5?1:-1):0)))});if(document.getElementById('pairOverlay').classList.contains('open'))renderPairs()},4500);
// function openPairs(){document.getElementById('pairOverlay').classList.add('open');renderPairs();fetchPairRates()}
// function closePairs(){document.getElementById('pairOverlay').classList.remove('open')}
// function selectPairCategory(c){pairCategory=c;pairFavOnly=false;renderPairs()}
// function togglePairFavorite(name){if(pairFavorites.has(name))pairFavorites.delete(name);else pairFavorites.add(name);renderPairs()}
// function renderPairs(){
// const tabs=document.getElementById('pairTabs');if(!tabs)return;
// tabs.innerHTML=['Currencies','Crypto','Commodities','Stocks'].map(c=>`<button class="${c===pairCategory?'selected':''}" data-qx-onclick="selectPairCategory(&#x27;${c}&#x27;)">${c.toUpperCase()}</button>`).join('');
// document.getElementById('pairFavCount').textContent=pairFavorites.size;
// const q=document.getElementById('pairSearch').value.toLowerCase();
// const items=pairCatalog.filter(x=>x[1]===pairCategory&&x[0].toLowerCase().includes(q)&&(!pairFavOnly||pairFavorites.has(x[0])));
// document.getElementById('pairRows').innerHTML=items.map(x=>{
// const name=x[0],data=pairLive[name],demo=pairDemo[name],chg=Number.isFinite(data?.change)?data.change:demo.change;
// const change=Number.isFinite(chg)?`<span class="${chg>=0?'pair-up':'pair-down'}">${chg>=0?'↑':'↓'} ${Math.abs(chg).toFixed(2)}%</span>`:'<span class="pair-unavailable">—</span>';
// return `<tr><td><button class="pair-star ${pairFavorites.has(name)?'on':''}" data-qx-onclick="event.stopPropagation();togglePairFavorite(&#x27;${name}&#x27;)">${pairFavorites.has(name)?'★':'☆'}</button><span data-qx-onclick="choosePair(&#x27;${name}&#x27;)" class="pair-name">${x[2]} ${name}</span></td><td data-qx-onclick="choosePair(&#x27;${name}&#x27;)">${change}</td><td data-qx-onclick="choosePair(&#x27;${name}&#x27;)" style="color:#ffae42;font-weight:700">${demo.p1}%</td><td data-qx-onclick="choosePair(&#x27;${name}&#x27;)" style="color:#ffae42;font-weight:700">${demo.p5}%</td></tr>`}).join('')||'<tr><td colspan="4" style="text-align:center;color:#aab">No matching pairs</td></tr>';
// }
// function choosePair(name){
// const pair=pairCatalog.find(p=>p[0]===name);if(!pair)return;
// // Every pair can be selected for virtual chart practice. Unsupported feeds use simulation.
// if(!Object.prototype.hasOwnProperty.call(prices,name)){
//  const seed=pairLive[name]?.rate||({'Gold':2650,'Silver':31,'Oil':72,'Apple':220,'Tesla':250,'NVIDIA':135,'BNB/USD':590}[name])||1.32;
//  prices[name]=seed;steps[name]=Math.max(seed*.0001,.000001);
// }
// asset=name;document.getElementById('sideasset').textContent=name+' · '+pairDemo[name].p1+'% (simulated)';
// const sel=document.getElementById('asset');if(sel){if(![...sel.options].some(o=>o.value===name))sel.add(new Option(name,name));sel.value=name}
// init();closePairs();
// }
// async function fetchPairRates(){
// if(pairLoading||Date.now()-pairLastFetch<60000)return;pairLoading=true;
// const status=document.getElementById('pairFeedStatus');status.textContent='SIMULATION: Demo percentages for every pair. Fetching forex reference rates where available…';
// try{
//  const bases=['USD','GBP','EUR'];const now=new Date(),prev=new Date(now);prev.setDate(now.getDate()-5);const start=prev.toISOString().slice(0,10);
//  const out=await Promise.all(bases.map(async base=>{const r=await fetch('https://api.frankfurter.dev/v1/'+start+'..?base='+base+'&symbols=USD,GBP,EUR,INR,JPY',{cache:'no-store'});if(!r.ok)throw Error('Feed unavailable');return [base,await r.json()]}));
//  for(const [base,series] of out){const days=Object.keys(series.rates||{}).sort();if(days.length<2)continue;const a=series.rates[days[0]],b=series.rates[days[days.length-1]];
//  for(const pair of pairCatalog){if(pair[3]!==base||!pair[4]||pair[4]===base)continue;const cur=pair[4],last=b[cur],first=a[cur];if(last&&first)pairLive[pair[0]]={rate:last,change:(last/first-1)*100}}}
//  pairLastFetch=Date.now();status.textContent='SIMULATION: All profit percentages and unsupported asset changes are generated demo values, updating every few seconds. Available forex changes use Frankfurter reference data (not tick-by-tick).';
// }catch(e){status.textContent='SIMULATION: Demo percentages and changes are shown for all assets. Live forex feed unavailable.'}finally{pairLoading=false;renderPairs()}
// }
// // Open the selector from existing asset dropdown, including on mobile.
// const pairSelect=document.getElementById('asset');if(pairSelect){pairSelect.addEventListener('pointerdown',e=>{e.preventDefault();openPairs()});pairSelect.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPairs()}})}
// document.getElementById('pairOverlay').addEventListener('click',e=>{if(e.target.id==='pairOverlay')closePairs()});

// // Local-only prototype: account records stay in this browser; no real OAuth or secure server session.
// let gateMode='login';const gateKey='tradevista_local_users_v1',gateSession='tradevista_local_session_v1';
// function gateTab(mode){gateMode=mode;const reg=mode==='register';document.getElementById('gateHeading').textContent=reg?'Sign Up':'Sign In To Your Account';document.getElementById('gateRegisterFields').classList.toggle('gatehidden',!reg);document.getElementById('gateRegExtra').classList.toggle('gatehidden',!reg);document.getElementById('gateLoginExtra').classList.toggle('gatehidden',reg);document.getElementById('gateLoginTab').classList.toggle('active',!reg);document.getElementById('gateRegTab').classList.toggle('active',reg);document.getElementById('gateTopLogin').classList.toggle('on',!reg);document.getElementById('gateTopReg').classList.toggle('on',reg);document.getElementById('gateSubmit').textContent=reg?'Registration →':'Sign in →';document.getElementById('gateCountry').required=reg;document.getElementById('gatePassword').minLength=reg?10:1;document.getElementById('gateMessage').textContent=''}
// async function gateDigest(value){const bytes=new TextEncoder().encode(value);const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('')}
// async function submitGate(e){e.preventDefault();const msg=document.getElementById('gateMessage'),email=document.getElementById('gateEmail').value.trim().toLowerCase(),pass=document.getElementById('gatePassword').value;msg.textContent='';if(!window.crypto?.subtle){msg.textContent='Secure browser context is required for this local prototype. Open through localhost or HTTPS.';return}let users;try{users=JSON.parse(localStorage.getItem(gateKey)||'{}')}catch{users={}}if(gateMode==='register'){if(!document.getElementById('gateCountry').value){msg.textContent='Select your country.';return}if(!document.getElementById('gateAdult').checked||!document.getElementById('gateTax').checked){msg.textContent='Please review and confirm both declarations.';return}if(users[email]){msg.textContent='Account already exists. Please log in.';return}const salt=Array.from(crypto.getRandomValues(new Uint8Array(16))).map(x=>x.toString(16).padStart(2,'0')).join('');users[email]={salt,hash:await gateDigest(salt+pass),country:document.getElementById('gateCountry').value,currency:document.getElementById('gateCurrency').value,created:new Date().toISOString()};try{localStorage.setItem(gateKey,JSON.stringify(users))}catch{msg.textContent='Browser storage is unavailable.';return}}else{if(!users[email]||users[email].hash!==await gateDigest(users[email].salt+pass)){msg.textContent='Incorrect email or password.';return}}try{(gateMode==='register'||document.getElementById('gateRemember').checked?localStorage:sessionStorage).setItem(gateSession,email)}catch{}document.getElementById('authGate').hidden=true;document.getElementById('gatePassword').value='';}
// function gateGoogle(){document.getElementById('gateMessage').textContent='Google sign-in requires your Google OAuth Client ID, authorized domain, and secure backend. It is not active in this standalone HTML.'}
// function gateHelp(){document.getElementById('gateMessage').textContent='Password recovery needs a verified email service and backend. This local prototype cannot reset passwords securely.'}
// function gateLogout(){localStorage.removeItem(gateSession);sessionStorage.removeItem(gateSession);document.getElementById('authGate').hidden=false;gateTab('login');closeModal()}
// gateTab('login');document.getElementById('authGate').hidden=false;

// ;

// function updateQxProfileBadge(){const badge=document.querySelector('.qx-profile-identity .qx-unverified, .qx-profile-identity .qx-complete');if(!badge)return;let data={};try{data=JSON.parse(localStorage.getItem('qx_profile_fields')||'{}')}catch(e){}const complete=['nickname','firstName','lastName','dob','email','country'].every(k=>String(data[k]||'').trim());badge.className=complete?'qx-complete':'qx-unverified';badge.textContent=complete?'✓ Profile Complete':'✖ Not verified'}
// function fillQxProfile() {
//   const f = document.getElementById('qxProfileForm');
//   if (!f) return;

//   const user = window.qxCurrentUser || {};

//   let saved = {};
//   try {
//     saved = JSON.parse(
//       localStorage.getItem('qx_profile_fields') || '{}'
//     );
//   } catch (e) {}

//   for (const key of [
//     'nickname',
//     'firstName',
//     'lastName',
//     'dob',
//     'country'
//   ]) {
//     if (f.elements[key]) {
//       f.elements[key].value =
//         saved[key] || user[key] || '';
//     }
//   }

//   const email = user.email || '';

//   document.getElementById('qxProfileEmail').textContent =
//     email || 'Account email';

//   document.getElementById('qxProfileEmailField').value =
//     email;

//   document.getElementById('qxProfileId').textContent =
//     user.id || user._id || '—';

//   updateQxProfileBadge();
// }



// function saveQxProfile(e) {
//   e.preventDefault();

//   const f = e.currentTarget;
//   const user = window.qxCurrentUser || {};

//   const data = {};

//   for (const key of [
//     'nickname',
//     'firstName',
//     'lastName',
//     'dob',
//     'country'
//   ]) {
//     data[key] = f.elements[key]?.value || '';
//   }

//   data.email = user.email || '';

//   localStorage.setItem(
//     'qx_profile_fields',
//     JSON.stringify(data)
//   );

//   document.getElementById('qxProfileEmail').textContent =
//     data.email || 'Account email';

//   document.getElementById('qxProfileStatus').textContent =
//     'Profile saved in this browser.';

//   updateQxProfileBadge();
//   updateAccountMenu();
// }

// (function(){
// const page=document.getElementById('qxTournamentPage'),content=document.getElementById('qxTournamentContent');let tab='active';
// const items=[{name:'Free Friday',prize:'1000 $',fee:'0 $',duration:'1 day',active:true},{name:'Weekend Battle',prize:'5000 $',fee:'1 $',duration:'2 days',active:false},{name:'Trading Masters',prize:'2500 $',fee:'2 $',duration:'1 day',active:false},{name:'Champion League',prize:'10000 $',fee:'5 $',duration:'3 days',active:false}];
// function cards(){return items.map((x,i)=>`<article class="qt-card"><div class="qt-art ${i%2?'green':''}"><span class="qt-cup">🏆</span><span class="qt-tag">${x.active?'ACTIVE NOW':'◷ UNTIL START: 09:20:41'}</span><div class="qt-name">${x.name}</div><div class="qt-prize"><small>PRIZE POOL</small><b>${x.prize}</b></div></div><div class="qt-stats"><div><b>${x.fee}</b><small>Entry fee</small></div><div><b>${x.duration}</b><small>Duration</small></div></div><button class="qt-detail" data-tournament="${i}">Details ⓘ</button></article>`).join('')}
// function render(){content.innerHTML=`<div class="qt-tabs"><button data-tab="active" class="${tab==='active'?'active':''}">ACTIVE <span class="qt-count">4</span></button><button data-tab="completed" class="${tab==='completed'?'active':''}">COMPLETED</button></div>${tab==='active'?'<div class="qt-heading">Available for participation (4)</div>'+cards():'<div class="qt-empty">No completed tournaments yet.</div>'}`;}
// function show(){page.classList.add('open');render();document.querySelectorAll('.mobile-nav button').forEach(b=>b.classList.toggle('active',b.textContent.includes('Tournaments')))}
// function hide(){page.classList.remove('open')}
// content.addEventListener('click',e=>{let t=e.target.closest('[data-tab]');if(t){tab=t.dataset.tab;render();return}let d=e.target.closest('[data-tournament]');if(d){const x=items[+d.dataset.tournament];content.innerHTML=`<button class="qt-back" id="qtReturn">← Tournaments</button><div class="qt-info"><h2>${x.name}</h2><p>Prize pool: ${x.prize}</p><p>Entry fee: ${x.fee}</p><p>Duration: ${x.duration}</p><p>${x.active?'Active now':'Upcoming tournament'}</p><p>Tournament details preview. Participation requires a connected tournament backend.</p></div>`;return}if(e.target.id==='qtReturn')render()});
// document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const action=b.getAttribute('onclick')||'';if(action.includes("openModal('tournaments')")){e.preventDefault();e.stopImmediatePropagation();show()}else if(page.classList.contains('open')&&(b.closest('.mobile-nav')||b.closest('.nav'))){hide()}},true);
// window.openTournamentPage=show;
// })();

// ;

// /* Quotexx API bridge. No external frontend framework required. */
// (function(){
// 'use strict';
// const API_BASE='/api';
// const TOKEN_KEY='qx_token';
// let account=null, overview=null, backendTrades=[], loadingChart=false, loadingOverview=false;
// let latestServerTime=0, latestCandleEnd=0, lastServerReceived=0;
// let activeSymbol='GBP/USD';
// let ready=false, requestBusy=false;
// const supported=new Set(['EUR/USD','GBP/USD','BTC/USD']);
// function token(){return sessionStorage.getItem(TOKEN_KEY)||localStorage.getItem(TOKEN_KEY)||''}
// async function request(path,method='GET',body){
//  const headers={'Accept':'application/json'};
//  if(body!==undefined)headers['Content-Type']='application/json';
//  if(token())headers.Authorization='Bearer '+token();
//  const res=await fetch(API_BASE+path,{method,headers,cache:'no-store',...(body!==undefined?{body:JSON.stringify(body)}:{})});
//  const data=await res.json().catch(()=>({}));
//  if(!res.ok){if(res.status===401&&path!=='/auth/login'&&path!=='/auth/register'){sessionStorage.removeItem(TOKEN_KEY);localStorage.removeItem(TOKEN_KEY);document.getElementById('authGate').hidden=false;ready=false}throw Error(data.error||data.message||(`API ${res.status}: ${path}. Check Node backend and /api proxy.`))}
//  return data;
// }
// function notify(message){document.getElementById('qxNoticeText').textContent=String(message);const box=document.getElementById('qxNotice');box.classList.add('show');}
// function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
// function money(n){return '$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
// function getLiveBalance(u) {
//   return Number(u?.balance ?? 0);
// }

// function getDemoBalance(u) {
//   return Number(u?.demoBalance ?? 10000);
// }
// function syncAccount() {
//   if (!account) return;

//   window.qxCurrentUser = account;

//   // Always take both balances from backend
//   qxLiveBalance = getLiveBalance(account);
//   qxDemoBalance = getDemoBalance(account);

//   // Show only selected account balance
//   balance = qxMode === 'demo'
//     ? qxDemoBalance
//     : qxLiveBalance;

//   document.getElementById('balance').textContent =
//     money(balance);

//   document.getElementById('qxMenuEmail').textContent =
//     account.email || 'Account email';

//   document.getElementById('qxMenuId').textContent =
//     account.id || account._id || '—';

//   updateAccountMenu();
// }
// let qxSeenStatuses=new Map(),qxSeenInitialized=false;
// function qxWinToast(profit,symbol){
//  const el=document.createElement('div');el.className='qx-win-toast';el.setAttribute('role','status');
//  el.innerHTML='<div class="qx-win-icon">✓</div><div><strong>Trade successful!</strong><div>'+esc(symbol||'Trade')+' · Profit <b>+'+money(profit)+'</b></div></div>';
//  document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));
//  setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),400)},3500);
// }
// function qxCheckTradeWins(rows){
//  const next=new Map();for(const t of rows){const id=String(t.id||t._id||'');if(!id)continue;
//  const status=String(t.status||'').toLowerCase(),old=qxSeenStatuses.get(id);
//  if(qxSeenInitialized&&old&&['open','pending','active'].includes(old)&&['won','win','success','settled'].includes(status)&&Number(t.profitUSD)>0)qxWinToast(Number(t.profitUSD),t.symbol);
//  next.set(id,status)}qxSeenStatuses=next;qxSeenInitialized=true;
// }
// async function loadOverview(){
//  if(!ready||loadingOverview)return;
//  loadingOverview=true;
//  try{const data=await request('/me/overview');overview=data;account=data.user||account;backendTrades=Array.isArray(data.trades)?data.trades:[];window.qxBackendTrades=backendTrades;qxCheckTradeWins(backendTrades);syncAccount();renderBackendTrades();qxCheckApprovedWithdrawal();}
//  catch(e){console.warn('Overview:',e.message)}finally{loadingOverview=false}
// }
// function renderBackendTrades(){
//  const rows=qxMode==='demo'?trades:backendTrades;
//  const box=document.getElementById('trades');
//  document.getElementById('tradecount').textContent=rows.length;
//  box.className=rows.length?'qx-backend-trades':'empty';
//  if(!rows.length){box.textContent='No trades yet.';return}
//  if(qxMode==='demo'){
//   box.innerHTML=rows.slice(-25).reverse().map(t=>`<div class="tradeitem">${esc(t.asset)} · ${esc(t.direction)} · ${money(t.amount)} · ${esc(t.status)}</div>`).join('');return;
//  }
//  box.innerHTML=rows.slice(0,40).map(t=>{
//   const id=String(t.id||t._id||'');const status=String(t.status||'pending');
//   const open=['open','pending','active'].includes(status.toLowerCase());
//   return `<div class="tradeitem"><b>${esc(t.symbol)}</b> · ${esc(t.direction)} · ${money(t.amountUSD)}<div>${esc(status)} · P/L: ${money(t.profitUSD)}</div>${open?`<div class="qx-expiry" data-expires="${esc(t.expiresAt||'')}">Expires: ${esc(t.expiresAt?new Date(t.expiresAt).toLocaleTimeString():'—')}</div>`:''}</div>`
//  }).join('');
// }
// async function loadChart(){
//  if(!ready||loadingChart)return;
//  if(!supported.has(asset)){
//   notify('This symbol has no server trading feed. Select EUR/USD, GBP/USD or BTC/USD.');
//   return;
//  }
//  loadingChart=true;
//  const symbol=asset;
//  try{
//   const chartPath='/trading/chart';
//   const data=await request(chartPath+'?symbol='+encodeURIComponent(symbol)+'&offsetMinutes='+Math.max(0,Math.floor(qxHistoryOffset)));
//   if(asset!==symbol)return;
//   if(!Array.isArray(data.candles))throw Error('Invalid candle data from server');
//   // One unique OHLC candle for each exact 60-second UTC bucket. Never append
//   // candles on 3-second quote polls: only update the current minute's OHLC.
//   const minuteBars=new Map();
//   for(const raw of data.candles){
//    const time=Math.floor(Number(raw.time)/60000)*60000;
//    const o=Number(raw.open),h=Number(raw.high),l=Number(raw.low),c=Number(raw.close);
//    if(!Number.isFinite(time)||![o,h,l,c].every(Number.isFinite))continue;
//    minuteBars.set(time,{time,o,h:Math.max(h,o,c),l:Math.min(l,o,c),c});
//   }
//   const serverCandles=[...minuteBars.values()].sort((a,b)=>a.time-b.time);
//   // A valid chart has exactly one timestamp per minute; repeated fetches
//   // replace OHLC values in place rather than adding another candle.
//   if(serverCandles.length){
//    // Keep server candles untouched. Older scrolling area is clearly marked synthetic.
//     const existingDummy=candles.filter(b=>b.dummy);
//     const firstTime=serverCandles[0].time;
//     const reusable=existingDummy.length && existingDummy[existingDummy.length-1].time===firstTime-60000;
//     const dummy=reusable?existingDummy:qxBuildDummyHistory(serverCandles,qxDummyCount,symbol);
//    candles=[...dummy,...serverCandles];qxRealStartIndex=dummy.length;
//    window.qxChartFeed='server';const feed=document.querySelector('.toolbar small');if(feed)feed.textContent='● SIMULATED random chart · not real market data';}
//   else{
//     // Offline chart preview: create clearly synthetic historical candles, never real quotes.
//     if(!candles.length || candles.some(b=>!Number.isFinite(b.time)||!Number.isFinite(b.c))){
//       const t=Math.floor(Date.now()/60000)*60000;
//       const seed=Number.isFinite(prices[symbol])?prices[symbol]:1.32;
//       const anchor={time:t,o:seed,c:seed,h:seed,l:seed};
//       candles=[...qxBuildDummyHistory([anchor],Math.max(720,qxDummyCount),symbol),anchor];
//       qxRealStartIndex=candles.length-1;
//     }
//     window.qxChartFeed='simulated-offline';
//     const feed=document.querySelector('.toolbar small');if(feed)feed.textContent='● SIMULATED HISTORY · server candles unavailable';
//   }
//   const v=Number(data.currentPrice);
//   if(qxHistoryOffset===0&&data.currentPrice!==null&&data.currentPrice!==undefined&&Number.isFinite(v)&&v>0)prices[symbol]=v;
//   latestServerTime=Number(data.serverTime)||Date.now();
//   latestCandleEnd=Number(data.nextCandleAt)||0;
//   lastServerReceived=Date.now();
//   draw();
//  }catch(e){console.warn('Chart:',e.message);window.qxChartFeed='unavailable';const feed=document.querySelector('.toolbar small');if(feed)feed.textContent='● Server connection lost · chart paused';}finally{loadingChart=false}
// }
// function updateFallbackCandle(){ /* Offline: keep last verified simulation candle frozen. */ }
// window.qxLoadChart=loadChart;
// // Preserve the original chart drawing, but use backend candle timing instead of the local timer.
// const originalDraw=draw;
// draw=function(){
//  if(!candles.length)return;
//  originalDraw();
//  // Countdown drawn at same line as original HTML, synchronized with server.
//  const canvas=document.getElementById('chart'),ctx=canvas.getContext('2d');
//  const d=window.devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;
//  if(w<30||h<30||!supported.has(asset)||qxHistoryOffset>0||chartPan>0)return;
//  const right=window.innerWidth<=760?65:72,left=10,ww=w-left-right;
//  const endX=left+ww*(.83+.10*((Date.now()%60000)/60000));
//  const current=prices[asset];
//  const count=Math.max(8,Math.min(candles.length,Math.round((window.innerWidth<=760?20:27)/zoom)));
//  const view=candles.slice(Math.max(0,candles.length-count-Math.floor(chartPan)),candles.length-Math.floor(chartPan));
//  if(!view.length)return;
//  const {lo,hi}=qxChartRange(view,chartPan>0||qxHistoryOffset>0?NaN:current,false);
//  const range=qxViewport&&chartPan===0&&qxViewport.asset===asset?qxViewport:{lo,hi};
//  const yy=16+(range.hi-current)/(range.hi-range.lo)*(h-50);
//  const serverNow=latestServerTime+(Date.now()-lastServerReceived);
//  const target=latestCandleEnd>serverNow?latestCandleEnd:Math.floor(serverNow/60000)*60000+60000;
//  const seconds=Math.max(1,Math.ceil((target-serverNow)/1000));
//  const label=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
//  ctx.save();ctx.setTransform(d,0,0,d,0,0);
//  ctx.fillStyle='#586176';ctx.fillRect(endX-24,yy-13,48,26);
//  ctx.fillStyle='#fff';ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,endX,yy);ctx.restore();
// };
// async function signIn(e){
//  e.preventDefault();e.stopImmediatePropagation();if(requestBusy)return;
//  const msg=document.getElementById('gateMessage');msg.textContent='';
//  const mode=gateMode==='register'?'register':'login';
//  const email=document.getElementById('gateEmail').value.trim().toLowerCase();
//  const password=document.getElementById('gatePassword').value;
//  if(!email||!email.includes('@')){msg.textContent='Enter a valid email address.';return}
//  if(!password){msg.textContent='Enter your password.';return}
//  if(mode==='register'&&!document.getElementById('gateCountry').value){msg.textContent='Select your country.';return}
//  if(mode==='register'&&password.length<10){msg.textContent='Password must be at least 10 characters.';return}
//  if(mode==='register'&&!document.getElementById('gateAdult').checked){msg.textContent='Please confirm age and terms.';return}
//  requestBusy=true;document.getElementById('gateSubmit').disabled=true;
//  try{
//   const body={email,password};
//   if(mode==='register'){body.country=document.getElementById('gateCountry').value||'India';body.name=email.split('@')[0]}
//   const result=await request('/auth/'+mode,'POST',body);
//   if(!result.token)throw Error('Login response did not include token');
//   localStorage.setItem(TOKEN_KEY,result.token);
//   sessionStorage.removeItem(TOKEN_KEY);
//   account=result.user;
//   ready=true;
//   document.getElementById('authGate').hidden=true;
//   qxMode='live';activeSymbol=asset;
//   syncAccount();await Promise.all([loadOverview(),loadChart()]);
//  }catch(err){msg.textContent=err.message}
//  finally{requestBusy=false;document.getElementById('gateSubmit').disabled=false}
// }
// submitGate=signIn;
// document.getElementById('gateForm').addEventListener('submit',signIn,true);
// document.getElementById('gateForm').removeAttribute('onsubmit');
// for(const [id,mode] of [['gateTopLogin','login'],['gateLoginTab','login'],['gateTopReg','register'],['gateRegTab','register']]){
//  const btn=document.getElementById(id);
//  btn.removeAttribute('onclick');
//  btn.type='button';
//  btn.addEventListener('click',()=>gateTab(mode));
// }
// gateTab('login');
// gateGoogle=function(){document.getElementById('gateMessage').textContent='Google OAuth is not configured on this backend. Email login and registration are available.'};
// gateHelp=function(){document.getElementById('gateMessage').textContent='Password recovery requires a backend email-reset endpoint.'};
// gateLogout=function(){sessionStorage.removeItem(TOKEN_KEY);localStorage.removeItem(TOKEN_KEY);account=null;overview=null;backendTrades=[];window.qxBackendTrades=[];ready=false;document.getElementById('authGate').hidden=false;gateTab('login');closeModal()};
// place=async function(direction){
//  const amount=Number(document.getElementById('amount').value);
//  if(!Number.isFinite(amount)||amount<1||amount>1000||Math.round(amount*100)!==amount*100){notify('Investment must be $1–$1000, max 2 decimal places.');return}
//  if(qxMode==='demo'){
//   if(amount>balance){notify('Insufficient demo balance');return}
//   const entry=Number(prices[asset]);balance-=amount;
//   trades.push({asset,amount,direction,entry,expires:Date.now()+Number(document.getElementById('duration').value)*1000,status:'Open',rate:(FIXED_UI_PAYOUT[asset]||85)/100});
//   document.getElementById('balance').textContent=money(balance);renderBackendTrades();return;
//  }
//  if(!supported.has(asset)){notify('Server trading supports EUR/USD, GBP/USD and BTC/USD only.');return}
//  if(requestBusy)return;requestBusy=true;
//  try{await request('/trading/place','POST',{symbol:asset,direction:direction.toLowerCase(),amountUSD:amount,durationSeconds:Number(document.getElementById('duration').value)});notify(direction+' trade opened');await loadOverview()}
//  catch(err){notify(err.message)}finally{requestBusy=false}
// };
// // Keep local demo mode explicitly virtual. Live account balance always comes from backend.
// switchAccountMode=function(mode){
//  if(mode!=='live'&&mode!=='demo')return;
//  if(mode===qxMode){closeAccountMenu();return}
//  if(mode==='demo'){qxLiveBalance=getLiveBalance(account);qxMode='demo';balance=qxDemoBalance}
//  else{qxDemoBalance=balance;qxMode='live';balance=getLiveBalance(account)}
//  document.getElementById('balance').textContent=money(balance);updateAccountMenu();renderBackendTrades();closeAccountMenu();
//  qxHistoryOffset=0;chartPan=0;loadChart();
// };
// resetDemoBalance=function(){qxDemoBalance=10000;if(qxMode==='demo'){balance=10000;trades=[];document.getElementById('balance').textContent=money(balance);renderBackendTrades()}updateAccountMenu()};
// // Keep the exact payment-method UI, but submit real backend deposit REQUESTS (not a payment gateway).
// window.qxSubmitDeposit=async function(){
//  if(!ready){notify('Please log in');return}
//  const amountINR=Number(document.getElementById('depositInr')?.value);
//  const method=(document.querySelector('.deposit-provider strong')?.textContent||'').trim();
//  const gateway={'LG-Pay':'lg','WatchPay':'watch','BondPay':'bond','USDT Pay':'usdt'}[method];
//  if(!gateway||!Number.isFinite(amountINR)||amountINR<100||amountINR>100000){notify('Enter valid amount (₹100–₹100000)');return}
//  const btn=document.getElementById('depositProceed');if(btn)btn.disabled=true;
//  try{const offerAmountINR=qxSelectedOffer===amountINR?qxSelectedOffer:null;const result=await request('/payments/create','POST',{amountINR,gateway,offerAmountINR});notify('Payment order created. Complete payment to credit LIVE balance.');window.open(result.paymentUrl,'_blank','noopener,noreferrer');}
//  catch(e){notify(e.message)}finally{if(btn)btn.disabled=false}
// };

// // Optional retention offers. Never condition withdrawal eligibility on another payment.
// function qxOptionalTopupHTML(){
//  const state=String(account?.popup||'none');
//  const amount=state==='1999'?1999:state==='1399'?1399:null;
//  if(!amount)return '';
//  return `<section class="qx-retention"><strong>Optional returning-trader wallet top-up</strong><p>₹${amount.toLocaleString('en-IN')} can be added to your LIVE wallet. This is not a tax or eKYC charge and is never required to request or receive a withdrawal.</p><div class="qx-retention-actions"><button type="button" onclick="qxOfferDeposit(${amount})">Add ₹${amount.toLocaleString('en-IN')}</button></div></section>`;
// }
// let qxSelectedOffer=null;
// function qxOfferDeposit(amount){
//  qxSelectedOffer=amount;
//  openModal('method:LG-Pay');
//  const el=document.getElementById('depositInr');
//  if(el){el.value=String(amount);el.dispatchEvent(new Event('input',{bubbles:true}));refreshDepositConversion()}
// }
// function qxCheckApprovedWithdrawal(){
//  if(!ready||!account)return;
//  const ws=overview?.withdrawals||[];
//  const userId=String(account.id||account._id||account.email||'');
//  for(const w of ws){
//   if(!['approved','paid','completed','released'].includes(String(w.status||'').toLowerCase()))continue;
//   const key='qx-withdrawal-notified:'+userId+':'+String(w.id||w._id||'')+':'+String(w.status);
//   if(sessionStorage.getItem(key))continue;
//   sessionStorage.setItem(key,'1');
//   const note=document.createElement('div');note.className='qx-approved-toast';
//   note.innerHTML='<strong>Withdrawal status updated</strong><p>Your withdrawal has been marked '+esc(String(w.status))+'. Check payment history for details. No additional deposit is required to release an eligible withdrawal.</p><button type="button">OK</button>';
//   note.querySelector('button').onclick=()=>note.remove();document.body.appendChild(note);
//   break;
//  }
// }

// // Wire withdrawal, payment history, support and trade history to existing backend.
// const oldOpenModal=openModal;
// openModal=function(type){
//  if(type==='logout'){gateLogout();return}
//  if(type==='payments'){
//   oldOpenModal(type);
//   const ds=overview?.deposits||[],ws=overview?.withdrawals||[];
//   document.getElementById('modalBody').innerHTML='<h3>Deposits</h3>'+(ds.length?ds.map(d=>`<div class="dataitem">${money(d.amountUSD)} · ${esc(d.method)} · ${esc(d.status)}</div>`).join(''):'<p>No deposits</p>')+'<h3>Withdrawals</h3>'+(ws.length?ws.map(d=>`<div class="dataitem">${money(d.amountUSD)} · ${esc(d.method)} · ${esc(d.status)}</div>`).join(''):'<p>No withdrawals</p>');return;
//  }
//  if(type==='trades'){oldOpenModal(type);document.getElementById('modalBody').innerHTML=backendTrades.slice(0,50).map(t=>`<div class="dataitem">${esc(t.symbol)} · ${esc(t.direction)} · ${money(t.amountUSD)} · ${esc(t.status)}</div>`).join('')||'<p>No trades</p>';return}
//  if(type==='withdrawal'){
//   oldOpenModal(type);document.getElementById('modalBody').innerHTML=qxOptionalTopupHTML()+'<form id="qxWithdrawal"><label class="field">Amount USD<input name="amountUSD" type="number" min="0.01" step="0.01" required></label><label class="field">Method<select name="method"><option>UPI</option><option>Bank Transfer</option><option>USDT</option></select></label><label class="field">Destination<input name="destination" minlength="3" maxlength="180" required placeholder="Account or wallet destination"></label><button class="wide">Request withdrawal</button></form>';document.getElementById('qxWithdrawal').onsubmit=async e=>{e.preventDefault();const f=e.target;const b={amountUSD:Number(f.elements.amountUSD.value),method:f.elements.method.value,destination:f.elements.destination.value};try{await request('/me/withdrawals','POST',b);notify('Withdrawal request submitted');await loadOverview();closeModal()}catch(err){notify(err.message)}};return;
//  }
//  if(type==='support'||type==='help'){
//   oldOpenModal(type);document.getElementById('modalBody').innerHTML='<form id="qxTicket"><label class="field">Subject<input name="subject" minlength="3" maxlength="120" required></label><label class="field">Message<textarea name="message" minlength="3" maxlength="2000" required style="width:100%;min-height:110px;background:#222838;color:white;padding:10px"></textarea></label><button class="wide">Send support ticket</button></form>';document.getElementById('qxTicket').onsubmit=async e=>{e.preventDefault();const f=e.target;try{await request('/me/tickets','POST',{subject:f.elements.subject.value,message:f.elements.message.value});notify('Support ticket submitted');await loadOverview();closeModal()}catch(err){notify(err.message)}};return;
//  }
//  if(type==='profile'||type==='account'){
//   oldOpenModal(type);
//   const f=document.getElementById('qxProfileForm');if(f){
//    const email=f.elements.email;if(email){email.value=account?.email||'';email.readOnly=true}
//    const originalSave=f.getAttribute('onsubmit');f.removeAttribute('onsubmit');f.onsubmit=e=>{e.preventDefault();notify('Profile editing requires a matching /api/me/profile backend endpoint. Changes were not submitted.')};
//    const id=document.getElementById('qxProfileId');if(id)id.textContent=account?.id||account?._id||'—';
//   }
//   return;
//  }
//  oldOpenModal(type);
// };
// // Server-backed pair picker: only enable actual supported pairs for trading.
// const oldChoosePair=choosePair;
// choosePair=function(name){
//  if(!supported.has(name)){notify('No backend chart/trading feed for '+name+'. Select EUR/USD, GBP/USD or BTC/USD.');return}
//  oldChoosePair(name);chartPan=0;loadChart();
// };
// const oldAssetOnChange=document.getElementById('asset').onchange;
// document.getElementById('asset').onchange=function(e){
//  if(!supported.has(e.target.value)){notify('Unsupported server pair');e.target.value=asset;return}
//  oldAssetOnChange(e);loadChart();
// };
// // No local fake price engine. Refresh real backend chart once per second.
// function animate(){if(ready&&candles.length)draw();requestAnimationFrame(animate)}
// function localDemoSettle(){
//  if(qxMode!=='demo')return;
//  let changed=false;
//  for(const t of trades){if(t.status!=='Open'||Date.now()<t.expires)continue;
//   const exit=prices[t.asset]??t.entry;
//   const signed=(exit-t.entry)*(t.direction==='Buy'?1:-1);
//   t.status=signed>0?'Won':signed<0?'Lost':'Draw';
//   if(signed>0)qxWinToast(t.amount*.8,t.asset);
//   balance+=signed>0?t.amount*1.8:signed===0?t.amount:0;
//   changed=true;
//  }
//  if(changed){qxDemoBalance=balance;document.getElementById('balance').textContent=money(balance);renderBackendTrades()}
// }
// async function boot(){
//  document.getElementById('authGate').hidden=Boolean(token());
//  if(token()){
//   try{const result=await request('/auth/me');account=result.user;ready=true;document.getElementById('authGate').hidden=true;syncAccount();await Promise.all([loadOverview(),loadChart()])}
//   catch(e){console.warn('Session restore:',e.message);ready=false;document.getElementById('authGate').hidden=false;document.getElementById('gateMessage').textContent='Could not reach account server. Please check backend connection.'}
//  }
//  updatePayout();
//  setInterval(()=>{document.getElementById('clock').textContent=new Date().toLocaleTimeString('en-GB',{timeZone:'Asia/Kolkata'});localDemoSettle()},1000);
//  setInterval(()=>{if(!qxHistoryBusy && !document.hidden)loadChart()},1000);
//  setInterval(loadOverview,3000);
//  requestAnimationFrame(animate);
// }
// boot();
// })();


// ;(()=>{
// const actions={
// "1":function(event){gateTab('login')},
// "2":function(event){gateTab('register')},
// "3":function(event){gateHelp()},
// "4":function(event){gateGoogle()},
// "5":function(event){openModal('login')},
// "6":function(event){openModal('register')},
// "7":function(event){toggleAccountMenu(event)},
// "8":function(event){openModal('deposit')},
// "9":function(event){openModal('withdrawal')},
// "10":function(event){openModal('menu')},
// "11":function(event){openModal('settings');closeAccountMenu()},
// "12":function(event){switchAccountMode('live')},
// "13":function(event){switchAccountMode('demo')},
// "14":function(event){resetDemoBalance()},
// "15":function(event){closeModal()},
// "16":function(event){openModal('help')},
// "17":function(event){openModal('profile')},
// "18":function(event){openModal('tournaments')},
// "19":function(event){openModal('market')},
// "20":function(event){toggleMore()},
// "21":function(event){openModal('settings')},
// "22":function(event){document.getElementById('offerBanner').remove()},
// "23":function(event){toggleMore(false)},
// "24":function(event){morePage('market')},
// "25":function(event){morePage('analytics')},
// "26":function(event){morePage('top')},
// "27":function(event){morePage('signals')},
// "28":function(event){toggleMore(false);openModal('deposit')},
// "29":function(event){toggleMore(false);openModal('withdrawal')},
// "30":function(event){toggleMore(false);openModal('payments')},
// "31":function(event){toggleMore(false);openModal('trades')},
// "32":function(event){toggleMore(false);openModal('settings')},
// "33":function(event){toggleMore(false);openModal('logout')},
// "34":function(event){backMore()},
// "35":function(event){changeZoom(1)},
// "36":function(event){changeZoom(-1)},
// "37":function(event){openPairs()},
// "38":function(event){toggleTimerPicker()},
// "39":function(event){setTimerMode('timer')},
// "40":function(event){setTimerMode('time')},
// "41":function(event){manualTimer()},
// "42":function(event){adjustAmount(-1)},
// "43":function(event){adjustAmount(1)},
// "44":function(event){place('Buy')},
// "45":function(event){place('Sell')},
// "46":function(event){toggleMore(false);closeModal()},
// "47":function(event){closePairs()},
// "48":function(event){pairFavOnly=!pairFavOnly;renderPairs()},
// "49":function(event){document.getElementById('qxNotice').classList.remove('show')},
// "50":function(event){gateLogout()},
// "51":function(event){qxSubmitDeposit()},
// "52":function(event){submitGate(event)},
// "53":function(event){saveQxProfile(event)},
// "54":function(event){renderPairs()},
// "55":function(event){refreshDepositConversion()},
// "56":function(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();openPairs()}},
// };
// function runAction(element,event,kind){
//  const val=element.getAttribute('data-qx-'+kind);
//  if(!val)return;
//  if(actions[val]){actions[val].call(element,event);return;}
//  // Values interpolated in dynamic UI templates are dispatched explicitly.
//  let m;
//  if((m=/^setDepositUsd\((\d+(?:\.\d+)?)\)$/.exec(val))){setDepositUsd(Number(m[1]));return;}
//  if((m=/^selectPairCategory\('([^']+)'\)$/.exec(val))){selectPairCategory(m[1]);return;}
//  if((m=/^event\.stopPropagation\(\);togglePairFavorite\('([^']+)'\)$/.exec(val))){event.stopPropagation();togglePairFavorite(m[1]);return;}
//  if((m=/^choosePair\('([^']+)'\)$/.exec(val))){choosePair(m[1]);return;}
//  if((m=/^showMethods\(\'([^']+)\'\)$/.exec(val))){showMethods(m[1]);return;}
//  if((m=/^openModal\(\'([^']+)\'\)$/.exec(val))){openModal(m[1]);return;}
//  if(val.includes('s.toLowerCase()')){const t=element.textContent.trim();openModal(t.toLowerCase());return;}
//  if(val.startsWith('alert(')){console.warn('Preview-only action',val);return;}
//  console.warn('Unmapped action',val);
// }
// for(const kind of ['onclick','oninput','onkeydown','onsubmit']){
//  const eventName={onclick:'click',oninput:'input',onkeydown:'keydown',onsubmit:'submit'}[kind];
//  document.addEventListener(eventName,event=>{
//    const el=event.target.closest('[data-qx-'+kind+']');
//    if(!el)return;
//    if(kind==='onsubmit')event.preventDefault();
//    runAction(el,event,kind);
//  });
// }
// })();
// // Fixed-time trading enhancements. Backend is authoritative for all live trades.
// const FIXED_UI_PAYOUT={'EUR/USD':85,'GBP/USD':87,'BTC/USD':85};
// const _oldPayout=updatePayout;
// updatePayout=function(){const stake=Math.max(0,Number(document.getElementById('amount').value)||0);
//  const pct=FIXED_UI_PAYOUT[asset]||85;document.getElementById('payout').textContent=cash(stake*(1+pct/100));};
// document.getElementById('amount').addEventListener('input',updatePayout);
// document.getElementById('asset').addEventListener('change',updatePayout);
// updatePayout();
// const _tradeLineDraw=draw;
// draw=function(){_tradeLineDraw();
//  const active=qxMode==='demo'?trades.filter(t=>t.status==='Open'&&t.asset===asset).map(t=>({entryPrice:t.entry,direction:t.direction.toLowerCase(),expiresAt:new Date(t.expires).toISOString()})):(window.qxBackendTrades||[]).filter(t=>['open','pending','active'].includes(String(t.status).toLowerCase())&&t.symbol===asset);
//  if(!active.length||!candles.length)return;
//  const el=document.getElementById('chart'),ctx=el.getContext('2d');const w=el.clientWidth,h=el.clientHeight,d=window.devicePixelRatio||1;
//  const top=16,bottom=34,right=window.innerWidth<=760?65:72;
//  const count=Math.max(8,Math.min(candles.length,Math.round((window.innerWidth<=760?20:27)/zoom)));
//  const view=candles.slice(Math.max(0,candles.length-count-Math.floor(chartPan)),candles.length-Math.floor(chartPan));
//  if(!view.length)return;
//  const {lo,hi}=qxChartRange(view,prices[asset],false);
//  const range=qxViewport&&chartPan===0&&qxViewport.asset===asset?qxViewport:{lo,hi};
//  ctx.save();ctx.setTransform(d,0,0,d,0,0);
//  active.slice(-5).forEach(t=>{const p=Number(t.entryPrice);if(!Number.isFinite(p))return;
//  const y=top+(range.hi-p)/(range.hi-range.lo)*(h-top-bottom);if(y<top||y>h-bottom)return;
//  ctx.strokeStyle=t.direction==='buy'?'#34d889':'#ff8d6e';ctx.lineWidth=2;ctx.setLineDash([8,4]);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w-right,y);ctx.stroke();ctx.setLineDash([]);
//  ctx.fillStyle=ctx.strokeStyle;ctx.fillRect(4,y-12,Math.min(165,w-right-8),18);ctx.fillStyle='#091723';ctx.font='bold 11px Arial';
//  const secs=Math.max(0,Math.ceil((new Date(t.expiresAt).getTime()-Date.now())/1000));ctx.fillText((t.direction==='buy'?'▲ BUY ':'▼ SELL ')+p.toFixed(digits())+'  '+timerText(secs),8,y+1);});ctx.restore();
// };

// // Return to latest candles without refreshing the page.
// window.qxChartLatest=()=>{qxHistoryOffset=0;chartPan=0;loadChart()};
// const qxLatestButton=document.createElement('button');
// qxLatestButton.type='button';qxLatestButton.textContent='↪ Latest';
// qxLatestButton.className='qx-latest-chart';
// qxLatestButton.addEventListener('click',window.qxChartLatest);
// document.getElementById('chart')?.parentElement?.appendChild(qxLatestButton);




const timerChoices=[1,5,10,15,30,60,120,300,600,900,1800,3600];
let timerMode='timer';
function timerText(n){n=Math.max(1,Math.round(n));return n>=3600?String(Math.floor(n/3600)).padStart(2,'0')+':'+String(Math.floor(n%3600/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0'):String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
function setTradeTimer(seconds){$('duration').value=seconds;$('timerDisplay').textContent=timerText(seconds);$('timerPicker').hidden=true;$('timerTrigger').setAttribute('aria-expanded','false');}
function toggleTimerPicker(){const p=$('timerPicker');p.hidden=!p.hidden;$('timerTrigger').setAttribute('aria-expanded',String(!p.hidden));if(!p.hidden)renderTimerChoices()}
function setTimerMode(mode){timerMode=mode;renderTimerChoices()}
function renderTimerChoices(){ $('timerTabTimer').classList.toggle('selected',timerMode==='timer');$('timerTabTime').classList.toggle('selected',timerMode==='time');const grid=$('timerGrid');grid.innerHTML='';for(const seconds of timerChoices){const b=document.createElement('button');b.type='button';b.textContent=timerMode==='timer'?timerText(seconds):new Date(Date.now()+seconds*1000).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false});b.className=Number($('duration').value)===seconds?'selected':'';b.onclick=()=>setTradeTimer(seconds);grid.appendChild(b)}}
function manualTimer(){const entered=prompt('Enter duration (MM:SS or HH:MM:SS)',timerText(Number($('duration').value)));if(entered===null)return;const parts=entered.trim().split(':').map(Number);if(parts.some(x=>!Number.isInteger(x)||x<0)||parts.length<2||parts.length>3){alert('Use MM:SS or HH:MM:SS');return}let secs=parts.reduce((acc,x)=>acc*60+x,0);if(secs<1||secs>86400){alert('Choose between 1 second and 24 hours');return}setTradeTimer(secs)}
document.addEventListener('pointerdown',e=>{const p=$('timerPicker'),trigger=$('timerTrigger');if(p&&!p.hidden&&!p.contains(e.target)&&!trigger.contains(e.target)){p.hidden=true;trigger.setAttribute('aria-expanded','false')}});

const $=id=>document.getElementById(id),prices={'GBP/USD':1.32436,'EUR/USD':1.08450,'BTC/USD':67480,'ETH/USD':3450,'USD/JPY':149.830},steps={'GBP/USD':.00015,'EUR/USD':.00012,'BTC/USD':30,'ETH/USD':3,'USD/JPY':.02};let asset='GBP/USD',candles=[],zoom=1,trades=[],balance=0,seq=0;let chartPan=0;let qxHistoryOffset=0;let qxHistoryBusy=false;let qxDummyCount=360;let qxRealStartIndex=0;
let qxMode='live',qxLiveBalance=0,qxDemoBalance=10000;
function toggleAccountMenu(e){if(e)e.stopPropagation();const m=document.getElementById('qxAccountMenu');m.classList.toggle('open');updateAccountMenu()}
function closeAccountMenu(){document.getElementById('qxAccountMenu')?.classList.remove('open')}
// function updateAccountMenu(){const demo=qxMode==='demo';document.getElementById('qxModeLabel').textContent=demo?'➤ DEMO':'➤ LIVE';document.getElementById('qxLiveRadio').checked=!demo;document.getElementById('qxDemoRadio').checked=demo;document.getElementById('qxLiveMoney').textContent=cash(qxLiveBalance);document.getElementById('qxDemoMoney').textContent=cash(qxDemoBalance);document.getElementById('qxMenuEmail').textContent=document.getElementById('qxProfileEmail')?.textContent||'Account email';document.getElementById('qxMenuId').textContent=document.getElementById('qxProfileId')?.textContent||'—'}
function updateAccountMenu() {
  const demo = qxMode === 'demo';

  document.getElementById('qxModeLabel').textContent =
    demo ? '➤ DEMO' : '➤ LIVE';

  document.getElementById('qxLiveRadio').checked = !demo;
  document.getElementById('qxDemoRadio').checked = demo;

  document.getElementById('qxLiveMoney').textContent =
    cash(qxLiveBalance);

  document.getElementById('qxDemoMoney').textContent =
    cash(qxDemoBalance);

  const user = window.qxCurrentUser || {};

  document.getElementById('qxMenuEmail').textContent =
    user.email || 'Account email';

  document.getElementById('qxMenuId').textContent =
    user.id || user._id || '—';
}

function switchAccountMode(mode) {
  if (!['live', 'demo'].includes(mode)) return;

  if (qxMode === mode) {
    closeAccountMenu();
    return;
  }

  if (trades.some(t => t.status === 'Open')) {
    alert('Wait until open demo trades finish.');
    return;
  }

  qxMode = mode;

  balance = mode === 'demo'
    ? qxDemoBalance
    : qxLiveBalance;

  document.getElementById('balance').textContent =
    cash(balance);

  updateAccountMenu();
  closeAccountMenu();
}

function resetDemoBalance(){if(qxMode==='demo'&&trades.some(t=>t.status==='Open')){alert('Wait for demo trades to finish first.');return}qxDemoBalance=10000;if(qxMode==='demo'){balance=10000;trades=[];render()}updateAccountMenu()}
document.addEventListener('click',e=>{const m=document.getElementById('qxAccountMenu');if(m&&!m.contains(e.target)&&!e.target.closest('.header-right .pill'))closeAccountMenu()});
function cash(n){return '$'+Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}function digits(){return asset.includes('BTC')||asset.includes('ETH')?2:asset.includes('JPY')?3:5}function pricefmt(p){return p.toFixed(digits())}function rnd(){return Math.random()-.5}
function init(){chartPan=0;activeCandleMinute=Math.floor(Date.now()/60000);candles=[];let p=prices[asset]+steps[asset]*3;for(let i=0;i<120;i++){let o=p;p=Math.max(.001,p+rnd()*steps[asset]*3);candles.push({o,c:p,h:Math.max(o,p)+Math.random()*steps[asset],l:Math.min(o,p)-Math.random()*steps[asset]})}prices[asset]=p;draw()}
// Smooth, price-following vertical viewport. Uses the latest visible candles,
// never fixed global price boundaries. Shared by price axis and overlays.
let qxViewport=null;
function qxChartRange(view, current, smooth=true){
 const vals=view.flatMap(b=>[Number(b.h),Number(b.l)]).filter(Number.isFinite);
 if(Number.isFinite(current))vals.push(current);
 if(!vals.length)return {lo:0,hi:1};
 const rawLo=Math.min(...vals),rawHi=Math.max(...vals);
 const typical=(Number.isFinite(steps[asset])&&steps[asset]>0)?steps[asset]:Math.max(Number.isFinite(current)?Math.abs(current)*0.0001:0,0.00001);
 const span=Math.max(rawHi-rawLo,typical*5,(Number.isFinite(current)?Math.abs(current)*0.000001:0));
 const pad=span*0.14;
 const desiredLo=rawLo-pad,desiredHi=rawHi+pad;
 if(!smooth||chartPan>0)return {lo:desiredLo,hi:desiredHi};
 if(!qxViewport||qxViewport.asset!==asset){qxViewport={asset,lo:desiredLo,hi:desiredHi};}
 else {
  // Expand immediately so current prices never clip; contract smoothly.
  const alpha=0.12;
  qxViewport.lo=desiredLo<qxViewport.lo?desiredLo:qxViewport.lo+(desiredLo-qxViewport.lo)*alpha;
  qxViewport.hi=desiredHi>qxViewport.hi?desiredHi:qxViewport.hi+(desiredHi-qxViewport.hi)*alpha;
 }
 return {lo:qxViewport.lo,hi:qxViewport.hi};
}
// Historical placeholders are synthetic and NEVER returned as broker/API prices.
// Stable timestamp-based variation prevents old candles changing on every refresh.
function qxBuildDummyHistory(realBars, count, symbol){
 if(!realBars.length)return [];
 const first=realBars[0], step=steps[symbol]||0.0001;
 let nextOpen=first.o;
 const result=new Array(count);
 const rand=(time,salt)=>{let x=(Math.floor(time/60000)*1664525+salt*1013904223+symbol.length*69069)>>>0;x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
 for(let i=count-1;i>=0;i--){
  const time=first.time-(count-i)*60000;
  const c=nextOpen;
  const o=Math.max(0.000001,c+(rand(time,1)-0.5)*step*1.7);
  const extra=step*(0.10+rand(time,2)*0.45);
  result[i]={time,o,c,h:Math.max(o,c)+extra,l:Math.max(0.000001,Math.min(o,c)-extra),dummy:true};
  nextOpen=o;
 }
 return result;
}
function draw(){
const el=$('chart'),r=el.getBoundingClientRect(),d=window.devicePixelRatio||1,w=r.width,h=r.height;
if(w<20||h<20||!candles.length)return;
el.width=Math.round(w*d);el.height=Math.round(h*d);
const c=el.getContext('2d');c.setTransform(d,0,0,d,0,0);
c.fillStyle='#1c2230';c.fillRect(0,0,w,h);
const right=window.innerWidth<=760?65:72,top=16,bottom=34,left=10,ww=w-left-right,hh=h-top-bottom;
const count=Math.max(8,Math.min(candles.length,Math.round((window.innerWidth<=760?20:27)/zoom)));
chartPan=Math.max(0,Math.min(chartPan,candles.length-count));
const view=candles.slice(Math.max(0,candles.length-count-Math.floor(chartPan)),candles.length-Math.floor(chartPan));
const {lo:low,hi:high}=qxChartRange(view,chartPan>0||qxHistoryOffset>0?NaN:prices[asset]);
const y=p=>top+(high-p)/(high-low)*hh;
c.lineWidth=1;c.strokeStyle='#4b5365';c.font=(w<=760?'13px Arial':'12px Arial');
const priceIntervals=4; // Wider, readable price-axis labels on mobile
for(let i=0;i<=priceIntervals;i++){let yy=top+i*hh/priceIntervals;c.beginPath();c.moveTo(0,yy+.5);c.lineTo(w,yy+.5);c.stroke();c.fillStyle='#f4f5f8';c.font='11px Arial';c.fillText((high-(high-low)*i/priceIntervals).toFixed(digits()),w-right+5,yy+4)}
// Wider 4-minute time labels, aligned to the clock and spaced across the chart.
const axisNow=new Date(view[view.length-1]?.time || Date.now());axisNow.setSeconds(0,0);
const timeSteps=4,axisStep=ww/timeSteps;
c.textAlign='center';c.font='12px Arial';
for(let i=0;i<=timeSteps;i++){
  const x=left+i*axisStep;
  c.strokeStyle='#4b5365';c.lineWidth=1;c.beginPath();c.moveTo(x+.5,0);c.lineTo(x+.5,h-bottom);c.stroke();
  const idx=Math.max(0,Math.min(view.length-1,Math.round(i*(view.length-1)/timeSteps)));
  const dt=new Date(view[idx]?.time || axisNow.getTime());
  c.fillStyle='#e1e4ea';
  if(x>=23&&x<=w-right-23)c.fillText(dt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'}),x,h-10);
}
c.textAlign='left';
const showingDummy=view.some(b=>b.dummy);
if(showingDummy){c.save();c.fillStyle='#d6a45e';c.font='bold 11px Arial';c.fillText('SIMULATED HISTORY',left+12,top+15);c.restore();}
// Screenshot geometry: candles stop at the beginning-of-trade marker;
// the future space to the right stays empty.
// The solid end-of-trade marker advances smoothly across the future area
// during each 60-second cycle, then returns to its start for the next cycle.
const isHistory=qxHistoryOffset>0||chartPan>0;
const beginX=left+ww*(isHistory?1:.79);
const cycleProgress=(Date.now()%60000)/60000;
const endX=left+ww*(.83+.10*cycleProgress);
const slot=(beginX-left)/view.length;
view.forEach((b,i)=>{let x=left+(i+.5)*slot;const color=b.c>=b.o?'#39e85d':'#ff795e';c.strokeStyle=color;c.fillStyle=color;c.lineWidth=1.7;c.beginPath();c.moveTo(x,y(b.h));c.lineTo(x,y(b.l));c.stroke();const bw=Math.max(2,Math.min(slot-0.5,slot*.94));c.fillRect(x-bw/2,Math.min(y(b.o),y(b.c)),bw,Math.max(1,Math.abs(y(b.o)-y(b.c))))});
const current=(qxHistoryOffset>0||chartPan>0)?view[view.length-1].c:prices[asset],yy=y(current);
// White dotted horizontal price line
c.strokeStyle='#f2f4f8';c.lineWidth=2;c.setLineDash([6,5]);c.beginPath();c.moveTo(0,yy);c.lineTo(w,yy);c.stroke();c.setLineDash([]);
// Two vertical markers, as in the reference
if(!isHistory){
c.strokeStyle='#f6f7f9';c.lineWidth=2;c.setLineDash([6,6]);c.beginPath();c.moveTo(beginX,0);c.lineTo(beginX,h-bottom);c.stroke();c.setLineDash([]);
c.strokeStyle='#b8beca';c.lineWidth=1.5;c.beginPath();c.moveTo(endX,0);c.lineTo(endX,h-bottom);c.stroke();
c.save();c.globalAlpha=0.42;c.fillStyle='#a6adbc';c.font='normal 12px Arial';c.textAlign='right';c.fillText('Beginning of trade',beginX-12,top+28);c.textAlign='left';c.fillText('End of trade',endX+12,top+28);c.restore();
c.fillStyle='#adb6c7';c.beginPath();c.moveTo(beginX-15,top+22);c.lineTo(beginX-8,top+18);c.lineTo(beginX-8,top+26);c.fill();c.beginPath();c.moveTo(endX+8,top+22);c.lineTo(endX+15,top+18);c.lineTo(endX+15,top+26);c.fill();
const remaining=60-new Date().getSeconds();const label='00:'+String(remaining).padStart(2,'0');
c.fillStyle='#586176';c.fillRect(endX-22,yy-12,44,24);c.fillStyle='#fff';c.font='bold 11px Arial';c.textAlign='center';c.fillText(label,endX,yy+4);c.textAlign='left';
}
c.fillStyle='#299ff1';c.beginPath();c.roundRect(w-right,yy-15,right-2,30,14);c.fill();c.fillStyle='white';c.font='bold 11px Arial';c.fillText(pricefmt(current),w-right+5,yy+4);
}
// One OHLC candle per real clock minute; update its high/low/close every second.
let activeCandleMinute=Math.floor(Date.now()/60000);
function update(){
 const minute=Math.floor(Date.now()/60000);
 if(minute!==activeCandleMinute){
   const last=candles[candles.length-1];
   const opening=last?last.c:prices[asset];
   candles.push({o:opening,c:opening,h:opening,l:opening});
   if(candles.length>80)candles.shift();
   activeCandleMinute=minute;
 }
 const c=candles[candles.length-1];
 const v=Math.max(.001,c.c+rnd()*steps[asset]*.65);
 c.c=v;c.h=Math.max(c.h,v);c.l=Math.min(c.l,v);
 prices[asset]=v;draw();settle();
}
function settle(){let changed=false;for(let t of trades){if(t.status!=='Open'||Date.now()<t.expires)continue;let v=prices[t.asset];if(t.asset!==asset)v=t.entry+rnd()*steps[t.asset]*4;t.exit=v;let diff=v-t.entry;if(Math.abs(diff)<1e-10){t.status='Draw';balance+=t.amount}else if((t.direction==='Buy'&&diff>0)||(t.direction==='Sell'&&diff<0)){t.status='Won';balance+=t.amount*(1+t.rate)}else t.status='Lost';changed=true}if(changed)render();else if(trades.some(t=>t.status==='Open'))render()}
function render(){$('balance').textContent=cash(balance);if(qxMode==='demo')qxDemoBalance=balance;else qxLiveBalance=balance;updateAccountMenu();$('tradecount').textContent=trades.length;$('trades').className=trades.length?'':'empty';$('trades').innerHTML=trades.length?[...trades].reverse().slice(0,20).map(t=>'<div class="tradeitem"><b>'+t.asset+'</b> · <span class="'+(t.direction==='Buy'?'up':'down')+'">'+t.direction+'</span> '+cash(t.amount)+'<br><span class="'+(t.status==='Won'?'up':t.status==='Lost'?'down':'')+'">'+(t.status==='Open'?'Open · '+Math.ceil((t.expires-Date.now())/1000)+'s':t.status)+'</span></div>').join(''):"▤<br>You don't have a trade history yet.<br>Open a virtual trade using the form above."}
function adjustAmount(n){const a=document.getElementById("amount");a.value=Math.max(1,(Number(a.value)||1)+n);updatePayout()}
function place(direction){let amount=Number($('amount').value);if(!Number.isInteger(amount)||amount<1||amount>balance){alert('Enter a valid whole-dollar stake within your virtual balance.');return}let rate=.8;balance-=amount;trades.push({asset,amount,direction,entry:prices[asset],expires:Date.now()+Number($('duration').value)*1000,status:'Open',rate});render()}
function setChartZoom(value){
  zoom=Math.max(0.5,Math.min(6,value));
  draw();
}
function changeZoom(n){setChartZoom(zoom*(n>0?1.2:1/1.2))}
// Mobile: two-finger pinch to zoom. Desktop: mouse wheel/trackpad.
const chartCanvas=$('chart');
chartCanvas.style.touchAction='none';
let pinchStartDistance=0,pinchStartZoom=zoom;
function fingerDistance(t){return Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY)}
chartCanvas.addEventListener('touchstart',e=>{
  if(e.touches.length===2){e.preventDefault();dragStartX=null;pinchStartDistance=fingerDistance(e.touches);pinchStartZoom=zoom}
},{passive:false});
chartCanvas.addEventListener('touchmove',e=>{
  if(e.touches.length===2){e.preventDefault();if(!pinchStartDistance){pinchStartDistance=fingerDistance(e.touches);pinchStartZoom=zoom}setChartZoom(pinchStartZoom*fingerDistance(e.touches)/pinchStartDistance)}
},{passive:false});
chartCanvas.addEventListener('touchend',e=>{if(e.touches.length<2)pinchStartDistance=0},{passive:true});
chartCanvas.addEventListener('touchcancel',()=>{pinchStartDistance=0},{passive:true});
// Historical navigation: drag chart to the RIGHT to reveal older candles.
// Shift+wheel or horizontal trackpad scroll also navigates history.
let dragStartX=null,dragStartPan=0,dragPointer=null;
const visibleCandleCount=()=>Math.max(5,Math.round((window.innerWidth<=760?20:27)/zoom));
const panSlot=()=>Math.max(3,(chartCanvas.getBoundingClientRect().width-75)*.79/visibleCandleCount());
function extendDummyHistory(){
  if(qxHistoryBusy||!candles.length||qxRealStartIndex<=0)return false;
  qxHistoryBusy=true;
  const older=qxBuildDummyHistory(candles.slice(0,1),360,asset);
  // Add before all existing bars; don't change server candles or trade prices.
  candles.unshift(...older);
  qxDummyCount+=older.length;
  qxRealStartIndex+=older.length;
  chartPan+=older.length; // Preserve the currently visible candles after prepend.
  qxHistoryBusy=false;
  return true;
}
function moveChartHistory(target){
  let maxPan=Math.max(0,candles.length-visibleCandleCount());
  if(target>maxPan-2 && maxPan>0){
    const oldMax=maxPan;
    if(extendDummyHistory()){
      // Keep moving toward older bars when user reaches the edge.
      target+=Math.max(0,candles.length-visibleCandleCount()-oldMax);
      maxPan=Math.max(0,candles.length-visibleCandleCount());
    }
  }
  chartPan=Math.max(0,Math.min(maxPan,target));
  draw();
}
chartCanvas.addEventListener('pointerdown',e=>{
 if(e.pointerType==='touch' && !e.isPrimary)return;
 dragStartX=e.clientX;dragStartPan=chartPan;dragPointer=e.pointerId;
 chartCanvas.setPointerCapture(e.pointerId);
});
chartCanvas.addEventListener('pointermove',e=>{
 if(dragStartX===null||e.pointerId!==dragPointer||pinchStartDistance)return;
 // Drag RIGHT -> older candles (history); drag LEFT -> latest.
 const desired=dragStartPan+(e.clientX-dragStartX)/panSlot();
 const visible=Math.max(8,Math.round((window.innerWidth<=760?20:27)/zoom));
 let maxPan=Math.max(0,candles.length-visible);
 if(desired>maxPan-12){
   const extra=Math.max(360,Math.ceil(desired-maxPan)+360);
   qxDummyCount+=extra;
   const earliest=candles[0];
   if(earliest&&Number.isFinite(earliest.time)&&Number.isFinite(earliest.o)){
     const older=qxBuildDummyHistory([earliest],extra,asset);
     candles.unshift(...older);
     qxRealStartIndex+=older.length;
   }
   maxPan=Math.max(0,candles.length-visible);
 }
 chartPan=Math.max(0,Math.min(maxPan,desired));
 draw();
});
function stopChartDrag(e){if(e.pointerId===dragPointer){dragStartX=null;dragPointer=null}}
chartCanvas.addEventListener('pointerup',stopChartDrag);
chartCanvas.addEventListener('pointercancel',stopChartDrag);
chartCanvas.addEventListener('wheel',e=>{
 e.preventDefault();
 if(e.shiftKey||Math.abs(e.deltaX)>Math.abs(e.deltaY)){
   // Trackpad left/right and Shift+wheel scroll historical candles.
   moveChartHistory(chartPan+(e.shiftKey?e.deltaY:e.deltaX)/panSlot());
 }else setChartZoom(zoom*Math.exp(-e.deltaY*.002));
},{passive:false});
$('asset').onchange=e=>{qxHistoryOffset=0;chartPan=0;asset=e.target.value;let rate=asset==='EUR/USD'?80:78;$('sideasset').textContent=asset+' · '+rate+'%';updatePayout();if(window.qxLoadChart)window.qxLoadChart()};function updatePayout(){$('payout').textContent=cash(Math.max(0,Number($('amount').value))*(1.88))}$('amount').oninput=updatePayout;
const paymentMethods=['LG-Pay','WatchPay','BondPay','USDT Pay'];
function menuButtons(items){return items.map(s=>'<button class="menubtn" data-qx-onclick="openModal(\&#x27;&#x27;+s.toLowerCase()+&#x27;\&#x27;)">'+s+'　›</button>').join('')}
function openModal(type){closeAccountMenu();$('overlay').classList.add('visible');let title=type[0].toUpperCase()+type.slice(1),body='';if(type==='menu'){closeModal();toggleMore();return}
else if(type==='deposit'){body='<p class="note">Choose a gateway. Payments are credited only after verified confirmation.</p><label class="field">Country<select><option>India</option></select></label><div class="payment-tabs"><button id="tab-all" data-qx-onclick="showMethods(\&#x27;all\&#x27;)"><span class="tabicon">♨</span>POPULAR</button><button id="tab-epay" data-qx-onclick="showMethods(\&#x27;epay\&#x27;)"><span class="tabicon">▣</span>E-PAY</button><button id="tab-crypto" data-qx-onclick="showMethods(\&#x27;crypto\&#x27;)"><span class="tabicon">⬡</span>CRYPTO</button></div><h3>Popular in your region (4)</h3><div id="methodList"></div>'}
else if(type.startsWith('method:')){let m=type.slice(7);title='Deposit';body=depositDetailHTML(m)}
else if(type==='login'||type==='register'||type==='forgot'){
const reg=type==='register',forgot=type==='forgot';title=forgot?'Password recovery':reg?'Create an account':'Sign in';
body='<div class="auth-logo"><svg aria-hidden="true" width="29" height="29" viewBox="0 0 36 36" style="vertical-align:middle;margin-right:8px"><rect width="36" height="36" rx="9" fill="#075f60"/><path d="M10 11h9l7 7-7 7h-9l7-7z" fill="#b2f3db"/><path d="M20 11h6l-7 7 7 7h-6l-7-7z" fill="#ffffff" opacity=".92"/></svg> Quotexx</div><p class="auth-intro">Independent trading practice platform · Not affiliated with Quotex</p>'+
(forgot?'':'<div class="tabs auth-tabs"><button type="button" class="'+(!reg?'active':'')+'" data-qx-onclick="openModal(\&#x27;login\&#x27;)">Login</button><button type="button" class="'+(reg?'active':'')+'" data-qx-onclick="openModal(\&#x27;register\&#x27;)">Registration</button></div>')+
'<form data-qx-onsubmit="event.preventDefault();alert(\&#x27;Preview only — account authentication needs a secure backend. No credentials have been submitted.\&#x27;)">'+
(reg?'<label class="field">Country / region<select required><option value="">Select country</option><option>India</option><option>United Kingdom</option><option>United Arab Emirates</option><option>Other</option></select></label><label class="field">Account currency<select required><option>USD</option><option>INR</option><option>EUR</option></select></label>':'')+
'<label class="field">Email<input type="email" autocomplete="off" placeholder="Enter your email" required></label>'+
(forgot?'': '<label class="field">Password<input type="password" autocomplete="off" placeholder="'+(reg?'Create a password':'Enter your password')+'" minlength="8" required></label>')+
(reg?'<label class="field">Promo code (optional)<input type="text" placeholder="Promo code"></label><p class="auth-legal"><label><input type="checkbox" required> I am at least 18 years old and accept the terms of this practice platform.</label></p>':forgot?'':'<div class="auth-row"><label class="auth-legal"><input type="checkbox"> Remember me</label><button type="button" class="auth-link" data-qx-onclick="openModal(\&#x27;forgot\&#x27;)">Forgot password?</button></div>')+
'<button class="wide" type="submit">'+(forgot?'Continue':reg?'Registration':'Sign in')+'</button></form>'+
'<div class="auth-disclosure">Quotexx is an independent interface preview, not Quotex. No account is created or accessed here. Do not enter real Quotex passwords.</div>'+
(forgot?'<p style="text-align:center"><button class="auth-link" data-qx-onclick="openModal(\&#x27;login\&#x27;)">← Back to login</button></p>':'');
}

else if(type==='logout'){gateLogout();return}
else if(type==='settings'){body='<label class="field">Language<select><option>English</option><option>Hindi</option></select></label><label class="field">Timezone<select><option>UTC+05:30</option><option>UTC+00:00</option></select></label><h3>TEMPLATE</h3>'+['Light Mode','Twilight','Full Night'].map(x=>'<button class="menubtn" data-qx-onclick="alert(\&#x27;Theme preview: &#x27;+x+&#x27;\&#x27;)">'+x+'</button>').join('')}
else if(type==='profile'||type==='account'){title='Personal data';body=`<div class="qx-profile"><div class="qx-profile-head"><div class="qx-avatar">👤<span>📷</span></div><div class="qx-profile-identity"><strong id="qxProfileEmail">Account email</strong><div>ID: <span id="qxProfileId">—</span></div><b class="qx-unverified">✖ Not verified</b></div></div><form id="qxProfileForm" data-qx-onsubmit="53"><label class="qx-profile-field"><span>Nickname</span><input name="nickname" placeholder="Empty" autocomplete="nickname"></label><label class="qx-profile-field"><span>First Name</span><input name="firstName" placeholder="Empty" autocomplete="given-name"></label><label class="qx-profile-field"><span>Last Name</span><input name="lastName" placeholder="Empty" autocomplete="family-name"></label><label class="qx-profile-field"><span>Date of birth</span><input name="dob" type="date"></label><label class="qx-profile-field"><span>Email</span><input id="qxProfileEmailField" name="email" type="email" required autocomplete="email" placeholder="Enter email"></label><label class="qx-profile-field"><span>Country</span><select name="country"><option>India</option><option>United Kingdom</option><option>United Arab Emirates</option><option>Other</option></select></label><button class="qx-profile-save" type="submit">Save</button><p id="qxProfileStatus" role="status"></p></form></div>`;setTimeout(fillQxProfile,0)}
else if(type==='help'){body=menuButtons(['FAQ','Tutorials','Support'])}
else if(type==='payments'){body='<p class="note">Payment history requires a connected account and backend.</p>'}
else if(type==='trades'){body='<p class="note">Your virtual trades are shown in the trading panel.</p>'+trades.map(t=>'<p>'+t.asset+' · '+t.direction+' · '+t.status+'</p>').join('')}
else{body='<p class="note">This is a preview of the '+title+' section. Live services are not connected.</p>'}
if(type==='account'||type==='profile')body+='<button class="wide" data-qx-onclick="50">Log out</button>';
$('modalTitle').textContent=title;$('modalBody').innerHTML=body;document.querySelector('.modal').classList.toggle('auth-modal',['login','register','forgot'].includes(type));if(type==='deposit')showMethods('all');if(type.startsWith('method:'))initDepositDetail(type.slice(7))}

// Public daily reference rate; never assume an outdated rate is a payable quote.
let depositFxRate=null,depositFxUpdated='',depositFxLoading=false;
const fiatDepositMethods=['PhonePe','UPI','PayTM','UPI Intent'];
function depositDetailHTML(method){
 return `<div class="deposit-detail"><div class="deposit-provider"><strong>${method}</strong></div>
 <label class="field">Deposit amount (INR)<input id="depositInr" type="number" min="100" step="0.01" value="100" data-qx-oninput="55"></label>
 <div class="deposit-rate"><div class="deposit-conversion"><span>Current 1 USDT</span><strong id="depositRateText">Loading…</strong></div>
 <div class="deposit-conversion"><span>Estimated USDT credit</span><strong id="depositReceive">Loading…</strong></div><small id="depositRateDate">Fetching current USDT/INR rate…</small></div>
 <button class="deposit-continue" id="depositProceed" data-qx-onclick="51">Continue to payment</button>
 <p class="deposit-note">Minimum ₹100. USDT amount is locked at payment request creation; LIVE balance credits only after a verified successful callback. DEMO balance is separate.</p></div>`;
}
let qxUSDTINR=0;
function refreshDepositConversion(){
 const n=Number(document.getElementById('depositInr')?.value);
 const valid=Number.isFinite(n)&&n>=100&&n<=100000;
 const r=document.getElementById('depositRateText'),c=document.getElementById('depositReceive'),btn=document.getElementById('depositProceed');
 if(r)r.textContent=qxUSDTINR?'₹'+qxUSDTINR.toFixed(4):'Rate unavailable';
 if(c)c.textContent=valid&&qxUSDTINR?(n/qxUSDTINR).toFixed(6)+' USDT':'—';
 if(btn)btn.disabled=!valid||!qxUSDTINR;
}
async function initDepositDetail(method){
 qxUSDTINR=0;refreshDepositConversion();
 const dateEl=document.getElementById('depositRateDate');
 try{const response=await fetch('/api/payments/rate',{cache:'no-store'});const data=await response.json();if(!response.ok)throw Error(data.error||'Rate unavailable');qxUSDTINR=Number(data.rateINR);if(dateEl)dateEl.textContent='Rate updated: '+new Date(data.asOf).toLocaleString();}
 catch(e){if(dateEl)dateEl.textContent='Rate unavailable. Please retry.'}
 refreshDepositConversion();
}
function showMethods(cat){
 const indices=cat==='crypto'?[3]:cat==='epay'?[0,1,2]:[0,1,2,3];
 const logos=[['₹','phonepe'],['₹','upi'],['₹','paytm'],['₮','usdt']];
 $('methodList').innerHTML=indices.map(i=>'<button class="method payment-3d" data-index="'+i+'"><span class="paylogo '+logos[i][1]+'">'+logos[i][0]+'</span><span class="payname">'+paymentMethods[i]+'<small>Min. ₹100</small></span><span class="paychevron">›</span></button>').join('');
 ['all','epay','crypto'].forEach(x=>{let el=$('tab-'+x);if(el)el.classList.toggle('active',x===cat)});
 document.querySelectorAll('[data-index]').forEach(b=>b.onclick=()=>openModal('method:'+paymentMethods[Number(b.dataset.index)]));
}
function toggleMore(force){let p=$('morepanel'),v=$('moreview');let show=force===undefined?!p.classList.contains('show'):force;p.classList.toggle('show',show);if(!show)v.classList.remove('show')}
function backMore(){$('moreview').classList.remove('show');$('morepanel').classList.add('show')}
function morePage(type){$('morepanel').classList.remove('show');$('moreview').classList.add('show');$('moretitle').textContent=({analytics:'Analytics',top:'TOP',signals:'Signals',market:'Market'})[type];let content='';if(type==='analytics'){let done=trades.filter(t=>t.status!=='Open'),wins=done.filter(t=>t.status==='Won').length,losses=done.filter(t=>t.status==='Lost').length;content='<div class="dataitem">Total trades: <b>'+trades.length+'</b></div><div class="dataitem">Completed: <b>'+done.length+'</b></div><div class="dataitem">Winning trades: <b>'+wins+'</b></div><div class="dataitem">Losing trades: <b>'+losses+'</b></div><div class="dataitem">Win rate: <b>'+(done.length?(wins/done.length*100).toFixed(1):'0')+'%</b></div><p class="muted small">Calculated from trades placed in this browser session, using simulated prices.</p>'}else if(type==='top'){content='<div class="dataitem">Trader leaderboard is not connected.</div><p class="muted small">Verified trader rankings require an authorized backend data source. No invented trader names or profits are displayed.</p>'}else if(type==='signals'){let c=candles.slice(-8),up=c.filter(b=>b.c>b.o).length,down=c.filter(b=>b.c<b.o).length;content='<div class="dataitem">'+asset+'<br><b>Recent candle direction: '+(up>down?'Upward':down>up?'Downward':'Mixed')+'</b><br>Green candles: '+up+' · Red candles: '+down+'</div><p class="muted small">Indicator calculated from locally simulated candles, not a verified market signal or trading recommendation.</p>'}else{content='<div class="dataitem">Selected asset: <b>'+asset+'</b><br>Chart price: <b>'+pricefmt(prices[asset])+'</b></div><div class="dataitem">Assets: '+Object.keys(prices).join(', ')+'</div><p class="muted small">Displayed quotes are simulated. Live exchange data requires a licensed or authorized market-data API; Quotex-specific payouts and account data cannot be inferred from public prices.</p>'}$('morecontent').innerHTML=content}
function closeModal(){$('overlay').classList.remove('visible')}document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});window.addEventListener('resize',draw);
/* Backend-powered bootstrap is installed below; local random-price loop disabled. */

// Forex reference feed plus explicitly simulated values for unsupported pairs and payouts.
const pairCatalog=[
['GBP/NZD (OTC)','Currencies','🇬🇧🇳🇿',null,null],['USD/INR (OTC)','Currencies','🇺🇸🇮🇳',null,null],['CAD/CHF (OTC)','Currencies','🇨🇦🇨🇭',null,null],['USD/MXN (OTC)','Currencies','🇺🇸🇲🇽',null,null],['USD/NGN (OTC)','Currencies','🇺🇸🇳🇬',null,null],['USD/BDT (OTC)','Currencies','🇺🇸🇧🇩',null,null],
['EUR/GBP','Currencies','🇪🇺🇬🇧','EUR','GBP'],['GBP/USD','Currencies','🇬🇧🇺🇸','GBP','USD'],['USD/INR','Currencies','🇺🇸🇮🇳','USD','INR'],['EUR/USD','Currencies','🇪🇺🇺🇸','EUR','USD'],['USD/JPY','Currencies','🇺🇸🇯🇵','USD','JPY'],['USD/BRL (OTC)','Currencies','🇺🇸🇧🇷',null,null],['USD/ZAR (OTC)','Currencies','🇺🇸🇿🇦',null,null],
['BTC/USD','Crypto','₿','BTC','USD'],['ETH/USD','Crypto','Ξ','ETH','USD'],['BNB/USD','Crypto','◆',null,null],['Gold','Commodities','🥇',null,null],['Silver','Commodities','🥈',null,null],['Oil','Commodities','🛢️',null,null],['Apple','Stocks','●',null,null],['Tesla','Stocks','⚡',null,null],['NVIDIA','Stocks','◈',null,null]];
let pairCategory='Currencies',pairFavOnly=false,pairFavorites=new Set(),pairLive={},pairLastFetch=0,pairLoading=false;
// Demonstration values for every listed asset; not broker quotes or real payouts.
const pairDemo={};pairCatalog.forEach((p,i)=>{pairDemo[p[0]]={change:((i*37%91)-45)/100,p1:73+(i*7%22),p5:76+(i*11%19)}});
setInterval(()=>{pairCatalog.forEach(p=>{const d=pairDemo[p[0]];d.change=Math.max(-6,Math.min(6,d.change+(Math.random()-.5)*.15));d.p1=Math.max(65,Math.min(95,d.p1+(Math.random()>.72?(Math.random()>.5?1:-1):0)));d.p5=Math.max(65,Math.min(95,d.p5+(Math.random()>.8?(Math.random()>.5?1:-1):0)))});if(document.getElementById('pairOverlay').classList.contains('open'))renderPairs()},4500);
function openPairs(){document.getElementById('pairOverlay').classList.add('open');renderPairs();fetchPairRates()}
function closePairs(){document.getElementById('pairOverlay').classList.remove('open')}
function selectPairCategory(c){pairCategory=c;pairFavOnly=false;renderPairs()}
function togglePairFavorite(name){if(pairFavorites.has(name))pairFavorites.delete(name);else pairFavorites.add(name);renderPairs()}
function renderPairs(){
const tabs=document.getElementById('pairTabs');if(!tabs)return;
tabs.innerHTML=['Currencies','Crypto','Commodities','Stocks'].map(c=>`<button class="${c===pairCategory?'selected':''}" data-qx-onclick="selectPairCategory(&#x27;${c}&#x27;)">${c.toUpperCase()}</button>`).join('');
document.getElementById('pairFavCount').textContent=pairFavorites.size;
const q=document.getElementById('pairSearch').value.toLowerCase();
const items=pairCatalog.filter(x=>x[1]===pairCategory&&x[0].toLowerCase().includes(q)&&(!pairFavOnly||pairFavorites.has(x[0])));
document.getElementById('pairRows').innerHTML=items.map(x=>{
const name=x[0],data=pairLive[name],demo=pairDemo[name],chg=Number.isFinite(data?.change)?data.change:demo.change;
const change=Number.isFinite(chg)?`<span class="${chg>=0?'pair-up':'pair-down'}">${chg>=0?'↑':'↓'} ${Math.abs(chg).toFixed(2)}%</span>`:'<span class="pair-unavailable">—</span>';
return `<tr><td><button class="pair-star ${pairFavorites.has(name)?'on':''}" data-qx-onclick="event.stopPropagation();togglePairFavorite(&#x27;${name}&#x27;)">${pairFavorites.has(name)?'★':'☆'}</button><span data-qx-onclick="choosePair(&#x27;${name}&#x27;)" class="pair-name">${x[2]} ${name}</span></td><td data-qx-onclick="choosePair(&#x27;${name}&#x27;)">${change}</td><td data-qx-onclick="choosePair(&#x27;${name}&#x27;)" style="color:#ffae42;font-weight:700">${demo.p1}%</td><td data-qx-onclick="choosePair(&#x27;${name}&#x27;)" style="color:#ffae42;font-weight:700">${demo.p5}%</td></tr>`}).join('')||'<tr><td colspan="4" style="text-align:center;color:#aab">No matching pairs</td></tr>';
}
function choosePair(name){
const pair=pairCatalog.find(p=>p[0]===name);if(!pair)return;
// Every pair can be selected for virtual chart practice. Unsupported feeds use simulation.
if(!Object.prototype.hasOwnProperty.call(prices,name)){
 const seed=pairLive[name]?.rate||({'Gold':2650,'Silver':31,'Oil':72,'Apple':220,'Tesla':250,'NVIDIA':135,'BNB/USD':590}[name])||1.32;
 prices[name]=seed;steps[name]=Math.max(seed*.0001,.000001);
}
asset=name;document.getElementById('sideasset').textContent=name+' · '+pairDemo[name].p1+'% (simulated)';
const sel=document.getElementById('asset');if(sel){if(![...sel.options].some(o=>o.value===name))sel.add(new Option(name,name));sel.value=name}
init();closePairs();
}
async function fetchPairRates(){
if(pairLoading||Date.now()-pairLastFetch<60000)return;pairLoading=true;
const status=document.getElementById('pairFeedStatus');status.textContent='SIMULATION: Demo percentages for every pair. Fetching forex reference rates where available…';
try{
 const bases=['USD','GBP','EUR'];const now=new Date(),prev=new Date(now);prev.setDate(now.getDate()-5);const start=prev.toISOString().slice(0,10);
 const out=await Promise.all(bases.map(async base=>{const r=await fetch('https://api.frankfurter.dev/v1/'+start+'..?base='+base+'&symbols=USD,GBP,EUR,INR,JPY',{cache:'no-store'});if(!r.ok)throw Error('Feed unavailable');return [base,await r.json()]}));
 for(const [base,series] of out){const days=Object.keys(series.rates||{}).sort();if(days.length<2)continue;const a=series.rates[days[0]],b=series.rates[days[days.length-1]];
 for(const pair of pairCatalog){if(pair[3]!==base||!pair[4]||pair[4]===base)continue;const cur=pair[4],last=b[cur],first=a[cur];if(last&&first)pairLive[pair[0]]={rate:last,change:(last/first-1)*100}}}
 pairLastFetch=Date.now();status.textContent='SIMULATION: All profit percentages and unsupported asset changes are generated demo values, updating every few seconds. Available forex changes use Frankfurter reference data (not tick-by-tick).';
}catch(e){status.textContent='SIMULATION: Demo percentages and changes are shown for all assets. Live forex feed unavailable.'}finally{pairLoading=false;renderPairs()}
}
// Open the selector from existing asset dropdown, including on mobile.
const pairSelect=document.getElementById('asset');if(pairSelect){pairSelect.addEventListener('pointerdown',e=>{e.preventDefault();openPairs()});pairSelect.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openPairs()}})}
document.getElementById('pairOverlay').addEventListener('click',e=>{if(e.target.id==='pairOverlay')closePairs()});

// Local-only prototype: account records stay in this browser; no real OAuth or secure server session.
let gateMode='login';const gateKey='tradevista_local_users_v1',gateSession='tradevista_local_session_v1';
function gateTab(mode){gateMode=mode;const reg=mode==='register';document.getElementById('gateHeading').textContent=reg?'Sign Up':'Sign In To Your Account';document.getElementById('gateRegisterFields').classList.toggle('gatehidden',!reg);document.getElementById('gateRegExtra').classList.toggle('gatehidden',!reg);document.getElementById('gateLoginExtra').classList.toggle('gatehidden',reg);document.getElementById('gateLoginTab').classList.toggle('active',!reg);document.getElementById('gateRegTab').classList.toggle('active',reg);document.getElementById('gateTopLogin').classList.toggle('on',!reg);document.getElementById('gateTopReg').classList.toggle('on',reg);document.getElementById('gateSubmit').textContent=reg?'Registration →':'Sign in →';document.getElementById('gateCountry').required=reg;document.getElementById('gatePassword').minLength=reg?10:1;document.getElementById('gateMessage').textContent=''}
async function gateDigest(value){const bytes=new TextEncoder().encode(value);const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash)).map(x=>x.toString(16).padStart(2,'0')).join('')}
async function submitGate(e){e.preventDefault();const msg=document.getElementById('gateMessage'),email=document.getElementById('gateEmail').value.trim().toLowerCase(),pass=document.getElementById('gatePassword').value;msg.textContent='';if(!window.crypto?.subtle){msg.textContent='Secure browser context is required for this local prototype. Open through localhost or HTTPS.';return}let users;try{users=JSON.parse(localStorage.getItem(gateKey)||'{}')}catch{users={}}if(gateMode==='register'){if(!document.getElementById('gateCountry').value){msg.textContent='Select your country.';return}if(!document.getElementById('gateAdult').checked||!document.getElementById('gateTax').checked){msg.textContent='Please review and confirm both declarations.';return}if(users[email]){msg.textContent='Account already exists. Please log in.';return}const salt=Array.from(crypto.getRandomValues(new Uint8Array(16))).map(x=>x.toString(16).padStart(2,'0')).join('');users[email]={salt,hash:await gateDigest(salt+pass),country:document.getElementById('gateCountry').value,currency:document.getElementById('gateCurrency').value,created:new Date().toISOString()};try{localStorage.setItem(gateKey,JSON.stringify(users))}catch{msg.textContent='Browser storage is unavailable.';return}}else{if(!users[email]||users[email].hash!==await gateDigest(users[email].salt+pass)){msg.textContent='Incorrect email or password.';return}}try{(gateMode==='register'||document.getElementById('gateRemember').checked?localStorage:sessionStorage).setItem(gateSession,email)}catch{}document.getElementById('authGate').hidden=true;document.getElementById('gatePassword').value='';}
function gateGoogle(){document.getElementById('gateMessage').textContent='Google sign-in requires your Google OAuth Client ID, authorized domain, and secure backend. It is not active in this standalone HTML.'}
function gateHelp(){document.getElementById('gateMessage').textContent='Password recovery needs a verified email service and backend. This local prototype cannot reset passwords securely.'}
function gateLogout(){localStorage.removeItem(gateSession);sessionStorage.removeItem(gateSession);document.getElementById('authGate').hidden=false;gateTab('login');closeModal()}
gateTab('login');document.getElementById('authGate').hidden=false;

;

function updateQxProfileBadge(){const badge=document.querySelector('.qx-profile-identity .qx-unverified, .qx-profile-identity .qx-complete');if(!badge)return;let data={};try{data=JSON.parse(localStorage.getItem('qx_profile_fields')||'{}')}catch(e){}const complete=['nickname','firstName','lastName','dob','email','country'].every(k=>String(data[k]||'').trim());badge.className=complete?'qx-complete':'qx-unverified';badge.textContent=complete?'✓ Profile Complete':'✖ Not verified'}
function fillQxProfile() {
  const f = document.getElementById('qxProfileForm');
  if (!f) return;

  const user = window.qxCurrentUser || {};

  let saved = {};
  try {
    saved = JSON.parse(
      localStorage.getItem('qx_profile_fields') || '{}'
    );
  } catch (e) {}

  for (const key of [
    'nickname',
    'firstName',
    'lastName',
    'dob',
    'country'
  ]) {
    if (f.elements[key]) {
      f.elements[key].value =
        saved[key] || user[key] || '';
    }
  }

  const email = user.email || '';

  document.getElementById('qxProfileEmail').textContent =
    email || 'Account email';

  document.getElementById('qxProfileEmailField').value =
    email;

  document.getElementById('qxProfileId').textContent =
    user.id || user._id || '—';

  updateQxProfileBadge();
}



function saveQxProfile(e) {
  e.preventDefault();

  const f = e.currentTarget;
  const user = window.qxCurrentUser || {};

  const data = {};

  for (const key of [
    'nickname',
    'firstName',
    'lastName',
    'dob',
    'country'
  ]) {
    data[key] = f.elements[key]?.value || '';
  }

  data.email = user.email || '';

  localStorage.setItem(
    'qx_profile_fields',
    JSON.stringify(data)
  );

  document.getElementById('qxProfileEmail').textContent =
    data.email || 'Account email';

  document.getElementById('qxProfileStatus').textContent =
    'Profile saved in this browser.';

  updateQxProfileBadge();
  updateAccountMenu();
}

(function(){
const page=document.getElementById('qxTournamentPage'),content=document.getElementById('qxTournamentContent');let tab='active';
const items=[{name:'Free Friday',prize:'1000 $',fee:'0 $',duration:'1 day',active:true},{name:'Weekend Battle',prize:'5000 $',fee:'1 $',duration:'2 days',active:false},{name:'Trading Masters',prize:'2500 $',fee:'2 $',duration:'1 day',active:false},{name:'Champion League',prize:'10000 $',fee:'5 $',duration:'3 days',active:false}];
function cards(){return items.map((x,i)=>`<article class="qt-card"><div class="qt-art ${i%2?'green':''}"><span class="qt-cup">🏆</span><span class="qt-tag">${x.active?'ACTIVE NOW':'◷ UNTIL START: 09:20:41'}</span><div class="qt-name">${x.name}</div><div class="qt-prize"><small>PRIZE POOL</small><b>${x.prize}</b></div></div><div class="qt-stats"><div><b>${x.fee}</b><small>Entry fee</small></div><div><b>${x.duration}</b><small>Duration</small></div></div><button class="qt-detail" data-tournament="${i}">Details ⓘ</button></article>`).join('')}
function render(){content.innerHTML=`<div class="qt-tabs"><button data-tab="active" class="${tab==='active'?'active':''}">ACTIVE <span class="qt-count">4</span></button><button data-tab="completed" class="${tab==='completed'?'active':''}">COMPLETED</button></div>${tab==='active'?'<div class="qt-heading">Available for participation (4)</div>'+cards():'<div class="qt-empty">No completed tournaments yet.</div>'}`;}
function show(){page.classList.add('open');render();document.querySelectorAll('.mobile-nav button').forEach(b=>b.classList.toggle('active',b.textContent.includes('Tournaments')))}
function hide(){page.classList.remove('open')}
content.addEventListener('click',e=>{let t=e.target.closest('[data-tab]');if(t){tab=t.dataset.tab;render();return}let d=e.target.closest('[data-tournament]');if(d){const x=items[+d.dataset.tournament];content.innerHTML=`<button class="qt-back" id="qtReturn">← Tournaments</button><div class="qt-info"><h2>${x.name}</h2><p>Prize pool: ${x.prize}</p><p>Entry fee: ${x.fee}</p><p>Duration: ${x.duration}</p><p>${x.active?'Active now':'Upcoming tournament'}</p><p>Tournament details preview. Participation requires a connected tournament backend.</p></div>`;return}if(e.target.id==='qtReturn')render()});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const action=b.getAttribute('onclick')||'';if(action.includes("openModal('tournaments')")){e.preventDefault();e.stopImmediatePropagation();show()}else if(page.classList.contains('open')&&(b.closest('.mobile-nav')||b.closest('.nav'))){hide()}},true);
window.openTournamentPage=show;
})();

;

/* Quotexx API bridge. No external frontend framework required. */
(function(){
'use strict';
const API_BASE='/api';
const TOKEN_KEY='qx_token';
let account=null, overview=null, backendTrades=[], loadingChart=false, loadingOverview=false;
let latestServerTime=0, latestCandleEnd=0, lastServerReceived=0;
let activeSymbol='GBP/USD';
let ready=false, requestBusy=false;
const supported=new Set(['EUR/USD','GBP/USD','BTC/USD']);
function token(){return sessionStorage.getItem(TOKEN_KEY)||localStorage.getItem(TOKEN_KEY)||''}
async function request(path,method='GET',body){
 const headers={'Accept':'application/json'};
 if(body!==undefined)headers['Content-Type']='application/json';
 if(token())headers.Authorization='Bearer '+token();
 const res=await fetch(API_BASE+path,{method,headers,cache:'no-store',...(body!==undefined?{body:JSON.stringify(body)}:{})});
 const data=await res.json().catch(()=>({}));
 if(!res.ok){if(res.status===401&&path!=='/auth/login'&&path!=='/auth/register'){sessionStorage.removeItem(TOKEN_KEY);localStorage.removeItem(TOKEN_KEY);document.getElementById('authGate').hidden=false;ready=false}throw Error(data.error||data.message||(`API ${res.status}: ${path}. Check Node backend and /api proxy.`))}
 return data;
}
function notify(message){document.getElementById('qxNoticeText').textContent=String(message);const box=document.getElementById('qxNotice');box.classList.add('show');}
function esc(x){return String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function money(n){return '$'+Number(n||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}
function getLiveBalance(u) {
  return Number(u?.balance ?? 0);
}

function getDemoBalance(u) {
  return Number(u?.demoBalance ?? 10000);
}
function syncAccount() {
  if (!account) return;

  window.qxCurrentUser = account;

  // Always take both balances from backend
  qxLiveBalance = getLiveBalance(account);
  qxDemoBalance = getDemoBalance(account);

  // Show only selected account balance
  balance = qxMode === 'demo'
    ? qxDemoBalance
    : qxLiveBalance;

  document.getElementById('balance').textContent =
    money(balance);

  document.getElementById('qxMenuEmail').textContent =
    account.email || 'Account email';

  document.getElementById('qxMenuId').textContent =
    account.id || account._id || '—';

  updateAccountMenu();
}
let qxSeenStatuses=new Map(),qxSeenInitialized=false;
function qxWinToast(profit,symbol){
 const el=document.createElement('div');el.className='qx-win-toast';el.setAttribute('role','status');
 el.innerHTML='<div class="qx-win-icon">✓</div><div><strong>Trade successful!</strong><div>'+esc(symbol||'Trade')+' · Profit <b>+'+money(profit)+'</b></div></div>';
 document.body.appendChild(el);requestAnimationFrame(()=>el.classList.add('show'));
 setTimeout(()=>{el.classList.remove('show');setTimeout(()=>el.remove(),400)},3500);
}
function qxCheckTradeWins(rows){
 const next=new Map();for(const t of rows){const id=String(t.id||t._id||'');if(!id)continue;
 const status=String(t.status||'').toLowerCase(),old=qxSeenStatuses.get(id);
 if(qxSeenInitialized&&old&&['open','pending','active'].includes(old)&&['won','win','success','settled'].includes(status)&&Number(t.profitUSD)>0)qxWinToast(Number(t.profitUSD),t.symbol);
 next.set(id,status)}qxSeenStatuses=next;qxSeenInitialized=true;
}
async function loadOverview(){
 if(!ready||loadingOverview)return;
 loadingOverview=true;
 try{const data=await request('/me/overview');overview=data;account=data.user||account;backendTrades=Array.isArray(data.trades)?data.trades:[];window.qxBackendTrades=backendTrades;qxCheckTradeWins(backendTrades);syncAccount();renderBackendTrades();qxCheckApprovedWithdrawal();}
 catch(e){console.warn('Overview:',e.message)}finally{loadingOverview=false}
}
function renderBackendTrades(){
 const rows=qxMode==='demo'?trades:backendTrades;
 const box=document.getElementById('trades');
 document.getElementById('tradecount').textContent=rows.length;
 box.className=rows.length?'qx-backend-trades':'empty';
 if(!rows.length){box.textContent='No trades yet.';return}
 if(qxMode==='demo'){
  box.innerHTML=rows.slice(-25).reverse().map(t=>`<div class="tradeitem">${esc(t.asset)} · ${esc(t.direction)} · ${money(t.amount)} · ${esc(t.status)}</div>`).join('');return;
 }
 box.innerHTML=rows.slice(0,40).map(t=>{
  const id=String(t.id||t._id||'');const status=String(t.status||'pending');
  const open=['open','pending','active'].includes(status.toLowerCase());
  return `<div class="tradeitem"><b>${esc(t.symbol)}</b> · ${esc(t.direction)} · ${money(t.amountUSD)}<div>${esc(status)} · P/L: ${money(t.profitUSD)}</div>${open?`<div class="qx-expiry" data-expires="${esc(t.expiresAt||'')}">Expires: ${esc(t.expiresAt?new Date(t.expiresAt).toLocaleTimeString():'—')}</div>`:''}</div>`
 }).join('');
}
async function loadChart(){
 if(!ready||loadingChart)return;
 if(!supported.has(asset)){
  notify('This symbol has no server trading feed. Select EUR/USD, GBP/USD or BTC/USD.');
  return;
 }
 loadingChart=true;
 const symbol=asset;
 try{
  const chartPath='/trading/chart';
  const data=await request(chartPath+'?symbol='+encodeURIComponent(symbol)+'&offsetMinutes='+Math.max(0,Math.floor(qxHistoryOffset)));
  if(asset!==symbol)return;
  if(!Array.isArray(data.candles))throw Error('Invalid candle data from server');
  // One unique OHLC candle for each exact 60-second UTC bucket. Never append
  // candles on 3-second quote polls: only update the current minute's OHLC.
  const minuteBars=new Map();
  for(const raw of data.candles){
   const time=Math.floor(Number(raw.time)/60000)*60000;
   const o=Number(raw.open),h=Number(raw.high),l=Number(raw.low),c=Number(raw.close);
   if(!Number.isFinite(time)||![o,h,l,c].every(Number.isFinite))continue;
   minuteBars.set(time,{time,o,h:Math.max(h,o,c),l:Math.min(l,o,c),c});
  }
  const serverCandles=[...minuteBars.values()].sort((a,b)=>a.time-b.time);
  // A valid chart has exactly one timestamp per minute; repeated fetches
  // replace OHLC values in place rather than adding another candle.
  if(serverCandles.length){
   // Keep server candles untouched. Older scrolling area is clearly marked synthetic.
    const existingDummy=candles.filter(b=>b.dummy);
    const firstTime=serverCandles[0].time;
    const reusable=existingDummy.length && existingDummy[existingDummy.length-1].time===firstTime-60000;
    const dummy=reusable?existingDummy:qxBuildDummyHistory(serverCandles,qxDummyCount,symbol);
   candles=[...dummy,...serverCandles];qxRealStartIndex=dummy.length;
   window.qxChartFeed='server';const feed=document.querySelector('.toolbar small');if(feed)feed.textContent='● SIMULATED random chart · not real market data';}
  else{
    // Offline chart preview: create clearly synthetic historical candles, never real quotes.
    if(!candles.length || candles.some(b=>!Number.isFinite(b.time)||!Number.isFinite(b.c))){
      const t=Math.floor(Date.now()/60000)*60000;
      const seed=Number.isFinite(prices[symbol])?prices[symbol]:1.32;
      const anchor={time:t,o:seed,c:seed,h:seed,l:seed};
      candles=[...qxBuildDummyHistory([anchor],Math.max(720,qxDummyCount),symbol),anchor];
      qxRealStartIndex=candles.length-1;
    }
    window.qxChartFeed='simulated-offline';
    const feed=document.querySelector('.toolbar small');if(feed)feed.textContent='● SIMULATED HISTORY · server candles unavailable';
  }
  const v=Number(data.currentPrice);
  if(qxHistoryOffset===0&&data.currentPrice!==null&&data.currentPrice!==undefined&&Number.isFinite(v)&&v>0)prices[symbol]=v;
  latestServerTime=Number(data.serverTime)||Date.now();
  latestCandleEnd=Number(data.nextCandleAt)||0;
  lastServerReceived=Date.now();
  draw();
 }catch(e){console.warn('Chart:',e.message);window.qxChartFeed='unavailable';const feed=document.querySelector('.toolbar small');if(feed)feed.textContent='● Server connection lost · chart paused';}finally{loadingChart=false}
}
function updateFallbackCandle(){ /* Offline: keep last verified simulation candle frozen. */ }
window.qxLoadChart=loadChart;
// Preserve the original chart drawing, but use backend candle timing instead of the local timer.
const originalDraw=draw;
draw=function(){
 if(!candles.length)return;
 originalDraw();
 // Countdown drawn at same line as original HTML, synchronized with server.
 const canvas=document.getElementById('chart'),ctx=canvas.getContext('2d');
 const d=window.devicePixelRatio||1,w=canvas.clientWidth,h=canvas.clientHeight;
 if(w<30||h<30||!supported.has(asset)||qxHistoryOffset>0||chartPan>0)return;
 const right=window.innerWidth<=760?65:72,left=10,ww=w-left-right;
 const endX=left+ww*(.83+.10*((Date.now()%60000)/60000));
 const current=prices[asset];
 const count=Math.max(8,Math.min(candles.length,Math.round((window.innerWidth<=760?20:27)/zoom)));
 const view=candles.slice(Math.max(0,candles.length-count-Math.floor(chartPan)),candles.length-Math.floor(chartPan));
 if(!view.length)return;
 const {lo,hi}=qxChartRange(view,chartPan>0||qxHistoryOffset>0?NaN:current,false);
 const range=qxViewport&&chartPan===0&&qxViewport.asset===asset?qxViewport:{lo,hi};
 const yy=16+(range.hi-current)/(range.hi-range.lo)*(h-50);
 const serverNow=latestServerTime+(Date.now()-lastServerReceived);
 const target=latestCandleEnd>serverNow?latestCandleEnd:Math.floor(serverNow/60000)*60000+60000;
 const seconds=Math.max(1,Math.ceil((target-serverNow)/1000));
 const label=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
 ctx.save();ctx.setTransform(d,0,0,d,0,0);
 ctx.fillStyle='#586176';ctx.fillRect(endX-24,yy-13,48,26);
 ctx.fillStyle='#fff';ctx.font='bold 11px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,endX,yy);ctx.restore();
};
async function signIn(e){
 e.preventDefault();e.stopImmediatePropagation();if(requestBusy)return;
 const msg=document.getElementById('gateMessage');msg.textContent='';
 const mode=gateMode==='register'?'register':'login';
 const email=document.getElementById('gateEmail').value.trim().toLowerCase();
 const password=document.getElementById('gatePassword').value;
 if(!email||!email.includes('@')){msg.textContent='Enter a valid email address.';return}
 if(!password){msg.textContent='Enter your password.';return}
 if(mode==='register'&&!document.getElementById('gateCountry').value){msg.textContent='Select your country.';return}
 if(mode==='register'&&password.length<10){msg.textContent='Password must be at least 10 characters.';return}
 if(mode==='register'&&!document.getElementById('gateAdult').checked){msg.textContent='Please confirm age and terms.';return}
 requestBusy=true;document.getElementById('gateSubmit').disabled=true;
 try{
  const body={email,password};
  if(mode==='register'){body.country=document.getElementById('gateCountry').value||'India';body.name=email.split('@')[0]}
  const result=await request('/auth/'+mode,'POST',body);
  if(!result.token)throw Error('Login response did not include token');
  localStorage.setItem(TOKEN_KEY,result.token);
  sessionStorage.removeItem(TOKEN_KEY);
  account=result.user;
  ready=true;
  document.getElementById('authGate').hidden=true;
  qxMode='live';activeSymbol=asset;
  syncAccount();await Promise.all([loadOverview(),loadChart()]);
 }catch(err){msg.textContent=err.message}
 finally{requestBusy=false;document.getElementById('gateSubmit').disabled=false}
}
submitGate=signIn;
document.getElementById('gateForm').addEventListener('submit',signIn,true);
document.getElementById('gateForm').removeAttribute('onsubmit');
for(const [id,mode] of [['gateTopLogin','login'],['gateLoginTab','login'],['gateTopReg','register'],['gateRegTab','register']]){
 const btn=document.getElementById(id);
 btn.removeAttribute('onclick');
 btn.type='button';
 btn.addEventListener('click',()=>gateTab(mode));
}
gateTab('login');
gateGoogle=function(){document.getElementById('gateMessage').textContent='Google OAuth is not configured on this backend. Email login and registration are available.'};
gateHelp=function(){document.getElementById('gateMessage').textContent='Password recovery requires a backend email-reset endpoint.'};
gateLogout=function(){sessionStorage.removeItem(TOKEN_KEY);localStorage.removeItem(TOKEN_KEY);account=null;overview=null;backendTrades=[];window.qxBackendTrades=[];ready=false;document.getElementById('authGate').hidden=false;gateTab('login');closeModal()};
place=async function(direction){
 const amount=Number(document.getElementById('amount').value);
 if(!Number.isFinite(amount)||amount<1||amount>1000||Math.round(amount*100)!==amount*100){notify('Investment must be $1–$1000, max 2 decimal places.');return}
 if(qxMode==='demo'){
  if(amount>balance){notify('Insufficient demo balance');return}
  const entry=Number(prices[asset]);balance-=amount;
  trades.push({asset,amount,direction,entry,expires:Date.now()+Number(document.getElementById('duration').value)*1000,status:'Open',rate:(FIXED_UI_PAYOUT[asset]||85)/100});
  document.getElementById('balance').textContent=money(balance);renderBackendTrades();return;
 }
 if(!supported.has(asset)){notify('Server trading supports EUR/USD, GBP/USD and BTC/USD only.');return}
 if(requestBusy)return;requestBusy=true;
 try{await request('/trading/place','POST',{symbol:asset,direction:direction.toLowerCase(),amountUSD:amount,durationSeconds:Number(document.getElementById('duration').value)});notify(direction+' trade opened');await loadOverview()}
 catch(err){notify(err.message)}finally{requestBusy=false}
};
// Keep local demo mode explicitly virtual. Live account balance always comes from backend.
switchAccountMode=function(mode){
 if(mode!=='live'&&mode!=='demo')return;
 if(mode===qxMode){closeAccountMenu();return}
 if(mode==='demo'){qxLiveBalance=getLiveBalance(account);qxMode='demo';balance=qxDemoBalance}
 else{qxDemoBalance=balance;qxMode='live';balance=getLiveBalance(account)}
 document.getElementById('balance').textContent=money(balance);updateAccountMenu();renderBackendTrades();closeAccountMenu();
 qxHistoryOffset=0;chartPan=0;loadChart();
};
resetDemoBalance=function(){qxDemoBalance=10000;if(qxMode==='demo'){balance=10000;trades=[];document.getElementById('balance').textContent=money(balance);renderBackendTrades()}updateAccountMenu()};
// Keep the exact payment-method UI, but submit real backend deposit REQUESTS (not a payment gateway).
window.qxSubmitDeposit=async function(){
 if(!ready){notify('Please log in');return}
 const amountINR=Number(document.getElementById('depositInr')?.value);
 const method=(document.querySelector('.deposit-provider strong')?.textContent||'').trim();
 const gateway={'LG-Pay':'lg','WatchPay':'watch','BondPay':'bond','USDT Pay':'usdt'}[method];
 if(!gateway||!Number.isFinite(amountINR)||amountINR<100||amountINR>100000){notify('Enter valid amount (₹100–₹100000)');return}
 const btn=document.getElementById('depositProceed');if(btn)btn.disabled=true;
 try{const offerAmountINR=qxSelectedOffer===amountINR?qxSelectedOffer:null;const result=await request('/payments/create','POST',{amountINR,gateway,offerAmountINR});notify('Payment order created. Complete payment to credit LIVE balance.');window.open(result.paymentUrl,'_blank','noopener,noreferrer');}
 catch(e){notify(e.message)}finally{if(btn)btn.disabled=false}
};

// Optional retention offers. Never condition withdrawal eligibility on another payment.
function qxOptionalTopupHTML(){
 const state=String(account?.popup||'none');
 const amount=state==='1999'?1999:state==='1399'?1399:null;
 if(!amount)return '';
 return `<section class="qx-retention"><strong>Optional returning-trader wallet top-up</strong><p>₹${amount.toLocaleString('en-IN')} can be added to your LIVE wallet. This is not a tax or eKYC charge and is never required to request or receive a withdrawal.</p><div class="qx-retention-actions"><button type="button" onclick="qxOfferDeposit(${amount})">Add ₹${amount.toLocaleString('en-IN')}</button></div></section>`;
}
let qxSelectedOffer=null;
function qxOfferDeposit(amount){
 qxSelectedOffer=amount;
 openModal('method:LG-Pay');
 const el=document.getElementById('depositInr');
 if(el){el.value=String(amount);el.dispatchEvent(new Event('input',{bubbles:true}));refreshDepositConversion()}
}
function qxCheckApprovedWithdrawal(){
 if(!ready||!account)return;
 const ws=overview?.withdrawals||[];
 const userId=String(account.id||account._id||account.email||'');
 for(const w of ws){
  if(!['approved','paid','completed','released'].includes(String(w.status||'').toLowerCase()))continue;
  const key='qx-withdrawal-notified:'+userId+':'+String(w.id||w._id||'')+':'+String(w.status);
  if(sessionStorage.getItem(key))continue;
  sessionStorage.setItem(key,'1');
  const note=document.createElement('div');note.className='qx-approved-toast';
  note.innerHTML='<strong>Withdrawal status updated</strong><p>Your withdrawal has been marked '+esc(String(w.status))+'. Check payment history for details. No additional deposit is required to release an eligible withdrawal.</p><button type="button">OK</button>';
  note.querySelector('button').onclick=()=>note.remove();document.body.appendChild(note);
  break;
 }
}

// Wire withdrawal, payment history, support and trade history to existing backend.
const oldOpenModal=openModal;
openModal=function(type){
 if(type==='logout'){gateLogout();return}
 if(type==='payments'){
  oldOpenModal(type);
  const ds=overview?.deposits||[],ws=overview?.withdrawals||[];
  document.getElementById('modalBody').innerHTML='<h3>Deposits</h3>'+(ds.length?ds.map(d=>`<div class="dataitem">${money(d.amountUSD)} · ${esc(d.method)} · ${esc(d.status)}</div>`).join(''):'<p>No deposits</p>')+'<h3>Withdrawals</h3>'+(ws.length?ws.map(d=>`<div class="dataitem">${money(d.amountUSD)} · ${esc(d.method)} · ${esc(d.status)}</div>`).join(''):'<p>No withdrawals</p>');return;
 }
 if(type==='trades'){oldOpenModal(type);document.getElementById('modalBody').innerHTML=backendTrades.slice(0,50).map(t=>`<div class="dataitem">${esc(t.symbol)} · ${esc(t.direction)} · ${money(t.amountUSD)} · ${esc(t.status)}</div>`).join('')||'<p>No trades</p>';return}
 if(type==='withdrawal'){
  oldOpenModal(type);document.getElementById('modalBody').innerHTML=qxOptionalTopupHTML()+'<form id="qxWithdrawal"><label class="field">Amount USD<input name="amountUSD" type="number" min="0.01" step="0.01" required></label><label class="field">Method<select name="method"><option>UPI</option><option>Bank Transfer</option><option>USDT</option></select></label><label class="field">Destination<input name="destination" minlength="3" maxlength="180" required placeholder="Account or wallet destination"></label><button class="wide">Request withdrawal</button></form>';document.getElementById('qxWithdrawal').onsubmit=async e=>{e.preventDefault();const f=e.target;const b={amountUSD:Number(f.elements.amountUSD.value),method:f.elements.method.value,destination:f.elements.destination.value};try{await request('/me/withdrawals','POST',b);notify('Withdrawal request submitted');await loadOverview();closeModal()}catch(err){notify(err.message)}};return;
 }
 if(type==='support'||type==='help'){
  oldOpenModal(type);document.getElementById('modalBody').innerHTML='<form id="qxTicket"><label class="field">Subject<input name="subject" minlength="3" maxlength="120" required></label><label class="field">Message<textarea name="message" minlength="3" maxlength="2000" required style="width:100%;min-height:110px;background:#222838;color:white;padding:10px"></textarea></label><button class="wide">Send support ticket</button></form>';document.getElementById('qxTicket').onsubmit=async e=>{e.preventDefault();const f=e.target;try{await request('/me/tickets','POST',{subject:f.elements.subject.value,message:f.elements.message.value});notify('Support ticket submitted');await loadOverview();closeModal()}catch(err){notify(err.message)}};return;
 }
 if(type==='profile'||type==='account'){
  oldOpenModal(type);
  const f=document.getElementById('qxProfileForm');if(f){
   const email=f.elements.email;if(email){email.value=account?.email||'';email.readOnly=true}
   const originalSave=f.getAttribute('onsubmit');f.removeAttribute('onsubmit');f.onsubmit=e=>{e.preventDefault();notify('Profile editing requires a matching /api/me/profile backend endpoint. Changes were not submitted.')};
   const id=document.getElementById('qxProfileId');if(id)id.textContent=account?.id||account?._id||'—';
  }
  return;
 }
 oldOpenModal(type);
};
// Server-backed pair picker: only enable actual supported pairs for trading.
const oldChoosePair=choosePair;
choosePair=function(name){
 if(!supported.has(name)){notify('No backend chart/trading feed for '+name+'. Select EUR/USD, GBP/USD or BTC/USD.');return}
 oldChoosePair(name);chartPan=0;loadChart();
};
const oldAssetOnChange=document.getElementById('asset').onchange;
document.getElementById('asset').onchange=function(e){
 if(!supported.has(e.target.value)){notify('Unsupported server pair');e.target.value=asset;return}
 oldAssetOnChange(e);loadChart();
};
// No local fake price engine. Refresh real backend chart once per second.
// Smooth visual interpolation only. Server prices and trade settlement remain authoritative.
const qxRawChartDraw = draw;
let qxVisualAsset = null, qxVisualMinute = null, qxVisualClose = null, qxVisualFrame = 0;
draw = function(){
  if (!candles.length) return qxRawChartDraw();
  const last = candles[candles.length - 1];
  const minute = Number(last?.time);
  const target = Number(last?.c);
  if (chartPan > 0 || qxHistoryOffset > 0 || !Number.isFinite(target)) {
    return qxRawChartDraw();
  }
  const now = performance.now();
  if (qxVisualAsset !== asset || qxVisualMinute !== minute || !Number.isFinite(qxVisualClose)) {
    qxVisualAsset = asset;
    qxVisualMinute = minute;
    // A new minute opens from the preceding candle's closing price.
    const prev = candles[candles.length - 2];
    qxVisualClose = Number.isFinite(prev?.c) && minute !== null ? Number(prev.c) : target;
    if (!Number.isFinite(qxVisualClose)) qxVisualClose = target;
    qxVisualFrame = now;
  }
  const dt = Math.max(0, Math.min(0.08, (now - qxVisualFrame) / 1000));
  qxVisualFrame = now;
  // 0.30s response time: movement remains fluid between 1s polls.
  const alpha = 1 - Math.exp(-dt / 0.30);
  qxVisualClose += (target - qxVisualClose) * alpha;
  if (Math.abs(target - qxVisualClose) < Math.max(Math.abs(target) * 1e-10, 1e-9)) qxVisualClose = target;
  // Temporarily override only the rendered values, then restore server data.
  const originalBar = candles[candles.length - 1];
  const originalPrice = prices[asset];
  candles[candles.length - 1] = {
    ...originalBar,
    c: qxVisualClose,
    h: Math.max(Number(originalBar.h), qxVisualClose),
    l: Math.min(Number(originalBar.l), qxVisualClose)
  };
  prices[asset] = qxVisualClose;
  try { return qxRawChartDraw(); }
  finally {
    candles[candles.length - 1] = originalBar;
    prices[asset] = originalPrice;
  }
};
function animate(){if(ready&&candles.length&&!document.hidden)draw();requestAnimationFrame(animate)}
function localDemoSettle(){
 if(qxMode!=='demo')return;
 let changed=false;
 for(const t of trades){if(t.status!=='Open'||Date.now()<t.expires)continue;
  const exit=prices[t.asset]??t.entry;
  const signed=(exit-t.entry)*(t.direction==='Buy'?1:-1);
  t.status=signed>0?'Won':signed<0?'Lost':'Draw';
  if(signed>0)qxWinToast(t.amount*.8,t.asset);
  balance+=signed>0?t.amount*1.8:signed===0?t.amount:0;
  changed=true;
 }
 if(changed){qxDemoBalance=balance;document.getElementById('balance').textContent=money(balance);renderBackendTrades()}
}
async function boot(){
 document.getElementById('authGate').hidden=Boolean(token());
 if(token()){
  try{const result=await request('/auth/me');account=result.user;ready=true;document.getElementById('authGate').hidden=true;syncAccount();await Promise.all([loadOverview(),loadChart()])}
  catch(e){console.warn('Session restore:',e.message);ready=false;document.getElementById('authGate').hidden=false;document.getElementById('gateMessage').textContent='Could not reach account server. Please check backend connection.'}
 }
 updatePayout();
 setInterval(()=>{document.getElementById('clock').textContent=new Date().toLocaleTimeString('en-GB',{timeZone:'Asia/Kolkata'});localDemoSettle()},1000);
 setInterval(()=>{if(!qxHistoryBusy && !document.hidden)loadChart()},1000);
 setInterval(loadOverview,3000);
 requestAnimationFrame(animate);
}
boot();
})();


;(()=>{
const actions={
"1":function(event){gateTab('login')},
"2":function(event){gateTab('register')},
"3":function(event){gateHelp()},
"4":function(event){gateGoogle()},
"5":function(event){openModal('login')},
"6":function(event){openModal('register')},
"7":function(event){toggleAccountMenu(event)},
"8":function(event){openModal('deposit')},
"9":function(event){openModal('withdrawal')},
"10":function(event){openModal('menu')},
"11":function(event){openModal('settings');closeAccountMenu()},
"12":function(event){switchAccountMode('live')},
"13":function(event){switchAccountMode('demo')},
"14":function(event){resetDemoBalance()},
"15":function(event){closeModal()},
"16":function(event){openModal('help')},
"17":function(event){openModal('profile')},
"18":function(event){openModal('tournaments')},
"19":function(event){openModal('market')},
"20":function(event){toggleMore()},
"21":function(event){openModal('settings')},
"22":function(event){document.getElementById('offerBanner').remove()},
"23":function(event){toggleMore(false)},
"24":function(event){morePage('market')},
"25":function(event){morePage('analytics')},
"26":function(event){morePage('top')},
"27":function(event){morePage('signals')},
"28":function(event){toggleMore(false);openModal('deposit')},
"29":function(event){toggleMore(false);openModal('withdrawal')},
"30":function(event){toggleMore(false);openModal('payments')},
"31":function(event){toggleMore(false);openModal('trades')},
"32":function(event){toggleMore(false);openModal('settings')},
"33":function(event){toggleMore(false);openModal('logout')},
"34":function(event){backMore()},
"35":function(event){changeZoom(1)},
"36":function(event){changeZoom(-1)},
"37":function(event){openPairs()},
"38":function(event){toggleTimerPicker()},
"39":function(event){setTimerMode('timer')},
"40":function(event){setTimerMode('time')},
"41":function(event){manualTimer()},
"42":function(event){adjustAmount(-1)},
"43":function(event){adjustAmount(1)},
"44":function(event){place('Buy')},
"45":function(event){place('Sell')},
"46":function(event){toggleMore(false);closeModal()},
"47":function(event){closePairs()},
"48":function(event){pairFavOnly=!pairFavOnly;renderPairs()},
"49":function(event){document.getElementById('qxNotice').classList.remove('show')},
"50":function(event){gateLogout()},
"51":function(event){qxSubmitDeposit()},
"52":function(event){submitGate(event)},
"53":function(event){saveQxProfile(event)},
"54":function(event){renderPairs()},
"55":function(event){refreshDepositConversion()},
"56":function(event){if(event.key==='Enter'||event.key===' '){event.preventDefault();openPairs()}},
};
function runAction(element,event,kind){
 const val=element.getAttribute('data-qx-'+kind);
 if(!val)return;
 if(actions[val]){actions[val].call(element,event);return;}
 // Values interpolated in dynamic UI templates are dispatched explicitly.
 let m;
 if((m=/^setDepositUsd\((\d+(?:\.\d+)?)\)$/.exec(val))){setDepositUsd(Number(m[1]));return;}
 if((m=/^selectPairCategory\('([^']+)'\)$/.exec(val))){selectPairCategory(m[1]);return;}
 if((m=/^event\.stopPropagation\(\);togglePairFavorite\('([^']+)'\)$/.exec(val))){event.stopPropagation();togglePairFavorite(m[1]);return;}
 if((m=/^choosePair\('([^']+)'\)$/.exec(val))){choosePair(m[1]);return;}
 if((m=/^showMethods\(\'([^']+)\'\)$/.exec(val))){showMethods(m[1]);return;}
 if((m=/^openModal\(\'([^']+)\'\)$/.exec(val))){openModal(m[1]);return;}
 if(val.includes('s.toLowerCase()')){const t=element.textContent.trim();openModal(t.toLowerCase());return;}
 if(val.startsWith('alert(')){console.warn('Preview-only action',val);return;}
 console.warn('Unmapped action',val);
}
for(const kind of ['onclick','oninput','onkeydown','onsubmit']){
 const eventName={onclick:'click',oninput:'input',onkeydown:'keydown',onsubmit:'submit'}[kind];
 document.addEventListener(eventName,event=>{
   const el=event.target.closest('[data-qx-'+kind+']');
   if(!el)return;
   if(kind==='onsubmit')event.preventDefault();
   runAction(el,event,kind);
 });
}
})();
// Fixed-time trading enhancements. Backend is authoritative for all live trades.
const FIXED_UI_PAYOUT={'EUR/USD':85,'GBP/USD':87,'BTC/USD':85};
const _oldPayout=updatePayout;
updatePayout=function(){const stake=Math.max(0,Number(document.getElementById('amount').value)||0);
 const pct=FIXED_UI_PAYOUT[asset]||85;document.getElementById('payout').textContent=cash(stake*(1+pct/100));};
document.getElementById('amount').addEventListener('input',updatePayout);
document.getElementById('asset').addEventListener('change',updatePayout);
updatePayout();
const _tradeLineDraw=draw;
draw=function(){_tradeLineDraw();
 const active=qxMode==='demo'?trades.filter(t=>t.status==='Open'&&t.asset===asset).map(t=>({entryPrice:t.entry,direction:t.direction.toLowerCase(),expiresAt:new Date(t.expires).toISOString()})):(window.qxBackendTrades||[]).filter(t=>['open','pending','active'].includes(String(t.status).toLowerCase())&&t.symbol===asset);
 if(!active.length||!candles.length)return;
 const el=document.getElementById('chart'),ctx=el.getContext('2d');const w=el.clientWidth,h=el.clientHeight,d=window.devicePixelRatio||1;
 const top=16,bottom=34,right=window.innerWidth<=760?65:72;
 const count=Math.max(8,Math.min(candles.length,Math.round((window.innerWidth<=760?20:27)/zoom)));
 const view=candles.slice(Math.max(0,candles.length-count-Math.floor(chartPan)),candles.length-Math.floor(chartPan));
 if(!view.length)return;
 const {lo,hi}=qxChartRange(view,prices[asset],false);
 const range=qxViewport&&chartPan===0&&qxViewport.asset===asset?qxViewport:{lo,hi};
 ctx.save();ctx.setTransform(d,0,0,d,0,0);
 active.slice(-5).forEach(t=>{const p=Number(t.entryPrice);if(!Number.isFinite(p))return;
 const y=top+(range.hi-p)/(range.hi-range.lo)*(h-top-bottom);if(y<top||y>h-bottom)return;
 ctx.strokeStyle=t.direction==='buy'?'#34d889':'#ff8d6e';ctx.lineWidth=2;ctx.setLineDash([8,4]);ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w-right,y);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle=ctx.strokeStyle;ctx.fillRect(4,y-12,Math.min(165,w-right-8),18);ctx.fillStyle='#091723';ctx.font='bold 11px Arial';
 const secs=Math.max(0,Math.ceil((new Date(t.expiresAt).getTime()-Date.now())/1000));ctx.fillText((t.direction==='buy'?'▲ BUY ':'▼ SELL ')+p.toFixed(digits())+'  '+timerText(secs),8,y+1);});ctx.restore();
};

// Return to latest candles without refreshing the page.
window.qxChartLatest=()=>{qxHistoryOffset=0;chartPan=0;loadChart()};
const qxLatestButton=document.createElement('button');
qxLatestButton.type='button';qxLatestButton.textContent='↪ Latest';
qxLatestButton.className='qx-latest-chart';
qxLatestButton.addEventListener('click',window.qxChartLatest);
document.getElementById('chart')?.parentElement?.appendChild(qxLatestButton);
