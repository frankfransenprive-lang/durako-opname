import React, { useMemo, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  Plus, Save, Trash2, ChevronLeft, Copy, Camera, FileDown,
  DoorOpen, Ruler, Grid2X2, FolderOpen, Settings2
} from "lucide-react";
import { WAD_PROFILES, ELEMENT_TYPES } from "./data/wadCatalog";
import "./styles.css";

const STORAGE_KEY = "durako-opname-v1";

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
  colorOutside: "Wit",
  location: "",
  notes: "",
  columns: [1000, 1000],
  rows: [1500],
  cells: [
    { type: "fixed" },
    { type: "tilt-turn-right" }
  ]
});

const defaultProject = () => ({
  id: uid("project"),
  name: "Nieuw project",
  customer: "",
  address: "",
  city: "",
  reference: "",
  elements: [defaultElement()]
});

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const p = defaultProject();
  return { projects: [p], activeProjectId: p.id, activeElementId: p.elements[0].id };
}

function normalizeParts(parts, total) {
  if (!parts.length) return [total];
  const current = parts.reduce((a,b)=>a+b,0);
  if (current <= 0) return parts.map((_,i)=> i === parts.length-1 ? total : 0);
  const scaled = parts.map(v => Math.round((v/current)*total));
  const diff = total - scaled.reduce((a,b)=>a+b,0);
  scaled[scaled.length-1] += diff;
  return scaled;
}

function App() {
  const [state, setState] = useState(loadState);
  const [screen, setScreen] = useState("projects");

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const project = state.projects.find(p => p.id === state.activeProjectId) || state.projects[0];
  const element = project?.elements.find(e => e.id === state.activeElementId) || project?.elements[0];

  const setProject = (updater) => {
    setState(s => ({
      ...s,
      projects: s.projects.map(p => p.id === project.id ? updater(p) : p)
    }));
  };

  const updateElement = (patch) => {
    setProject(p => ({
      ...p,
      elements: p.elements.map(e => e.id === element.id ? { ...e, ...patch } : e)
    }));
  };

  const addProject = () => {
    const p = defaultProject();
    setState(s => ({...s, projects: [...s.projects, p], activeProjectId: p.id, activeElementId: p.elements[0].id}));
    setScreen("project");
  };

  const addElement = () => {
    const idx = project.elements.length + 1;
    const e = {...defaultElement(), code: `K${String(idx).padStart(2,"0")}`};
    setProject(p => ({...p, elements: [...p.elements, e]}));
    setState(s => ({...s, activeElementId: e.id}));
    setScreen("element");
  };

  const duplicateElement = () => {
    const copy = {
      ...JSON.parse(JSON.stringify(element)),
      id: uid("element"),
      code: `${element.code}-KOPIE`
    };
    setProject(p => ({...p, elements: [...p.elements, copy]}));
    setState(s => ({...s, activeElementId: copy.id}));
  };

  const deleteElement = () => {
    if (project.elements.length <= 1) return alert("Een project moet minimaal één positie houden.");
    const next = project.elements.filter(e => e.id !== element.id);
    setProject(p => ({...p, elements: next}));
    setState(s => ({...s, activeElementId: next[0].id}));
    setScreen("project");
  };

  const updateGridCount = (axis, count) => {
    count = Math.max(1, Math.min(6, Number(count) || 1));
    if (axis === "columns") {
      const columns = Array.from({length: count}, (_,i) => element.columns[i] ?? Math.round(element.width/count));
      const normalized = normalizeParts(columns, element.width);
      const cells = Array.from({length: count * element.rows.length}, (_,i) => element.cells[i] || {type:"fixed"});
      updateElement({columns: normalized, cells});
    } else {
      const rows = Array.from({length: count}, (_,i) => element.rows[i] ?? Math.round(element.height/count));
      const normalized = normalizeParts(rows, element.height);
      const cells = Array.from({length: element.columns.length * count}, (_,i) => element.cells[i] || {type:"fixed"});
      updateElement({rows: normalized, cells});
    }
  };

  const updateTotalSize = (axis, value) => {
    value = Math.max(1, Number(value) || 1);
    if (axis === "width") {
      updateElement({width:value, columns:normalizeParts(element.columns, value)});
    } else {
      updateElement({height:value, rows:normalizeParts(element.rows, value)});
    }
  };

  const updatePart = (axis, index, value) => {
    const arr = [...element[axis]];
    arr[index] = Math.max(1, Number(value) || 1);
    updateElement({[axis]: arr});
  };

  const autoFit = (axis) => {
    if (axis === "columns") updateElement({columns: normalizeParts(element.columns, element.width)});
    else updateElement({rows: normalizeParts(element.rows, element.height)});
  };

  const updateCell = (index, patch) => {
    const cells = element.cells.map((c,i)=>i===index?{...c,...patch}:c);
    updateElement({cells});
  };

  if (screen === "projects") {
    return <ProjectsScreen state={state} onAdd={addProject} onOpen={(p)=>{
      setState(s=>({...s, activeProjectId:p.id, activeElementId:p.elements[0]?.id}));
      setScreen("project");
    }} />;
  }

  if (!project) return null;

  if (screen === "project") {
    return <ProjectScreen
      project={project}
      onBack={()=>setScreen("projects")}
      onChange={(patch)=>setProject(p=>({...p,...patch}))}
      onAddElement={addElement}
      onOpenElement={(e)=>{setState(s=>({...s,activeElementId:e.id})); setScreen("element");}}
    />;
  }

  return <ElementScreen
    project={project}
    element={element}
    onBack={()=>setScreen("project")}
    updateElement={updateElement}
    updateGridCount={updateGridCount}
    updateTotalSize={updateTotalSize}
    updatePart={updatePart}
    autoFit={autoFit}
    updateCell={updateCell}
    duplicateElement={duplicateElement}
    deleteElement={deleteElement}
  />;
}

