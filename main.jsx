import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Plus, Trash2, ChevronLeft, Copy, Camera, Grid2X2, FolderOpen,
  Settings2, Home, Images, Menu, Search, Bell, UserCircle2,
  Sparkles, Leaf, ShieldCheck, PanelsTopLeft, SlidersHorizontal,
  Ruler, Check, X, MoveHorizontal
} from "lucide-react";
import { WAD_PROFILES, ELEMENT_TYPES } from "./wadCatalog";
import "./styles.css";

const STORAGE_KEY = "durako-opname-v2";

function uid(prefix="id") {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
}

const defaultElement = () => ({
  id: uid("element"),
  code: "K01",
  name: "Kozijn",
  width: 2000,
  height: 1500,
  profileId: "veka-82-passive",
  glass: "Triple glas 44 mm",
  colorInside: "Wit",
  colorOutside: "Antraciet",
  location: "",
  notes: "",
  columns: [1000, 1000],
  rows: [1500],
  cells: [{ type: "fixed" }, { type: "tilt-turn-right" }]
});

const defaultProject = () => ({
  id: uid("project"),
  name: "Nieuw project",
  customer: "",
  address: "",
  city: "",
  reference: "",
  status: "Opname",
  updatedAt: new Date().toISOString(),
  elements: [defaultElement()]
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const p = defaultProject();
  return { projects:[p], activeProjectId:p.id, activeElementId:p.elements[0].id };
}

function normalizeParts(parts, total) {
  if (!parts?.length) return [total];
  const sum = parts.reduce((a,b)=>a+Number(b||0),0);
  if (sum <= 0) return parts.map((_,i)=> i === parts.length-1 ? total : 0);
  const scaled = parts.map(v=>Math.max(1, Math.round((Number(v)/sum)*total)));
  scaled[scaled.length-1] += total - scaled.reduce((a,b)=>a+b,0);
  return scaled;
}

function App(){
  const [state,setState] = useState(loadState);
  const [screen,setScreen] = useState("projects");

  useEffect(()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(state)),[state]);

  const project = state.projects.find(p=>p.id===state.activeProjectId) || state.projects[0];
  const element = project?.elements.find(e=>e.id===state.activeElementId) || project?.elements[0];

  const setProject = updater => setState(s=>({
    ...s,
    projects:s.projects.map(p=>p.id===project.id ? {...updater(p),updatedAt:new Date().toISOString()} : p)
  }));

  const updateElement = patch => setProject(p=>({
    ...p,
    elements:p.elements.map(e=>e.id===element.id ? {...e,...patch}:e)
  }));

  const addProject=()=>{
    const p=defaultProject();
    setState(s=>({...s,projects:[p,...s.projects],activeProjectId:p.id,activeElementId:p.elements[0].id}));
    setScreen("project");
  };

  const addElement=()=>{
    const idx=project.elements.length+1;
    const e={...defaultElement(),code:`K${String(idx).padStart(2,"0")}`};
    setProject(p=>({...p,elements:[...p.elements,e]}));
    setState(s=>({...s,activeElementId:e.id}));
    setScreen("element");
  };

  const duplicateElement=()=>{
    const c={...JSON.parse(JSON.stringify(element)),id:uid("element"),code:`${element.code}-KOPIE`};
    setProject(p=>({...p,elements:[...p.elements,c]}));
    setState(s=>({...s,activeElementId:c.id}));
  };

  const deleteElement=()=>{
    if(project.elements.length<=1) return alert("Een project moet minimaal één positie houden.");
    const next=project.elements.filter(e=>e.id!==element.id);
    setProject(p=>({...p,elements:next}));
    setState(s=>({...s,activeElementId:next[0].id}));
    setScreen("project");
  };

  const updateGridCount=(axis,count)=>{
    count=Math.max(1,Math.min(6,Number(count)||1));
    const cols=axis==="columns"?count:element.columns.length;
    const rows=axis==="rows"?count:element.rows.length;
    const nextParts=axis==="columns"
      ? normalizeParts(Array.from({length:count},(_,i)=>element.columns[i]??Math.round(element.width/count)),element.width)
      : normalizeParts(Array.from({length:count},(_,i)=>element.rows[i]??Math.round(element.height/count)),element.height);
    const cells=Array.from({length:cols*rows},(_,i)=>element.cells[i]||{type:"fixed"});
    updateElement(axis==="columns"?{columns:nextParts,cells}:{rows:nextParts,cells});
  };

  const updateTotalSize=(axis,value)=>{
    value=Math.max(1,Number(value)||1);
    if(axis==="width") updateElement({width:value,columns:normalizeParts(element.columns,value)});
    else updateElement({height:value,rows:normalizeParts(element.rows,value)});
  };

  const updatePart=(axis,index,value)=>{
    const arr=[...element[axis]];
    arr[index]=Math.max(1,Number(value)||1);
    updateElement({[axis]:arr});
  };

  const autoFit=axis=>updateElement({[axis]:normalizeParts(element[axis],axis==="columns"?element.width:element.height)});
  const updateCell=(index,patch)=>updateElement({cells:element.cells.map((c,i)=>i===index?{...c,...patch}:c)});

  return <div className="app-shell">
    <DurakoHeader onBack={screen!=="projects"?()=>setScreen(screen==="element"?"project":"projects"):null}/>
    {screen==="projects"&&<ProjectsScreen state={state} onAdd={addProject} onOpen={p=>{
      setState(s=>({...s,activeProjectId:p.id,activeElementId:p.elements[0]?.id}));setScreen("project");
    }}/>} 
    {screen==="project"&&project&&<ProjectScreen project={project} onChange={patch=>setProject(p=>({...p,...patch}))} onAddElement={addElement} onOpenElement={e=>{setState(s=>({...s,activeElementId:e.id}));setScreen("element");}}/>}
    {screen==="element"&&project&&element&&<ElementScreen project={project} element={element} updateElement={updateElement} updateGridCount={updateGridCount} updateTotalSize={updateTotalSize} updatePart={updatePart} autoFit={autoFit} updateCell={updateCell} duplicateElement={duplicateElement} deleteElement={deleteElement}/>} 
    <BottomNav screen={screen} onHome={()=>setScreen("projects")} onProjects={()=>setScreen("projects")} onDraw={()=>project&&setScreen("element")}/>
  </div>;
}

