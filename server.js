// Bingo en vivo v7 (1-60): varias salas (un anfitrión por sala), sin dependencias. Ejecuta: node server.js
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto'),zlib=require('zlib');
//#ENGINE-START (lógica del juego; la demo la reutiliza tal cual)
function createEngine(newId){
 /* t = categoría: 0 platino (plateado) · 1 dorado. Cada categoría tiene su propio ranking, puestos y premios; comparten los números cantados. */
 let called=[],cs=new Set(),round=1,open=true,places=[5,5],prizes=[['','','','',''],['','','','','']],jk=0,jn=[],pt=null,kc=0,wh=[],rec=0,base=0,ck=0,rv=0,tbn=0,wc=null,cg=false;
 const MAXC=10,CN=16,players=new Map(),subs=new Set(),gh=new Map(),tb=new Map();
 const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
 const newCard=()=>shuffle(Array.from({length:60},(_,i)=>i+1)).slice(0,CN);
 const lc=c=>c.filter(n=>!cs.has(n)).length;
 const left=p=>Math.min(...p.cards.map(lc));
 const doneAt=p=>{let b=0;for(const c of p.cards)if(!lc(c)){const d=Math.max(...c.map(n=>called.indexOf(n)+1));if(!b||d<b)b=d}return b};
 const everyone=()=>[...players.values(),...gh.values()];
 function W(t){const f=everyone().filter(p=>p.t===t).map(p=>({p,d:doneAt(p),t:tb.get(p.id)||0})).filter(x=>x.d).sort((a,b)=>a.d-b.d||a.t-b.t),w=[];let k=0;
  for(const x of f){const l=w[w.length-1];if(l&&l.draw===x.d&&!x.t&&!l.tb){l.names.push(x.p.name);l.ids.push(x.p.id)}else w.push({place:k+1,draw:x.d,names:[x.p.name],ids:[x.p.id],tb:!!x.t});k++}
  return{w,total:k}}
 const wins=()=>{if(wc)return wc;const r=[W(0),W(1)];if(cg)wc=r;return r};
 const isOver=()=>{if(called.length>=60)return true;const r=wins(),all=everyone();
  const fin=t=>{const n=all.filter(p=>p.t===t).length;return n===0||r[t].total>=Math.min(places[t],n)};
  return(r[0].total>0||r[1].total>0)&&fin(0)&&fin(1)};
 function arch(){if(rec===round)return;const r=wins(),a=[];
  [0,1].forEach(t=>r[t].w.filter(g=>g.place<=places[t]).forEach(g=>a.push({r:round-base,t,place:g.place,names:g.names.slice(),tb:g.tb,prize:prizes[t][g.place-1]||''})));
  if(!a.length)return;rec=round;wh=[...a,...wh].slice(0,30)}
 function snap(){const r=wins(),pl=[...players.values()],dist=[Array(CN+1).fill(0),Array(CN+1).fill(0)],nt=[0,0];
  const top=pl.map(p=>{const l=left(p);dist[p.t][l]++;nt[p.t]++;return[p.name,l,p.cards.length,p.t]}).sort((a,b)=>a[1]-b[1]||b[2]-a[2]||a[0].localeCompare(b[0],'es'));
  return{called,round,n:pl.length,nt,tc:pl.reduce((a,p)=>a+p.cards.length,0),open:open&&called.length===0,places,prizes,over:isOver()&&called.length>0,
   win:[0,1].map(t=>r[t].w.filter(g=>g.place<=places[t]).map(g=>({place:g.place,draw:g.draw,names:g.names,tb:g.tb,prize:prizes[t][g.place-1]||''}))),
   tie:[0,1].some(t=>r[t].w.some(g=>g.place<=places[t]&&g.names.length>1)),dist,
   top,jn,wh,kc,ck,rv,cn:CN}}
 const go=()=>{pt=null;cg=true;wc=null;try{if(called.length&&isOver())arch();const s=JSON.stringify(snap());subs.forEach(f=>{try{f(s)}catch(e){}})}finally{cg=false;wc=null}};
 const push=now=>{if(now){clearTimeout(pt);go()}else if(!pt)pt=setTimeout(go,500)};
 const info=p=>({id:p.id,name:p.name,cards:p.cards,t:p.t});
 const clean=s=>String(s||'').replace(/[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u2069\ufeff<>]/g,'').replace(/\s+/g,' ').trim().slice(0,20);
 const uniq=(name,id)=>{let n=name,i=2;while([...players.values()].some(p=>p.id!==id&&p.name.toLowerCase()===n.toLowerCase()))n=name.slice(0,16)+' ('+i+++')';return n};
 const byName=n=>{const nm=clean(n).toLowerCase();return nm&&[...players.values()].find(x=>x.name.toLowerCase()===nm)};
 function api(m,p,q,b,host){b=b||{};
  if(p==='/join'&&m==='POST'){let pl=players.get(b.id);
   if(!pl){if(called.length||!open)return[403,{error:'closed'}];const name=clean(b.name);if(!name)return[400,{error:'name'}];if(players.size>=500)return[403,{error:'full'}];
    pl={id:newId(),name:uniq(name),cards:[newCard()],t:0};players.set(pl.id,pl);jn=[...jn,{k:++jk,name:pl.name}].slice(-5);rv++;push()}
   return[200,info(pl)]}
  if(p==='/me'){const pl=players.get(q.id);return pl?[200,info(pl)]:[404,{}]}
  if(p==='/rename'&&m==='POST'){const pl=players.get(b.id),n=clean(b.name);if(!pl||!n)return[400,{}];pl.name=uniq(n,pl.id);rv++;push();return[200,info(pl)]}
  if(p==='/leave'&&m==='POST'){const pl=players.get(b.id);if(pl){if(called.length&&!left(pl))gh.set(pl.id,pl);players.delete(pl.id);rv++;push()}return[200,{}]}
  if(p==='/roster'&&m==='GET'){if(!host)return[403,{error:'key'}];
   return[200,{list:[...players.values()].map(x=>({name:x.name,c:x.cards.length,t:x.t})).sort((a,b)=>b.c-a.c||a.name.localeCompare(b.name,'es'))}]}
  if(m==='POST'&&['/draw','/reset','/config','/kick','/hardreset','/addcard','/tiebreak','/tier'].includes(p)){if(!host)return[403,{error:'key'}];
   if(p==='/draw'){const rest=[];for(let n=1;n<=60;n++)if(!called.includes(n))rest.push(n);
    if(isOver()||!rest.length)return[409,{}];const n=rest[Math.floor(Math.random()*rest.length)];called.push(n);cs.add(n);push(true);return[200,{n}]}
   if(p==='/reset'){arch();gh.clear();tb.clear();tbn=0;called=[];cs=new Set();round++;open=true;players.forEach(x=>x.cards=x.cards.map(()=>newCard()));push(true);return[200,{}]}
   if(p==='/kick'){const pl=byName(b.name);if(!pl)return[404,{error:'none'}];players.delete(pl.id);kc++;rv++;push(true);return[200,{name:pl.name}]}
   if(p==='/hardreset'){called=[];cs=new Set();round++;base=round-1;open=true;players.clear();gh.clear();tb.clear();tbn=0;jn=[];wh=[];rec=0;kc++;rv++;push(true);return[200,{}]}
   if(p==='/tier'){const pl=byName(b.name);if(!pl)return[404,{error:'none'}];if(called.length)return[409,{error:'started'}];
    pl.t=b.t===0||b.t===1?b.t:1-pl.t;rv++;push();return[200,{name:pl.name,t:pl.t}]}
   if(p==='/addcard'){const pl=byName(b.name);if(!pl)return[404,{error:'none'}];
    if(called.length)return[409,{error:'started'}];const n=Math.max(-9,Math.min(9,Math.trunc(+b.n)||1));
    if(n>0){if(pl.cards.length>=MAXC)return[409,{error:'max',max:MAXC}];for(let i=0;i<n&&pl.cards.length<MAXC;i++)pl.cards.push(newCard())}
    else{if(pl.cards.length<=1)return[409,{error:'min'}];pl.cards.length=Math.max(1,pl.cards.length+n)}
    ck++;rv++;push(true);return[200,{name:pl.name,c:pl.cards.length}]}
   if(p==='/tiebreak'){const r=wins();let any=false;
    [0,1].forEach(t=>r[t].w.filter(g=>g.place<=places[t]&&g.names.length>1&&!g.tb).forEach(g=>{any=true;shuffle(g.ids.slice()).forEach(id=>tb.set(id,++tbn))}));
    if(!any)return[409,{error:'none'}];push(true);return[200,{}]}
   /* /config: t = categoría (0 platino, 1 dorado) a la que se aplican premios y puestos */
   const t=+b.t===1?1:0;
   if(Array.isArray(b.prizes))prizes[t]=[0,1,2,3,4].map(i=>String(b.prizes[i]||'').slice(0,40));
   if([1,2,3,4,5].includes(+b.places))places[t]=+b.places;if(typeof b.open==='boolean')open=b.open;push();return[200,{}]}
  return null}
 return{api,snap,subs}}
