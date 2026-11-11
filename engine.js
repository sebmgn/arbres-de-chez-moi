/* ============ outils ============ */
const D2R = Math.PI/180;
const F = n => (Math.round(n*10)/10).toString();
function rng(seed){ let a = seed>>>0; return () => { a = (a + 0x6D2B79F5)|0; let t = Math.imul(a ^ (a>>>15), 1|a); t = (t + Math.imul(t ^ (t>>>7), 61|t)) ^ t; return ((t ^ (t>>>14))>>>0)/4294967296; }; }
const ptsD = (p, close) => 'M' + p.map(q => F(q[0]) + ' ' + F(q[1])).join('L') + (close ? 'Z' : '');
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');

/* ============ géométrie des feuilles ============ */
function prof(t,pk,pb,pt){ if(t<=0||t>=1) return 0; return t<pk ? Math.pow(Math.sin(Math.PI/2*t/pk),pb) : Math.pow(Math.cos(Math.PI/2*(t-pk)/(1-pk)),pt); }
function halfW(t,o){
  let h = o.W*prof(t,o.pk,o.pb,o.pt);
  if(o.base) h += o.W*o.base*Math.pow(1-t,6);
  if(o.lobes){ const L=o.lobes; const s=Math.abs(Math.sin(Math.PI*L.n*t)); h *= (1-L.d) + L.d*Math.pow(s, L.p||0.6); }
  if(o.aur) h += o.W*o.aur*Math.exp(-Math.pow((t-0.035)/0.03,2));
  const tap = Math.max(0, Math.min(1, t*7, (1-t)*9));
  if(o.teeth){ const T=o.teeth; const u=(t*T.n)%1; const tooth = u<0.78 ? u/0.78 : (1-u)/0.22; h += o.W*T.d*tooth*tap;
    if(T.dbl){ const u2=(t*T.n*3)%1; const t2 = u2<0.78 ? u2/0.78 : (1-u2)/0.22; h += o.W*T.d*0.35*t2*tap; } }
  if(o.wave) h += o.W*o.wave.d*Math.sin(2*Math.PI*o.wave.n*t)*tap;
  return Math.max(h,0);
}
function leaf(o){
  const N=o.N||300, R=[], Lf=[];
  const cord = t => o.cord ? o.cord*Math.pow(Math.max(0,1-t/0.25),2) : 0;
  const asy = t => o.asym ? 1 - o.asym*Math.pow(1-t,3) : 1;
  const tEnd = o.notch ? 0.985 : 1;
  for(let i=0;i<=N;i++){ const t=i/N*tEnd; const h=halfW(t,o); const y=-t*o.L;
    R.push([h, y+cord(t)]); Lf.push([-h*asy(t), y+cord(t)*(o.asym?0.55:1)]); }
  const tip = o.notch ? [[0,-o.L*(1-o.notch)]] : [];
  const outline = [[0,0], ...R, ...tip, ...Lf.reverse()];
  const sh=[];
  if(o.pet) sh.push({k:'poly',p:[[0,0],[0,o.pet]],c:'pet'});
  sh.push({k:'poly',p:outline,c:'blade',close:true});
  sh.push({k:'poly',p:[[0,0],[0,-o.L*(o.notch?0.92:0.96)]],c:'mid'});
  let targets=[];
  if(o.lobes){ for(let k=0;k<Math.ceil(o.lobes.n);k++){ const t=(k+0.5)/o.lobes.n; if(t>0.07&&t<0.93) targets.push(t);} }
  else if(o.veins){ const v0=o.v0||0.07; for(let i=1;i<=o.veins;i++) targets.push(v0 + (i/(o.veins+1))*(0.93-v0)); }
  targets.forEach(t1=>{ const t0=Math.max(0.01,t1-(o.va||0.1));
    [1,-1].forEach(sd=>{ const a = sd<0 ? asy(t1) : 1;
      const x1=sd*halfW(t1,o)*0.88*a, y1=-t1*o.L+cord(t1)*(sd<0&&o.asym?0.55:1), my=-t0*o.L;
      const cx=x1*0.5, cy=my+(y1-my)*0.4, p=[];
      for(let j=0;j<=8;j++){ const u=j/8; p.push([2*(1-u)*u*cx+u*u*x1, (1-u)*(1-u)*my+2*(1-u)*u*cy+u*u*y1]); }
      sh.push({k:'poly',p,c:'vein'}); }); });
  if(o.glands){ sh.push({k:'circ',x:-2.6,y:4,r:2.1,c:'gland'},{k:'circ',x:2.6,y:5.5,r:2.1,c:'gland'}); }
  return sh;
}
function palm(o){
  const C=[0,-o.c], out=[];
  const R = th => { let r=o.r0; o.lobes.forEach(l=>{ const u=Math.abs(th-l.a)/l.w; r += l.len*(o.tri ? Math.pow(Math.max(0,1-u),1.25) : Math.exp(-u*u*1.2)); });
    if(o.teeth){ const u=((th+180)/360*o.teeth.n)%1; r += o.teeth.d*(1-Math.abs(2*u-1))*Math.min(1,(r-o.r0)/25+0.15); } return r; };
  for(let th=-172; th<=172; th+=0.5){ const r=R(th); out.push([C[0]+r*Math.sin(th*D2R), C[1]-r*Math.cos(th*D2R)]); }
  const sh=[{k:'poly',p:[[0,0],[0,o.pet]],c:'pet'},{k:'poly',p:out,c:'blade',close:true}];
  o.lobes.forEach(l=>{ const r=(o.r0+l.len)*0.9; sh.push({k:'poly',p:[C,[r*Math.sin(l.a*D2R), C[1]-r*Math.cos(l.a*D2R)]],c:'mid'});
    [-1,1].forEach(sd=>{ for(let k=1;k<=3;k++){ const f=k/4.2; const bx=f*r*Math.sin(l.a*D2R), by=C[1]-f*r*Math.cos(l.a*D2R); const a2=(l.a+sd*38)*D2R, rr=r*0.22*(1-f*0.5);
      sh.push({k:'poly',p:[[bx,by],[bx+rr*Math.sin(a2), by-rr*Math.cos(a2)]],c:'vein'}); } }); });
  return sh;
}
function xf(shapes, tx, ty, ang=0, sc=1){
  const c=Math.cos(ang*D2R), s=Math.sin(ang*D2R);
  const T=([x,y])=>[tx+sc*(x*c-y*s), ty+sc*(x*s+y*c)];
  return shapes.map(sh=>{ if(sh.k==='circ'){ const [x,y]=T([sh.x,sh.y]); return {...sh,x,y,r:sh.r*sc}; } return {...sh,p:sh.p.map(T)}; });
}
function pinnate(o){
  let sh=[]; const top=o.len;
  for(let k=0;k<o.n;k++){ const y=-(o.y0 + k*(top-o.y0)/o.n); const sc = 1 - (o.taper||0)*(1-k/o.n);
    [1,-1].forEach(sd=>{ sh=sh.concat(xf(leaf({...o.lf,N:120}),0,y,sd*o.ang,sc)); }); }
  sh=sh.concat(xf(leaf({...o.lf,N:120}),0,-top,0,1));
  sh.push({k:'poly',p:[[0,o.pet],[0,-top]],c:'pet'});
  if(o.spines){ const y=o.pet-2; sh.push({k:'poly',p:[[-1,y],[-11,y-9],[-3,y+2]],c:'spine',close:true},{k:'poly',p:[[1,y],[11,y-9],[3,y+2]],c:'spine',close:true}); }
  return sh;
}
function palmComp(o){
  let sh=[{k:'poly',p:[[0,0],[0,o.pet]],c:'pet'}];
  o.leaflets.forEach(l=>{ sh=sh.concat(xf(leaf({...o.lf,N:160}),0,0,l.a,l.s)); });
  sh.push({k:'circ',x:0,y:0,r:2.5,c:'gland'});
  sh[sh.length-1].c='pet';
  return sh;
}
function needles(o){
  const sh=[], len=o.len||170, r=rng(o.seed||7);
  sh.push({k:'poly',p:[[0,40],[0,-len]],c:'twig'});
  const fas=(y,a0)=>{ for(let j=0;j<2;j++){ const a=(a0+(j?7:-7))*D2R, L=o.nl*(0.85+r()*0.3), sd=a0>=0?1:-1, p=[];
      for(let k=0;k<=12;k++){ const u=k/12, bend=(o.curve||5)*u*u*sd + (o.twist?Math.sin(u*Math.PI*3)*1.6:0);
        p.push([Math.sin(a)*L*u+Math.cos(a)*bend, y-Math.cos(a)*L*u+Math.sin(a)*bend]); }
      sh.push({k:'poly',p,c:'needle'}); } };
  for(let i=0;i<o.n;i++){ const y=30-(len+20)*(i/o.n); fas(y,(i%2?1:-1)*(32+r()*26)); }
  [-30,-12,6,24].forEach(a=>fas(-len,a));
  sh.push({k:'circ',x:0,y:-len-3,r:3.5,c:'bud'});
  return sh;
}
function yew(o){ const sh=[], len=o.len||160; sh.push({k:'poly',p:[[0,30],[0,-len]],c:'twig'});
  for(let i=0;i<o.n;i++){ const y=22-(len+14)*i/o.n; const L=o.nl*(0.7+0.3*Math.sin(Math.PI*(i+1)/(o.n+1)));
    [-1,1].forEach(sd=>{ const a=sd*(o.ang||74)*D2R; sh.push({k:'poly',p:[[0,y],[Math.sin(a)*L*.5,y-Math.cos(a)*L*.5-1],[Math.sin(a)*L, y-Math.cos(a)*L]],c:o.cls||'flat'}); }); }
  return sh; }
function cypressL(){ let sh=[{k:'poly',p:[[0,40],[0,-170]],c:'twig'}];
  [[-150,1],[-120,-1],[-90,1],[-60,-1],[-30,1],[0,-1],[26,1]].forEach(([y,sd],i)=>{ sh=sh.concat(xf(yew({nl:13,n:22,len:70,ang:78,cls:'fine'}).map(x=>x.c==='twig'?{...x,c:'pet'}:x),0,y,sd*58,1-i*0.04)); });
  return sh; }
function cedar(){ const sh=[{k:'poly',p:[[-80,70],[90,-60]],c:'twig'}]; const r=rng(4);
  for(let i=0;i<7;i++){ const t=i/6, x=-68+t*145, y=61-t*112;
    for(let k=0;k<20;k++){ const a=(-85+170*k/19+(r()-.5)*8)*D2R, L=13+r()*9; sh.push({k:'poly',p:[[x,y-3],[x+Math.sin(a)*L, y-3-Math.cos(a)*L]],c:'needle'}); }
    sh.push({k:'circ',x,y:y-3,r:3.2,c:'bud'}); }
  return sh; }
function sequoiaL(){ const sh=[]; const r=rng(8);
  const br=(x0,y0,ang,len)=>{ let x=x0,y=y0,a=ang*D2R; for(let s=0;s<len;s+=4.2){ a+=(r()-.5)*0.04; const fx=Math.sin(a), fy=-Math.cos(a), px=-fy, py=fx, sd=(Math.round(s/4.2)%2)?1:-1, o=sd*1.2;
      sh.push({k:'poly',p:[[x+px*o,y+py*o],[x+fx*3+px*(3.2+o),y+fy*3+py*(3.2+o)],[x+fx*8+px*o*1.6,y+fy*8+py*o*1.6],[x+fx*3-px*(3.2-o),y+fy*3-py*(3.2-o)]],c:'scale',close:true}); x+=fx*4.2; y+=fy*4.2; }
    return [x,y]; };
  br(0,40,0,180); [[10,-55,60],[-20,50,52],[-55,-45,48],[-90,48,40],[-122,-40,30]].forEach(([y,a,l])=>br(0,y,a,l));
  return sh; }
function ginkgoL(){ const out=[[0,0]], sh=[{k:'poly',p:[[0,0],[0,60]],c:'pet'}], R0=88;
  const rr=th=> R0*(1-0.05*Math.abs(Math.sin(th*D2R*9))) - R0*0.3*Math.exp(-Math.pow(th/5,2));
  for(let th=-64;th<=64;th+=0.5){ const r=rr(th); out.push([r*Math.sin(th*D2R), -r*Math.cos(th*D2R)]); }
  sh.push({k:'poly',p:out,c:'blade',close:true});
  for(let th=-58;th<=58;th+=5){ const r=rr(th)*0.94; sh.push({k:'poly',p:[[0,-2],[r*0.4*Math.sin(th*0.6*D2R),-r*0.4*Math.cos(th*0.6*D2R)],[r*Math.sin(th*D2R),-r*Math.cos(th*D2R)]],c:'vein'}); }
  return sh; }
function render(sh, o={}){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  const acc=(x,y,r=0)=>{x0=Math.min(x0,x-r);y0=Math.min(y0,y-r);x1=Math.max(x1,x+r);y1=Math.max(y1,y+r);};
  sh.forEach(s=> s.k==='circ' ? acc(s.x,s.y,s.r) : s.p.forEach(q=>acc(q[0],q[1])));
  const pad=o.pad??8;
  let out=`<svg viewBox="${F(x0-pad)} ${F(y0-pad)} ${F(x1-x0+2*pad)} ${F(y1-y0+2*pad)}" class="ill" style="${o.style||''}" role="img" aria-label="${esc(o.label||'')}">`;
  sh.forEach(s=>{
    if(s.k==='circ'){ out+=`<circle class="${s.c}" cx="${F(s.x)}" cy="${F(s.y)}" r="${F(s.r)}"/>`; return; }
    const d=ptsD(s.p, s.close);
    out += s.c==='blade' ? `<path class="blade" d="${d}"/><path class="shine" d="${d}"/>` : `<path class="${s.c}" d="${d}"/>`;
  });
  return out+'</svg>';
}

