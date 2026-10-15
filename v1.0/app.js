const GAS=['Vivienda','Alimentación','Transporte','Ocio','Salud','Otros gastos'],ING=['Nómina','Extras','Otros ingresos'];
const COL=['#1f6f68','#d9822b','#4f6bd8','#b8467c','#6a9f3c','#8a7a6a'];
const KEY='presupuesto-v1';
let S={tx:[],lim:{},goals:[]};
try{const r=localStorage.getItem(KEY);if(r)S=Object.assign(S,JSON.parse(r))}catch(e){}
S.cfg=Object.assign({cur:"EUR",theme:"auto",acc:"#3b6ef5",size:100},S.cfg);
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const $=id=>document.getElementById(id);
const eur=n=>n.toLocaleString('es-ES',{style:'currency',currency:S.cfg.cur});
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r2=n=>Math.round(n*100)/100;
const today=()=>new Date().toISOString().slice(0,10);
let M=today().slice(0,7);
const shift=(m,d)=>{let[y,k]=m.split('-').map(Number);const t=new Date(y,k-1+d,1);return t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')};
const lab=m=>{const[y,k]=m.split('-');return new Date(y,k-1,1).toLocaleDateString('es-ES',{month:'short'})};
const inM=m=>S.tx.filter(t=>t.d.startsWith(m));
const sum=(a,ty)=>r2(a.filter(t=>t.ty===ty).reduce((s,t)=>s+t.a,0));

function catOpts(){$('mc').innerHTML=($('mt').value==='g'?GAS:ING).map(c=>`<option>${c}</option>`).join('')}

function resumen(){
 const a=inM(M),inc=sum(a,'i'),exp=sum(a,'g'),bal=r2(inc-exp);
 const pct=inc>0?exp/inc*100:(exp>0?100:0);
 $('kpis').innerHTML=`<div class="card kpi"><small>Ingresos</small><b class="pos">${eur(inc)}</b></div><div class="card kpi"><small>Gastos</small><b class="neg">${eur(exp)}</b></div><div class="card kpi main"><small>Saldo disponible</small><b class="${bal<0?'neg':''}">${eur(bal)}</b></div><div class="card kpi"><small>% gastado</small><b>${pct.toFixed(1).replace('.',',')} %</b></div>`;
 const p=$('pbar');p.style.width=Math.min(pct,100)+'%';p.className=pct>=100?'o':pct>=80?'w':'';
 $('ptxt').textContent=inc>0?`Has gastado ${eur(exp)} de ${eur(inc)} ingresados.`:(exp>0?'Hay gastos pero ningún ingreso este mes.':'Aún no hay movimientos este mes.');
 // donut
 const by=GAS.map((c,i)=>({c,v:r2(a.filter(t=>t.ty==='g'&&t.c===c).reduce((s,t)=>s+t.a,0)),col:COL[i]})).filter(x=>x.v>0);
 if(!exp){$('donut').innerHTML='<p class="empty">Registra gastos para ver el reparto por categoría.</p>'}
 else{let off=25;const segs=by.map(x=>{const l=x.v/exp*100;const s=`<circle r="15.9155" cx="21" cy="21" fill="none" stroke="${x.col}" stroke-width="7" stroke-dasharray="${l} ${100-l}" stroke-dashoffset="${off}"/>`;off-=l;return s}).join('');
  $('donut').innerHTML=`<svg viewBox="0 0 42 42" style="max-width:220px;display:block;margin:auto" role="img" aria-label="Gasto por categoría">${segs}<text x="21" y="22.5" text-anchor="middle" font-size="3" fill="currentColor" font-weight="700">${eur(exp)}</text></svg><div class="leg">${by.map(x=>`<span style="--c:${x.col}">${x.c}: ${eur(x.v)} (${(x.v/exp*100).toFixed(0)} %)</span>`).join('')}</div>`}
 // bars 6 meses
 const ms=[...Array(6)].map((_,i)=>shift(M,i-5)),d=ms.map(m=>{const x=inM(m);return{m,i:sum(x,'i'),g:sum(x,'g')}}),mx=Math.max(1,...d.flatMap(x=>[x.i,x.g]));
 $('bars').innerHTML=`<svg viewBox="0 0 300 150" style="width:100%" role="img" aria-label="Ingresos y gastos por mes">${d.map((x,k)=>{const h1=x.i/mx*110,h2=x.g/mx*110,bx=k*50+6;return `<rect x="${bx}" y="${120-h1}" width="18" height="${h1}" rx="2" fill="var(--ok)"><title>${lab(x.m)} ingresos ${eur(x.i)}</title></rect><rect x="${bx+20}" y="${120-h2}" width="18" height="${h2}" rx="2" fill="var(--bad)"><title>${lab(x.m)} gastos ${eur(x.g)}</title></rect><text x="${bx+19}" y="138" text-anchor="middle" font-size="10" fill="var(--mut)">${lab(x.m)}</text>`}).join('')}<line x1="0" x2="300" y1="120" y2="120" stroke="var(--bd)"/></svg><div class="leg"><span style="--c:var(--ok)">Ingresos</span><span style="--c:var(--bad)">Gastos</span></div>`;
 // límites
 const hay=GAS.filter(c=>S.lim[c]>0);
 $('limprog').innerHTML=hay.length?hay.map(c=>{const g=r2(a.filter(t=>t.ty==='g'&&t.c===c).reduce((s,t)=>s+t.a,0)),l=S.lim[c],p=g/l*100;return `<div class="lim"><div class="t"><span>${c}</span><span class="${g>l?'neg':''}">${eur(g)} / ${eur(l)} · ${p.toFixed(0)} %${g>l?' · superado':''}</span></div><div class="bar"><i class="${p>=100?'o':p>=80?'w':''}" style="width:${Math.min(p,100)}%"></i></div></div>`}).join(''):'<p class="empty">Define límites en la pestaña «Límites» para seguirlos aquí.</p>';
}

function movs(){
 const a=inM(M).sort((x,y)=>y.d.localeCompare(x.d)||y.id-x.id);
 $('tb').innerHTML=a.length?a.map(t=>`<tr><td>${t.d.split('-').reverse().join('/')}</td><td>${esc(t.c)}</td><td>${esc(t.n||'')}</td><td class="n ${t.ty==='i'?'pos':'neg'}">${t.ty==='i'?'+':'−'}${eur(t.a)}</td><td><button class="x" data-del="${t.id}" aria-label="Eliminar">✕</button></td></tr>`).join(''):'<tr><td colspan="5" class="empty">No hay movimientos en este mes.</td></tr>';
}

function limites(){
 $('lims').innerHTML=GAS.map(c=>`<label>${c}<input type="number" min="0" step="1" data-lim="${c}" value="${S.lim[c]||''}" placeholder="Sin límite"></label>`).join('');
}

function metas(){
 $('goals').innerHTML=S.goals.length?S.goals.map(g=>{const p=Math.min(g.s/g.t*100,100);return `<div class="card"><div style="display:flex;justify-content:space-between;gap:8px"><h3>${esc(g.n)}</h3><button class="x" data-gdel="${g.id}" aria-label="Eliminar meta">✕</button></div><p style="margin:4px 0 8px;color:var(--mut)">${eur(g.s)} de ${eur(g.t)} · ${p.toFixed(0)} %${g.d?' · para el '+g.d.split('-').reverse().join('/'):''}${g.s>=g.t?' · ¡Meta alcanzada!':''}</p><div class="bar"><i style="width:${p}%"></i></div><div class="f" style="margin:12px 0 0;grid-template-columns:1fr auto"><input type="number" step="0.01" placeholder="Aportar" data-gin="${g.id}" aria-label="Aportación"><button data-gadd="${g.id}">Aportar</button></div></div>`}).join(''):'<p class="empty">Aún no tienes metas. Crea la primera arriba.</p>';
}

const all=()=>{resumen();movs();limites();metas()};
function setM(m){M=m;$('mes').value=m;resumen();movs()}

$('mes').onchange=e=>e.target.value&&setM(e.target.value);
$('prev').onclick=()=>setM(shift(M,-1));$('next').onclick=()=>setM(shift(M,1));
$('mt').onchange=catOpts;
$('tabs').onclick=e=>{const b=e.target.closest('button');if(!b)return;document.querySelectorAll('#tabs button').forEach(x=>x.setAttribute('aria-selected',x===b));['res','mov','lim','met','aju'].forEach(id=>$(id).hidden=id!==b.dataset.t)};

$('add').onclick=()=>{
 const a=r2(parseFloat($('mm').value)),d=$('md').value;
 if(!(a>0)){$('err').textContent='Introduce un importe mayor que 0.';return}
 if(!d){$('err').textContent='Elige una fecha.';return}
 $('err').textContent='';
 S.tx.push({id:Date.now(),ty:$('mt').value,c:$('mc').value,a,d,n:$('mn').value.trim()});
 save();$('mm').value='';$('mn').value='';
 if(!d.startsWith(M))setM(d.slice(0,7));else{resumen();movs()}
};
$('tb').onclick=e=>{const b=e.target.closest('[data-del]');if(!b)return;S.tx=S.tx.filter(t=>t.id!=b.dataset.del);save();resumen();movs()};
$('lims').onchange=e=>{const c=e.target.dataset.lim;if(!c)return;const v=parseFloat(e.target.value);if(v>0)S.lim[c]=v;else delete S.lim[c];save();resumen()};

$('gadd').onclick=()=>{const n=$('gn').value.trim(),t=r2(parseFloat($('gt').value));if(!n||!(t>0))return;S.goals.push({id:Date.now(),n,t,s:0,d:$('gd').value});save();$('gn').value=$('gt').value=$('gd').value='';metas()};
$('goals').onclick=e=>{
 const del=e.target.closest('[data-gdel]'),ad=e.target.closest('[data-gadd]');
 if(del){S.goals=S.goals.filter(g=>g.id!=del.dataset.gdel);save();metas()}
 if(ad){const inp=document.querySelector(`[data-gin="${ad.dataset.gadd}"]`),v=r2(parseFloat(inp.value));if(!(v>0))return;const g=S.goals.find(g=>g.id==ad.dataset.gadd);g.s=r2(g.s+v);save();metas()}
};

function csvText(){
 const q=s=>'"'+String(s).replace(/"/g,'""')+'"';
 const rows=[...S.tx].sort((a,b)=>a.d.localeCompare(b.d)).map(t=>[t.d,t.ty==='i'?'Ingreso':'Gasto',q(t.c),t.a.toFixed(2),q(t.n||''),S.cfg.cur].join(','));
 return ['Fecha,Tipo,Categoría,Importe,Nota,Moneda',...rows].join('\n');
}
$('csv').onclick=()=>{$('ta').value=csvText();$('dlg').showModal()};
$('cl').onclick=()=>$('dlg').close();
$('cp').onclick=async()=>{try{await navigator.clipboard.writeText($('ta').value)}catch(e){$('ta').select();document.execCommand('copy')}$('cp').textContent='Copiado'; setTimeout(()=>$('cp').textContent='Copiar',1500)};
$('dl').onclick=()=>{try{const u=URL.createObjectURL(new Blob(['\ufeff'+$('ta').value],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=u;a.download='movimientos.csv';a.click();URL.revokeObjectURL(u)}catch(e){}};

const CUR=[['EUR','Euro'],['USD','Dólar estadounidense']],LAT=[['ARS','Peso argentino'],['BOB','Boliviano'],['BRL','Real brasileño'],['CLP','Peso chileno'],['COP','Peso colombiano'],['CRC','Colón costarricense'],['CUP','Peso cubano'],['DOP','Peso dominicano'],['GTQ','Quetzal guatemalteco'],['HNL','Lempira hondureño'],['HTG','Gourde haitiano'],['MXN','Peso mexicano'],['NIO','Córdoba nicaragüense'],['PAB','Balboa panameño'],['PEN','Sol peruano'],['PYG','Guaraní paraguayo'],['UYU','Peso uruguayo'],['VES','Bolívar venezolano']];
const ACC=[['#3b6ef5','Azul'],['#2f9e6e','Verde'],['#e07b39','Naranja'],['#8b5cf6','Violeta'],['#6b7280','Grafito']];
const opt=l=>l.map(([c,n])=>`<option value="${c}">${c} · ${n}</option>`).join('');
$('cur').innerHTML=`<optgroup label="Principales">${opt(CUR)}</optgroup><optgroup label="Latinoamérica">${opt(LAT)}</optgroup>`;
$('sAcc').innerHTML=ACC.map(([c,n])=>`<button class="sw" style="--c:${c}" data-v="${c}" aria-label="${n}"></button>`).join('');
function applyCfg(){const c=S.cfg,r=document.documentElement;c.theme==='auto'?r.removeAttribute('data-theme'):r.setAttribute('data-theme',c.theme);r.style.setProperty('--ac',c.acc);r.style.fontSize=c.size+'%';$('cur').value=c.cur;[['sTheme',c.theme],['sAcc',c.acc],['sSize',String(c.size)]].forEach(([id,v])=>$(id).querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===v)))}
const seg=(id,k,f=x=>x)=>{$(id).onclick=e=>{const b=e.target.closest('button');if(!b)return;S.cfg[k]=f(b.dataset.v);save();applyCfg()}};
seg('sTheme','theme');seg('sAcc','acc');seg('sSize','size',Number);
$('cur').onchange=e=>{S.cfg.cur=e.target.value;save();all()};
let rt;$('rst').onclick=()=>{if($('rst').dataset.s){S.tx=[];S.lim={};S.goals=[];save();all();$('rst').textContent='Borrar todos los datos';delete $('rst').dataset.s;clearTimeout(rt)}else{$('rst').dataset.s=1;$('rst').textContent='¿Seguro? Pulsa otra vez para borrar';rt=setTimeout(()=>{$('rst').textContent='Borrar todos los datos';delete $('rst').dataset.s},3500)}};
applyCfg();
$('md').value=today();catOpts();$('mes').value=M;all();