function Header({title, subtitle, onBack}) {
  return <header className="topbar">
    <div className="topbar-inner">
      {onBack ? <button className="icon-button ghost" onClick={onBack}><ChevronLeft size={22}/></button> : <div className="brand-mark">D</div>}
      <div className="title-wrap">
        <div className="title">{title}</div>
        {subtitle && <div className="subtitle">{subtitle}</div>}
      </div>
      <div className="save-pill"><Save size={15}/> Automatisch</div>
    </div>
  </header>
}

function ProjectsScreen({state,onAdd,onOpen}) {
  return <div className="app">
    <Header title="Durako Opname" subtitle="Kozijnen & deuren inmeten"/>
    <main className="page">
      <div className="section-heading">
        <div>
          <h1>Projecten</h1>
          <p>Open een project of start een nieuwe opname.</p>
        </div>
        <button className="primary" onClick={onAdd}><Plus size={18}/> Nieuw project</button>
      </div>
      <div className="project-grid">
        {state.projects.map(p=><button key={p.id} className="project-card" onClick={()=>onOpen(p)}>
          <div className="card-icon"><FolderOpen/></div>
          <div className="project-info">
            <strong>{p.name || "Naamloos project"}</strong>
            <span>{p.customer || "Nog geen klant"}{p.city ? ` · ${p.city}` : ""}</span>
            <small>{p.elements.length} positie{p.elements.length === 1 ? "" : "s"}</small>
          </div>
        </button>)}
      </div>
    </main>
  </div>
}

function ProjectScreen({project,onBack,onChange,onAddElement,onOpenElement}) {
  return <div className="app">
    <Header title={project.name || "Project"} subtitle={project.customer || "Projectgegevens"} onBack={onBack}/>
    <main className="page">
      <div className="two-col">
        <section className="panel">
          <h2>Projectgegevens</h2>
          <Field label="Projectnaam"><input value={project.name} onChange={e=>onChange({name:e.target.value})}/></Field>
          <Field label="Klant"><input value={project.customer} onChange={e=>onChange({customer:e.target.value})}/></Field>
          <Field label="Adres"><input value={project.address} onChange={e=>onChange({address:e.target.value})}/></Field>
          <div className="form-row">
            <Field label="Plaats"><input value={project.city} onChange={e=>onChange({city:e.target.value})}/></Field>
            <Field label="Referentie"><input value={project.reference} onChange={e=>onChange({reference:e.target.value})}/></Field>
          </div>
        </section>

        <section className="panel">
          <div className="panel-title-row">
            <div><h2>Posities</h2><p className="muted">Kozijnen, deuren en schuifpuien</p></div>
            <button className="primary" onClick={onAddElement}><Plus size={18}/> Positie</button>
          </div>
          <div className="element-list">
            {project.elements.map(e=><button className="element-row" key={e.id} onClick={()=>onOpenElement(e)}>
              <div className="element-badge">{e.code}</div>
              <div className="element-row-main">
                <strong>{e.name}</strong>
                <span>{e.width} × {e.height} mm</span>
              </div>
              <ChevronLeft className="rotate-180" size={20}/>
            </button>)}
          </div>
        </section>
      </div>
    </main>
  </div>
}

