import React,{useEffect,useMemo,useState} from "react";
import {createRoot} from "react-dom/client";
import {
  ChevronLeft,Copy,Trash2,Grid2X2,SlidersHorizontal,Ruler,MoveHorizontal,Check,
  Home,FolderOpen,Images,Menu,UserCircle2,Bell,Plus,Download,Save,PanelsTopLeft,
  DoorOpen,LayoutTemplate,AlertTriangle,CheckCircle2,Building2
} from "lucide-react";
import {WAD_PROFILES,ELEMENT_TYPES,ELEMENT_PRESETS} from "./wadCatalog";
import "./styles.css";

const KEY="durako-opname-v2";
const uid=(p="id")=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const now=()=>new Date().toISOString();

const newElement=()=>({
  id:uid("e"), code:"K01", name:"Kozijn", width:2000, height:1500,
  supplier:"Perfect WAD Group", profileId:"veka-softline-82-nl",
  glass:"Triple glas 44 mm", colorInside:"Wit", colorOutside:"Wit",
  location:"", sill:"", ventilation:"Geen", notes:"",
  columns:[1000,1000], rows:[1500], cells:[{type:"fixed"},{type:"tilt-turn-right"}]
});
const newProject=()=>({id:uid("p"),name:"Nieuw project",customer:"",address:"",city:"",reference:"",status:"Opname",updatedAt:now(),elements:[newElement()]});

function migrate(x){
  if(!x?.projects?.length)return null;
  x.projects=x.projects.map(p=>({...p,updatedAt:p.updatedAt||now(),elements:(p.elements||[]).map(e=>({
    supplier:"Perfect WAD Group", colorInside:"Wit", sill:"", ventilation:"Geen", notes:"", ...e,
    profileId:e.profileId||"veka-softline-82-nl",
    columns:e.columns?.length?e.columns:[e.width||1000],
    rows:e.rows?.length?e.rows:[e.height||1500],
    cells:e.cells?.length?e.cells:[{type:"fixed"}]
  }))}));
  return x;
}
function load(){try{const x=migrate(JSON.parse(localStorage.getItem(KEY)));if(x)return x}catch{}const p=newProject();return{projects:[p],activeProjectId:p.id,activeElementId:p.elements[0].id}}
function normalize(a,total){const s=a.reduce((x,y)=>x+Number(y||0),0)||1;const n=a.map(v=>Math.max(1,Math.round(Number(v||0)/s*total)));n[n.length-1]+=total-n.reduce((x,y)=>x+y,0);return n}
const sum=a=>a.reduce((x,y)=>x+Number(y||0),0);

function App(){
 const [state,setState]=useState(load),[screen,setScreen]=useState("projects");
 const [saved,setSaved]=useState(true);
 useEffect(()=>{setSaved(false);const t=setTimeout(()=>{localStorage.setItem(KEY,JSON.stringify(state));setSaved(true)},250);return()=>clearTimeout(t)},[state]);
 const project=state.projects.find(p=>p.id===state.activeProjectId)||state.projects[0];
 const element=project?.elements.find(e=>e.id===state.activeElementId)||project?.elements[0];
 const setProject=fn=>setState(s=>({...s,projects:s.projects.map(p=>p.id===project.id?{...fn(p),updatedAt:now()}:p)}));
 const update=patch=>setProject(p=>({...p,elements:p.elements.map(e=>e.id===element.id?{...e,...patch}:e)}));
 const openProject=p=>{setState(s=>({...s,activeProjectId:p.id,activeElementId:p.elements[0]?.id}));setScreen("project")};
 const addProject=()=>{const p=newProject();setState(s=>({...s,projects:[p,...s.projects],activeProjectId:p.id,activeElementId:p.elements[0].id}));setScreen("project")};
 const addElement=()=>{const e={...newElement(),code:`K${String(project.elements.length+1).padStart(2,"0")}`};setProject(p=>({...p,elements:[...p.elements,e]}));setState(s=>({...s,activeElementId:e.id}));setScreen("element")};
 return <div className="app">
   <Header back={screen!=="projects"?()=>setScreen(screen==="element"?"project":"projects"):null} saved={saved}/>
   {screen==="projects"&&<Projects state={state} add={addProject} open={openProject}/>}
   {screen==="project"&&project&&<Project p={project} change={x=>setProject(p=>({...p,...x}))} add={addElement} open={e=>{setState(s=>({...s,activeElementId:e.id}));setScreen("element")}} exportProject={()=>downloadProject(project)}/>}
   {screen==="element"&&project&&element&&<Element p={project} e={element} update={update} setProject={setProject} setState={setState} setScreen={setScreen}/>}
   <Nav draw={()=>project&&setScreen("element")} projects={()=>setScreen("projects")}/>
 </div>
}

