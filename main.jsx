import React, {useEffect,useState} from "react";
import {createRoot} from "react-dom/client";
import {ChevronLeft, Copy, Trash2, Grid2X2, SlidersHorizontal, Ruler, MoveHorizontal, Check, Home, FolderOpen, Images, Menu, UserCircle2, Bell, Plus} from "lucide-react";
import {WAD_PROFILES, ELEMENT_TYPES} from "./wadCatalog";
import "./styles.css";

const KEY="durako-opname-v2";
const uid=(p="id")=>`${p}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
const newElement=()=>({id:uid("e"),code:"K01",name:"Kozijn",width:2000,height:1500,profileId:"veka-82-passive",glass:"Triple glas 44 mm",colorOutside:"Antraciet",location:"",notes:"",columns:[1000,1000],rows:[1500],cells:[{type:"fixed"},{type:"tilt-turn-right"}]});
const newProject=()=>({id:uid("p"),name:"Nieuw project",customer:"",address:"",city:"",reference:"",status:"Opname",updatedAt:new Date().toISOString(),elements:[newElement()]});
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));if(x?.projects?.length)return x}catch{} const p=newProject();return{projects:[p],activeProjectId:p.id,activeElementId:p.elements[0].id}}
const fit=(a,total)=>{const s=a.reduce((x,y)=>x+Number(y||0),0)||1;const n=a.map(v=>Math.max(1,Math.round(v/s*total)));n[n.length-1]+=total-n.reduce((x,y)=>x+y,0);return n};

function App(){
 const [state,setState]=useState(load),[screen,setScreen]=useState("projects");
 useEffect(()=>localStorage.setItem(KEY,JSON.stringify(state)),[state]);
 const project=state.projects.find(p=>p.id===state.activeProjectId)||state.projects[0];
 const element=project?.elements.find(e=>e.id===state.activeElementId)||project?.elements[0];
 const setProject=fn=>setState(s=>({...s,projects:s.projects.map(p=>p.id===project.id?{...fn(p),updatedAt:new Date().toISOString()}:p)}));
 const update=patch=>setProject(p=>({...p,elements:p.elements.map(e=>e.id===element.id?{...e,...patch}:e)}));
 const openProject=p=>{setState(s=>({...s,activeProjectId:p.id,activeElementId:p.elements[0]?.id}));setScreen("project")};
 const addProject=()=>{const p=newProject();setState(s=>({...s,projects:[p,...s.projects],activeProjectId:p.id,activeElementId:p.elements[0].id}));setScreen("project")};
 const addElement=()=>{const e={...newElement(),code:`K${String(project.elements.length+1).padStart(2,"0")}`};setProject(p=>({...p,elements:[...p.elements,e]}));setState(s=>({...s,activeElementId:e.id}));setScreen("element")};
 const grid=(axis,n)=>{n=Math.max(1,Math.min(6,n));const cols=axis==="columns"?n:element.columns.length,rows=axis==="rows"?n:element.rows.length;const vals=axis==="columns"?fit(Array.from({length:n},(_,i)=>element.columns[i]||element.width/n),element.width):fit(Array.from({length:n},(_,i)=>element.rows[i]||element.height/n),element.height);const cells=Array.from({length:cols*rows},(_,i)=>element.cells[i]||{type:"fixed"});update(axis==="columns"?{columns:vals,cells}:{rows:vals,cells})};
 return <div className="app">
  <Header back={screen!=="projects"?()=>setScreen(screen==="element"?"project":"projects"):null}/>
  {screen==="projects"&&<Projects state={state} add={addProject} open={openProject}/>}
  {screen==="project"&&<Project p={project} change={x=>setProject(p=>({...p,...x}))} add={addElement} open={e=>{setState(s=>({...s,activeElementId:e.id}));setScreen("element")}}/>}
  {screen==="element"&&<Element p={project} e={element} update={update} grid={grid} setProject={setProject} setState={setState} setScreen={setScreen}/>}
  <Nav draw={()=>project&&setScreen("element")} projects={()=>setScreen("projects")}/>
 </div>
}

function Header({back}){return <header><div className="brand">{back?<button className="icon" onClick={back}><ChevronLeft/></button>:<div className="mark">D</div>}<div><b>DURA<span>KO</span></b><small>KOZIJNEN</small></div></div><div className="headicons"><button className="icon"><Bell/></button><button className="icon"><UserCircle2/></button></div></header>}
function Projects({state,add,open}){return <main><section className="hero"><small>DUURZAAM WONEN BEGINT HIER</small><h1>Durako Opname</h1><p>Professioneel inmeten, tekenen en vastleggen van kozijnen en deuren.</p></section><button className="big dark" onClick={add}><Plus/> Nieuw project</button><section className="card"><label>PROJECTEN</label><h2>Mijn projecten</h2>{state.projects.map(p=><button className="row" key={p.id} onClick={()=>open(p)}><FolderOpen/><span><b>{p.name}</b><small>{p.customer||"Nog geen klant"} · {p.elements.length} positie(s)</small></span></button>)}</section></main>}
function Project({p,change,add,open}){return <main><section className="card"><label>PROJECTGEGEVENS</label><h2>{p.name}</h2><div className="fields"><F t="Projectnaam"><input value={p.name} onChange={x=>change({name:x.target.value})}/></F><F t="Klant"><input value={p.customer} onChange={x=>change({customer:x.target.value})}/></F><F t="Adres"><input value={p.address} onChange={x=>change({address:x.target.value})}/></F><F t="Plaats"><input value={p.city} onChange={x=>change({city:x.target.value})}/></F></div></section><section className="card"><div className="title"><div><label>ELEMENTEN</label><h2>Posities</h2></div><button className="primary" onClick={add}><Plus/> Positie</button></div>{p.elements.map(e=><button className="row" key={e.id} onClick={()=>open(e)}><span className="badge">{e.code}</span><span><b>{e.name}</b><small>{e.width} × {e.height} mm</small></span></button>)}</section></main>}

function Element({p,e,update,grid,setProject,setState,setScreen}){
 const [tab,setTab]=useState("drawing"),[sel,setSel]=useState(0);
 useEffect(()=>{if(sel>=e.cells.length)setSel(0)},[e.cells.length]);
 const cell=e.cells[sel]||{type:"fixed"};
 const setCell=type=>update({cells:e.cells.map((c,i)=>i===sel?{...c,type}:c)});
 const del=()=>{if(p.elements.length<2)return alert("Een project moet minimaal één positie houden.");const a=p.elements.filter(x=>x.id!==e.id);setProject(q=>({...q,elements:a}));setState(s=>({...s,activeElementId:a[0].id}));setScreen("project")};
 const dup=()=>{const c={...JSON.parse(JSON.stringify(e)),id:uid("e"),code:e.code+"-KOPIE"};setProject(q=>({...q,elements:[...q.elements,c]}));setState(s=>({...s,activeElementId:c.id}))};
 return <main>
  <section className="toolbar"><button className={tab==="drawing"?"on":""} onClick={()=>setTab("drawing")}><Grid2X2/>Tekening</button><button className={tab==="data"?"on":""} onClick={()=>setTab("data")}><SlidersHorizontal/>Gegevens</button><button onClick={dup}><Copy/></button><button className="del" onClick={del}><Trash2/></button></section>
  {tab==="data"?<section className="card"><div className="fields"><F t="Positiecode"><input value={e.code} onChange={x=>update({code:x.target.value})}/></F><F t="Omschrijving"><input value={e.name} onChange={x=>update({name:x.target.value})}/></F><F t="Locatie"><input value={e.location} onChange={x=>update({location:x.target.value})}/></F><F t="VEKA / WAD profiel"><select value={e.profileId} onChange={x=>update({profileId:x.target.value})}>{WAD_PROFILES.map(x=><option key={x.id} value={x.id}>{x.name} — {x.family}</option>)}</select></F></div></section>:
  <>
   <section className="card drawing"><label>TECHNISCHE TEKENING</label><div className="title"><h2>{e.code} · {e.name}</h2><span className="size">{e.width} × {e.height} mm</span></div><Frame e={e} sel={sel} setSel={setSel}/><div className="selectedbar"><b>Vak V{sel+1}</b><span>{ELEMENT_TYPES.find(x=>x.id===cell.type)?.label}</span></div></section>
   <section className="card"><div className="sectionhead"><Ruler/><div><label>MAATVOERING</label><h3>Totale maat</h3></div></div><div className="fields two"><F t="Breedte (mm)"><input type="number" value={e.width} onChange={x=>{const v=Math.max(1,+x.target.value||1);update({width:v,columns:fit(e.columns,v)})}}/></F><F t="Hoogte (mm)"><input type="number" value={e.height} onChange={x=>{const v=Math.max(1,+x.target.value||1);update({height:v,rows:fit(e.rows,v)})}}/></F></div></section>
   <section className="card"><div className="sectionhead"><MoveHorizontal/><div><label>INDELING</label><h3>Stijlen & regels</h3></div></div><Counter t="Verticale vakken" n={e.columns.length} minus={()=>grid("columns",e.columns.length-1)} plus={()=>grid("columns",e.columns.length+1)}/><Counter t="Horizontale vakken" n={e.rows.length} minus={()=>grid("rows",e.rows.length-1)} plus={()=>grid("rows",e.rows.length+1)}/><Dims t="Vakbreedtes" a={e.columns} change={(i,v)=>{const a=[...e.columns];a[i]=Math.max(1,+v||1);update({columns:a})}} equal={()=>update({columns:fit(e.columns,e.width)})}/><Dims t="Vakhoogtes" a={e.rows} change={(i,v)=>{const a=[...e.rows];a[i]=Math.max(1,+v||1);update({rows:a})}} equal={()=>update({rows:fit(e.rows,e.height)})}/></section>
   <section className="card selector"><div className="title"><div><label>GESELECTEERD VAK</label><h2>V{sel+1}</h2></div><span className="active"><Check/> actief</span></div><p>Kies het type voor dit vak.</p><div className="types">{ELEMENT_TYPES.map(t=><button key={t.id} className={cell.type===t.id?"chosen":""} onClick={()=>setCell(t.id)}><Mini type={t.id}/><span>{t.label}</span></button>)}</div></section>
  </>}
 </main>
}

function Frame({e,sel,setSel}){
 const W=900,H=660,maxW=650,maxH=420,asp=e.width/e.height;let fw=maxW,fh=fw/asp;if(fh>maxH){fh=maxH;fw=fh*asp}const x0=(W-fw)/2,y0=115+(maxH-fh)/2;
 const sw=e.columns.reduce((a,b)=>a+b,0)||1,sh=e.rows.reduce((a,b)=>a+b,0)||1,ws=e.columns.map(v=>fw*v/sw),hs=e.rows.map(v=>fh*v/sh);
 let x=x0;const xs=ws.map(w=>{const z=x;x+=w;return z});let y=y0;const ys=hs.map(h=>{const z=y;y+=h;return z});
 return <div className="stage"><svg viewBox={`0 0 ${W} ${H}`}>
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#dceafb"/><stop offset="1" stopColor="#bdd1ea"/></linearGradient></defs>
  <Dim x1={x0} y1={65} x2={x0+fw} y2={65} text={`${e.width} mm`}/><Dim x1={x0-45} y1={y0} x2={x0-45} y2={y0+fh} text={`${e.height} mm`} vertical/>
  {e.rows.map((_,r)=>e.columns.map((_,c)=>{const i=r*e.columns.length+c,X=xs[c],Y=ys[r],w=ws[c],h=hs[r];return <g key={i} onClick={()=>setSel(i)} className="clickcell"><rect x={X+5} y={Y+5} width={w-10} height={h-10} className={i===sel?"glass selected":"glass"}/><Symbol type={e.cells[i]?.type||"fixed"} x={X+16} y={Y+16} w={w-32} h={h-32}/><text x={X+w/2} y={Y+h-12} className="vlabel" textAnchor="middle">V{i+1}</text></g>}) )}
  {xs.slice(1).map((X,i)=><rect key={i} x={X-6} y={y0} width="12" height={fh} className="mullion"/>)}{ys.slice(1).map((Y,i)=><rect key={i} x={x0} y={Y-6} width={fw} height="12" className="mullion"/>)}
  <rect x={x0} y={y0} width={fw} height={fh} className="outer"/>
  {e.columns.map((v,i)=><Sub key={"c"+i} x1={xs[i]} y1={y0+fh+40} x2={xs[i]+ws[i]} y2={y0+fh+40} text={v}/>)}
  {e.rows.map((v,i)=><Sub key={"r"+i} x1={x0+fw+35} y1={ys[i]} x2={x0+fw+35} y2={ys[i]+hs[i]} text={v} vertical/>)}
 </svg></div>
}
function Dim({x1,y1,x2,y2,text,vertical}){const mx=(x1+x2)/2,my=(y1+y2)/2;return <g className="dim"><line x1={x1} y1={y1} x2={x2} y2={y2}/>{vertical?<><line x1={x1-9} y1={y1} x2={x1+9} y2={y1}/><line x1={x2-9} y1={y2} x2={x2+9} y2={y2}/><text x={x1-17} y={my} transform={`rotate(-90 ${x1-17} ${my})`} textAnchor="middle">{text}</text></>:<><line x1={x1} y1={y1-9} x2={x1} y2={y1+9}/><line x1={x2} y1={y2-9} x2={x2} y2={y2+9}/><text x={mx} y={y1-15} textAnchor="middle">{text}</text></>}</g>}
function Sub({x1,y1,x2,y2,text,vertical}){const mx=(x1+x2)/2,my=(y1+y2)/2;return <g className="subdim"><line x1={x1} y1={y1} x2={x2} y2={y2}/>{vertical?<text x={x1+18} y={my+4}>{text}</text>:<text x={mx} y={y1+27} textAnchor="middle">{text}</text>}</g>}

function Symbol({type,x,y,w,h}){
 const s="#294a70",cx=x+w/2,cy=y+h/2,p=6;
 if(type==="fixed")return <rect x={x+p} y={y+p} width={w-2*p} height={h-2*p} fill="none" stroke={s} strokeWidth="3"/>;
 if(type==="panel")return <rect x={x+p} y={y+p} width={w-2*p} height={h-2*p} fill="#d9d5c8" stroke="#62645d" strokeWidth="3"/>;
 if(type.startsWith("door")){const left=type.endsWith("left"),hinge=left?x+p:x+w-p,handle=left?x+w-18:x+18;return <g><rect x={x+p} y={y+p} width={w-2*p} height={h-2*p} fill="none" stroke={s} strokeWidth="4"/><line x1={hinge} y1={y+p} x2={left?x+w-p:x+p} y2={cy} stroke={s} strokeWidth="3"/><line x1={hinge} y1={y+h-p} x2={left?x+w-p:x+p} y2={cy} stroke={s} strokeWidth="3"/><circle cx={handle} cy={cy} r="5" fill="#1d211b"/><line x1={handle} y1={cy} x2={left?handle-12:handle+12} y2={cy} stroke="#1d211b" strokeWidth="5" strokeLinecap="round"/></g>}
 if(type.startsWith("sliding")){const right=type.endsWith("right");return <g><rect x={x+p} y={y+p} width={w-2*p} height={h-2*p} fill="none" stroke={s} strokeWidth="3"/><line x1={x+w*.25} y1={cy} x2={x+w*.75} y2={cy} stroke={s} strokeWidth="4"/><polyline points={right?`${x+w*.62},${cy-12} ${x+w*.75},${cy} ${x+w*.62},${cy+12}`:`${x+w*.38},${cy-12} ${x+w*.25},${cy} ${x+w*.38},${cy+12}`} fill="none" stroke={s} strokeWidth="4"/></g>}
 if(type==="tilt")return <g><rect x={x+p} y={y+p} width={w-2*p} height={h-2*p} fill="none" stroke={s} strokeWidth="3"/><line x1={x+p} y1={y+p} x2={cx} y2={y+h-p} stroke={s} strokeWidth="3"/><line x1={x+w-p} y1={y+p} x2={cx} y2={y+h-p} stroke={s} strokeWidth="3"/></g>;
 const left=type.endsWith("left"),turn=type.startsWith("turn-"),tt=type.startsWith("tilt-turn");
 const hinge=left?x+p:x+w-p,point=left?x+w-p:x+p;
 return <g><rect x={x+p} y={y+p} width={w-2*p} height={h-2*p} fill="none" stroke={s} strokeWidth="3"/><line x1={hinge} y1={y+p} x2={point} y2={cy} stroke={s} strokeWidth="3"/><line x1={hinge} y1={y+h-p} x2={point} y2={cy} stroke={s} strokeWidth="3"/>{tt&&<><line x1={x+p} y1={y+p} x2={cx} y2={y+h-p} stroke={s} strokeWidth="2" strokeDasharray="9 7"/><line x1={x+w-p} y1={y+p} x2={cx} y2={y+h-p} stroke={s} strokeWidth="2" strokeDasharray="9 7"/></>}<Handle x={left?x+w-15:x+15} y={cy}/></g>
}
function Handle({x,y}){return <g><circle cx={x} cy={y} r="4" fill="#1d211b"/><line x1={x} y1={y} x2={x} y2={y-14} stroke="#1d211b" strokeWidth="4" strokeLinecap="round"/></g>}
function Mini({type}){return <svg viewBox="0 0 40 40"><rect x="6" y="5" width="28" height="30" rx="2" fill="none" stroke="currentColor" strokeWidth="2"/>{type==="fixed"?<circle cx="20" cy="20" r="3" fill="currentColor"/>:<path d={type.includes("left")?"M7 6 L33 20 L7 34":"M33 6 L7 20 L33 34"} fill="none" stroke="currentColor" strokeWidth="2"/>}</svg>}
function Counter({t,n,minus,plus}){return <div className="counter"><b>{t}</b><div><button onClick={minus}>−</button><strong>{n}</strong><button onClick={plus}>+</button></div></div>}
function Dims({t,a,change,equal}){return <div className="dims"><div><b>{t}</b><button onClick={equal}>Gelijk verdelen</button></div><section>{a.map((v,i)=><label key={i}><span>V{i+1}</span><input type="number" value={v} onChange={x=>change(i,x.target.value)}/><small>mm</small></label>)}</section></div>}
function F({t,children}){return <label className="field"><span>{t}</span>{children}</label>}
function Nav({projects,draw}){return <nav><button onClick={projects}><Home/><span>Home</span></button><button onClick={projects}><FolderOpen/><span>Projecten</span></button><button onClick={draw} className="navon"><Grid2X2/><span>Tekenen</span></button><button><Images/><span>Foto's</span></button><button><Menu/><span>Meer</span></button></nav>}
createRoot(document.getElementById("root")).render(<App/>);