function ElementScreen({
  project,element,onBack,updateElement,updateGridCount,updateTotalSize,
  updatePart,autoFit,updateCell,duplicateElement,deleteElement
}) {
  const [tab,setTab] = useState("tekening");
  const profile = WAD_PROFILES.find(p=>p.id===element.profileId);

  return <div className="app">
    <Header title={`${element.code} · ${element.name}`} subtitle={project.name} onBack={onBack}/>
    <main className="page element-page">
      <div className="element-toolbar">
        <div className="tabs">
          <button className={tab==="tekening"?"active":""} onClick={()=>setTab("tekening")}><Grid2X2 size={17}/> Tekening</button>
          <button className={tab==="gegevens"?"active":""} onClick={()=>setTab("gegevens")}><Settings2 size={17}/> Gegevens</button>
        </div>
        <div className="toolbar-actions">
          <button className="secondary" onClick={duplicateElement}><Copy size={17}/> Kopiëren</button>
          <button className="danger-light" onClick={deleteElement}><Trash2 size={17}/></button>
        </div>
      </div>

      {tab === "gegevens" ? (
        <section className="panel data-panel">
          <div className="form-row">
            <Field label="Positiecode"><input value={element.code} onChange={e=>updateElement({code:e.target.value})}/></Field>
            <Field label="Omschrijving"><input value={element.name} onChange={e=>updateElement({name:e.target.value})}/></Field>
          </div>
          <Field label="Locatie / ruimte"><input value={element.location} placeholder="Bijv. woonkamer voorgevel" onChange={e=>updateElement({location:e.target.value})}/></Field>
          <div className="form-row">
            <Field label="VEKA / WAD profiel">
              <select value={element.profileId} onChange={e=>updateElement({profileId:e.target.value})}>
                {WAD_PROFILES.map(p=><option key={p.id} value={p.id}>{p.name} — {p.family}</option>)}
              </select>
            </Field>
            <Field label="Glas"><input value={element.glass} onChange={e=>updateElement({glass:e.target.value})}/></Field>
          </div>
          <div className="profile-summary">
            <strong>{profile?.name}</strong>
            <span>{profile?.family} · {profile?.depthMm} mm · {profile?.category}</span>
          </div>
          <div className="form-row">
            <Field label="Kleur binnen"><input value={element.colorInside} onChange={e=>updateElement({colorInside:e.target.value})}/></Field>
            <Field label="Kleur buiten"><input value={element.colorOutside} onChange={e=>updateElement({colorOutside:e.target.value})}/></Field>
          </div>
          <Field label="Opmerkingen"><textarea rows="5" value={element.notes} onChange={e=>updateElement({notes:e.target.value})}/></Field>
        </section>
      ) : (
        <div className="editor-layout">
          <aside className="panel editor-controls">
            <h2>Maatvoering</h2>
            <div className="form-row">
              <Field label="Totale breedte (mm)"><input type="number" value={element.width} onChange={e=>updateTotalSize("width",e.target.value)}/></Field>
              <Field label="Totale hoogte (mm)"><input type="number" value={element.height} onChange={e=>updateTotalSize("height",e.target.value)}/></Field>
            </div>

            <div className="split-control">
              <div>
                <label>Verticale vakken</label>
                <div className="stepper">
                  <button onClick={()=>updateGridCount("columns",element.columns.length-1)}>-</button>
                  <strong>{element.columns.length}</strong>
                  <button onClick={()=>updateGridCount("columns",element.columns.length+1)}>+</button>
                </div>
              </div>
              <div>
                <label>Horizontale vakken</label>
                <div className="stepper">
                  <button onClick={()=>updateGridCount("rows",element.rows.length-1)}>-</button>
                  <strong>{element.rows.length}</strong>
                  <button onClick={()=>updateGridCount("rows",element.rows.length+1)}>+</button>
                </div>
              </div>
            </div>

            <DimensionEditor title="Vakken breedte" items={element.columns} onChange={(i,v)=>updatePart("columns",i,v)} onFit={()=>autoFit("columns")}/>
            <DimensionEditor title="Vakken hoogte" items={element.rows} onChange={(i,v)=>updatePart("rows",i,v)} onFit={()=>autoFit("rows")}/>

            <div className="hint">
              <Ruler size={18}/>
              Vakmaten hoeven tijdens invoer niet direct exact op te tellen. Gebruik <strong>Verdelen</strong> om ze weer passend te maken.
            </div>
          </aside>

          <section className="panel drawing-panel">
            <div className="drawing-header">
              <div>
                <h2>Technische tekening</h2>
                <p>{element.width} × {element.height} mm · buitenaanzicht</p>
              </div>
              <div className="profile-chip">{profile?.family}</div>
            </div>
            <FrameDrawing element={element}/>
            <div className="cell-config-grid">
              {element.cells.map((cell,i)=>{
                const col = i % element.columns.length;
                const row = Math.floor(i/element.columns.length);
                return <div className="cell-config" key={i}>
                  <div className="cell-label">Vak {i+1} · {element.columns[col]} × {element.rows[row]} mm</div>
                  <select value={cell.type} onChange={e=>updateCell(i,{type:e.target.value})}>
                    {ELEMENT_TYPES.map(t=><option value={t.id} key={t.id}>{t.label}</option>)}
                  </select>
                </div>
              })}
            </div>
          </section>
        </div>
      )}
    </main>
  </div>
}