/* ============ fruits (dessins à la main, viewBox 0 0 200 200) ============ */
const svgF = (inner,label) => `<svg viewBox="0 0 200 200" role="img" aria-label="${esc(label)}">${inner}</svg>`;
const lab = (x,y,t,anchor='start') => `<text x="${x}" y="${y}" font-size="10.5" fill="#5b5146" text-anchor="${anchor}" font-weight="600">${t}</text>`;
const twigS = d => `<path d="${d}" fill="none" stroke="#6b4f33" stroke-width="5" stroke-linecap="round"/>`;
function acorn(x,y,a,L,cup=.32,nc='#a06c2c',cc='#7d6b47',wf=1){
  const rx=L*.3*wf, ry=L*.5; let sc='';
  for(let r=0;r<4;r++){ const yy=r*(L*cup)/4; for(let i=0;i<6;i++){ const xx=-rx+ (i+(r%2)*.5)*(2*rx)/6; sc+=`<path d="M${F(xx-2.5)} ${F(yy+2.5)} Q${F(xx)} ${F(yy-1.5)} ${F(xx+2.5)} ${F(yy+2.5)}" fill="none" stroke="#4e4029" stroke-width=".8"/>`; } }
  return `<g transform="translate(${F(x)} ${F(y)}) rotate(${a})">
    <ellipse cx="0" cy="${F(L*.5)}" rx="${F(rx)}" ry="${F(ry)}" fill="${nc}" stroke="#5a3a17"/>
    <ellipse cx="0" cy="${F(L*.5)}" rx="${F(rx)}" ry="${F(ry)}" fill="url(#gNut)"/>
    <path d="M0 ${F(L)} l0 ${F(L*.06)}" stroke="#5a3a17" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M${F(-rx-2)} ${F(L*cup)} Q${F(-rx-3)} -4 0 -4 Q${F(rx+3)} -4 ${F(rx+2)} ${F(L*cup)} Q0 ${F(L*cup+4)} ${F(-rx-2)} ${F(L*cup)}Z" fill="${cc}" stroke="#4e4029"/>${sc}</g>`;
}
function chestnut(x,y,a,s=1,col='#7a3d1b'){
  return `<g transform="translate(${x} ${y}) rotate(${a}) scale(${s})">
   <path d="M0 -26 C14 -24 26 -8 24 10 C22 24 12 28 0 28 C-12 28 -22 24 -24 10 C-26 -8 -14 -24 0 -26Z" fill="${col}" stroke="#3f1d0a"/>
   <path d="M0 -26 C14 -24 26 -8 24 10 C22 24 12 28 0 28 C-12 28 -22 24 -24 10 C-26 -8 -14 -24 0 -26Z" fill="url(#gNut)"/>
   <path d="M-8 -18 C-12 -2 -12 12 -8 22 M7 -18 C11 -2 11 12 8 22" stroke="#3f1d0a" stroke-width=".6" fill="none" opacity=".5"/>
   <path d="M-21 17 Q0 33 21 17 Q0 25 -21 17Z" fill="#d8c59c"/>
   <path d="M0 -26 l-4 -8 M0 -26 l0 -10 M0 -26 l4 -8" stroke="#d9c8a0" stroke-width="1.5" stroke-linecap="round"/></g>`;
}
function cone(cx,cy,L,W,a,col,umbo='#4b3b28'){
  let s=`<ellipse cx="0" cy="0" rx="${W/2}" ry="${L/2}" fill="${col}" stroke="#3b2e20"/>`;
  const rows=Math.round(L/7);
  for(let j=0;j<rows;j++){ const y=-L/2+ (j+.6)*L/rows; const hw=W/2*Math.sqrt(Math.max(0,1-Math.pow(y/(L/2),2)));
    const n=Math.max(2,Math.round(hw*2/9)); for(let i=0;i<n;i++){ const x=-hw+ (i+.5+(j%2)*.25)*(2*hw)/n; if(Math.abs(x)>hw-2) continue;
      s+=`<path d="M${F(x)} ${F(y-4)} L${F(x+4.5)} ${F(y)} L${F(x)} ${F(y+4)} L${F(x-4.5)} ${F(y)}Z" fill="${col}" stroke="#3b2e20" stroke-width=".7"/><circle cx="${F(x)}" cy="${F(y)}" r="1" fill="${umbo}"/>`; } }
  s+=`<ellipse cx="0" cy="0" rx="${W/2}" ry="${L/2}" fill="url(#gNut)" opacity=".7"/>`;
  return `<g transform="translate(${cx} ${cy}) rotate(${a})">${s}</g>`;
}
function needlePair(x,y,a,L,col){ const r1=(a-8)*D2R, r2=(a+8)*D2R;
  return `<path d="M${x} ${y} q${F(Math.sin(r1)*L*.5+3)} ${F(-Math.cos(r1)*L*.5)} ${F(Math.sin(r1)*L)} ${F(-Math.cos(r1)*L)} M${x} ${y} q${F(Math.sin(r2)*L*.5-3)} ${F(-Math.cos(r2)*L*.5)} ${F(Math.sin(r2)*L)} ${F(-Math.cos(r2)*L)}" stroke="${col}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`; }