//#ENGINE-END

/* ===== Salas: cada anfitrión tiene su propio motor, enlace de participantes y clave ===== */
const PORT=process.env.PORT||3000,rnd=n=>crypto.randomBytes(n).toString('hex'),
 ENVKEY=process.env.ADMIN_KEY||process.env.HOST_KEY,ADMIN=ENVKEY||rnd(8),
 BASE=(process.env.RENDER_EXTERNAL_URL||process.env.PUBLIC_URL||'http://localhost:'+PORT).replace(/\/+$/,''),
 DATA=process.env.DATA_DIR||path.join(__dirname,'data'),FILE=path.join(DATA,'rooms.json'),
 TTL=(+process.env.ROOM_TTL_HOURS||12)*36e5,MAXROOMS=+process.env.MAX_ROOMS||200;
const F={'landing.html':['text/html;charset=utf-8','no-cache'],'board.jpg':['image/jpeg','public,max-age=3600'],'card.jpg':['image/jpeg','public,max-age=3600'],'frog.jpg':['image/jpeg','public,max-age=86400']};
const GAME=fs.readFileSync(path.join(__dirname,'public','index.html'),'utf8');
const rooms=new Map(),pings=new Set(),fails=new Map(),retired=new Set();
process.on('uncaughtException',e=>console.error(e));process.on('unhandledRejection',e=>console.error(e));
setInterval(()=>pings.forEach(f=>f()),20000);
const mkRoom=(code,hostKey,rid)=>({code,hostKey,rid:rid||rnd(6),E:createEngine(()=>rnd(5)),conns:new Set(),last:Date.now()});
function saveRooms(){try{fs.mkdirSync(DATA,{recursive:true});const t=FILE+'.tmp';fs.writeFileSync(t,JSON.stringify([...rooms.values()].map(r=>({code:r.code,hostKey:r.hostKey,rid:r.rid}))));fs.renameSync(t,FILE)}catch(e){}}
try{for(const x of JSON.parse(fs.readFileSync(FILE,'utf8')))if(x&&x.code&&x.hostKey)rooms.set(x.code,mkRoom(x.code,x.hostKey,x.rid))}catch(e){}
/* códigos: aleatorio o personalizado (3-30: minúsculas, números y guiones) */
const CODE=/^[a-z0-9][a-z0-9-]{2,29}$/,ALPHA='abcdefghjkmnpqrstuvwxyz23456789',RESERVED=new Set(['admin','host','crear','health','events','api','static']);
const randCode=()=>{let c;do{c=Array.from(crypto.randomBytes(6),b=>ALPHA[b%ALPHA.length]).join('')}while(rooms.has(c));return c};
const normCode=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,'-');
function pickCode(raw,cur){const c=normCode(raw);if(!c)return randCode();if(!CODE.test(c)||RESERVED.has(c))return null;if((rooms.has(c)||retired.has(c))&&c!==cur)return false;return c} // null=inválido, false=ocupado
const eq=(a,b)=>{a=Buffer.from(String(a||''));b=Buffer.from(String(b));return a.length===b.length&&crypto.timingSafeEqual(a,b)};
/* freno a quien adivina la clave maestra */
const ipOf=req=>String(req.headers['x-forwarded-for']||req.socket.remoteAddress||'').split(',').pop().trim();
const blocked=ip=>{const f=fails.get(ip);return !!f&&f.n>=8&&Date.now()-f.t<6e5};
const fail=ip=>{const f=fails.get(ip);if(!f||Date.now()-f.t>=6e5)fails.set(ip,{n:1,t:Date.now()});else{f.n++;f.t=Date.now()}};
/* limpieza de salas sin uso */
setInterval(()=>{const now=Date.now();let ch=false;rooms.forEach((r,c)=>{if(!r.conns.size&&now-r.last>TTL){rooms.delete(c);ch=true}});if(ch)saveRooms();fails.forEach((f,k)=>{if(now-f.t>6e5)fails.delete(k)})},6e5);
const body=req=>new Promise(r=>{let d='';req.on('data',c=>{d+=c;if(d.length>1e4)req.destroy()});req.on('end',()=>{try{const j=JSON.parse(d||'{}');r(j&&typeof j==='object'&&!Array.isArray(j)?j:{})}catch(e){r({})}});req.on('error',()=>r({}));req.on('close',()=>r({}))});
const send=(res,code,obj)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(obj))};
const page=(res,code,t)=>{res.writeHead(code,{'Content-Type':'text/html;charset=utf-8'});res.end('<!DOCTYPE html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:system-ui;background:#12072e;color:#fff;display:grid;place-items:center;height:100vh;margin:0;text-align:center;padding:20px"><div><div style="font-size:60px">🐸</div><h2>'+t+'</h2></div>')};
const GI=GAME.indexOf('</head>');
async function H(req,res){
 const u=new URL(req.url,'http://x'),p=u.pathname;
 if(p==='/health'){res.writeHead(200);return res.end('ok')}
 /* crear sala: solo con la clave maestra */
 if(p==='/crear'&&req.method==='POST'){const b=await body(req),ip=ipOf(req);
  if(blocked(ip))return send(res,429,{error:'wait'});
  if(!eq(b.adminKey,ADMIN)){fail(ip);return send(res,403,{error:'key'})}
  if(rooms.size>=MAXROOMS)return send(res,503,{error:'full'});
  const c=pickCode(b.code);if(c===null)return send(res,400,{error:'invalid'});if(c===false)return send(res,409,{error:'taken'});
  const r=mkRoom(c,rnd(8));rooms.set(c,r);saveRooms();return send(res,200,{code:c,hostKey:r.hostKey})}
 /* rutas de una sala: /s/CODIGO[/host|/events|/join|...] */
 const m=p.match(/^\/s\/([^/]+)(\/.*)?$/);
 if(m){const code=m[1].toLowerCase(),rest=m[2]||'',room=rooms.get(code);
  if(!room){if(req.method==='GET'&&(rest===''||rest==='/'||rest==='/host'))return page(res,404,'Esta partida no existe o su enlace cambió.<br><small style="opacity:.7">Pide el enlace actual a tu anfitrión.</small>');return send(res,404,{})}
  room.last=Date.now();const E=room.E,host=eq(u.searchParams.get('key'),room.hostKey);
  if(rest==='/join'&&req.method==='POST'){const k='j'+ipOf(req),now=Date.now(),f=fails.get(k);if(!f||now-f.t>=6e4)fails.set(k,{n:1,t:now});else if(++f.n>150)return send(res,429,{error:'wait'})}
  if(rest===''||rest==='/'||rest==='/host'){
   if(rest==='/host'&&!host){const ip=ipOf(req);if(blocked(ip))return page(res,429,'Demasiados intentos. Espera unos minutos.');fail(ip);return page(res,403,'Enlace de anfitrión incorrecto.')}
   const isH=rest==='/host',inj='<script>window.__ROOM='+JSON.stringify({code,rid:room.rid,host:isH})+'</script>',gzp=/\bgzip\b/.test(req.headers['accept-encoding']||'');
   res.writeHead(200,Object.assign({'Content-Type':'text/html;charset=utf-8','Cache-Control':'no-store','Vary':'Accept-Encoding'},gzp?{'Content-Encoding':'gzip'}:{}));
   const out=GAME.slice(0,GI)+inj+GAME.slice(GI);return res.end(gzp?zlib.gzipSync(out):out)}
  if(rest==='/events'){res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});
   const f=s=>res.write('data:'+s+'\n\n'),pg=()=>res.write(': ping\n\n');E.subs.add(f);pings.add(pg);room.conns.add(res);
   res.write('retry:2000\n');f(JSON.stringify(E.snap()));req.on('close',()=>{E.subs.delete(f);pings.delete(pg);room.conns.delete(res)});return}
  /* cambiar el enlace de participantes (solo anfitrión de esa sala) */
  if(rest==='/relink'&&req.method==='POST'){if(!host)return send(res,403,{error:'key'});
   const b=await body(req),c=pickCode(b.code,code);if(c===null)return send(res,400,{error:'invalid'});if(c===false)return send(res,409,{error:'taken'});
   if(c!==code){rooms.delete(code);retired.add(code);room.code=c;rooms.set(c,room);saveRooms();
    room.conns.forEach(r=>{try{r.write('event: closed\ndata: x\n\n');r.end()}catch(e){}});room.conns.clear()}
   return send(res,200,{code:c})}
  const r=E.api(req.method,rest,Object.fromEntries(u.searchParams),req.method==='POST'?await body(req):{},host);
  if(r)return send(res,r[0],r[1]);
  return send(res,404,{})}
 const f=p==='/'?'landing.html':p.slice(1);
 if(!F[f]){res.writeHead(404);return res.end('No encontrado')}
 res.writeHead(200,{'Content-Type':F[f][0],'Cache-Control':F[f][1]});const st=fs.createReadStream(path.join(__dirname,'public',f));st.on('error',()=>res.destroy());st.pipe(res);
}
http.createServer((req,res)=>{H(req,res).catch(()=>{try{if(!res.headersSent)res.writeHead(500);res.end()}catch(e){}})}).listen(PORT,()=>{console.log('Crear partidas: '+BASE+'/\nClave maestra:  '+(ENVKEY?'(tu ADMIN_KEY)':ADMIN)+'\nSalas cargadas: '+rooms.size)});