function DimensionEditor({title,items,onChange,onFit}) {
  return <div className="dimension-editor">
    <div className="dimension-title"><strong>{title}</strong><button onClick={onFit}>Verdelen</button></div>
    <div className="dimension-list">
      {items.map((v,i)=><label key={i}><span>{i+1}</span><input type="number" value={v} onChange={e=>onChange(i,e.target.value)}/><small>mm</small></label>)}
    </div>
  </div>
}

function Field({label,children}) {
  return <label className="field"><span>{label}</span>{children}</label>
}

function FrameDrawing({element}) {
  const W = 920, H = 600;
  const margin = {left:95,right:55,top:65,bottom:95};
  const availW = W-margin.left-margin.right;
  const availH = H-margin.top-margin.bottom;
  const scale = Math.min(availW/element.width, availH/element.height);
  const drawW = element.width*scale;
  const drawH = element.height*scale;
  const x0 = margin.left + (availW-drawW)/2;
  const y0 = margin.top + (availH-drawH)/2;
  const frame = Math.max(10, Math.min(22, 65*scale));

  const colXs=[x0];
  element.columns.forEach(v=>colXs.push(colXs[colXs.length-1]+v*scale));
  const rowYs=[y0];
  element.rows.forEach(v=>rowYs.push(rowYs[rowYs.length-1]+v*scale));

  return <div className="drawing-wrap">
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Technische kozijntekening">
      <defs>
        <marker id="arrow" markerWidth="7" markerHeight="7" refX="3.5" refY="3.5" orient="auto-start-reverse">
          <path d="M0,0 L7,3.5 L0,7 z" className="dim-arrow"/>
        </marker>
      </defs>

      <rect x={x0} y={y0} width={drawW} height={drawH} className="frame-outline"/>
      {colXs.slice(1,-1).map((x,i)=><rect key={`v${i}`} x={x-frame/2} y={y0} width={frame} height={drawH} className="mullion"/>)}
      {rowYs.slice(1,-1).map((y,i)=><rect key={`h${i}`} x={x0} y={y-frame/2} width={drawW} height={frame} className="mullion"/>)}

      {element.cells.map((cell,i)=>{
        const c = i % element.columns.length;
        const r = Math.floor(i/element.columns.length);
        const x = colXs[c] + (c===0?frame:frame/2);
        const y = rowYs[r] + (r===0?frame:frame/2);
        const x2 = colXs[c+1] - (c===element.columns.length-1?frame:frame/2);
        const y2 = rowYs[r+1] - (r===element.rows.length-1?frame:frame/2);
        return <CellSymbol key={i} type={cell.type} x={x} y={y} w={Math.max(1,x2-x)} h={Math.max(1,y2-y)} index={i}/>;
      })}

      {/* totale maat horizontaal */}
      <line x1={x0} y1={y0-28} x2={x0+drawW} y2={y0-28} className="dim-line" markerStart="url(#arrow)" markerEnd="url(#arrow)"/>
      <line x1={x0} y1={y0-18} x2={x0} y2={y0-40} className="extension"/>
      <line x1={x0+drawW} y1={y0-18} x2={x0+drawW} y2={y0-40} className="extension"/>
      <text x={x0+drawW/2} y={y0-38} textAnchor="middle" className="dim-text total">{element.width} mm</text>

      {/* totale maat verticaal */}
      <line x1={x0-32} y1={y0} x2={x0-32} y2={y0+drawH} className="dim-line" markerStart="url(#arrow)" markerEnd="url(#arrow)"/>
      <line x1={x0-20} y1={y0} x2={x0-44} y2={y0} className="extension"/>
      <line x1={x0-20} y1={y0+drawH} x2={x0-44} y2={y0+drawH} className="extension"/>
      <text x={x0-48} y={y0+drawH/2} textAnchor="middle" className="dim-text total" transform={`rotate(-90 ${x0-48} ${y0+drawH/2})`}>{element.height} mm</text>

      {/* vakbreedtes onder */}
      {element.columns.map((v,i)=>{
        const a=colXs[i], b=colXs[i+1], y=y0+drawH+33;
        return <g key={`cw${i}`}>
          <line x1={a} y1={y} x2={b} y2={y} className="dim-line slim" markerStart="url(#arrow)" markerEnd="url(#arrow)"/>
          <text x={(a+b)/2} y={y+19} textAnchor="middle" className="dim-text">{v}</text>
        </g>
      })}

      {/* vakhoogtes rechts */}
      {element.rows.map((v,i)=>{
        const a=rowYs[i], b=rowYs[i+1], x=x0+drawW+32;
        return <g key={`rh${i}`}>
          <line x1={x} y1={a} x2={x} y2={b} className="dim-line slim" markerStart="url(#arrow)" markerEnd="url(#arrow)"/>
          <text x={x+16} y={(a+b)/2} className="dim-text" dominantBaseline="middle">{v}</text>
        </g>
      })}
    </svg>
  </div>
}