function DurakoHeader({onBack}){
  return <header className="durako-header">
    <div className="header-left">
      {onBack?<button className="icon-button ghost" onClick={onBack}><ChevronLeft/></button>:<div className="durako-logo-mark"><span>D</span></div>}
      <div className="brand-text"><div className="durako-wordmark">DURA<span>KO</span></div><div className="durako-submark">KOZIJNEN</div></div>
    </div>
    <div className="header-actions"><button className="icon-button"><Bell/></button><button className="icon-button"><UserCircle2/></button></div>
  </header>;
}

function ProjectsScreen({state,onAdd,onOpen}){
  const [query,setQuery]=useState("");
  const filtered=state.projects.filter(p=>`${p.name} ${p.customer} ${p.address} ${p.city}`.toLowerCase().includes(query.toLowerCase()));
  return <main className="page dashboard-page">
    <section className="hero-card"><div className="hero-content"><div className="eyebrow">Duurzaam wonen begint hier</div><h1>Durako Opname</h1><p>Professioneel inmeten, tekenen en vastleggen van kozijnen en deuren.</p><div className="hero-badges"><span><Leaf/>Duurzaam</span><span><ShieldCheck/>Kwaliteit</span><span><Sparkles/>Toekomst</span></div></div></section>
    <section className="quick-grid"><button className="quick-card dark" onClick={onAdd}><Plus/><div><strong>Nieuw project</strong><span>Start een nieuwe opname</span></div></button><button className="quick-card olive"><FolderOpen/><div><strong>Open project</strong><span>Bekijk lopende projecten</span></div></button><button className="quick-card charcoal"><Camera/><div><strong>Foto's</strong><span>Projectfoto's & details</span></div></button></section>
    <section className="panel project-panel"><div className="panel-head stack-mobile"><div><span className="section-kicker">Projecten</span><h2>Mijn projecten</h2></div><div className="search-wrap"><Search/><input placeholder="Zoek projecten..." value={query} onChange={e=>setQuery(e.target.value)}/></div></div><div className="project-cards">{filtered.map(p=><button key={p.id} className="project-tile" onClick={()=>onOpen(p)}><div className="project-photo-placeholder"><PanelsTopLeft/></div><div className="project-tile-main"><div className="project-title-row"><strong>{p.name||"Naamloos project"}</strong><span className="status-pill">{p.status||"Opname"}</span></div><span>{p.customer||"Nog geen klant"}{p.city?` · ${p.city}`:""}</span><small>{p.elements.length} positie{p.elements.length===1?"":"s"}</small></div><ChevronLeft className="rotate-180"/></button>)}</div></section>
  </main>;
}