function downloadProject(p){
 const blob=new Blob([JSON.stringify(p,null,2)],{type:"application/json"});
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`${(p.name||"durako-project").replace(/[^a-z0-9]+/gi,"-")}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}

function Header({back,saved}){return <header><div className="brand">{back?<button className="icon" onClick={back}><ChevronLeft/></button>:<div className="mark">D</div>}<div><b>DURA<span>KO</span></b><small>KOZIJNEN</small></div></div><div className="headicons"><span className="saveState">{saved?<><CheckCircle2/>Opgeslagen</>:<><Save/>Opslaan…</>}</span><button className="icon"><Bell/></button><button className="icon"><UserCircle2/></button></div></header>}

function Projects({state,add,open}){
 const positions=state.projects.reduce((n,p)=>n+p.elements.length,0);
 return <main>
  <section className="hero"><small>DUURZAAM · KWALITEIT · TOEKOMST</small><h1>Durako Opname</h1><p>Inmeten, technisch tekenen en projectgegevens vastleggen op locatie.</p><div className="heroStats"><span><b>{state.projects.length}</b> projecten</span><span><b>{positions}</b> posities</span></div></section>
  <button className="big dark" onClick={add}><Plus/> Nieuw project</button>
  <section className="card"><label>PROJECTEN</label><h2>Mijn projecten</h2>{state.projects.map(p=><button className="row" key={p.id} onClick={()=>open(p)}><FolderOpen/><span><b>{p.name}</b><small>{p.customer||"Nog geen klant"}{p.city?` · ${p.city}`:""} · {p.elements.length} positie(s)</small></span><em>{p.status}</em></button>)}</section>
 </main>
}

function Project({p,change,add,open,exportProject}){
 const totalM2=p.elements.reduce((n,e)=>n+(e.width*e.height/1e6),0);
 return <main>
  <section className="card"><div className="title"><div><label>PROJECTGEGEVENS</label><h2>{p.name}</h2></div><button className="outline" onClick={exportProject}><Download/> Back-up</button></div>
   <div className="fields"><F t="Projectnaam"><input value={p.name} onChange={x=>change({name:x.target.value})}/></F><F t="Klant"><input value={p.customer} onChange={x=>change({customer:x.target.value})}/></F><F t="Adres"><input value={p.address} onChange={x=>change({address:x.target.value})}/></F><F t="Plaats"><input value={p.city} onChange={x=>change({city:x.target.value})}/></F><F t="Referentie"><input value={p.reference} onChange={x=>change({reference:x.target.value})}/></F><F t="Status"><select value={p.status} onChange={x=>change({status:x.target.value})}><option>Opname</option><option>Offerte</option><option>Akkoord</option><option>Besteld</option><option>Gereed</option></select></F></div>
  </section>
  <section className="summary"><div><b>{p.elements.length}</b><span>posities</span></div><div><b>{totalM2.toFixed(1)} m²</b><span>totaal oppervlak</span></div><div><b>WAD</b><span>leverancier</span></div></section>
  <section className="card"><div className="title"><div><label>ELEMENTEN</label><h2>Posities</h2></div><button className="primary" onClick={add}><Plus/> Positie</button></div>{p.elements.map(e=><button className="row" key={e.id} onClick={()=>open(e)}><span className="badge">{e.code}</span><span><b>{e.name}</b><small>{e.width} × {e.height} mm · {WAD_PROFILES.find(x=>x.id===e.profileId)?.family||"profiel"}</small></span></button>)}</section>
 </main>
}

function Element({p,e,update,setProject,setState,setScreen}){
 const [tab,setTab]=useState("drawing"),[sel,setSel]=useState(0);
 useEffect(()=>{if(sel>=e.cells.length)setSel(0)},[e.cells.length,sel]);
 const cell=e.cells[sel]||{type:"fixed"},profile=WAD_PROFILES.find(x=>x.id===e.profileId)||WAD_PROFILES[0];
 const widthOk=sum(e.columns)===Number(e.width),heightOk=sum(e.rows)===Number(e.height);
 const setCell=type=>update({cells:e.cells.map((c,i)=>i===sel?{...c,type}:c)});
 const grid=(axis,n)=>{n=Math.max(1,Math.min(6,n));const cols=axis==="columns"?n:e.columns.length,rows=axis==="rows"?n:e.rows.length;const vals=axis==="columns"?normalize(Array.from({length:n},(_,i)=>e.columns[i]||e.width/n),e.width):normalize(Array.from({length:n},(_,i)=>e.rows[i]||e.height/n),e.height);const cells=Array.from({length:cols*rows},(_,i)=>e.cells[i]||{type:"fixed"});update(axis==="columns"?{columns:vals,cells}:{rows:vals,cells})};
 const applyPreset=preset=>{if(!confirm(`Indeling wijzigen naar "${preset.label}"?`))return;update({name:preset.label,width:preset.width,height:preset.height,columns:[...preset.columns],rows:[...preset.rows],cells:preset.cells.map(type=>({type}))});setSel(0)};
 const del=()=>{if(p.elements.length<2)return alert("Een project moet minimaal één positie houden.");const a=p.elements.filter(x=>x.id!==e.id);setProject(q=>({...q,elements:a}));setState(s=>({...s,activeElementId:a[0].id}));setScreen("project")};
 const dup=()=>{const c={...JSON.parse(JSON.stringify(e)),id:uid("e"),code:e.code+"-KOPIE"};setProject(q=>({...q,elements:[...q.elements,c]}));setState(s=>({...s,activeElementId:c.id}))};
 return <main>
  <section className="toolbar"><button className={tab==="drawing"?"on":""} onClick={()=>setTab("drawing")}><Grid2X2/>Tekening</button><button className={tab==="data"?"on":""} onClick={()=>setTab("data")}><SlidersHorizontal/>Gegevens</button><button onClick={dup}><Copy/><span>Kopiëren</span></button><button className="del" onClick={del}><Trash2/></button></section>
  {tab==="data"?<section className="card">
    <div className="fields">
      <F t="Positiecode"><input value={e.code} onChange={x=>update({code:x.target.value})}/></F><F t="Omschrijving"><input value={e.name} onChange={x=>update({name:x.target.value})}/></F>
      <F t="Locatie / ruimte"><input value={e.location} onChange={x=>update({location:x.target.value})}/></F><F t="Leverancier"><input value="Perfect WAD Group" disabled/></F>
      <F t="WAD / VEKA profiel"><select value={e.profileId} onChange={x=>update({profileId:x.target.value})}>{WAD_PROFILES.map(x=><option key={x.id} value={x.id}>{x.family} — {x.name}</option>)}</select></F>
      <F t="Glas"><input value={e.glass} onChange={x=>update({glass:x.target.value})}/></F><F t="Kleur binnen"><input value={e.colorInside} onChange={x=>update({colorInside:x.target.value})}/></F><F t="Kleur buiten"><input value={e.colorOutside} onChange={x=>update({colorOutside:x.target.value})}/></F>
      <F t="Vensterbank / dorpel"><input value={e.sill} onChange={x=>update({sill:x.target.value})}/></F><F t="Ventilatie"><select value={e.ventilation} onChange={x=>update({ventilation:x.target.value})}><option>Geen</option><option>Rooster</option><option>Sus-kast</option><option>N.t.b.</option></select></F>
    </div>
    <div className="profile"><Building2/><div><label>GEKOZEN PROFIEL</label><h3>{profile.name}</h3><p>{profile.supplier} · {profile.family} · {profile.category}</p><p>{profile.depthMm?`${profile.depthMm} mm`:''}{profile.glazing?` · glas ${profile.glazing}`:''}</p>{profile.note&&<small>{profile.note}</small>}</div></div>
    <F t="Opmerkingen"><textarea rows="5" value={e.notes} onChange={x=>update({notes:x.target.value})}/></F>
  </section>:
  <>
   <section className="card presets"><div className="sectionhead"><LayoutTemplate/><div><label>SNEL STARTEN</label><h3>Elementtype</h3></div></div><div className="presetScroll">{ELEMENT_PRESETS.map(x=><button key={x.id} onClick={()=>applyPreset(x)}><DoorOpen/><span>{x.label}</span></button>)}</div></section>
   <section className="card drawing"><label>TECHNISCHE TEKENING</label><div className="title"><h2>{e.code} · {e.name}</h2><span className="size">{e.width} × {e.height} mm</span></div><Frame e={e} sel={sel} setSel={setSel}/><div className="selectedbar"><b>Vak V{sel+1}</b><span>{ELEMENT_TYPES.find(x=>x.id===cell.type)?.label}</span></div></section>
   {(!widthOk||!heightOk)&&<div className="warn"><AlertTriangle/><span>De vakmaten tellen niet op tot de totale maat.</span><button onClick={()=>update({columns:normalize(e.columns,e.width),rows:normalize(e.rows,e.height)})}>Corrigeren</button></div>}
   <section className="card"><div className="sectionhead"><Ruler/><div><label>MAATVOERING</label><h3>Totale maat</h3></div></div><div className="fields two"><F t="Breedte (mm)"><input type="number" inputMode="numeric" value={e.width} onChange={x=>{const v=Math.max(1,+x.target.value||1);update({width:v,columns:normalize(e.columns,v)})}}/></F><F t="Hoogte (mm)"><input type="number" inputMode="numeric" value={e.height} onChange={x=>{const v=Math.max(1,+x.target.value||1);update({height:v,rows:normalize(e.rows,v)})}}/></F></div></section>
   <section className="card"><div className="sectionhead"><MoveHorizontal/><div><label>INDELING</label><h3>Stijlen & regels</h3></div></div>
    <Counter t="Verticale vakken" n={e.columns.length} minus={()=>grid("columns",e.columns.length-1)} plus={()=>grid("columns",e.columns.length+1)}/><Counter t="Horizontale vakken" n={e.rows.length} minus={()=>grid("rows",e.rows.length-1)} plus={()=>grid("rows",e.rows.length+1)}/>
    <Dims t="Vakbreedtes" a={e.columns} change={(i,v)=>{const a=[...e.columns];a[i]=Math.max(1,+v||1);update({columns:a})}} equal={()=>update({columns:normalize(e.columns,e.width)})}/>
    <Dims t="Vakhoogtes" a={e.rows} change={(i,v)=>{const a=[...e.rows];a[i]=Math.max(1,+v||1);update({rows:a})}} equal={()=>update({rows:normalize(e.rows,e.height)})}/>
   </section>
   <section className="card selector"><div className="title"><div><label>GESELECTEERD VAK</label><h2>V{sel+1}</h2></div><span className="active"><Check/> actief</span></div><div className="types">{ELEMENT_TYPES.map(t=><button key={t.id} className={cell.type===t.id?"chosen":""} onClick={()=>setCell(t.id)}><Mini type={t.id}/><span>{t.label}</span><small>{t.group}</small></button>)}</div></section>
  </>}
 </main>
}

function Frame({e,sel,setSel}){
 const W=900,H=690,maxW=650,maxH=470,asp=e.width/e.height;let fw=maxW,fh=fw/asp;if(fh>maxH){fh=maxH;fw=fh*asp}
 const x0=(W-fw)/2,y0=110+(maxH-fh)/2,sw=sum(e.columns)||1,sh=sum(e.rows)||1,ws=e.columns.map(v=>fw*v/sw),hs=e.rows.map(v=>fh*v/sh);
 let x=x0;const xs=ws.map(w=>{const z=x;x+=w;return z});let y=y0;const ys=hs.map(h=>{const z=y;y+=h;return z});
 return <div className="stage"><svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#dceafb"/><stop offset="1" stopColor="#bdd1ea"/></linearGradient></defs>
  <Dim x1={x0} y1={65} x2={x0+fw} y2={65} text={`${e.width} mm`}/><Dim x1={x0-45} y1={y0} x2={x0-45} y2={y0+fh} text={`${e.height} mm`} vertical/>
  {e.rows.map((_,r)=>e.columns.map((_,c)=>{const i=r*e.columns.length+c,X=xs[c],Y=ys[r],w=ws[c],h=hs[r];return <g key={i} onClick={()=>setSel(i)} className="clickcell"><rect x={X+5} y={Y+5} width={Math.max(1,w-10)} height={Math.max(1,h-10)} className={i===sel?"glass selected":"glass"}/><Symbol type={e.cells[i]?.type||"fixed"} x={X+15} y={Y+15} w={Math.max(24,w-30)} h={Math.max(24,h-30)}/><text x={X+w/2} y={Y+h-12} className="vlabel" textAnchor="middle">V{i+1}</text></g>}) )}
  {xs.slice(1).map((X,i)=><rect key={i} x={X-6} y={y0} width="12" height={fh} className="mullion"/>)}{ys.slice(1).map((Y,i)=><rect key={i} x={x0} y={Y-6} width={fw} height="12" className="mullion"/>)}
  <rect x={x0} y={y0} width={fw} height={fh} className="outer"/>
  {e.columns.map((v,i)=><Sub key={"c"+i} x1={xs[i]} y1={y0+fh+36} x2={xs[i]+ws[i]} y2={y0+fh+36} text={`${v} mm`}/>)}
  {e.rows.map((v,i)=><Sub key={"r"+i} x1={x0+fw+34} y1={ys[i]} x2={x0+fw+34} y2={ys[i]+hs[i]} text={`${v} mm`} vertical/>)}
 </svg></div>
}
function Dim({x1,y1,x2,y2,text,vertical}){const mx=(x1+x2)/2,my=(y1+y2)/2;return <g className="dim"><line x1={x1} y1={y1} x2={x2} y2={y2}/>{vertical?<><line x1={x1-9} y1={y1} x2={x1+9} y2={y1}/><line x1={x2-9} y1={y2} x2={x2+9} y2={y2}/><text x={x1-17} y={my} transform={`rotate(-90 ${x1-17} ${my})`} textAnchor="middle">{text}</text></>:<><line x1={x1} y1={y1-9} x2={x1} y2={y1+9}/><line x1={x2} y1={y2-9} x2={x2} y2={y2+9}/><text x={mx} y={y1-15} textAnchor="middle">{text}</text></>}</g>}
function Sub({x1,y1,x2,y2,text,vertical}){const mx=(x1+x2)/2,my=(y1+y2)/2;return <g className="subdim"><line x1={x1} y1={y1} x2={x2} y2={y2}/>{vertical?<text x={x1+15} y={my+4}>{text}</text>:<text x={mx} y={y1+25} textAnchor="middle">{text}</text>}</g>}

function Symbol({type,x,y,w,h}){
 const s="#294a70",cx=x+w/2,cy=y+h/2,p=5;
 if(type==="fixed")return <rect x={x+p} y={y+p} width={Math.max(1,w-2*p)} height={Math.max(1,h-2*p)} fill="none" stroke={s} strokeWidth="3"/>;
 if(type==="panel")return <g><rect x={x+p} y={y+p} width={Math.max(1,w-2*p)} height={Math.max(1,h-2*p)} fill="#d8d4c8" stroke="#62645d" strokeWidth="3"/><line x1={x+p} y1={cy} x2={x+w-p} y2={cy} stroke="#8e8b81" strokeWidth="2"/></g>;
 if(type.startsWith("door")){const left=type.endsWith("left"),hinge=left?x+p:x+w-p,point=left?x+w-p:x+p,handle=left?x+w-18:x+18;return <g><rect x={x+p} y={y+p} width={Math.max(1,w-2*p)} height={Math.max(1,h-2*p)} fill="none" stroke={s} strokeWidth="4"/><line x1={hinge} y1={y+p} x2={point} y2={cy} stroke={s} strokeWidth="3"/><line x1={hinge} y1={y+h-p} x2={point} y2={cy} stroke={s} strokeWidth="3"/><Handle x={handle} y={cy} horizontal left={left}/></g>}
 if(type.startsWith("sliding")){const right=type.endsWith("right");return <g><rect x={x+p} y={y+p} width={Math.max(1,w-2*p)} height={Math.max(1,h-2*p)} fill="none" stroke={s} strokeWidth="3"/><line x1={x+w*.23} y1={cy} x2={x+w*.77} y2={cy} stroke={s} strokeWidth="4"/><polyline points={right?`${x+w*.63},${cy-11} ${x+w*.77},${cy} ${x+w*.63},${cy+11}`:`${x+w*.37},${cy-11} ${x+w*.23},${cy} ${x+w*.37},${cy+11}`} fill="none" stroke={s} strokeWidth="4"/></g>}
 if(type==="tilt")return <g><rect x={x+p} y={y+p} width={Math.max(1,w-2*p)} height={Math.max(1,h-2*p)} fill="none" stroke={s} strokeWidth="3"/><line x1={x+p} y1={y+p} x2={cx} y2={y+h-p} stroke={s} strokeWidth="3"/><line x1={x+w-p} y1={y+p} x2={cx} y2={y+h-p} stroke={s} strokeWidth="3"/><Handle x={cx} y={y+16}/></g>;
 const left=type.endsWith("left"),tt=type.startsWith("tilt-turn"),hinge=left?x+p:x+w-p,point=left?x+w-p:x+p;
 return <g><rect x={x+p} y={y+p} width={Math.max(1,w-2*p)} height={Math.max(1,h-2*p)} fill="none" stroke={s} strokeWidth="3"/><line x1={hinge} y1={y+p} x2={point} y2={cy} stroke={s} strokeWidth="3"/><line x1={hinge} y1={y+h-p} x2={point} y2={cy} stroke={s} strokeWidth="3"/>{tt&&<><line x1={x+p} y1={y+p} x2={cx} y2={y+h-p} stroke={s} strokeWidth="2" strokeDasharray="8 7"/><line x1={x+w-p} y1={y+p} x2={cx} y2={y+h-p} stroke={s} strokeWidth="2" strokeDasharray="8 7"/></>}<Handle x={left?x+w-15:x+15} y={cy}/></g>
}
function Handle({x,y,horizontal,left}){return <g><rect x={x-4} y={y-6} width="8" height="12" rx="3" fill="#1d211b"/>{horizontal?<line x1={x} y1={y} x2={left?x-15:x+15} y2={y} stroke="#1d211b" strokeWidth="5" strokeLinecap="round"/>:<line x1={x} y1={y} x2={x} y2={y-16} stroke="#1d211b" strokeWidth="5" strokeLinecap="round"/>}</g>}
function Mini({type}){return <svg viewBox="0 0 40 40"><rect x="6" y="5" width="28" height="30" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>{type==="fixed"?<circle cx="20" cy="20" r="3" fill="currentColor"/>:type==="panel"?<path d="M7 20H33" stroke="currentColor" strokeWidth="2"/>:<path d={type.includes("left")?"M7 6 L33 20 L7 34":"M33 6 L7 20 L33 34"} fill="none" stroke="currentColor" strokeWidth="2"/>}</svg>}
function Counter({t,n,minus,plus}){return <div className="counter"><b>{t}</b><div><button onClick={minus}>−</button><strong>{n}</strong><button onClick={plus}>+</button></div></div>}
function Dims({t,a,change,equal}){return <div className="dims"><div><b>{t}</b><button onClick={equal}>Gelijk verdelen</button></div><section>{a.map((v,i)=><label key={i}><span>V{i+1}</span><input type="number" inputMode="numeric" value={v} onChange={x=>change(i,x.target.value)}/><small>mm</small></label>)}</section></div>}
function F({t,children}){return <label className="field"><span>{t}</span>{children}</label>}
function Nav({projects,draw}){return <nav><button onClick={projects}><Home/><span>Home</span></button><button onClick={projects}><FolderOpen/><span>Projecten</span></button><button onClick={draw} className="navon"><Grid2X2/><span>Tekenen</span></button><button><Images/><span>Foto's</span></button><button><Menu/><span>Meer</span></button></nav>}
createRoot(document.getElementById("root")).render(<App/>);