function CellSymbol({type,x,y,w,h,index}) {
  const pad = Math.max(4, Math.min(14, Math.min(w,h)*0.05));
  const ix=x+pad, iy=y+pad, iw=Math.max(2,w-pad*2), ih=Math.max(2,h-pad*2);
  const centerX=ix+iw/2, centerY=iy+ih/2;
  const blueClass = "glass-fill";

  const base = <rect x={x} y={y} width={w} height={h} className={type==="panel"?"panel-fill":blueClass}/>;
  const number = <g><circle cx={x+18} cy={y+18} r="13" className="cell-number-bg"/><text x={x+18} y={y+22} textAnchor="middle" className="cell-number">{index+1}</text></g>;

  if (type === "fixed") return <g>{base}{number}</g>;
  if (type === "panel") return <g>{base}<rect x={ix} y={iy} width={iw} height={ih} className="panel-inner"/>{number}</g>;

  if (type.startsWith("door")) {
    const left = type==="door-left";
    const hingeX = left ? ix : ix+iw;
    const freeX = left ? ix+iw : ix;
    const handleX = left ? ix+iw-12 : ix+12;
    return <g>
      {base}
      <rect x={ix} y={iy} width={iw} height={ih} className="sash"/>
      <line x1={hingeX} y1={iy} x2={freeX} y2={centerY} className="opening"/>
      <line x1={hingeX} y1={iy+ih} x2={freeX} y2={centerY} className="opening"/>
      <circle cx={handleX} cy={centerY} r="5" className="handle"/>
      <line x1={handleX} y1={centerY} x2={handleX+(left?9:-9)} y2={centerY} className="handle-line"/>
      {number}
    </g>;
  }

  if (type.startsWith("sliding")) {
    const left = type==="sliding-left";
    return <g>
      {base}
      <rect x={ix} y={iy} width={iw} height={ih} className="sash"/>
      <line x1={left?ix+iw*0.75:ix+iw*0.25} y1={centerY} x2={left?ix+iw*0.25:ix+iw*0.75} y2={centerY} className="opening arrowline"/>
      <polyline points={left?`${ix+iw*0.3},${centerY-8} ${ix+iw*0.2},${centerY} ${ix+iw*0.3},${centerY+8}`:`${ix+iw*0.7},${centerY-8} ${ix+iw*0.8},${centerY} ${ix+iw*0.7},${centerY+8}`} className="opening"/>
      {number}
    </g>;
  }

  const left = type.includes("left");
  const turn = type.startsWith("turn") || type.startsWith("tilt-turn");
  const tilt = type==="tilt" || type.startsWith("tilt-turn");

  return <g>
    {base}
    <rect x={ix} y={iy} width={iw} height={ih} className="sash"/>
    {turn && <>
      <line x1={left?ix:ix+iw} y1={iy} x2={left?ix+iw:ix} y2={centerY} className="opening"/>
      <line x1={left?ix:ix+iw} y1={iy+ih} x2={left?ix+iw:ix} y2={centerY} className="opening"/>
    </>}
    {tilt && <>
      <line x1={ix} y1={iy} x2={centerX} y2={iy+ih} className="tilt-line"/>
      <line x1={ix+iw} y1={iy} x2={centerX} y2={iy+ih} className="tilt-line"/>
    </>}
    {number}
  </g>;
}

createRoot(document.getElementById("root")).render(<App />);