function ProjectScreen({project,onChange,onAddElement,onOpenElement}){
  return <main className="page"><section className="panel"><div className="panel-head"><div><span className="section-kicker">Projectgegevens</span><h2>{project.name}</h2></div><span className="status-pill">{project.status||"Opname"}</span></div><div className="form-grid"><Field label="Projectnaam"><input value={project.name} onChange={e=>onChange({name:e.target.value})}/></Field><Field label="Klant"><input value={project.customer} onChange={e=>onChange({customer:e.target.value})}/></Field><Field label="Adres"><input value={project.address} onChange={e=>onChange({address:e.target.value})}/></Field><Field label="Plaats"><input value={project.city} onChange={e=>onChange({city:e.target.value})}/></Field><Field label="Referentie"><input value={project.reference} onChange={e=>onChange({reference:e.target.value})}/></Field><Field label="Status"><select value={project.status||"Opname"} onChange={e=>onChange({status:e.target.value})}><option>Opname</option><option>Offerte</option><option>Akkoord</option><option>Besteld</option><option>Gereed</option></select></Field></div></section><section className="panel"><div className="panel-head"><div><span className="section-kicker">Elementen</span><h2>Posities</h2></div><button className="primary" onClick={onAddElement}><Plus/>Positie</button></div><div className="element-list">{project.elements.map(e=><button className="element-row" key={e.id} onClick={()=>onOpenElement(e)}><div className="element-badge">{e.code}</div><div className="element-row-main"><strong>{e.name}</strong><span>{e.width} × {e.height} mm · {e.location||"geen ruimte"}</span></div><ChevronLeft className="rotate-180"/></button>)}</div></section></main>;
}