const FRUITS = {
  sessile(){ return svgF(twigS('M15 70 Q100 58 188 72') + acorn(62,68,-14,44) + acorn(138,68,14,44) + acorn(100,64,0,48) + lab(100,182,'Glands collés au rameau (sans queue)','middle') + lab(100,196,'gland 2–3 cm','middle'),'Glands du chêne sessile'); },
  pedoncule(){ return svgF(twigS('M20 26 Q90 16 175 24') + `<path d="M70 22 C78 60 96 84 110 120" stroke="#6b5233" stroke-width="3" fill="none" stroke-linecap="round"/>` + acorn(110,118,-14,46) + acorn(94,92,30,40) + `<path d="M72 34 l-26 20" stroke="#b0532a" stroke-width="1.2"/>` + lab(8,66,'long pédoncule') + lab(8,78,'(2 à 10 cm)') ,'Glands du chêne pédonculé'); },
  chataignier(){ const r=rng(11); let sp=''; for(let i=0;i<150;i++){ const a=r()*Math.PI*2, d=Math.sqrt(r())*40, x=62+Math.cos(a)*d, y=100+Math.sin(a)*d, L=7+r()*9, b=a+(r()-.5)*1.2;
      sp+=`<path d="M${F(x)} ${F(y)} l${F(Math.cos(b)*L)} ${F(Math.sin(b)*L)}" stroke="${r()<.5?'#c9c15c':'#8f8a35'}" stroke-width="1"/>`; }
    return svgF(`<circle cx="62" cy="100" r="40" fill="#a9a142" stroke="#77722b"/>${sp}` + chestnut(150,72,10,.95) + chestnut(145,140,-12,.9) + lab(62,170,'bogue très piquante','middle') + lab(148,186,'châtaignes à pointe','middle') + lab(148,198,'(comestibles)','middle'),'Bogue et châtaignes'); },
  hetre(){ let v=''; [-62,-22,22,62].forEach(a=>{ let br=''; for(let k=0;k<12;k++){ const t=k/12; const y=-6-t*44; br+=`<path d="M${F(-6*Math.sin(t*3.1))} ${F(y)} l-5 -3 M${F(6*Math.sin(t*3.1))} ${F(y)} l5 -3" stroke="#6b4f2c" stroke-width=".9"/>`; }
      v+=`<g transform="translate(100 135) rotate(${a})"><path d="M0 0 C-13 -10 -11 -44 0 -56 C11 -44 13 -10 0 0Z" fill="#9a7647" stroke="#5f4524"/>${br}</g>`; });
    return svgF(`<path d="M100 135 L100 190" stroke="#6b5233" stroke-width="3"/>${v}<path d="M86 132 L96 82 L106 132Z" fill="#6e4a2a" stroke="#3d2814"/><path d="M96 82 L99 132" stroke="#a07a52"/><path d="M98 132 L109 85 L118 133Z" fill="#7b5532" stroke="#3d2814"/><path d="M109 85 L111 133" stroke="#a07a52"/>` + lab(100,30,'faînes triangulaires','middle') + lab(100,42,'dans une cupule à 4 valves','middle'),'Faînes du hêtre'); },
  charme(){ const br=`<path d="M0 0 C-4 2 -12 4 -14 12 C-9 13 -6 11 -4 10 C-6 22 -6 34 -1 44 C4 34 5 22 3 10 C7 13 12 14 16 9 C12 3 5 1 0 0Z" fill="#c9cf8f" stroke="#8b8f4d"/><path d="M0 2 L0 40 M0 8 L-10 11 M0 8 L12 10" stroke="#9aa05a" stroke-width=".7"/><ellipse cx="0" cy="3" rx="4" ry="5" fill="#9a8b55" stroke="#6a5e33"/>`;
    let s='<path d="M100 8 C104 60 96 120 100 190" stroke="#6b5233" stroke-width="2.5" fill="none"/>';
    [[38,1],[62,-1],[86,1],[110,-1],[134,1],[158,-1]].forEach(([y,sd])=>{ s+=`<g transform="translate(100 ${y}) rotate(${sd*-52})">${br}</g>`; });
    return svgF(s + lab(140,30,'grappe') + lab(140,42,'pendante') + lab(4,180,'noisette sur une') + lab(4,192,'bractée à 3 lobes'),'Fruits du charme'); },
  bouleau(){ const cat=(x,y,L)=>{ let m=''; for(let k=0;k<L/5;k++) m+=`<path d="M${x-4} ${y+k*5+3} l4 3 l4 -3" stroke="#5b4e2a" stroke-width=".8" fill="none"/>`; return `<rect x="${x-5}" y="${y}" width="10" height="${L}" rx="5" fill="#8f8247" stroke="#5b4e2a"/>${m}`; };
    const seed=(x,y)=>`<g transform="translate(${x} ${y})"><ellipse cx="-6" cy="0" rx="6" ry="4.5" fill="#d8c79a" stroke="#8a7445" stroke-width=".7"/><ellipse cx="6" cy="0" rx="6" ry="4.5" fill="#d8c79a" stroke="#8a7445" stroke-width=".7"/><ellipse cx="0" cy="0" rx="2.5" ry="4" fill="#6b5530"/></g>`;
    return svgF(twigS('M10 30 Q100 18 190 34') + `<path d="M60 26 q2 10 0 18 M100 22 q-2 10 0 18 M140 26 q3 10 2 16" stroke="#6b4f33" stroke-width="2" fill="none"/>` + cat(60,42,70) + cat(100,38,82) + cat(142,40,66) + seed(40,165) + seed(72,178) + seed(58,150) + lab(130,170,'chatons et','middle') + lab(130,183,'graines ailées','middle') + lab(130,196,'minuscules','middle'),'Chatons et graines du bouleau'); },
  pinsyl(){ let n=''; [[-40,22],[-20,24],[10,22],[35,24],[55,22]].forEach(([a,L],i)=>{ n+=needlePair(40+i*28,120-i*14,a,L*1.6,'#5d8577'); });
    return svgF(twigS('M20 140 L180 70') + n + cone(78,150,44,26,18,'#8a7b62','#3a3024') + cone(122,128,40,24,-12,'#867660','#3a3024') + lab(100,184,'cônes 3–7 cm, ternes,','middle') + lab(100,197,'pointés vers l’arrière','middle'),'Cônes du pin sylvestre'); },
  laricio(){ let n=''; [[-50,70],[-25,75],[15,72],[40,70]].forEach(([a,L],i)=>{ n+=needlePair(40+i*34,110-i*10,a,L,'#2e5233'); });
    return svgF(twigS('M20 120 L180 80') + n + cone(100,145,74,40,8,'#b58548','#5a3d1a') + lab(100,190,'cône 5–8 cm,','middle') + lab(100,202,'brun-jaune luisant','middle'),'Cône du pin laricio'); },
  merisier(){ const ch=(x,y)=>`<circle cx="${x}" cy="${y}" r="15" fill="#9e1420" stroke="#5c0a10"/><circle cx="${x}" cy="${y}" r="15" fill="url(#gNut)"/><path d="M${x} ${y-15} q2 3 0 5" stroke="#5c0a10" fill="none"/>`;
    return svgF(twigS('M30 30 L170 24') + `<path d="M100 28 C80 60 72 100 70 140 M100 28 C104 70 104 110 104 152 M100 28 C120 60 132 96 136 136" stroke="#6d8a3a" stroke-width="2" fill="none"/>` + ch(70,152) + ch(104,166) + ch(136,148) + lab(100,188,'petites cerises sauvages','middle') + lab(100,200,'à longues queues','middle'),'Merises'); },
  sycomore(){ const w=`<path d="M0 -4 C14 -9 36 -4 48 12 C40 19 22 15 4 6Z" fill="#c6b37a" stroke="#8a7444"/><path d="M6 1 C20 0 34 4 44 12 M8 -1 C20 -6 34 -2 42 6" stroke="#9c8650" stroke-width=".7" fill="none"/><circle cx="2" cy="2" r="6" fill="#a99258" stroke="#7a6436"/>`;
    const pair=(x,y,a)=>`<g transform="translate(${x} ${y}) rotate(${a})"><g transform="rotate(28)">${w}</g><g transform="scale(-1 1) rotate(28)">${w}</g></g>`;
    return svgF(`<path d="M100 6 C102 50 98 90 100 120 M100 50 L70 80 M100 70 L134 104" stroke="#6b5233" stroke-width="2" fill="none"/>` + pair(70,86,10) + pair(134,110,-8) + pair(100,128,0) + lab(100,180,'samares doubles :','middle') + lab(100,193,'ailes en angle droit ou aigu','middle'),'Samares de l’érable sycomore'); },
  frene(){ const s1=`<path d="M0 0 C5 10 6 40 2 56 C0 59 -2 59 -3 56 C-6 40 -5 10 0 0Z" fill="#c2a86c" stroke="#80683a"/><path d="M0 4 L-0.5 24" stroke="#6e5428" stroke-width="2.4" stroke-linecap="round"/>`;
    let s='<path d="M100 8 L100 40 M100 40 L70 60 M100 40 L130 64 M100 40 L100 70" stroke="#6b5233" stroke-width="2" fill="none"/>';
    [[70,60,14],[62,62,26],[78,62,2],[130,64,-14],[138,66,-24],[122,64,-4],[100,70,4],[94,70,14],[106,70,-8]].forEach(([x,y,a])=>{ s+=`<g transform="translate(${x} ${y}) rotate(${a})">${s1}</g>`; });
    return svgF(s + lab(100,168,'samares simples en grappes','middle') + lab(100,182,'qui restent sur l’arbre l’hiver','middle'),'Samares du frêne'); },
  aulne(){ const st=(x,y)=>{ let b=''; for(let k=0;k<7;k++){ const a=k*0.9; b+=`<path d="M${F(x+Math.cos(a)*5)} ${F(y-8+k*2.6)} q3 -2 6 0" stroke="#6b5a4a" stroke-width=".8" fill="none"/>`; } return `<ellipse cx="${x}" cy="${y}" rx="9" ry="13" fill="#3a2a1f" stroke="#1d140e"/>${b}`; };
    const cat=(x,y,L)=>`<rect x="${x-3.5}" y="${y}" width="7" height="${L}" rx="3.5" fill="#7a4a3a" stroke="#4a2a1f"/>`;
    return svgF(twigS('M20 30 Q100 22 180 36') + `<path d="M70 28 L66 70 M66 50 L50 80 M66 50 L84 84 M130 30 L136 46 M146 30 L150 46" stroke="#6b5233" stroke-width="2" fill="none"/>` + st(66,84) + st(50,94) + st(86,98) + cat(136,46,58) + cat(150,46,64) + lab(70,140,'petits « cônes » noirs','middle') + lab(70,152,'(restent l’hiver)','middle') + lab(145,128,'chatons','middle'),'Strobiles et chatons de l’aulne'); },
  tilleul(){ return svgF(`<g transform="translate(70 30) rotate(-18)"><path d="M0 0 C14 10 17 70 7 110 C3 116 -4 114 -6 108 C-12 70 -10 10 0 0Z" fill="#d7d8a0" stroke="#9a9b5a"/><path d="M0 4 L1 106" stroke="#a9aa68"/></g><path d="M86 82 C100 100 110 112 116 120 M116 120 L104 146 M116 120 L118 150 M116 120 L134 142 M116 120 L130 158" stroke="#7d7a44" stroke-width="1.5" fill="none"/>` + [[104,148],[118,153],[135,145],[131,161]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="6" fill="#9aa266" stroke="#646b38"/><circle cx="${x}" cy="${y}" r="6" fill="url(#gNut)"/>`).join('') + lab(100,182,'boules pendues à une','middle') + lab(100,195,'bractée en languette','middle'),'Fruits du tilleul'); },
  platane(){ const r=rng(5); const ball=(x,y,R)=>{ let d=''; for(let i=0;i<90;i++){ const a=r()*6.283, q=Math.sqrt(r())*R*.92; d+=`<circle cx="${F(x+Math.cos(a)*q)}" cy="${F(y+Math.sin(a)*q)}" r="1.2" fill="#5a4223"/>`; } return `<circle cx="${x}" cy="${y}" r="${R}" fill="#8f6c3c" stroke="#5a4223"/>${d}<circle cx="${x}" cy="${y}" r="${R}" fill="url(#gNut)"/>`; };
    return svgF(twigS('M20 24 L180 30') + `<path d="M100 27 C96 60 84 92 78 112 M100 27 C108 70 124 106 130 126" stroke="#6b5233" stroke-width="1.6" fill="none"/>` + ball(78,132,22) + ball(130,148,22) + lab(100,186,'boules qui restent l’hiver','middle') + lab(100,199,'puis s’effilochent en duvet','middle'),'Boules du platane'); },
  marronnier(){ let sp=''; const r=rng(9); for(let i=0;i<16;i++){ const a=r()*6.283, d=36+r()*4; const x=100+Math.cos(a)*d, y=100+Math.sin(a)*d; sp+=`<path d="M${F(x)} ${F(y)} l${F(Math.cos(a)*7)} ${F(Math.sin(a)*7)}" stroke="#6f8a32" stroke-width="2.5" stroke-linecap="round"/>`; }
    return svgF(`<path d="M100 100 m-40 0 a40 40 0 0 1 22 -36 L100 100Z" fill="#9cb24f"/><circle cx="100" cy="100" r="40" fill="#9cb24f" stroke="#6f8a32"/>${sp}<circle cx="100" cy="100" r="30" fill="#efe8cf"/><circle cx="100" cy="100" r="25" fill="#6e2a12" stroke="#3a1206"/><circle cx="100" cy="100" r="25" fill="url(#gNut)"/><ellipse cx="96" cy="112" rx="13" ry="8" fill="#d8c39a"/>` + `<circle cx="168" cy="58" r="17" fill="#6e2a12" stroke="#3a1206"/><circle cx="168" cy="58" r="17" fill="url(#gNut)"/><ellipse cx="165" cy="67" rx="9" ry="5.5" fill="#d8c39a"/>` + lab(100,166,'bogue charnue, piquants rares','middle') + lab(100,180,'marron rond, gros hile clair, sans pointe','middle') + lab(100,194,'⚠ toxique : ce n’est pas une châtaigne','middle'),'Bogue et marron d’Inde'); },
  robinier(){ const pod=(x,y,a,L)=>{ let s=''; for(let k=1;k<5;k++) s+=`<ellipse cx="0" cy="${F(k*L/5.4)}" rx="4" ry="6" fill="none" stroke="#4a301a" stroke-width=".8"/>`; return `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0 C9 6 9 ${L-8} 3 ${L} C-4 ${L-6} -8 8 0 0Z" fill="#6b4a2c" stroke="#3f2914"/>${s}</g>`; };
    return svgF(twigS('M20 30 L180 26') + pod(70,34,12,110) + pod(100,32,0,120) + pod(130,32,-14,104) + lab(100,180,'gousses plates :','middle') + lab(100,193,'un cousin du haricot','middle'),'Gousses du robinier'); },
  chenerouge(){ return svgF(twigS('M20 40 Q100 30 180 44') + `<path d="M100 36 L100 52" stroke="#6b5233" stroke-width="3"/>` + acorn(82,54,-16,40,.17,'#8a5a2a','#7a6247',1.35) + acorn(120,54,16,40,.17,'#8a5a2a','#7a6247',1.35) + lab(100,140,'gland trapu, cupule plate','middle') + lab(100,153,'« en soucoupe »','middle') + lab(100,166,'mûrit en deux ans','middle'),'Glands du chêne rouge'); },
  pubescent(){ let f=''; for(let k=0;k<30;k++){ const x=70+ (k%10)*6, y=52+Math.floor(k/10)*5; f+=`<path d="M${x} ${y} l2 -3" stroke="#e8e0c8" stroke-width=".8"/>`; } return svgF(twigS('M20 34 Q100 26 180 36') + `<path d="M100 32 C100 40 98 46 96 52" stroke="#6b5233" stroke-width="3" fill="none"/>` + acorn(78,52,-14,46,.34,'#9c6a2e','#b3a585') + acorn(118,54,14,44,.34,'#9c6a2e','#b3a585') + lab(100,160,'cupule aux écailles velues','middle') + lab(100,173,'queue courte','middle'),'Glands du chêne pubescent'); },
  tremble(){ const r=rng(21); const cat=(x,y,L)=>{ let p=''; for(let k=0;k<30;k++) p+=`<circle cx="${F(x+(r()-.5)*12)}" cy="${F(y+3+r()*(L-6))}" r="${F(3+r()*3)}" fill="${r()<.55?'#ece9e2':'#c9c2b4'}"/>`; return `<rect x="${x-6}" y="${y}" width="12" height="${L}" rx="6" fill="#8a6a5a"/>${p}`; };
    return svgF(twigS('M15 26 Q100 16 185 30') + `<path d="M60 24 v12 M104 20 v12 M146 26 v12" stroke="#6b4f33" stroke-width="2"/>` + cat(60,36,92) + cat(104,32,106) + cat(146,38,86) + lab(100,166,'chatons laineux','middle') + lab(100,179,'à la fin de l’hiver','middle'),'Chatons du tremble'); },
  sorbier(){ const r=rng(31); let st='', b=''; for(let k=0;k<24;k++){ const a=(-70+140*r())*D2R, d=30+r()*42, x=100+Math.sin(a)*d*1.1, y=58+Math.cos(a)*d*0.75+10;
      st+=`<path d="M100 58 Q${F((100+x)/2)} ${F(62)} ${F(x)} ${F(y)}" stroke="#8a6a3a" stroke-width="1" fill="none"/>`; b+=`<circle cx="${F(x)}" cy="${F(y)}" r="7" fill="#e0461d" stroke="#9a2a0e"/><circle cx="${F(x)}" cy="${F(y)}" r="7" fill="url(#gNut)"/><circle cx="${F(x)}" cy="${F(y+5)}" r="1.3" fill="#3a1a0a"/>`; }
    return svgF(`<path d="M100 10 L100 58" stroke="#6b5233" stroke-width="3"/>${st}${b}` + lab(100,170,'baies rouge-orangé en bouquets,','middle') + lab(100,183,'dont raffolent les oiseaux','middle'),'Baies du sorbier des oiseleurs'); },
  alisier(){ const r=rng(41); let st='', b=''; for(let k=0;k<12;k++){ const a=(-60+120*r())*D2R, d=30+r()*36, x=100+Math.sin(a)*d*1.1, y=60+Math.cos(a)*d*0.8+8;
      st+=`<path d="M100 58 L${F(x)} ${F(y-8)}" stroke="#7a6a3a" stroke-width="1.2"/>`; let dots=''; for(let j=0;j<5;j++) dots+=`<circle cx="${F(x+(r()-.5)*8)}" cy="${F(y+(r()-.5)*10)}" r="1.1" fill="#e0c79a"/>`;
      b+=`<ellipse cx="${F(x)}" cy="${F(y)}" rx="7" ry="9" fill="#7a4a28" stroke="#3f2412"/>${dots}<ellipse cx="${F(x)}" cy="${F(y)}" rx="7" ry="9" fill="url(#gNut)"/>`; }
    return svgF(`<path d="M100 10 L100 58" stroke="#6b5233" stroke-width="3"/>${st}${b}` + lab(100,170,'alises brunes ponctuées,','middle') + lab(100,183,'comestibles une fois blettes','middle'),'Alises'); },
  houx(){ const lf=render(BYID.houx.leaf(),{style:leafStyle(BYID.houx)}).replace('<svg ','<svg x="6" y="6" width="120" height="140" ');
    let b=''; [[128,92],[142,84],[136,104],[150,98],[124,108],[146,114]].forEach(([x,y])=>b+=`<circle cx="${x}" cy="${y}" r="8" fill="#c4161c" stroke="#7a0a0e"/><circle cx="${x}" cy="${y}" r="8" fill="url(#gNut)"/><circle cx="${x}" cy="${y-6}" r="1.3" fill="#2a1a0a"/>`);
    return svgF(lf + b + lab(100,172,'baies rouges toxiques, seulement','middle') + lab(100,185,'sur les pieds femelles','middle'),'Baies du houx'); },
  noisetier(){ const nut=(x,y,a)=>`<g transform="translate(${x} ${y}) rotate(${a})"><ellipse cx="0" cy="10" rx="13" ry="15" fill="#a8743a" stroke="#5a3a17"/><ellipse cx="0" cy="10" rx="13" ry="15" fill="url(#gNut)"/><path d="M-15 0 L-19 -15 L-10 -7 L-7 -22 L-1 -9 L4 -22 L7 -8 L14 -18 L13 -4 L19 -10 L15 3 Q0 9 -15 0Z" fill="#9fb04f" stroke="#6f7f30"/></g>`;
    return svgF(twigS('M20 24 Q100 18 180 26') + `<path d="M100 22 C100 40 94 52 76 70 M100 22 C104 44 112 56 126 74 M100 22 L100 96" stroke="#6b5233" stroke-width="2" fill="none"/>` + nut(74,84,-18) + nut(128,88,16) + nut(101,110,0) + lab(100,170,'noisettes dans une','middle') + lab(100,183,'collerette déchiquetée','middle'),'Noisettes'); },
  erablech(){ return svgF(samaraFig(-18,'samares aux ailes','alignées à l’horizontale'),'Samares de l’érable champêtre'); },
  erableplane(){ return svgF(samaraFig(2,'samares aux ailes très écartées','(angle obtus)'),'Samares de l’érable plane'); },
  saule(){ const r=rng(51); const cat=(x,y,a,L)=>{ let p=''; for(let k=0;k<22;k++) p+=`<circle cx="${F((r()-.5)*8)}" cy="${F(-r()*L)}" r="${F(1.5+r()*1.6)}" fill="${r()<.6?'#e8d34a':'#c9b23a'}"/>`; return `<g transform="translate(${x} ${y}) rotate(${a})"><rect x="-4" y="${-L}" width="8" height="${L}" rx="4" fill="#b8a43a"/>${p}</g>`; };
    let cot=''; for(let k=0;k<5;k++){ const x=40+k*30, y=150+(k%2)*10; for(let j=0;j<10;j++) cot+=`<circle cx="${F(x+(r()-.5)*16)}" cy="${F(y+(r()-.5)*10)}" r="${F(3+r()*3)}" fill="#f5f3ee" stroke="#ddd8cc" stroke-width=".5"/>`; }
    return svgF(twigS('M20 120 Q100 110 180 118') + cat(60,116,-12,48) + cat(100,112,4,54) + cat(140,114,16,44) + cot + lab(100,186,'chatons au printemps, puis duvet blanc','middle'),'Chatons et graines du saule'); },
  if(){ const tw=render(yew({nl:30,n:16,len:130}),{style:'--needle:#24452c'}).replace('<svg ','<svg x="40" y="4" width="120" height="150" ');
    const ar=(x,y)=>`<circle cx="${x}" cy="${y}" r="10" fill="#d0202a" stroke="#8a0a12"/><circle cx="${x}" cy="${y}" r="10" fill="url(#gNut)"/><circle cx="${x}" cy="${y+5}" r="4.5" fill="#3a2a20"/>`;
    return svgF(tw + ar(84,110) + ar(118,86) + lab(100,172,'arille rouge charnu','middle') + lab(100,185,'⚠ graine et feuillage très toxiques','middle'),'Arilles de l’if'); },
  cedre(){ const cn=(x)=>{ let b=''; for(let k=1;k<9;k++) b+=`<path d="M${x-15} ${F(150-k*6)} Q${x} ${F(146-k*6)} ${x+15} ${F(150-k*6)}" stroke="#5a5038" stroke-width=".9" fill="none"/>`; return `<rect x="${x-17}" y="92" width="34" height="56" rx="15" fill="#9a8f66" stroke="#5a5038"/>${b}<rect x="${x-17}" y="92" width="34" height="56" rx="15" fill="url(#gNut)"/>`; };
    let n=''; const r=rng(3); for(let i=0;i<5;i++){ const x=24+i*38; for(let k=0;k<14;k++){ const a=(-80+160*k/13)*D2R; n+=`<path d="M${x} 152 l${F(Math.sin(a)*14)} ${F(-Math.cos(a)*14+ (r()-.5)*3)}" stroke="#41634a" stroke-width="1.3"/>`; } }
    return svgF(twigS('M10 156 L190 150') + n + cn(70) + cn(132) + lab(100,178,'cônes dressés en tonnelet,','middle') + lab(100,191,'qui se défont sur la branche','middle'),'Cônes du cèdre du Liban'); },
  ginkgo(){ const lf=g=>render(ginkgoL(),{style:'--leaf:#5f9a3a'}).replace('<svg ',`<svg ${g} `);
    const sd=(x,y)=>`<circle cx="${x}" cy="${y}" r="12" fill="#d8b13a" stroke="#9a7a1a"/><circle cx="${x}" cy="${y}" r="12" fill="url(#gNut)"/>`;
    return svgF(lf('x="10" y="6" width="90" height="100"') + lf('x="96" y="0" width="80" height="90"') + `<path d="M96 96 C90 110 82 120 74 132 M96 96 C104 112 112 124 122 136" stroke="#6b5233" stroke-width="1.5" fill="none"/>` + sd(74,140) + sd(122,144) + lab(100,174,'graines jaunes (pieds femelles)','middle') + lab(100,187,'à odeur de beurre rance','middle'),'Graines du ginkgo'); },
  sequoia(){ const br=render(sequoiaL(),{style:'--needle:#3d6a3f'}).replace('<svg ','<svg x="0" y="20" width="90" height="140" ');
    return svgF(br + cone(136,92,58,40,6,'#8a6a45','#4a3420') + lab(100,178,'cônes ovoïdes de 5 à 7 cm','middle'),'Cône du séquoia géant'); },
  cypres(){ const c=(x,y)=>{ let l=''; for(let k=0;k<6;k++){ const a=k*1.05; l+=`<path d="M${x} ${y} L${F(x+Math.cos(a)*14)} ${F(y+Math.sin(a)*14)}" stroke="#5a6a3a" stroke-width=".8"/>`; } return `<circle cx="${x}" cy="${y}" r="15" fill="#8fa05a" stroke="#5a6a3a"/>${l}<circle cx="${x}" cy="${y}" r="15" fill="url(#gNut)"/>`; };
    const tw=render(yew({nl:16,n:24,len:150,cls:'fine'}),{style:'--needle:#7aa35a'}).replace('<svg ','<svg x="10" y="10" width="80" height="150" ');
    return svgF(tw + c(130,80) + c(150,112) + lab(100,176,'petits cônes ronds (2–3 cm)','middle') + lab(100,189,'qui se désagrègent','middle'),'Cônes du cyprès chauve'); },
  tulipier(){ let pet=''; [-50,-25,0,25,50].forEach(a=>{ pet+=`<g transform="translate(60 96) rotate(${a})"><path d="M0 0 C-12 -10 -12 -44 0 -52 C12 -44 12 -10 0 0Z" fill="#cfd88a" stroke="#8a9a4a"/><path d="M-8 -6 C-6 -16 6 -16 8 -6 Q0 0 -8 -6Z" fill="#e8892a"/></g>`; });
    let sm=''; for(let k=0;k<14;k++){ const y=60+k*5, w=10*Math.sin(Math.PI*(k+1)/15); sm+=`<path d="M${F(150-w)} ${y} L150 ${y-12} L${F(150+w)} ${y}" fill="#b5925a" stroke="#6a5030" stroke-width=".7"/>`; }
    return svgF(`<path d="M60 96 L60 150" stroke="#6b5233" stroke-width="3"/>${pet}<path d="M150 130 L150 160" stroke="#6b5233" stroke-width="3"/>${sm}` + lab(60,176,'fleur en tulipe','middle') + lab(60,189,'(juin)','middle') + lab(150,176,'cône de samares','middle') + lab(150,189,'(reste l’hiver)','middle'),'Fleur et fruit du tulipier'); },
};
function samaraFig(spread,l1,l2){ const w=`<path d="M0 -4 C14 -9 36 -4 48 12 C40 19 22 15 4 6Z" fill="#c6b37a" stroke="#8a7444"/><path d="M6 1 C20 0 34 4 44 12" stroke="#9c8650" stroke-width=".7" fill="none"/><circle cx="2" cy="2" r="6" fill="#a99258" stroke="#7a6436"/>`;
  const pair=(x,y,a)=>`<g transform="translate(${x} ${y}) rotate(${a})"><g transform="rotate(${spread})">${w}</g><g transform="scale(-1 1) rotate(${spread})">${w}</g></g>`;
  return `<path d="M100 6 C102 40 98 70 100 92 M100 40 L62 66 M100 56 L138 84" stroke="#6b5233" stroke-width="2" fill="none"/>` + pair(62,70,6) + pair(138,88,-6) + pair(100,100,0) + lab(100,172,l1,'middle') + lab(100,185,l2,'middle'); }

/* ============ écorces ============ */
function bark(b, seed){
  const r=rng(seed), W=160, H=220; let s=`<rect width="${W}" height="${H}" fill="${b.base}"/>`;
  const L=(pts,col,w,op=1)=>`<path d="${ptsD(pts)}" fill="none" stroke="${col}" stroke-width="${F(w)}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"/>`;
  const blob=(cx,cy,w,h,col,op)=>{ const p=[]; for(let k=0;k<7;k++){ const a=k/7*6.283; p.push([cx+Math.cos(a)*w*(0.7+r()*0.5), cy+Math.sin(a)*h*(0.7+r()*0.5)]); } return `<path d="${ptsD(p,1)}" fill="${col}" opacity="${op}"/>`; };
  switch(b.t){
    case 'fissured': { const n=b.n||9;
      for(let i=0;i<n;i++){ let x=(i+.5+(r()-.5)*.5)*W/n; const pts=[]; for(let y=-10;y<=H+10;y+=8){ x+=(r()-.5)*(b.wob||4)+(b.slant||0)*8; pts.push([x-(b.slant||0)*H*.5,y]); }
        s+=L(pts.map(p=>[p[0]+3,p[1]]),b.ridge,3,.55); s+=L(pts,b.crack,2+r()*(b.cw||3));
        for(let k=0;k<(b.cross||4);k++){ const p=pts[Math.floor(r()*pts.length)]; const dx=W/n*(0.4+r()*0.6); s+=L([p,[p[0]+dx,p[1]+(r()-.5)*12]],b.crack,1.3+r()*1.5); } }
      break; }
    case 'smooth': {
      for(let k=0;k<16;k++) s+=blob(r()*W,r()*H,10+r()*26,8+r()*20,r()<.5?'#ffffff':'#4a4a44',.08+r()*.12);
      for(let k=0;k<10;k++){ const y=r()*H, x=r()*W; s+=L([[x,y],[x+10+r()*30,y+(r()-.5)*2]],'#5f5f58',1,.5); }
      for(let k=0;k<3;k++){ const x=20+r()*110, y=20+r()*170; s+=`<path d="M${F(x)} ${F(y)} q14 -9 28 0 q-14 5 -28 0Z" fill="#55554e" opacity=".6"/>`; }
      for(let k=0;k<5;k++) s+=`<circle cx="${F(r()*W)}" cy="${F(r()*H)}" r="${F(3+r()*7)}" fill="#a9b77a" opacity=".55"/>`;
      break; }
    case 'fluted': {
      for(let i=0;i<8;i++){ let x=(i+.3+r()*.4)*W/8; const pts=[]; for(let y=-10;y<=H+10;y+=10){ x+=Math.sin(y/30+i)*1.5+(r()-.5)*1.5; pts.push([x,y]); }
        s+=L(pts,b.light,8+r()*7,.55); s+=L(pts.map(p=>[p[0]+8,p[1]]),b.dark,1.4,.6); }
      for(let k=0;k<8;k++) s+=blob(r()*W,r()*H,8+r()*14,6+r()*10,'#ffffff',.1);
      break; }
    case 'birch': {
      for(let k=0;k<8;k++) s+=blob(r()*W,r()*H,14+r()*20,6+r()*10,'#cfcac0',.35);
      for(let k=0;k<46;k++){ const w=5+r()*26, y=r()*H*0.8; s+=`<rect x="${F(r()*W-w/2)}" y="${F(y)}" width="${F(w)}" height="${F(1.4+r()*2)}" rx="1" fill="#222" opacity="${F(.6+r()*.4)}"/>`; }
      for(let k=0;k<3;k++){ const x=20+r()*110, y=30+r()*120; s+=`<path d="M${F(x)} ${F(y)} l10 -7 l10 7 l-10 9Z" fill="#1d1d1d" opacity=".85"/>`; }
      s+=`<rect y="178" width="${W}" height="42" fill="#3a352f"/>`; for(let i=0;i<10;i++){ const x=8+i*15+r()*6; s+=L([[x,172],[x+r()*4,200],[x-2,222]],'#1a1714',2.5); s+=L([[x+3,174],[x+5,222]],'#efece6',1.2,.4); }
      break; }
    case 'plates': {
      for(let k=0;k<(b.n||40);k++){ const col=b.cols[Math.floor(r()*b.cols.length)]; s+=blob(r()*W,r()*H,b.pw*(0.6+r()*0.8),b.ph*(0.6+r()*0.8),col,.95); }
      if(b.edges) for(let k=0;k<(b.n||40)*.6;k++){ const x=r()*W, y=r()*H; s+=L([[x,y],[x+b.pw*(r()-.3),y+b.ph*(r()-.5)*.6]],b.edges,1.1,.6); }
      break; }
    case 'reticulate': {
      [-1,1].forEach(sd=>{ for(let i=-8;i<14;i++){ let x=i*b.sp; const pts=[]; for(let y=-10;y<=H+10;y+=10){ x+=sd*Math.tan(b.ang*D2R)*10+(r()-.5)*2; pts.push([x,y]); }
        s+=L(pts.map(p=>[p[0]+b.cw*.8,p[1]]),b.ridge,b.cw*.6,.5); s+=L(pts,b.crack,b.cw*(0.7+r()*0.6)); } });
      break; }
    case 'diam': {
      for(let k=0;k<10;k++) s+=blob(r()*W,r()*H,12+r()*20,8+r()*14,r()<.5?'#ffffff':'#55594c',.12);
      for(let k=0;k<30;k++){ const w=4+r()*14; s+=`<rect x="${F(r()*W)}" y="${F(r()*H)}" width="${F(w)}" height="1.6" rx=".8" fill="#4a4d42" opacity=".7"/>`; }
      for(let k=0;k<12;k++){ const x=10+r()*140, y=10+r()*200, z=5+r()*8; s+=`<path d="M${F(x)} ${F(y-z)} L${F(x+z*.8)} ${F(y)} L${F(x)} ${F(y+z)} L${F(x-z*.8)} ${F(y)}Z" fill="#2f3129" opacity=".75"/>`; }
      break; }
    case 'lenticel': {
      for(let y=6;y<H;y+=12+r()*8){ for(let x=-10;x<W;x+=12+r()*16){ s+=`<rect x="${F(x)}" y="${F(y)}" width="${F(6+r()*16)}" height="${F(2+r()*1.6)}" rx="1" fill="${b.lent}" opacity=".9"/>`; } }
      for(let k=0;k<5;k++){ const y=r()*H; s+=`<path d="M0 ${F(y)} q${W/2} ${F(-4-r()*4)} ${W} 0" stroke="${b.strip||'#c98a6e'}" stroke-width="2" fill="none" opacity=".7"/>`; }
      s+=`<rect x="58" width="20" height="${H}" fill="#fff" opacity=".12"/>`;
      break; }
  }
  s+=`<rect width="${W}" height="${H}" fill="url(#gCyl)"/>`;
  return `<svg viewBox="0 0 160 220" preserveAspectRatio="xMidYMid slice" role="img" aria-label="écorce">${s}</svg>`;
}

/* ============ silhouettes ============ */
function silhouette(o, seed, opt={}){
  const r=rng(seed), G=208, pxm=185/42, th=o.h*pxm, sc=th/160;
  let s = opt.bare ? '' : `<rect width="200" height="220" fill="url(#gSky)"/>`;
  s += `<rect y="${G}" width="200" height="12" fill="#cfd5bd"/>`;
  const cols=o.cols||['#4f6e34','#5e7f3c','#6c8d46'];
  const tw=(o.tw||6)*Math.max(.7,sc);
  const trunkTop=G-th*(o.type==='pine'?0.86:Math.max(o.trunk,.2)+0.12);
  if(o.type!=='shrub') s+=`<path d="M${F(100-tw)} ${G} L${F(100-tw*0.4)} ${F(trunkTop)} L${F(100+tw*0.4)} ${F(trunkTop)} L${F(100+tw)} ${G}Z" fill="${o.bark||'#5a4a3a'}"/>`;
  if(o.type==='pine'){ s+=`<path d="M${F(100-tw*0.62)} ${F(G-th*0.42)} L${F(100-tw*0.4)} ${F(trunkTop)} L${F(100+tw*0.4)} ${F(trunkTop)} L${F(100+tw*0.62)} ${F(G-th*0.42)}Z" fill="${o.top}"/>`; }
  if(o.type==='weeping'){ s+=[0.2,0.35,0.5,0.62].map(f=>`<rect x="${F(100-tw*0.8)}" y="${F(G-th*f)}" width="${F(tw*1.2)}" height="1.6" fill="#222"/>`).join(''); }
  const circles=[]; const add=(x,y,rad)=>circles.push([x,y,rad]);
  const rx=o.cw*th/2, crownH=th*(1-o.trunk), ry=crownH/2*1.04, cy=G-th+ry;
  const n=o.sparse?45:85;
  if(o.type==='shrub'){ for(let k=0;k<6;k++){ const x0=100+(k-2.5)*2.5, x1=100+(k-2.5)*rx*0.3; s+=`<path d="M${F(x0)} ${G} Q${F(x0)} ${F((G+cy)/2)} ${F(x1)} ${F(cy)}" stroke="${o.bark}" stroke-width="1.8" fill="none"/>`; } }
  if(o.type==='tiers'){ for(let c=0;c<5;c++){ const y=G-th+(c/4)*th*(1-o.trunk)*0.92+5*sc, w=rx*(0.4+0.6*c/4);
      s+=`<path d="M100 ${F(y+6*sc)} L${F(100-w*0.9)} ${F(y)} M100 ${F(y+6*sc)} L${F(100+w*0.9)} ${F(y)}" stroke="${o.bark}" stroke-width="${F(1.6*sc)}"/>`;
      for(let k=0;k<26;k++) add(100+(r()*2-1)*w, y+(r()-.5)*6*sc, (3.5+r()*3.5)*sc); } }
  if(o.knees){ for(let k=0;k<7;k++){ const x=100+(k-3)*11+(r()-.5)*4, h=3+r()*4; s+=`<path d="M${F(x-2.5)} ${G} L${F(x)} ${F(G-h)} L${F(x+2.5)} ${G}Z" fill="${o.bark}"/>`; } }
  if(o.type==='ellipse'||o.type==='weeping'||o.type==='shrub'){ for(let k=0;k<n;k++){ const a=r()*6.283, q=Math.sqrt(r()); add(100+Math.cos(a)*q*rx*0.92, cy+Math.sin(a)*q*ry*0.92, (5+r()*8)*sc*(o.type==='weeping'?0.6:1)); } }
  if(o.type==='irregular'){ const centers=[]; for(let i=0;i<5;i++) centers.push([100+(r()-.5)*rx*1.3, cy+(r()-.5)*ry*0.9]);
    centers.forEach(c=>{ for(let k=0;k<n/5;k++){ const a=r()*6.283, q=Math.sqrt(r()); add(c[0]+Math.cos(a)*q*rx*0.42, c[1]+Math.sin(a)*q*ry*0.5,(5+r()*8)*sc); } }); }
  if(o.type==='cone'){ const top=G-th, bot=G-th*o.trunk; for(let k=0;k<n;k++){ const u=Math.sqrt(r()); const y=top+u*(bot-top); const hw=rx*Math.pow(u,0.8); add(100+(r()*2-1)*hw*0.9, y, (4+r()*6)*sc); } }
  if(o.type==='pine'){ for(let c=0;c<5;c++){ const y=G-th+6*sc+(c/4)*th*0.26, x=100+(r()-.5)*rx*0.9, w=rx*(0.35+r()*0.3);
      s+=`<path d="M100 ${F(y+8*sc)} L${F(x)} ${F(y)}" stroke="${o.bark}" stroke-width="${F(2*sc)}"/>`;
      for(let k=0;k<14;k++) add(x+(r()*2-1)*w, y+(r()-.5)*7*sc, (4+r()*4)*sc); } }
  if(o.type!=='pine'&&o.type!=='tiers'&&o.type!=='shrub'){ for(let k=0;k<6;k++){ const tx=100+(r()-.5)*rx*1.4, ty=cy+(r()-.6)*ry; s+=`<path d="M100 ${F(trunkTop+6)} Q${F((100+tx)/2)} ${F(ty+ry*0.3)} ${F(tx)} ${F(ty)}" stroke="${o.bark||'#5a4a3a'}" stroke-width="${F(2.2*sc)}" fill="none"/>`; } }
  circles.forEach(([x,y,rad])=>{ s+=`<circle cx="${F(x)}" cy="${F(y)}" r="${F(rad)}" fill="${cols[Math.floor(r()*cols.length)]}" opacity="${o.sparse?.85:.95}"/>`; });
  if(o.type==='weeping'){ for(let k=0;k<26;k++){ const x=100+(r()*2-1)*rx, y=cy+(r()-.2)*ry*0.8; s+=`<path d="M${F(x)} ${F(y)} q${F((x-100)*0.08)} ${F(14*sc)} ${F((x-100)*0.05)} ${F(26*sc)}" stroke="#7a6a52" stroke-width=".7" fill="none" opacity=".7"/>`; } }
  if(!opt.bare){
    const ph=1.75*pxm; s+=`<g fill="#2b2b26"><circle cx="38" cy="${F(G-ph+1.1)}" r="1.2"/><rect x="37" y="${F(G-ph+2.3)}" width="2" height="${F(ph-2.3)}" rx=".8"/></g>`;
    s+=`<text x="38" y="${G-ph-4}" font-size="8" text-anchor="middle" fill="#55574b">1,75 m</text>`;
    s+=`<path d="M186 ${G} V${F(G-th)} M182 ${F(G-th)} H190 M182 ${G} H190" stroke="#8a8b7d" stroke-width="1"/><text x="183" y="${F(G-th-5)}" font-size="9" text-anchor="end" fill="#55574b" font-weight="700">${o.h} m</text>`;
  }
  return `<svg viewBox="0 0 200 220" role="img" aria-label="silhouette">${s}</svg>`;
}

/* ============ bourgeons d'hiver ============ */
function budSvg(type){
  const tw=(pts,col='#6b4f33',w=4)=>`<path d="${ptsD(pts)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const bud=(x,y,a,len,wid,col,extra='')=>`<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0 C${wid} ${-len*.25} ${wid*.8} ${-len*.7} 0 ${-len} C${-wid*.8} ${-len*.7} ${-wid} ${-len*.25} 0 0Z" fill="${col}" stroke="#2e1d10" stroke-width=".8"/>${extra}<path d="M0 0 C${wid} ${-len*.25} ${wid*.8} ${-len*.7} 0 ${-len} C${-wid*.8} ${-len*.7} ${-wid} ${-len*.25} 0 0Z" fill="url(#gNut)" opacity=".7"/></g>`;
  const scales=(len,n)=>{ let s=''; for(let k=1;k<n;k++){ const y=-len*k/n; s+=`<path d="M${F(-3+k*.2)} ${F(y+3)} Q0 ${F(y-1)} ${F(3-k*.2)} ${F(y+3)}" stroke="#3a2412" stroke-width=".6" fill="none"/>`; } return s; };
  let s='';
  switch(type){
    case 'hetre': s=tw([[60,210],[56,170],[64,130],[56,90],[62,50],[60,30]],'#7b5a3c',3); [[56,170,-38],[64,130,38],[56,90,-38],[62,50,38]].forEach(([x,y,a])=>s+=bud(x,y,a,24,4,'#a8673a',scales(24,7))); s+=bud(60,30,0,28,4.5,'#a8673a',scales(28,8)); break;
    case 'charme': s=tw([[60,210],[57,170],[63,130],[57,90],[62,50],[60,34]],'#6e5a46',3); [[57,170,-14],[63,130,14],[57,90,-14],[62,50,14]].forEach(([x,y,a])=>s+=bud(x,y,a,11,3.4,'#8a5b3a',scales(11,4))); s+=bud(60,34,0,12,3.6,'#8a5b3a'); break;
    case 'chene': s=tw([[60,210],[60,60]],'#6e5a40',4); [-44,-22,0,22,44].forEach(a=>s+=bud(60,60,a,13,5,'#9a6a3c',scales(13,4))); [[60,150,-40],[60,110,40]].forEach(([x,y,a])=>s+=bud(x,y,a,9,4,'#9a6a3c')); break;
    case 'frene': s=tw([[60,210],[60,52]],'#8b8f7e',8); [150,100].forEach(y=>{ s+=bud(56,y,-55,10,6,'#1c1a18')+bud(64,y,55,10,6,'#1c1a18')+`<path d="M50 ${y+6} q10 6 20 0" stroke="#d8d2b8" stroke-width="2" fill="none"/>`; }); s+=bud(60,52,0,22,9,'#1c1a18')+bud(53,62,-40,9,5,'#1c1a18')+bud(67,62,40,9,5,'#1c1a18'); break;
    case 'marronnier': s=tw([[60,210],[60,58]],'#7a5b45',9); [160,110].forEach(y=>{ s+=bud(55,y,-55,14,6,'#6b2d17')+bud(65,y,55,14,6,'#6b2d17')+`<path d="M47 ${y+8} q13 10 26 0" stroke="#e1d3b6" stroke-width="2.5" fill="none"/><circle cx="53" cy="${y+12}" r="1.2" fill="#5a3a26"/><circle cx="60" cy="${y+14}" r="1.2" fill="#5a3a26"/><circle cx="67" cy="${y+12}" r="1.2" fill="#5a3a26"/>`; }); s+=bud(60,58,0,36,11,'#6b2d17',scales(36,5)); break;
    case 'tilleul': s=tw([[60,210],[55,170],[65,130],[55,90],[63,50]],'#8a3b2a',3.5); [[55,170,-40],[65,130,40],[55,90,-40]].forEach(([x,y,a])=>s+=bud(x,y,a,13,6,'#b8402c','<path d="M-5 -5 Q0 -9 5 -4" stroke="#5c1a10" stroke-width=".8" fill="none"/>')); s+=bud(63,50,6,14,6,'#b8402c'); break;
    case 'aulne': s=tw([[60,210],[60,40]],'#6a5a4c',3.5)+tw([[60,90],[90,60]],'#6a5a4c',2.5); [[60,170,-45],[60,130,45]].forEach(([x,y,a])=>s+=`<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0 L0 -7" stroke="#6a5a4c" stroke-width="2"/></g>`+bud(x+Math.sin(a*D2R)*7,y-Math.cos(a*D2R)*7,a,12,5,'#6b4a6e')); s+=`<rect x="88" y="60" width="6" height="40" rx="3" fill="#7a4a3a"/><rect x="98" y="58" width="6" height="34" rx="3" fill="#7a4a3a"/><ellipse cx="40" cy="58" rx="6" ry="9" fill="#2e211a"/><ellipse cx="52" cy="48" rx="6" ry="9" fill="#2e211a"/>`+tw([[60,60],[40,58]],'#6a5a4c',1.5)+tw([[60,52],[52,48]],'#6a5a4c',1.5); break;
    case 'sycomore': s=tw([[60,210],[60,56]],'#7b6a50',6); [160,110].forEach(y=>{ s+=bud(56,y,-50,12,5,'#6f8f3a','<path d="M-4 -4 Q0 -7 4 -4 M-4 -8 Q0 -11 4 -8" stroke="#3d2a14" stroke-width=".8" fill="none"/>')+bud(64,y,50,12,5,'#6f8f3a','<path d="M-4 -4 Q0 -7 4 -4 M-4 -8 Q0 -11 4 -8" stroke="#3d2a14" stroke-width=".8" fill="none"/>'); }); s+=bud(60,56,0,20,8,'#6f8f3a','<path d="M-6 -6 Q0 -10 6 -6 M-6 -12 Q0 -16 6 -12" stroke="#3d2a14" stroke-width=".9" fill="none"/>'); break;
  }
  return `<svg viewBox="0 0 120 220" role="img" aria-label="rameau d’hiver">${s}</svg>`;
}

/* ============ typographie ============ */
const ty = t => String(t).replace(/ ([:;?!»%])/g,'\u00a0$1').replace(/« /g,'«\u00a0');
/* ============ données ============ */
const SP = [
 {id:'sessile',nom:'Chêne sessile',alt:'chêne rouvre',latin:'Quercus petraea',fam:'Fagacées',grp:['foret'],
  leaf:()=>leaf({L:130,W:40,pk:.55,pb:1.3,pt:1,lobes:{n:6.5,d:.32,p:.7},pet:22,va:.07}),
  c:'#4f7d32',aut:'#9a6a2e',fruit:'sessile',bark:{t:'fissured',base:'#6e6458',crack:'#2f2a24',ridge:'#9a8f80',n:9,wob:3,cross:3},
  sil:{h:40,trunk:.45,type:'ellipse',cw:.55,cols:['#4a6a30','#587a38','#678a42'],bark:'#4f4436'},
  traits:['Pétiole bien visible (1 à 2,5 cm)','Base de la feuille en coin, <b>sans oreillettes</b>','Lobes assez réguliers, 5 à 8 paires','Glands <b>sans queue</b>, collés au rameau','Port régulier, tronc droit'],
  ou:'C’est l’arbre roi de la forêt de Rambouillet : avec le pédonculé, il couvre environ deux tiers des surfaces de production. À Fausses-Reposes, 90 % des chênes sont des sessiles.',
  conf:'<b>Chêne pédonculé</b> : regarde le pétiole et la base de la feuille. Les deux espèces s’hybrident, certains arbres sont donc intermédiaires.',
  memo:'<b>Sessile</b> = gland « assis » sur la branche. C’est donc la feuille qui a une queue.', wiki:'Quercus_petraea'},
 {id:'pedoncule',nom:'Chêne pédonculé',alt:'chêne commun',latin:'Quercus robur',fam:'Fagacées',grp:['foret','eau'],
  leaf:()=>leaf({L:120,W:42,pk:.66,pb:1.6,pt:.9,lobes:{n:5.5,d:.5,p:.6},aur:.3,pet:4,va:.07}),
  c:'#46722e',aut:'#8a5a2a',fruit:'pedoncule',bark:{t:'fissured',base:'#5f564b',crack:'#221e1a',ridge:'#8c8173',n:7,wob:6,cw:5,cross:6},
  sil:{h:35,trunk:.3,type:'irregular',cw:.85,cols:['#46662e','#557636','#638541'],bark:'#4a3f33',tw:8},
  traits:['Pétiole <b>presque absent</b>','Deux petites <b>oreillettes</b> à la base de la feuille','Lobes plus profonds et irréguliers','Feuilles groupées en bout de rameau','Glands au bout d’une <b>longue queue</b> (2 à 10 cm)','Branches tortueuses, écorce très crevassée'],
  ou:'Mélangé au sessile à Rambouillet et à Marly (4 %). Il préfère les sols riches et toujours frais et supporte d’être inondé un temps : fonds humides, bords d’étangs, arbres isolés des haies.',
  conf:'<b>Chêne sessile</b> : c’est l’inverse, feuille à queue et gland sans queue.',
  memo:'<b>Pédonculé</b> = gland à pédoncule (une queue). Donc la feuille n’en a pas.', wiki:'Quercus_robur'},
 {id:'chataignier',nom:'Châtaignier',alt:'',latin:'Castanea sativa',fam:'Fagacées',grp:['foret'],
  leaf:()=>leaf({L:190,W:30,pk:.45,pb:.9,pt:1.5,teeth:{n:19,d:.2},veins:18,va:.05,pet:16}),
  c:'#5a8a33',aut:'#b08a2e',fruit:'chataignier',bark:{t:'fissured',base:'#6a5f52',crack:'#2a241e',ridge:'#988c7b',n:12,wob:2,slant:.28,cross:2},
  sil:{h:30,trunk:.35,type:'ellipse',cw:.72,cols:['#55752e','#668636','#759640'],bark:'#4e4336',tw:8},
  traits:['Feuille <b>très longue</b> (12 à 25 cm) et étroite','<b>Grosses dents pointues</b> régulières, une nervure par dent','Bogue très piquante qui contient 2 ou 3 châtaignes','Vieux tronc aux fissures qui <b>tournent en spirale</b>'],
  ou:'L’essence n° 1 juste à côté du Chesnay : 47 % de Fausses-Reposes et 34 % de la forêt de Marly. Il est en revanche rare dans la forêt domaniale de Rambouillet.',
  conf:'<b>Marronnier</b> : fruits proches, mais feuille en éventail, bogue aux piquants rares et marron sans pointe, toxique.',
  memo:'Châtaignier = feuille en « scie », avec une dent pointue au bout de chaque nervure.', wiki:'Castanea_sativa'},
 {id:'hetre',nom:'Hêtre',alt:'fayard',latin:'Fagus sylvatica',fam:'Fagacées',grp:['foret','ville'],
  leaf:()=>leaf({L:100,W:36,pk:.45,pb:.8,pt:1.3,wave:{n:7,d:.04},veins:7,va:.09,pet:9}),
  c:'#4f8a35',aut:'#c0702c',fruit:'hetre',bark:{t:'smooth',base:'#a8a8a0'},bud:'hetre',
  sil:{h:40,trunk:.35,type:'ellipse',cw:.6,cols:['#4b7a34','#5a8a3c','#6a9946'],bark:'#8e8e86'},
  traits:['Feuille ovale, <b>bord lisse</b> ou à peine ondulé','<b>Cils fins</b> sur le bord quand elle est jeune','5 à 9 paires de nervures parallèles','Écorce <b>lisse, gris argenté</b>, toute sa vie','Bourgeons longs et pointus comme des cigares'],
  ou:'14 % de la forêt de Marly, 7 % à Fausses-Reposes. Dans le domaine de Versailles, les grandes allées sont bordées de tilleuls et de hêtres.',
  conf:'<b>Charme</b> : sa feuille est dentée et son tronc cannelé.',
  memo:'« Le charme d’Adam, c’est d’être à poils » : <b>charme à dents, hêtre à poils</b>.', wiki:'Fagus_sylvatica'},
 {id:'charme',nom:'Charme',alt:'charmille',latin:'Carpinus betulus',fam:'Bétulacées',grp:['foret','ville'],
  leaf:()=>leaf({L:100,W:32,pk:.42,pb:.75,pt:1.8,teeth:{n:13,d:.09,dbl:1},veins:12,va:.07,pet:10}),
  c:'#4d8233',aut:'#d4b23a',fruit:'charme',bark:{t:'fluted',base:'#8d8f88',light:'#b8baae',dark:'#5e605a'},bud:'charme',
  sil:{h:25,trunk:.3,type:'ellipse',cw:.7,cols:['#4b7a34','#5a8a3c','#6a9946'],bark:'#8a8b84'},
  traits:['Feuille ovale pointue, <b>doublement dentée</b>','Nervures parallèles très marquées : feuille « gaufrée »','Tronc <b>cannelé</b>, comme fait de muscles ; écorce grise et lisse','Fruits en grappes : petite noix sur une bractée à 3 lobes','Jeune, il garde ses feuilles sèches l’hiver (marcescent)'],
  ou:'Typique du sous-étage des chênaies de Rambouillet (chênes au-dessus, charmes en dessous). 8 % de la forêt de Marly. Les « charmilles » des jardins de Versailles sont des charmes taillés.',
  conf:'<b>Hêtre</b> : bord de feuille lisse et cilié, tronc rond et lisse.',
  memo:'« Le charme d’Adam, c’est d’être à poils » : <b>charme à dents, hêtre à poils</b>.', wiki:'Carpinus_betulus'},
 {id:'bouleau',nom:'Bouleau verruqueux',alt:'',latin:'Betula pendula',fam:'Bétulacées',grp:['foret'],
  leaf:()=>leaf({L:70,W:30,pk:.22,pb:.55,pt:1.25,teeth:{n:9,d:.14,dbl:1},veins:6,va:.1,pet:24}),
  c:'#6a9a3a',aut:'#e0b733',fruit:'bouleau',bark:{t:'birch',base:'#f1eee8'},
  sil:{h:25,trunk:.25,type:'weeping',cw:.42,cols:['#7aa24a','#8ab055','#99bd62'],bark:'#ebe7df',tw:4},
  traits:['Petite feuille en <b>triangle ou losange</b>, doublement dentée','Long pétiole : les feuilles frémissent au moindre vent','<b>Tronc blanc</b> à marques noires, pied noir crevassé','Rameaux fins et retombants','Chatons et graines ailées minuscules'],
  ou:'Arbre pionnier : il colonise très vite les clairières, les lisières et les coupes récentes. 2 % de la forêt de Marly.',
  conf:'<b>Merisier</b> : son écorce pèle aussi, mais elle est brun-rouge.',
  memo:'Le seul <b>tronc blanc</b> de la forêt.', wiki:'Betula_pendula'},
 {id:'pinsyl',nom:'Pin sylvestre',alt:'',latin:'Pinus sylvestris',fam:'Pinacées',grp:['foret','conif'],
  leaf:()=>needles({nl:40,n:13,twist:1,len:150,seed:3}), style:'--needle:#5d8577',
  c:null,aut:null,fruit:'pinsyl',bark:{t:'plates',base:'#c8743f',cols:['#d88b55','#e3a874','#b8622f','#eab88a'],pw:16,ph:8,n:70,edges:'#7a3c18'},
  sil:{h:35,trunk:.65,type:'pine',cw:.5,cols:['#3e5f45','#4b6d51','#577a5b'],bark:'#6b5440',top:'#c8743f',tw:5},
  traits:['Aiguilles <b>par 2</b>, courtes (3 à 7 cm), <b>bleu-vert</b>, souvent un peu tordues','Haut du tronc <b>orange saumon</b>, qui s’écaille en fines plaques','Petits cônes ternes (3 à 7 cm), pointés vers l’arrière','Vieux arbres : long tronc nu, cime aplatie tout en haut'],
  ou:'Avec le laricio, les pins couvrent un peu plus d’un cinquième des surfaces de production de la forêt de Rambouillet. Impossible de les rater autour du Perray.',
  conf:'<b>Pin laricio</b> : aiguilles deux fois plus longues, tronc gris, pas d’orange.',
  memo:'<b>S</b>ylvestre = <b>s</b>aumon en haut du tronc.', wiki:'Pinus_sylvestris'},
 {id:'laricio',nom:'Pin laricio',alt:'pin de Corse',latin:'Pinus nigra subsp. laricio',fam:'Pinacées',grp:['foret','conif'],
  leaf:()=>needles({nl:105,n:9,curve:16,len:150,seed:5}), style:'--needle:#2e5233',
  c:null,aut:null,fruit:'laricio',bark:{t:'plates',base:'#5f5a53',cols:['#8f8a80','#a7a197','#77726a'],pw:9,ph:26,n:55,edges:'#2a2723'},
  sil:{h:40,trunk:.3,type:'cone',cw:.32,cols:['#2d4a32','#36573a','#41633f'],bark:'#5a554e'},
  traits:['Aiguilles par 2, <b>longues</b> (plus de 10 cm), souples, <b>vert sombre</b>','Écorce <b>grise</b> en longues plaques argentées','Tronc très droit, cime conique puis ovale','Cônes plus gros (5 à 8 cm), brun-jaune luisant'],
  ou:'Planté avec le pin sylvestre dans les parcelles de résineux de Rambouillet. L’ONF le cite parmi les essences adaptées au climat futur.',
  conf:'<b>Pin sylvestre</b> : aiguilles courtes et bleutées, tronc orangé en haut.',
  memo:'<b>L</b>aricio = <b>l</b>ong : des aiguilles longues comme un crayon.', wiki:'Pinus_nigra_subsp._laricio'},
 {id:'merisier',nom:'Merisier',alt:'cerisier sauvage',latin:'Prunus avium',fam:'Rosacées',grp:['foret'],
  leaf:()=>leaf({L:120,W:34,pk:.55,pb:1,pt:1.7,teeth:{n:24,d:.06},veins:9,va:.1,pet:28,glands:1}),
  c:'#4f8a35',aut:'#d4562b',fruit:'merisier',bark:{t:'lenticel',base:'#7b3a2e',lent:'#c9a58a'},
  sil:{h:25,trunk:.4,type:'ellipse',cw:.55,cols:['#4f7f36','#5d8e3f','#6c9c4a'],bark:'#6e3529'},
  traits:['Feuille ovale, pointue, dentée, qui pend','<b>Deux petites glandes rouges</b> en haut du pétiole','Écorce <b>brun-rouge brillante</b> à bandes horizontales, qui se déroule en lanières','Fleurs blanches en avril, petites cerises en été','Rouge-orange vif à l’automne'],
  ou:'Disséminé dans les forêts (1 % à Marly, avec frêne et érable à Fausses-Reposes). Facile à repérer en avril, quand il fleurit en blanc dans les lisières.',
  conf:'<b>Bouleau</b> : son écorce pèle aussi, mais elle est blanche.',
  memo:'Le merisier est un cerisier sauvage : cherche les deux « boutons rouges » sous la feuille.', wiki:'Prunus_avium'},
 {id:'sycomore',nom:'Érable sycomore',alt:'',latin:'Acer pseudoplatanus',fam:'Sapindacées',grp:['foret','ville'],
  leaf:()=>palm({r0:22,c:22,lobes:[{a:0,len:70,w:22},{a:-55,len:62,w:21},{a:55,len:62,w:21},{a:-118,len:32,w:20},{a:118,len:32,w:20}],teeth:{n:46,d:5},pet:60}),
  c:'#3f7a30',aut:'#c8a03a',fruit:'sycomore',bark:{t:'plates',base:'#8f8378',cols:['#b5a597','#a39385','#c4b6a8','#7d7167'],pw:20,ph:14,n:45,edges:'#4a3f36'},bud:'sycomore',
  sil:{h:30,trunk:.35,type:'ellipse',cw:.75,cols:['#3f6e2e','#4c7c36','#5a8a40'],bark:'#7d7167'},
  traits:['Feuilles <b>opposées</b>, palmées, à 5 lobes','Dents grossières, long pétiole souvent rougeâtre','Écorce gris-rose qui se détache en plaques (vieux arbres)','Samares doubles (« hélicoptères »), ailes en angle droit ou aigu','Bourgeons verts l’hiver'],
  ou:'3 % de la forêt de Marly ; aussi à Fausses-Reposes et dans le Grand Parc de Versailles, où la maladie de la suie de l’érable a été observée sur des sycomores en 2021.',
  conf:'<b>Platane</b> : feuilles alternes, écorce en camouflage, fruits en boules.',
  memo:'Érable = feuilles <b>par paires</b> et fruits en <b>hélicoptère</b>.', wiki:'Acer_pseudoplatanus'},
 {id:'frene',nom:'Frêne commun',alt:'',latin:'Fraxinus excelsior',fam:'Oléacées',grp:['foret','eau'],
  leaf:()=>pinnate({len:200,pet:30,n:5,y0:42,ang:62,taper:.15,lf:{L:55,W:12,pk:.4,pb:.9,pt:1.5,teeth:{n:12,d:.1},veins:6,va:.1}}),
  c:'#4b8030',aut:'#7f9a3a',fruit:'frene',bark:{t:'reticulate',base:'#8a8a80',crack:'#4a4a44',ridge:'#b0b0a5',sp:14,ang:11,cw:2},bud:'frene',
  sil:{h:35,trunk:.45,type:'ellipse',cw:.6,sparse:1,cols:['#4f7c34','#5e8b3e','#6d9948'],bark:'#76766d'},
  traits:['Feuille <b>composée</b> de 9 à 15 folioles pointues, dentées, sans queue','Feuilles <b>opposées</b> sur le rameau','<b>Bourgeons noirs</b> mats : le critère d’hiver infaillible','Samares simples en grappes, qui restent l’hiver','Écorce lisse gris-vert jeune, puis réseau de losanges serrés'],
  ou:'5 % de la forêt de Marly ; il aime les sols frais. Beaucoup de frênes souffrent de la chalarose, une maladie due à un champignon : cimes clairsemées, rameaux morts.',
  conf:'<b>Robinier</b> : folioles arrondies à bord lisse, épines, feuilles alternes.',
  memo:'Frêne = bourgeons <b>noirs comme du charbon</b>. Ses feuilles tombent souvent encore vertes.', wiki:'Fraxinus_excelsior'},
 {id:'aulne',nom:'Aulne glutineux',alt:'verne',latin:'Alnus glutinosa',fam:'Bétulacées',grp:['eau'],
  leaf:()=>leaf({L:85,W:38,pk:.66,pb:1.4,pt:.35,notch:.05,teeth:{n:9,d:.07,dbl:1},veins:6,va:.08,pet:18}),
  c:'#3f6f2e',aut:'#55702e',fruit:'aulne',bark:{t:'fissured',base:'#3f352d',crack:'#15110e',ridge:'#6a5d50',n:12,wob:3,cw:2,cross:10},bud:'aulne',
  sil:{h:25,trunk:.25,type:'ellipse',cw:.45,cols:['#36602b','#426d33','#4f7a3c'],bark:'#3f352d'},
  traits:['Feuille arrondie, <b>bout tronqué ou échancré</b>, sans vraie pointe','Collante quand elle est jeune (« glutineux »), doublement dentée','<b>Petits « cônes » noirs</b> ligneux qui restent sur l’arbre','Bourgeons violacés portés par un petit pied','Toujours <b>au bord de l’eau</b> ; les feuilles tombent vertes'],
  ou:'L’arbre typique des berges. Cherche-le au bord de l’étang du Perray, des étangs de Hollande et des rigoles qui les relient.',
  conf:'<b>Noisetier</b> : feuille ronde mais avec une pointe, très velue, et pas de cônes.',
  memo:'<b>Aulne</b> = au bord de l’eau, avec des mini-pommes de pin noires.', wiki:'Alnus_glutinosa'},
 {id:'tilleul',nom:'Tilleul',alt:'',latin:'Tilia cordata, T. platyphyllos',fam:'Malvacées',grp:['ville','foret'],
  leaf:()=>leaf({L:90,W:42,pk:.3,pb:.45,pt:1.5,base:.35,cord:12,asym:.3,teeth:{n:22,d:.05},veins:6,va:.12,pet:34}),
  c:'#4f8a35',aut:'#d8bf45',fruit:'tilleul',bark:{t:'fissured',base:'#6f6b63',crack:'#3a3732',ridge:'#97938a',n:15,wob:2,cw:1.4,cross:8},bud:'tilleul',
  sil:{h:30,trunk:.3,type:'ellipse',cw:.65,cols:['#4a7c33','#58893c','#679846'],bark:'#5c5851'},
  traits:['Feuille <b>en cœur</b>, base <b>asymétrique</b>, finement dentée','Fruits : boules pendues à une longue <b>bractée en languette</b>','Fleurs très parfumées en juin-juillet','Écorce grise finement fissurée en réseau','Bourgeons rouges à 2 ou 3 écailles visibles'],
  ou:'Les alignements du domaine de Versailles (l’allée de l’Accroissement a été replantée en tilleuls), les places et les avenues. L’ONF plante aussi du tilleul à petites feuilles en forêt.',
  conf:'Deux espèces proches : le <b>tilleul à petites feuilles</b> a des touffes de poils roux sous la feuille, à l’angle des nervures ; celui à <b>grandes feuilles</b> a des poils blanchâtres.',
  memo:'Tilleul = feuille en <b>cœur de travers</b>.', wiki:'Tilia'},
 {id:'platane',nom:'Platane',alt:'',latin:'Platanus × hispanica',fam:'Platanacées',grp:['ville'],
  leaf:()=>palm({r0:18,c:18,tri:1,lobes:[{a:0,len:82,w:34},{a:-52,len:74,w:32},{a:52,len:74,w:32},{a:-112,len:30,w:24},{a:112,len:30,w:24}],teeth:{n:22,d:6},pet:45}),
  c:'#4f8a35',aut:'#a8823e',fruit:'platane',bark:{t:'plates',base:'#c9c49a',cols:['#8e9a6a','#d8d3b4','#a6a37c','#6f7a55','#e6e1c8','#b9b48c'],pw:22,ph:18,n:55},
  sil:{h:40,trunk:.35,type:'ellipse',cw:.8,cols:['#4f7d35','#5d8b3e','#6c9948'],bark:'#a6a07a',tw:8},
  traits:['Grande feuille palmée, 3 à 5 lobes pointus','Feuilles <b>alternes</b> ; la base du pétiole est creuse et coiffe le bourgeon','Écorce en <b>camouflage</b> : plaques vertes, beiges et grises qui tombent','Boules pendantes qui restent l’hiver'],
  ou:'L’arbre des avenues et des places. On le trouve aussi dans les alignements du domaine de Versailles.',
  conf:'<b>Érable sycomore</b> : feuilles opposées, fruits en hélicoptère.',
  memo:'Platane = <b>tenue de camouflage</b>.', wiki:'Platanus_×_hispanica'},
 {id:'marronnier',nom:'Marronnier d’Inde',alt:'',latin:'Aesculus hippocastanum',fam:'Sapindacées',grp:['ville'],
  leaf:()=>palmComp({pet:85,leaflets:[{a:0,s:1},{a:-35,s:.92},{a:35,s:.92},{a:-72,s:.76},{a:72,s:.76},{a:-108,s:.56},{a:108,s:.56}],lf:{L:110,W:26,pk:.7,pb:1.6,pt:.75,teeth:{n:20,d:.06,dbl:1},veins:12,va:.08}}),
  c:'#3f7a30',aut:'#b5752c',fruit:'marronnier',bark:{t:'plates',base:'#6d625a',cols:['#857a70','#5e544c','#94897e'],pw:14,ph:10,n:60,edges:'#3a322c'},bud:'marronnier',
  sil:{h:30,trunk:.3,type:'ellipse',cw:.8,cols:['#3f6e2e','#4c7c36','#5a8a40'],bark:'#5e544c',tw:8},
  traits:['Feuille <b>composée en éventail</b> de 5 à 7 grandes folioles dentées','Feuilles opposées','Fleurs en « chandelles » blanches en avril-mai','Bogue aux piquants courts et espacés ; marron luisant <b>sans pointe</b>, toxique','Gros bourgeon brun-rouge collant, cicatrices en fer à cheval','Feuilles souvent brunies dès l’été par une chenille mineuse'],
  ou:'Cours d’école, places, parcs. Les jardins du château de Versailles ont leur « salle des Marronniers » et des alignements de marronniers d’Inde.',
  conf:'<b>Châtaignier</b> : feuille simple en scie, bogue très piquante, fruit à pointe et comestible.',
  memo:'Une feuille comme une <b>main ouverte</b> = marronnier.', wiki:'Aesculus_hippocastanum'},
 {id:'robinier',nom:'Robinier faux-acacia',alt:'',latin:'Robinia pseudoacacia',fam:'Fabacées',grp:['ville'],
  leaf:()=>pinnate({len:215,pet:26,n:6,y0:22,ang:68,lf:{L:30,W:10,pk:.5,pb:.8,pt:.7,pet:3},spines:1}),
  c:'#5a9238',aut:'#d6c043',fruit:'robinier',bark:{t:'reticulate',base:'#7a6f60',crack:'#2e2820',ridge:'#a39784',sp:22,ang:14,cw:5},
  sil:{h:25,trunk:.4,type:'irregular',cw:.6,sparse:1,cols:['#5a8a3a','#689844','#77a650'],bark:'#5a5045'},
  traits:['Feuille <b>composée</b> de 11 à 21 folioles ovales, bord lisse','Feuilles alternes','<b>Deux épines</b> à la base de chaque feuille','Écorce profondément crevassée, en réseau de crêtes','Grappes de fleurs blanches parfumées en mai-juin ; gousses plates'],
  ou:'Talus, friches, bords de routes et de voies ferrées. Originaire d’Amérique du Nord, il s’installe facilement partout.',
  conf:'<b>Frêne</b> : folioles pointues et dentées, feuilles opposées, bourgeons noirs.',
  memo:'Robinier = <b>épines + gousses</b> : c’est un cousin du haricot.', wiki:'Robinia_pseudoacacia'},
 {id:'chenerouge',nom:'Chêne rouge d’Amérique',alt:'',latin:'Quercus rubra',fam:'Fagacées',grp:['foret'],
  leaf:()=>leaf({L:140,W:48,pk:.5,pb:1.4,pt:1,lobes:{n:4.5,d:.62,p:1.8},pet:28,va:.07}),
  c:'#4b7d30',aut:'#b8321e',fruit:'chenerouge',bark:{t:'fissured',base:'#7a7670',crack:'#4a4642',ridge:'#a6a29a',n:6,wob:2,cw:1.2,cross:1},
  sil:{h:30,trunk:.35,type:'ellipse',cw:.7,cols:['#4a7a32','#58893a','#679846'],bark:'#6a6660'},
  traits:['Grande feuille (12 à 22 cm) aux <b>lobes pointus</b>, terminés par une fine soie','Écorce longtemps <b>lisse et grise</b>','Gland trapu dans une cupule plate en soucoupe, mûr en deux ans','Feuillage <b>rouge vif</b> à brun-roux à l’automne'],
  ou:'Originaire d’Amérique du Nord, il a été planté en forêt de Rambouillet : près de Gambaiseuil, le chêne de l’Ascension (26 m) se dresse au milieu d’une plantation de chênes rouges.',
  conf:'<b>Chênes indigènes</b> (sessile, pédonculé, pubescent) : lobes arrondis, écorce crevassée.',
  memo:'Chêne rouge = lobes pointus comme des flammes, et rouges à l’automne.', wiki:'Quercus_rubra'},
 {id:'pubescent',nom:'Chêne pubescent',alt:'chêne blanc',latin:'Quercus pubescens',fam:'Fagacées',grp:['foret'],
  leaf:()=>leaf({L:95,W:34,pk:.6,pb:1.2,pt:.9,lobes:{n:5,d:.45,p:.7},pet:10,va:.08}),
  c:'#6b8a4e',aut:'#8a6a3a',fruit:'pubescent',bark:{t:'fissured',base:'#4f4842',crack:'#1c1915',ridge:'#7a7066',n:12,wob:4,cw:3,cross:12},
  sil:{h:20,trunk:.3,type:'irregular',cw:.75,cols:['#5f7f48','#6b8a52','#78955e'],bark:'#4a423a',tw:7},
  traits:['Jeunes rameaux, bourgeons et <b>dessous des feuilles duveteux</b>, doux au toucher','Feuilles plus petites, lobes irréguliers, pétiole court mais net','Cupule aux écailles velues, gland à queue courte','Supporte mieux la sécheresse que nos deux autres chênes'],
  ou:'Le nouveau venu : l’ONF le plante désormais en Île-de-France pour préparer les forêts au climat futur. Tu le croiseras surtout dans les jeunes plantations.',
  conf:'<b>Chêne sessile</b> : dessous de feuille et rameaux lisses. Les deux s’hybrident souvent.',
  memo:'<b>Pubescent</b> = poilu : passe le doigt sous la feuille, c’est doux.', wiki:'Quercus_pubescens'},
 {id:'tremble',nom:'Tremble',alt:'peuplier tremble',latin:'Populus tremula',fam:'Salicacées',grp:['foret'],
  leaf:()=>leaf({L:62,W:33,pk:.42,pb:.55,pt:.75,base:.25,wave:{n:7,d:.07},veins:4,va:.15,pet:52}),
  c:'#5a8a3a',aut:'#e0b02a',fruit:'tremble',bark:{t:'diam',base:'#a7ad99'},
  sil:{h:25,trunk:.45,type:'ellipse',cw:.4,sparse:1,cols:['#6a9a45','#78a650','#86b25c'],bark:'#a7ad99',tw:5},
  traits:['Feuille <b>presque ronde</b>, à grosses dents arrondies','<b>Pétiole aplati</b> : la feuille tremble au moindre souffle','Tronc <b>gris-vert</b> lisse marqué de <b>losanges</b> sombres','Chatons laineux à la fin de l’hiver','Il drageonne : pousse souvent en petits groupes'],
  ou:'1 % de la forêt de Marly ; présent aussi à Fausses-Reposes. Lisières, clairières et jeunes peuplements.',
  conf:'<b>Bouleau</b> : feuille triangulaire pointue, tronc blanc à marques noires.',
  memo:'Pince le pétiole du tremble : il est plat comme un ruban, d’où le frémissement.', wiki:'Populus_tremula'},
 {id:'sorbier',nom:'Sorbier des oiseleurs',alt:'',latin:'Sorbus aucuparia',fam:'Rosacées',grp:['foret','ville'],
  leaf:()=>pinnate({len:190,pet:30,n:6,y0:36,ang:70,lf:{L:42,W:10,pk:.5,pb:.9,pt:1.1,teeth:{n:14,d:.12},veins:5,va:.1}}),
  c:'#4f8a35',aut:'#d4502a',fruit:'sorbier',bark:{t:'lenticel',base:'#8e8c84',lent:'#5e5c55',strip:'#b8b6ae'},
  sil:{h:15,trunk:.35,type:'ellipse',cw:.5,sparse:1,cols:['#4f8a35','#5d9840','#6ca64c'],bark:'#7e7c74',tw:4},
  traits:['Feuille <b>composée</b> de 11 à 19 folioles dentées','Feuilles <b>alternes</b>','Fleurs blanches en ombelles en mai','<b>Bouquets de baies rouge-orangé</b> en fin d’été','Écorce grise, lisse et luisante'],
  ou:'Petit arbre des sous-bois clairs, des lisières et des sols acides ; souvent planté dans les rues et les jardins.',
  conf:'<b>Frêne</b> : feuilles opposées, bourgeons noirs, pas de baies.',
  memo:'Sorbier « des oiseleurs » : les oiseleurs utilisaient ses baies pour attirer les grives.', wiki:'Sorbus_aucuparia'},
 {id:'alisier',nom:'Alisier torminal',alt:'',latin:'Sorbus torminalis',fam:'Rosacées',grp:['foret'],
  leaf:()=>leaf({L:100,W:44,pk:.32,pb:.6,pt:1.1,base:.2,lobes:{n:3.3,d:.55,p:1.5},teeth:{n:24,d:.04},pet:30,va:.08}),
  c:'#3f7a30',aut:'#a8231e',fruit:'alisier',bark:{t:'plates',base:'#6e655b',cols:['#8a8076','#5e564e','#9a9086'],pw:9,ph:7,n:90,edges:'#3a332c'},
  sil:{h:22,trunk:.4,type:'ellipse',cw:.55,cols:['#3f7a30','#4b8838','#589642'],bark:'#5e564e'},
  traits:['Feuille <b>alterne</b> découpée en lobes pointus, les plus profonds en bas','Vert brillant dessus, rouge sombre à l’automne','Petits fruits bruns ponctués (alises)','Écorce qui se détache en petites écailles'],
  ou:'Feuillu précieux disséminé dans les chênaies ; l’ONF le replante en Île-de-France pour diversifier les forêts face au climat.',
  conf:'<b>Érables</b> et <b>platane</b> : feuilles palmées, lobes partant d’un même point.',
  memo:'Alisier = une feuille d’érable « étirée », mais alterne.', wiki:'Sorbus_torminalis'},
 {id:'houx',nom:'Houx',alt:'',latin:'Ilex aquifolium',fam:'Aquifoliacées',grp:['foret'],
  leaf:()=>leaf({L:80,W:30,pk:.5,pb:.9,pt:1.2,teeth:{n:5.5,d:.42},pet:8}),
  c:'#24502b',aut:null,fruit:'houx',bark:{t:'smooth',base:'#8a8f80'},
  sil:{h:12,trunk:.1,type:'cone',cw:.6,cols:['#1f4a26','#27552e','#2f6036'],bark:'#6a6e62',tw:3},
  traits:['Feuilles <b>persistantes</b>, épaisses, très <b>luisantes</b>','Bord ondulé à <b>épines</b> (les feuilles du haut en ont parfois moins)','Baies rouges, toxiques, seulement sur les pieds femelles','Écorce lisse grise ; souvent un arbuste'],
  ou:'Sous-bois des hêtraies-chênaies : la forêt de Rambouillet abrite des « hêtraies à houx », un habitat protégé Natura 2000.',
  conf:'<b>Mahonia</b> des jardins : feuilles composées, baies bleu-noir.',
  memo:'Le seul feuillu <b>piquant et toujours vert</b> du sous-bois.', wiki:'Ilex_aquifolium'},
 {id:'noisetier',nom:'Noisetier',alt:'coudrier',latin:'Corylus avellana',fam:'Bétulacées',grp:['foret'],
  leaf:()=>leaf({L:85,W:40,pk:.55,pb:.5,pt:2.2,base:.32,cord:10,teeth:{n:14,d:.07,dbl:1},veins:6,va:.1,pet:12}),
  c:'#5a8a3a',aut:'#d2b03a',fruit:'noisetier',bark:{t:'lenticel',base:'#7b5f45',lent:'#c8b08a',strip:'#a08060'},
  sil:{h:7,trunk:.2,type:'shrub',cw:1.4,cols:['#5a8a3a','#68983f','#76a54a'],bark:'#6b5440'},
  traits:['Feuille ronde, <b>en cœur</b> à la base, courte pointe, doublement dentée','Douce et <b>velue</b> au toucher','<b>Chatons jaunes</b> pendants dès janvier-février','Noisettes dans une collerette déchiquetée','<b>Plusieurs tiges</b> partant du sol, écorce brune luisante'],
  ou:'Partout en lisière, en sous-bois clair et dans les haies.',
  conf:'<b>Aulne</b> : feuille sans pointe, petits cônes noirs. <b>Tilleul</b> : base de travers, feuille lisse.',
  memo:'Le noisetier pousse « en bouquet » : plusieurs troncs fins depuis le sol.', wiki:'Corylus_avellana'},
 {id:'erablech',nom:'Érable champêtre',alt:'',latin:'Acer campestre',fam:'Sapindacées',grp:['foret','ville'],
  leaf:()=>palm({r0:18,c:18,lobes:[{a:0,len:40,w:26},{a:-58,len:36,w:24},{a:58,len:36,w:24},{a:-120,len:18,w:22},{a:120,len:18,w:22}],pet:40}),
  c:'#4b8030',aut:'#e0b52a',fruit:'erablech',bark:{t:'fissured',base:'#8a7660',crack:'#4a3c2e',ridge:'#b09a80',n:14,wob:3,cw:2,cross:9},
  sil:{h:15,trunk:.3,type:'ellipse',cw:.7,cols:['#4b8030','#58903a','#669d46'],bark:'#6e5e4c'},
  traits:['Petite feuille <b>opposée</b>, 3 à 5 lobes <b>arrondis</b>, sans dents','Un lait blanc perle quand on casse le pétiole','Samares aux ailes <b>alignées à l’horizontale</b>','Écorce liégeuse, crêtes de liège sur certains rameaux','Jaune d’or à l’automne'],
  ou:'Haies, lisières et parcs ; très planté en ville et en haie taillée.',
  conf:'<b>Érable sycomore</b> : feuille plus grande et dentée, ailes en angle droit.',
  memo:'Champêtre = petit et rond ; ses hélicoptères sont à plat.', wiki:'Acer_campestre'},
 {id:'erableplane',nom:'Érable plane',alt:'',latin:'Acer platanoides',fam:'Sapindacées',grp:['ville','foret'],
  leaf:()=>palm({r0:20,c:20,tri:1,lobes:[{a:0,len:68,w:30},{a:-60,len:64,w:30},{a:60,len:64,w:30},{a:-120,len:34,w:26},{a:120,len:34,w:26}],teeth:{n:14,d:14},pet:65}),
  c:'#3f7a30',aut:'#e08a1e',fruit:'erableplane',bark:{t:'fissured',base:'#5e5750',crack:'#2a2622',ridge:'#8a8278',n:16,wob:1.5,cw:1.2,cross:2},
  sil:{h:25,trunk:.3,type:'ellipse',cw:.7,cols:['#3f7a30','#4b8838','#589642'],bark:'#4e4842'},
  traits:['Feuille <b>opposée</b>, 5 lobes terminés par de <b>longues dents fines</b>','<b>Lait blanc</b> quand on casse le pétiole','Samares aux ailes <b>très écartées</b> (angle obtus)','Écorce finement fissurée, qui ne pèle pas','Fleurs jaune-vert avant les feuilles, en mars-avril'],
  ou:'Très planté en alignement et dans les parcs ; présent aussi en forêt.',
  conf:'<b>Sycomore</b> : dents grossières, pas de lait. <b>Platane</b> : feuilles alternes, écorce qui pèle.',
  memo:'Érable plane : casse le pétiole, une goutte de lait blanc apparaît.', wiki:'Acer_platanoides'},
 {id:'saule',nom:'Saule blanc',alt:'',latin:'Salix alba',fam:'Salicacées',grp:['eau'],
  leaf:()=>leaf({L:130,W:13,pk:.4,pb:1,pt:1.3,teeth:{n:40,d:.05},veins:10,va:.08,pet:8}),
  c:'#8fa483',aut:'#c9b84a',fruit:'saule',bark:{t:'reticulate',base:'#7d776c',crack:'#3a352e',ridge:'#a59d90',sp:16,ang:12,cw:4},
  sil:{h:25,trunk:.3,type:'ellipse',cw:.75,cols:['#9fb08f','#adbd9c','#8fa180'],bark:'#6e685e',tw:8},
  traits:['Feuilles <b>étroites et longues</b>, finement dentées','<b>Argentées</b> et soyeuses dessous : l’arbre paraît gris de loin','Écorce grise crevassée en réseau','Chatons au printemps, graines en duvet blanc','Souvent taillé en <b>têtard</b> au bord de l’eau'],
  ou:'Berges des étangs, des rigoles et des rivières.',
  conf:'<b>Saule marsault</b> : feuilles larges et ovales, lisières sèches.',
  memo:'Saule blanc = feuilles en lame, argentées sous le vent.', wiki:'Salix_alba'},
 {id:'if',nom:'If commun',alt:'',latin:'Taxus baccata',fam:'Taxacées',grp:['ville','conif'],
  leaf:()=>yew({nl:30,n:18,len:150}), style:'--needle:#24452c',
  c:null,aut:null,fruit:'if',bark:{t:'plates',base:'#7a3f32',cols:['#9a5a48','#6a3328','#b0705a','#8a4a3a'],pw:14,ph:18,n:60,edges:'#3a1a12'},
  sil:{h:15,trunk:.15,type:'ellipse',cw:.7,cols:['#1f3a24','#25442b','#2c4e32'],bark:'#7a3f32',tw:7},
  traits:['Aiguilles <b>plates</b>, souples, vert sombre, sur deux rangs','Pas de cône : graine dans une <b>coupe rouge</b> charnue (arille)','<b>Feuillage et graines très toxiques</b>','Écorce brun-rouge à violacé, qui s’écaille finement','Supporte la taille : on en fait des topiaires'],
  ou:'Les ifs taillés en formes géométriques accompagnent les parterres des jardins de Versailles ; fréquent aussi dans les parcs et les cimetières.',
  conf:'<b>Sapin</b> : deux bandes blanches sous l’aiguille, cônes dressés.',
  memo:'If = aiguilles plates et perles rouges. On ne goûte pas.', wiki:'Taxus_baccata'},
 {id:'cedre',nom:'Cèdre du Liban',alt:'',latin:'Cedrus libani',fam:'Pinacées',grp:['ville','conif'],
  leaf:()=>cedar(), style:'--needle:#41634a',
  c:null,aut:null,fruit:'cedre',bark:{t:'plates',base:'#4e4c4a',cols:['#6a6764','#3e3c3a','#5a5856'],pw:16,ph:10,n:70,edges:'#1e1d1c'},
  sil:{h:30,trunk:.2,type:'tiers',cw:1.0,cols:['#2f4f3a','#385a42','#41634a'],bark:'#4e4c4a',tw:9},
  traits:['Aiguilles courtes (1 à 3 cm) <b>en rosettes</b>','Grands <b>étages horizontaux</b>, cime aplatie chez les vieux arbres','Cônes dressés en tonnelet, qui se défont sur la branche','Écorce gris sombre en écailles'],
  ou:'Le domaine de Versailles possède un cèdre du Liban de près de 30 m que la légende dit planté en 1722 par le botaniste Bernard de Jussieu.',
  conf:'<b>Mélèze</b> : aiguilles en rosettes aussi, mais molles et qui tombent l’hiver. <b>Cèdre de l’Atlas</b> : rameaux plus redressés, souvent bleutés.',
  memo:'Cèdre = rosettes d’aiguilles et grands étages plats.', wiki:'Cedrus_libani'},
 {id:'ginkgo',nom:'Ginkgo',alt:'arbre aux quarante écus',latin:'Ginkgo biloba',fam:'Ginkgoacées',grp:['ville'],
  leaf:()=>ginkgoL(),
  c:'#5f9a3a',aut:'#e8c22a',fruit:'ginkgo',bark:{t:'fissured',base:'#8b857c',crack:'#4a463f',ridge:'#aea89e',n:11,wob:4,cw:3,cross:7},
  sil:{h:30,trunk:.35,type:'irregular',cw:.5,sparse:1,cols:['#5f9a3a','#6aa644','#78b250'],bark:'#6e685f'},
  traits:['Feuille <b>en éventail</b>, souvent échancrée au milieu','Nervures fines qui partent en éventail','Jaune d’or à l’automne, puis chute presque d’un coup','Pieds femelles : graines jaunes à odeur de beurre rance','Lignée apparue il y a plus de 200 millions d’années'],
  ou:'Parcs et rues ; le domaine de Versailles compte parmi ses « arbres admirables » un rare ginkgo femelle.',
  conf:'Aucune confusion possible : sa feuille est unique.',
  memo:'Ginkgo = un petit éventail.', wiki:'Ginkgo_biloba'},
 {id:'tulipier',nom:'Tulipier de Virginie',alt:'',latin:'Liriodendron tulipifera',fam:'Magnoliacées',grp:['ville'],
  leaf:()=>palm({r0:45,c:45,lobes:[{a:-48,len:30,w:22},{a:48,len:30,w:22},{a:-118,len:28,w:22},{a:118,len:28,w:22}],pet:50}),
  c:'#4f8a35',aut:'#e8c22a',fruit:'tulipier',bark:{t:'reticulate',base:'#7f7d76',crack:'#4b4944',ridge:'#a6a39b',sp:13,ang:10,cw:2},
  sil:{h:35,trunk:.4,type:'ellipse',cw:.5,cols:['#4f8a35','#5d9840','#6ca64c'],bark:'#6a6862'},
  traits:['Feuille à 4 lobes, au <b>bout coupé net</b> comme aux ciseaux','Fleurs <b>en tulipe</b> vert-jaune et orange, vers juin','Cône dressé de samares qui reste l’hiver','Jaune d’or à l’automne ; tronc très droit'],
  ou:'Arbre favori de Marie-Antoinette : les deux tulipiers plantés au Petit Trianon en 1771 sont tombés lors de la tempête de 1999. On en voit d’autres dans les grands parcs.',
  conf:'Aucune autre feuille n’a ce bout « coupé ».',
  memo:'Tulipier = une feuille en forme de T-shirt.', wiki:'Liriodendron_tulipifera'},
 {id:'sequoia',nom:'Séquoia géant',alt:'wellingtonia',latin:'Sequoiadendron giganteum',fam:'Cupressacées',grp:['ville','conif'],
  leaf:()=>sequoiaL(), style:'--needle:#3d6a3f',
  c:null,aut:null,fruit:'sequoia',bark:{t:'fissured',base:'#8a4a2e',crack:'#4a2414',ridge:'#b06a48',n:10,wob:2,cw:4,cross:1},
  sil:{h:42,trunk:.15,type:'cone',cw:.32,cols:['#2f5a36','#386440','#41704a'],bark:'#8a4a2e',tw:11},
  traits:['Feuilles en <b>petites écailles</b> pointues serrées autour des rameaux','Écorce <b>rouge</b>, fibreuse, épaisse et <b>moelleuse</b>','Tronc énorme à la base, silhouette en fusée','Cônes ovoïdes de 5 à 7 cm'],
  ou:'Grands parcs et domaines du XIXe siècle, dont le domaine de Trianon à Versailles.',
  conf:'<b>Séquoia toujours vert</b> : aiguilles plates sur deux rangs. <b>Thuya</b> : écailles aplaties en éventail.',
  memo:'Séquoia = écorce rouge, moelleuse comme un tapis.', wiki:'Sequoiadendron_giganteum'},
 {id:'cypres',nom:'Cyprès chauve',alt:'',latin:'Taxodium distichum',fam:'Cupressacées',grp:['eau','conif','ville'],
  leaf:()=>cypressL(), style:'--needle:#7aa35a',
  c:null,aut:'#b5652e',fruit:'cypres',bark:{t:'fissured',base:'#8a6048',crack:'#4a3020',ridge:'#b08868',n:14,wob:1.5,cw:2,cross:0},
  sil:{h:30,trunk:.2,type:'cone',cw:.4,cols:['#6f9a4f','#7aa35a','#86ad66'],bark:'#8a6048',knees:1},
  traits:['Conifère qui <b>perd ses aiguilles l’hiver</b>, avec ses petits rameaux','Aiguilles plates, très fines, vert tendre, <b>rousses</b> à l’automne','Au bord de l’eau, des « <b>genoux</b> » sortent du sol autour du tronc','Petits cônes ronds ; écorce fibreuse brun-rouge'],
  ou:'Dans le parc du château de Rambouillet, tout près du Perray, les cyprès chauves sont présentés comme l’un des rares conifères à perdre leurs aiguilles l’hiver.',
  conf:'<b>Métaséquoia</b> : aiguilles opposées (alternes chez le cyprès chauve). <b>If</b> : persistant et vert sombre.',
  memo:'Cyprès <b>chauve</b> = il se dégarnit l’hiver, comme le mélèze.', wiki:'Taxodium_distichum'},
];
const BYID = Object.fromEntries(SP.map(s=>[s.id,s]));
const leafStyle = sp => sp.style || `--leaf:${sp.c}`;
const leafSvg = (sp, label) => render(sp.leaf(), {style:leafStyle(sp), label:label||('Feuille de '+sp.nom)});
const barkSvg = (sp, seed=7) => `<div class="barkbox">${bark(sp.bark, seed)}</div>`;

const BUDS = [['hetre','Hêtre','longs, pointus, en cigare, alternes'],['charme','Charme','petits, plaqués contre le rameau'],['chene','Chêne','groupés en bouquet au bout'],['frene','Frêne','noirs, opposés, rameau épais'],['marronnier','Marronnier','énormes, collants, opposés'],['sycomore','Érable sycomore','verts, opposés'],['tilleul','Tilleul','rouges, ventrus, rameau en zigzag'],['aulne','Aulne','violets, sur un petit pied, avec cônes et chatons']];
const KEY = {
  start:{q:'Ta feuille est-elle une aiguille ou une écaille ?',o:[['Oui : aiguilles ou écailles (conifère)','conif'],['Non, c’est une vraie feuille plate','plate']]},
  conif:{q:'Comment sont-elles disposées ?',o:[['Réunies par deux, longues','pins'],['En rosettes sur de petits rameaux','=cedre'],['Plates, sur deux rangs, vert sombre ; perles rouges','=if'],['Plates, très fines et molles ; tombent l’hiver','=cypres'],['Minuscules écailles serrées ; écorce rouge moelleuse','=sequoia']]},
  pins:{q:'Comment sont les aiguilles ?',o:[['Courtes (3 à 7 cm), bleutées ; haut du tronc orangé','=pinsyl'],['Longues (plus de 10 cm), vert sombre ; tronc gris','=laricio']]},
  plate:{q:'Quelle forme d’ensemble ?',o:[['Un petit éventail','=ginkgo'],['Plusieurs folioles en éventail, comme une main ouverte','=marronnier'],['Plusieurs folioles alignées de part et d’autre d’un axe','pennee'],['Une seule pièce','simple']]},
  pennee:{q:'Comment sont les folioles ?',o:[['Pointues, dentées ; feuilles opposées ; bourgeons noirs','=frene'],['Dentées ; feuilles alternes ; baies rouges','=sorbier'],['Ovales, bord lisse ; deux épines à la base','=robinier']]},
  simple:{q:'Comment est-elle découpée ?',o:[['Lobes arrondis','chenes'],['Lobes pointus','pointus'],['Quatre lobes, bout coupé net','=tulipier'],['Piquante, épaisse, luisante, persistante','=houx'],['Pas de lobes','entiere']]},
  chenes:{q:'Regarde la base de la feuille et le dessous.',o:[['Pétiole net (1 à 2,5 cm), base en coin, dessous lisse','=sessile'],['Presque pas de pétiole, deux petites oreillettes','=pedoncule'],['Dessous et rameaux duveteux, doux au toucher','=pubescent']]},
  pointus:{q:'Comment partent les lobes ?',o:[['Tous d’un même point, comme une main','mains'],['Le long de la nervure ; grande feuille à soies au bout des lobes','=chenerouge'],['Le long de la nervure ; plus profonds en bas, petite feuille','=alisier']]},
  mains:{q:'Comment sont-elles placées sur le rameau ?',o:[['Par paires, face à face (érable)','erables'],['Une par une, décalées ; écorce en camouflage','=platane']]},
  erables:{q:'Quel érable ?',o:[['Grosses dents irrégulières ; pas de lait au pétiole','=sycomore'],['Longues dents fines et pointues ; lait blanc au pétiole','=erableplane'],['Petite feuille aux lobes arrondis, sans dents','=erablech']]},
  entiere:{q:'Comment est le bord ?',o:[['Lisse ou à peine ondulé, avec des cils fins','=hetre'],['Grosses dents pointues ; feuille très longue','=chataignier'],['Étroite comme une lame, argentée dessous','=saule'],['Finement denté','dentee']]},
  dentee:{q:'Quelle forme générale ?',o:[['En cœur, base de travers, lisse','=tilleul'],['Ronde en cœur, courte pointe, velue ; plusieurs troncs','=noisetier'],['Ronde, grosses dents arrondies, pétiole aplati','=tremble'],['Petit triangle ou losange ; tronc blanc','=bouleau'],['Bout arrondi ou échancré ; près de l’eau','=aulne'],['Ovale gaufrée, doublement dentée','=charme'],['Ovale pointue, 2 glandes rouges sur le pétiole','=merisier']]},
};