function ElementScreen({project,element,updateElement,updateGridCount,updateTotalSize,updatePart,autoFit,updateCell,duplicateElement,deleteElement}){
  const [tab,setTab]=useState("tekening");
  const [selectedCell,setSelectedCell]=useState(0);
  useEffect(()=>{if(selectedCell>=element.cells.length)setSelectedCell(0)},[element.cells.length,selectedCell]);
  const selected=element.cells[selectedCell]||element.cells[0];
  const profile=WAD_PROFILES.find(p=>p.id===element.profileId);

  return <main className="page element-page">
    <div className="element-toolbar panel compact-panel"><div className="tabs"><button className={tab==="tekening"?"active":""} onClick={()=>setTab("tekening")}><Grid2X2/>Tekening</button><button className={tab==="gegevens"?"active":""} onClick={()=>setTab("gegevens")}><SlidersHorizontal/>Gegevens</button></div><div className="toolbar-actions"><button className="secondary" onClick={duplicateElement}><Copy/>Kopiëren</button><button className="danger-light" onClick={deleteElement}><Trash2/></button></div></div>

    {tab==="gegevens"?<section className="panel data-panel"><div className="form-grid"><Field label="Positiecode"><input value={element.code} onChange={e=>updateElement({code:e.target.value})}/></Field><Field label="Omschrijving"><input value={element.name} onChange={e=>updateElement({name:e.target.value})}/></Field><Field label="Locatie / ruimte"><input value={element.location} onChange={e=>updateElement({location:e.target.value})}/></Field><Field label="VEKA / WAD profiel"><select value={element.profileId} onChange={e=>updateElement({profileId:e.target.value})}>{WAD_PROFILES.map(p=><option key={p.id} value={p.id}>{p.name} — {p.family}</option>)}</select></Field><Field label="Glas"><input value={element.glass} onChange={e=>updateElement({glass:e.target.value})}/></Field><Field label="Kleur buiten"><input value={element.colorOutside} onChange={e=>updateElement({colorOutside:e.target.value})}/></Field></div><div className="profile-summary"><strong>{profile?.name}</strong><span>{profile?.family} · {profile?.depthMm} mm · {profile?.category}</span></div><Field label="Opmerkingen"><textarea rows="5" value={element.notes} onChange={e=>updateElement({notes:e.target.value})}/></Field></section>:
    <div className="drawing-layout">
      <section className="panel drawing-panel"><div className="drawing-title-row"><div><span className="section-kicker">Technische tekening</span><h2>{element.code} · {element.name}</h2></div><span className="size-pill">{element.width} × {element.height} mm</span></div><FrameDrawing element={element} selectedCell={selectedCell} onSelect={setSelectedCell}/><div className="drawing-hint">Tik op een blauw vak om het te selecteren en kies daarna het type.</div></section>

      <section className="panel editor-panel"><div className="editor-section"><div className="editor-heading"><Ruler/><div><span className="section-kicker">Maatvoering</span><h3>Totale maat</h3></div></div><div className="form-grid two"><Field label="Breedte (mm)"><input type="number" inputMode="numeric" value={element.width} onChange={e=>updateTotalSize("width",e.target.value)}/></Field><Field label="Hoogte (mm)"><input type="number" inputMode="numeric" value={element.height} onChange={e=>updateTotalSize("height",e.target.value)}/></Field></div></div>

      <div className="editor-section"><div className="editor-heading"><MoveHorizontal/><div><span className="section-kicker">Indeling</span><h3>Stijlen & regels</h3></div></div><div className="split-control"><Counter label="Verticale vakken" value={element.columns.length} minus={()=>updateGridCount("columns",element.columns.length-1)} plus={()=>updateGridCount("columns",element.columns.length+1)}/><Counter label="Horizontale vakken" value={element.rows.length} minus={()=>updateGridCount("rows",element.rows.length-1)} plus={()=>updateGridCount("rows",element.rows.length+1)}/></div><DimensionEditor label="Vakbreedtes" values={element.columns} onChange={(i,v)=>updatePart("columns",i,v)} onFit={()=>autoFit("columns")}/><DimensionEditor label="Vakhoogtes" values={element.rows} onChange={(i,v)=>updatePart("rows",i,v)} onFit={()=>autoFit("rows")}/></div>

      <div className="editor-section selected-editor"><div className="selected-head"><div><span className="section-kicker">Geselecteerd vak</span><h3>V{selectedCell+1}</h3></div><span className="selected-check"><Check/>actief</span></div><div className="type-grid">{ELEMENT_TYPES.map(t=><button key={t.id} className={`type-button ${selected?.type===t.id?"active":""}`} onClick={()=>updateCell(selectedCell,{type:t.id})}><TypeMiniIcon type={t.id}/><span>{t.label}</span></button>)}</div></div>
    </section>
    </div>}
  </main>;
}

function Counter({label,value,minus,plus}){return <div className="counter"><span>{label}</span><div><button onClick={minus}>−</button><strong>{value}</strong><button onClick={plus}>+</button></div></div>}

function DimensionEditor({label,values,onChange,onFit}){return <div className="dimension-block"><div className="dimension-head"><strong>{label}</strong><button onClick={onFit}>Gelijk verdelen</button></div><div className="dimension-inputs">{values.map((v,i)=><label key={i}><span>V{i+1}</span><input type="number" inputMode="numeric" value={v} onChange={e=>onChange(i,e.target.value)}/><small>mm</small></label>)}</div></div>}

function FrameDrawing({element,selectedCell,onSelect}){
  const W=1000,H=720;
  const maxFw=780,maxFh=470;
  const aspect=element.width/element.height;
  let fw=maxFw,fh=fw/aspect;
  if(fh>maxFh){fh=maxFh;fw=fh*aspect}
  const x0=(W-fw)/2,y0=130+(maxFh-fh)/2;
  const frame=12;
  const colTotal=element.columns.reduce((a,b)=>a+b,0)||1;
  const rowTotal=element.rows.reduce((a,b)=>a+b,0)||1;
  const colPx=element.columns.map(v=>fw*(v/colTotal));
  const rowPx=element.rows.map(v=>fh*(v/rowTotal));
  const colStarts=[];let cx=x0;colPx.forEach(w=>{colStarts.push(cx);cx+=w});
  const rowStarts=[];let cy=y0;rowPx.forEach(h=>{rowStarts.push(cy);cy+=h});

  return <div className="drawing-stage"><svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Technische kozijntekening">
    <defs><linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d6e4f5"/><stop offset="1" stopColor="#b7cce7"/></linearGradient></defs>
    <DimensionLine x1={x0} y1={80} x2={x0+fw} y2={80} text={`${element.width} mm`} vertical={false}/>
    <DimensionLine x1={x0-55} y1={y0} x2={x0-55} y2={y0+fh} text={`${element.height} mm`} vertical/>
    <rect x={x0} y={y0} width={fw} height={fh} rx="4" className="outer-frame"/>
    {element.rows.map((_,r)=>element.columns.map((_,c)=>{
      const i=r*element.columns.length+c;
      const x=colStarts[c],y=rowStarts[r],w=colPx[c],h=rowPx[r];
      return <g key={i} onClick={()=>onSelect(i)} className="svg-cell" role="button">
        <rect x={x+frame/2} y={y+frame/2} width={Math.max(1,w-frame)} height={Math.max(1,h-frame)} className={i===selectedCell?"glass-cell selected":"glass-cell"}/>
        <OpeningSymbol type={element.cells[i]?.type||"fixed"} x={x+18} y={y+18} w={Math.max(10,w-36)} h={Math.max(10,h-36)}/>
        <text x={x+w/2} y={y+h-14} textAnchor="middle" className="cell-label">V{i+1}</text>
      </g>
    }))}
    {colStarts.slice(1).map((x,i)=><rect key={`v-${i}`} x={x-frame/2} y={y0} width={frame} height={fh} className="frame-divider"/>)}
    {rowStarts.slice(1).map((y,i)=><rect key={`h-${i}`} x={x0} y={y-frame/2} width={fw} height={frame} className="frame-divider"/>)}
    {element.columns.map((v,i)=><g key={`cw-${i}`}><line x1={colStarts[i]} y1={y0+fh+45} x2={colStarts[i]+colPx[i]} y2={y0+fh+45} className="sub-dim-line"/><line x1={colStarts[i]} y1={y0+fh+36} x2={colStarts[i]} y2={y0+fh+54} className="sub-dim-line"/><line x1={colStarts[i]+colPx[i]} y1={y0+fh+36} x2={colStarts[i]+colPx[i]} y2={y0+fh+54} className="sub-dim-line"/><text x={colStarts[i]+colPx[i]/2} y={y0+fh+78} textAnchor="middle" className="sub-dim-text">{v}</text></g>)}
    {element.rows.map((v,i)=><g key={`rh-${i}`}><line x1={x0+fw+36} y1={rowStarts[i]} x2={x0+fw+36} y2={rowStarts[i]+rowPx[i]} className="sub-dim-line"/><line x1={x0+fw+27} y1={rowStarts[i]} x2={x0+fw+45} y2={rowStarts[i]} className="sub-dim-line"/><line x1={x0+fw+27} y1={rowStarts[i]+rowPx[i]} x2={x0+fw+45} y2={rowStarts[i]+rowPx[i]} className="sub-dim-line"/><text x={x0+fw+55} y={rowStarts[i]+rowPx[i]/2+5} className="sub-dim-text">{v}</text></g>)}
  </svg></div>;
}

function DimensionLine({x1,y1,x2,y2,text,vertical}){return <g><line x1={x1} y1={y1} x2={x2} y2={y2} className="main-dim-line"/>{vertical?<><line x1={x1-10} y1={y1} x2={x1+10} y2={y1} className="main-dim-line"/><line x1={x2-10} y1={y2} x2={x2+10} y2={y2} className="main-dim-line"/><text x={x1-18} y={(y1+y2)/2} textAnchor="middle" transform={`rotate(-90 ${x1-18} ${(y1+y2)/2})`} className="main-dim-text">{text}</text></>:<><line x1={x1} y1={y1-10} x2={x1} y2={y1+10} className="main-dim-line"/><line x1={x2} y1={y2-10} x2={x2} y2={y2+10} className="main-dim-line"/><text x={(x1+x2)/2} y={y1-18} textAnchor="middle" className="main-dim-text">{text}</text></>}</g>}

function OpeningSymbol({type,x,y,w,h}){
  const cx=x+w/2,cy=y+h/2;
  const stroke="#294a70";
  if(type==="fixed") return <rect x={x+10} y={y+10} width={Math.max(0,w-20)} height={Math.max(0,h-20)} fill="none" stroke={stroke} strokeWidth="4" rx="2"/>;
  if(type==="panel") return <g><rect x={x+8} y={y+8} width={Math.max(0,w-16)} height={Math.max(0,h-16)} fill="#d7d2c4" stroke="#5a5b55" strokeWidth="4"/><line x1={x+8} y1={cy} x2={x+w-8} y2={cy} stroke="#9d9a8e" strokeWidth="3"/></g>;
  if(type.startsWith("door")){
    const left=type.endsWith("left");
    const hingeX=left?x+w-12:x+12;
    const handleX=left?x+28:x+w-28;
    return <g><rect x={x+10} y={y+8} width={Math.max(0,w-20)} height={Math.max(0,h-16)} fill="none" stroke={stroke} strokeWidth="4"/><line x1={hingeX} y1={y+12} x2={handleX} y2={cy} stroke={stroke} strokeWidth="4"/><line x1={hingeX} y1={y+h-12} x2={handleX} y2={cy} stroke={stroke} strokeWidth="4"/><rect x={handleX-3} y={cy-15} width="6" height="30" rx="3" fill="#20221e"/><circle cx={handleX} cy={cy} r="5" fill="#20221e"/></g>;
  }
  if(type.startsWith("sliding")){
    const right=type.endsWith("right");
    return <g><rect x={x+10} y={y+10} width={Math.max(0,w-20)} height={Math.max(0,h-20)} fill="none" stroke={stroke} strokeWidth="4"/><line x1={right?x+24:x+w-24} y1={cy} x2={right?x+w-24:x+24} y2={cy} stroke={stroke} strokeWidth="5"/><polyline points={right?`${x+w-38},${cy-12} ${x+w-24},${cy} ${x+w-38},${cy+12}`:`${x+38},${cy-12} ${x+24},${cy} ${x+38},${cy+12}`} fill="none" stroke={stroke} strokeWidth="5"/></g>;
  }
  const left=type.endsWith("left");
  const turn=type.includes("turn");
  const tilt=type.includes("tilt");
  return <g><rect x={x+10} y={y+10} width={Math.max(0,w-20)} height={Math.max(0,h-20)} fill="none" stroke={stroke} strokeWidth="4"/>{turn&&<><line x1={left?x+w-12:x+12} y1={y+12} x2={left?x+12:x+w-12} y2={cy} stroke={stroke} strokeWidth="4"/><line x1={left?x+w-12:x+12} y1={y+h-12} x2={left?x+12:x+w-12} y2={cy} stroke={stroke} strokeWidth="4"/></>}{tilt&&<><line x1={x+12} y1={y+12} x2={cx} y2={y+h-12} stroke={stroke} strokeWidth="4"/><line x1={x+w-12} y1={y+12} x2={cx} y2={y+h-12} stroke={stroke} strokeWidth="4"/></>}</g>;
}

function TypeMiniIcon({type}){return <span className={`mini-type ${type}`}><i></i></span>}

function Field({label,children}){return <label className="field"><span>{label}</span>{children}</label>}

function BottomNav({screen,onHome,onProjects,onDraw}){return <nav className="bottom-nav"><button className={screen==="projects"?"active":""} onClick={onHome}><Home/><span>Home</span></button><button className={screen==="project"?"active":""} onClick={onProjects}><FolderOpen/><span>Projecten</span></button><button className={screen==="element"?"active":""} onClick={onDraw}><Grid2X2/><span>Tekenen</span></button><button><Images/><span>Foto's</span></button><button><Menu/><span>Meer</span></button></nav>}

createRoot(document.getElementById("root")).render(<App/>);
