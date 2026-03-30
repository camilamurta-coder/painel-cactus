import { useState, useMemo, useEffect } from "react";

const SHEETS_URL = "/.netlify/functions/dados";

const STATUS_CONFIG = {
  "ALOCADO":      { color: "#39B54A", bg: "#EAF3DE", label: "Alocado" },
  "PENDENTE":     { color: "#888780", bg: "#F1EFE8", label: "Pendente" },
  "REALIZADO":    { color: "#2D54C9", bg: "#E6F1FB", label: "Realizado" },
  "AGENDADO":     { color: "#FEAE00", bg: "#FAEEDA", label: "Agendado" },
  "CONCLUÍDO":    { color: "#39B54A", bg: "#EAF3DE", label: "Concluído" },
  "NÃO INICIADO": { color: "#E24B4A", bg: "#FCEBEB", label: "Não iniciado" },
  "SOLICITADO":   { color: "#FEAE00", bg: "#FAEEDA", label: "Solicitado" },
  "POVOANDO":     { color: "#2D54C9", bg: "#E6F1FB", label: "Povoando" },
  "FINALIZADA":   { color: "#39B54A", bg: "#EAF3DE", label: "Finalizada" },
  "ONLINE":       { color: "#2D54C9", bg: "#E6F1FB", label: "Online" },
  "FÍSICA":       { color: "#884FCB", bg: "#EEEDFE", label: "Física" },
  "EM ANDAMENTO": { color: "#2D54C9", bg: "#E6F1FB", label: "Em andamento" },
};

const STEPS = ["gestor","embarque","lms","avSond"];
const STATUS_OPTS = ["ALOCADO","PENDENTE","REALIZADO","AGENDADO","CONCLUÍDO","NÃO INICIADO","SOLICITADO","POVOANDO","FINALIZADA"];
const CONSULTORES = ["André","Fernando","Mari","Marcos","Mariene"];
const UFS = ["CE","MA","ES","PB","BA","PE"];

const ETAPA_FILTROS = [
  { key: "todos",    label: "Todas etapas" },
  { key: "gestor",   label: "Gestor pendente",      fn: r => r.gestor === "PENDENTE" },
  { key: "embarque", label: "Embarque pendente",     fn: r => r.embarque === "PENDENTE" },
  { key: "lms",      label: "LMS não iniciado",      fn: r => r.lms === "NÃO INICIADO" },
  { key: "avSond",   label: "Av. sondagem pendente", fn: r => r.avSond === "PENDENTE" },
  { key: "inadimp",  label: "Com saldo negativo",    fn: r => r.saldo < 0 },
];

function Badge({ value }) {
  if (!value) return <span style={{color:"#aaa",fontSize:12}}>—</span>;
  const cfg = STATUS_CONFIG[value] || { color:"#888", bg:"#eee", label:value };
  return (
    <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:500, background:cfg.bg, color:cfg.color, whiteSpace:"nowrap" }}>
      {cfg.label}
    </span>
  );
}

function SaudeBadge({ value }) {
  const cfg = {
    "SAUDÁVEL":     { bg:"#D4EDDA", color:"#155724" },
    "ATENÇÃO":      { bg:"#FFF3CD", color:"#856404" },
    "CRÍTICO":      { bg:"#FDECEA", color:"#A32D2D" },
    "INADIMPLENTE": { bg:"#EEEDFE", color:"#3C3489" },
  };
  if (!value) return <span style={{color:"#aaa",fontSize:12}}>—</span>;
  const c = cfg[value] || { bg:"#eee", color:"#888" };
  return (
    <span style={{ display:"inline-block", padding:"2px 8px", borderRadius:4, fontSize:11, fontWeight:500, background:c.bg, color:c.color, whiteSpace:"nowrap" }}>
      {value}
    </span>
  );
}

function ProgressBar({ pct }) {
  const color = pct===100 ? "#39B54A" : pct>=50 ? "#FEAE00" : "#E24B4A";
  return (
    <div style={{display:"flex",alignItems:"center",gap:6}}>
      <div style={{flex:1,height:6,background:"#eee",borderRadius:3,overflow:"hidden"}}>
        <div style={{height:"100%",width:pct+"%",background:color,borderRadius:3}}/>
      </div>
      <span style={{fontSize:11,color,fontWeight:500,minWidth:28}}>{pct}%</span>
    </div>
  );
}

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{ background:"#f5f5f3", borderRadius:8, padding:"12px 16px", minWidth:100 }}>
      <div style={{fontSize:12, color:"#888780", marginBottom:4}}>{label}</div>
      <div style={{fontSize:22, fontWeight:500, color: color||"#2c2c2a"}}>{value}</div>
      {sub && <div style={{fontSize:11,color:"#888780",marginTop:2}}>{sub}</div>}
    </div>
  );
}

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [view, setView] = useState("cidades");
  const [filterUF, setFilterUF] = useState("Todos");
  const [filterConsultor, setFilterConsultor] = useState("Todos");
  const [filterEtapa, setFilterEtapa] = useState("todos");
  const [sortCol, setSortCol] = useState("cidade");
  const [sortDir, setSortDir] = useState("asc");

  const carregarDados = () => {
    setLoading(true);
    setErro(null);
    fetch(SHEETS_URL + "?t=" + Date.now())
      .then(r => r.json())
      .then(json => {
        const cidades = (json.cidades || []).map((c, i) => ({
          id:               i + 1,
          cidade:           c.cidade || "",
          uf:               c.uf || "",
          consultor:        c.consultor || "",
          gestor:           c.gestor || "ALOCADO",
          embarque:         c.embarque || "PENDENTE",
          lms:              c.lms || "NÃO INICIADO",
          avSond:           c.avSond || "PENDENTE",
          avSondTipo:       c.avSondTipo || "",
          saldo:            parseFloat(c.saldo) || 0,
          vigência:         c.data_fim || "",
          status_orcamento: c.status_orcamento || "",
          margem_pct:       parseFloat(c.margem_pct) || 0,
          alerta_vigencia:  c.alerta_vigencia || "",
          progresso_pct:    parseFloat(c.progresso_pct) || 0,
        }));
        setData(cidades);
        setLastUpdate(new Date().toLocaleTimeString("pt-BR"));
        setLoading(false);
      })
      .catch(() => {
        setErro("Não foi possível carregar os dados da planilha.");
        setLoading(false);
      });
  };

  useEffect(() => { carregarDados(); }, []);

  const totalSaldo = data.reduce((a,c)=>a+c.saldo,0);

  // Embarques ok: CONCLUÍDO (igual ao critério do Sheets)
  const embarquesOk = data.filter(c => c.embarque === "CONCLUÍDO").length;

  // LMS ok: CONCLUÍDO (igual ao KPI do Sheets)
  const lmsOk = data.filter(c => c.lms === "CONCLUÍDO").length;

  const margemMedia = data.length > 0
    ? Math.round(data.reduce((a,c)=>a+(100-(c.margem_pct||0)),0)/data.length)
    : 0;

  const handleSort = col => {
    if(sortCol===col) setSortDir(d=>d==="asc"?"desc":"asc");
    else { setSortCol(col); setSortDir("asc"); }
  };

  const filtered = useMemo(()=>{
    const etapaFn = ETAPA_FILTROS.find(e=>e.key===filterEtapa)?.fn;
    let d = [...data];
    if(filterUF!=="Todos") d=d.filter(r=>r.uf===filterUF);
    if(filterConsultor!=="Todos") d=d.filter(r=>r.consultor===filterConsultor);
    if(etapaFn) d=d.filter(etapaFn);
    d.sort((a,b)=>{
      let av=a[sortCol], bv=b[sortCol];
      if(sortCol==="progresso"){
        const pct=r=>STEPS.filter(s=>["REALIZADO","CONCLUÍDO","ALOCADO","FINALIZADA","POVOANDO"].includes(r[s])).length;
        av=pct(a); bv=pct(b);
      }
      if(typeof av==="number"&&typeof bv==="number") return sortDir==="asc"?av-bv:bv-av;
      return sortDir==="asc"
        ? String(av||"").localeCompare(String(bv||""))
        : String(bv||"").localeCompare(String(av||""));
    });
    return d;
  },[data,filterUF,filterConsultor,filterEtapa,sortCol,sortDir]);

  const thS = col => ({
    padding:"8px 10px", textAlign:"left", fontSize:11, fontWeight:500,
    color:"#888780", cursor:"pointer", userSelect:"none", whiteSpace:"nowrap",
    borderBottom:"1px solid #e5e5e3",
    background:sortCol===col?"#f5f5f3":"transparent"
  });
  const tdS = { padding:"8px 10px", fontSize:12, borderBottom:"1px solid #e5e5e3", verticalAlign:"middle" };
  const sortIcon = col => sortCol===col?(sortDir==="asc"?" ↑":" ↓"):"";

  if (loading) return (
    <div style={{fontFamily:"system-ui,sans-serif",padding:"48px 24px",textAlign:"center",color:"#888780"}}>
      <div style={{fontSize:32,marginBottom:12}}>⟳</div>
      <div style={{fontSize:14}}>Carregando dados da planilha...</div>
    </div>
  );

  if (erro) return (
    <div style={{fontFamily:"system-ui,sans-serif",padding:"48px 24px",textAlign:"center"}}>
      <div style={{fontSize:14,color:"#A32D2D",marginBottom:16}}>{erro}</div>
      <button onClick={carregarDados} style={{fontSize:13,padding:"8px 16px",borderRadius:8,border:"1px solid #e5e5e3",cursor:"pointer"}}>
        Tentar novamente
      </button>
    </div>
  );

  return (
    <div style={{fontFamily:"system-ui,sans-serif",padding:"24px",maxWidth:1200,margin:"0 auto",background:"#fff",minHeight:"100vh"}}>

      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:24}}>
        <div style={{width:36,height:36,background:"#39B54A",borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <span style={{color:"white",fontSize:18,fontWeight:700}}>✦</span>
        </div>
        <div>
          <div style={{fontWeight:600,fontSize:18,color:"#2c2c2a"}}>Painel de Implementação Cactus</div>
          <div style={{fontSize:12,color:"#888780"}}>Ciclo 2026 · {data.length} municípios · atualizado às {lastUpdate}</div>
        </div>
        <button onClick={carregarDados} style={{marginLeft:"auto",fontSize:12,padding:"6px 12px",borderRadius:6,border:"1px solid #e5e5e3",background:"#fff",cursor:"pointer",color:"#888780"}}>
          ↻ Atualizar
        </button>
      </div>

      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:10,marginBottom:24}}>
        <StatCard label="Total municípios"   value={data.length}/>
        <StatCard label="Embarques ok"       value={embarquesOk}  color="#39B54A" sub={`de ${data.length}`}/>
        <StatCard label="LMS ok"             value={lmsOk}        color="#2D54C9" sub={`de ${data.length}`}/>
        <StatCard label="Margem média"       value={margemMedia+"%"} color={margemMedia<20?"#A32D2D":margemMedia<40?"#856404":"#155724"}/>
        <StatCard label="Saldo total"        value={"R$"+totalSaldo.toLocaleString("pt-BR")} color={totalSaldo<0?"#E24B4A":"#39B54A"}/>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,marginBottom:20,borderBottom:"1px solid #e5e5e3"}}>
        {[["cidades","Por cidade"],["consultores","Por consultor"]].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)} style={{
            padding:"8px 16px",fontSize:13,fontWeight:view===k?600:400,
            border:"none",background:"transparent",cursor:"pointer",
            borderBottom:view===k?"2px solid #39B54A":"2px solid transparent",
            color:view===k?"#39B54A":"#888780"
          }}>{l}</button>
        ))}
      </div>

      {view==="consultores" && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:12}}>
          {CONSULTORES.map(name=>{
            const cids=data.filter(r=>r.consultor===name);
            const colors={André:"#39B54A",Fernando:"#2D54C9",Mari:"#FEAE00",Marcos:"#EF400E",Mariene:"#884FCB"};
            const col=colors[name]||"#888";
            return (
              <div key={name} style={{background:"#fff",border:"1px solid #e5e5e3",borderRadius:12,padding:"16px",display:"flex",flexDirection:"column",gap:12}}>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{width:40,height:40,borderRadius:"50%",background:col+"22",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600,fontSize:14,color:col}}>{name.slice(0,2).toUpperCase()}</div>
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>{name}</div>
                    <div style={{fontSize:12,color:"#888780"}}>{cids.length} municípios</div>
                  </div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                  {[
                    [cids.filter(c=>c.embarque==="PENDENTE").length,"embarques pend.","#E24B4A"],
                    [cids.filter(c=>c.lms==="CONCLUÍDO").length,"LMS ok","#39B54A"],
                    [cids.filter(c=>c.saldo<0).length,"saldo negativo",cids.filter(c=>c.saldo<0).length>0?"#E24B4A":"#39B54A"],
                  ].map(([v,l,c])=>(
                    <div key={l} style={{textAlign:"center"}}>
                      <div style={{fontSize:20,fontWeight:600,color:c}}>{v}</div>
                      <div style={{fontSize:10,color:"#888780"}}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view==="cidades" && <>
        {/* Filtros de etapa */}
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:600,color:"#888780",marginBottom:6,letterSpacing:"0.05em"}}>FILTRO RÁPIDO POR ETAPA</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {ETAPA_FILTROS.map(e=>{
              const count=e.fn?data.filter(e.fn).length:data.length;
              const ativo=filterEtapa===e.key;
              return (
                <button key={e.key} onClick={()=>setFilterEtapa(e.key)} style={{
                  fontSize:12,padding:"5px 12px",borderRadius:20,
                  border:ativo?"none":"1px solid #e5e5e3",
                  background:ativo?"#39B54A":"#fff",
                  color:ativo?"white":"#888780",cursor:"pointer",
                  display:"flex",alignItems:"center",gap:5
                }}>
                  {e.label}
                  <span style={{fontSize:10,padding:"1px 5px",borderRadius:10,background:ativo?"rgba(255,255,255,0.25)":"#f5f5f3",color:ativo?"white":"#888780",fontWeight:600}}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filtros secundários */}
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14,alignItems:"center"}}>
          {[["UF",UFS,filterUF,setFilterUF],["Consultor",CONSULTORES,filterConsultor,setFilterConsultor]].map(([label,opts,val,set])=>(
            <div key={label} style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontSize:12,color:"#888780"}}>{label}</span>
              <select value={val} onChange={e=>set(e.target.value)} style={{fontSize:12,padding:"4px 8px",borderRadius:6,border:"1px solid #e5e5e3",background:"#fff",color:"#2c2c2a"}}>
                <option value="Todos">Todos</option>
                {opts.map(o=><option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div style={{display:"flex",alignItems:"center",gap:6,marginLeft:"auto"}}>
            <span style={{fontSize:12,color:"#888780"}}>Ordenar</span>
            {[["cidade","A–Z"],["saldo","Saldo"],["progresso","Progresso"]].map(([col,lbl])=>(
              <button key={col} onClick={()=>handleSort(col)} style={{
                fontSize:11,padding:"4px 10px",borderRadius:6,
                border:"1px solid #e5e5e3",
                background:sortCol===col?"#2c2c2a":"#fff",
                color:sortCol===col?"white":"#888780",cursor:"pointer"
              }}>{lbl}{sortIcon(col)}</button>
            ))}
          </div>
          <span style={{fontSize:12,color:"#888780"}}>{filtered.length} resultados</span>
        </div>

        {/* Tabela */}
        <div style={{overflowX:"auto",borderRadius:8,border:"1px solid #e5e5e3"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:800}}>
            <thead>
              <tr style={{background:"#f5f5f3"}}>
                {[["cidade","Cidade"],["uf","UF"],["consultor","Consultor"]].map(([col,lbl])=>(
                  <th key={col} style={thS(col)} onClick={()=>handleSort(col)}>{lbl}{sortIcon(col)}</th>
                ))}
                <th style={thS("gestor")}>Gestor</th>
                <th style={thS("embarque")}>Embarque</th>
                <th style={thS("lms")}>LMS</th>
                <th style={thS("avSond")}>Av. Sondagem</th>
                <th style={thS("progresso")} onClick={()=>handleSort("progresso")}>Progresso{sortIcon("progresso")}</th>
                <th style={thS("saldo")} onClick={()=>handleSort("saldo")}>Saldo{sortIcon("saldo")}</th>
                <th style={{...thS(""),minWidth:90}}>Vigência</th>
                <th style={thS("status_orcamento")}>Saúde</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row,i)=>{
                const saldoColor=row.saldo<0?"#E24B4A":row.saldo===0?"#888780":"#39B54A";

                // Alerta de vigência vindo da planilha
                const alerta = row.alerta_vigencia;
                const alertaColor = alerta==="VENCIDO"?"#3C3489":alerta==="ENVIAR OFÍCIO"?"#A32D2D":alerta==="REUNIÃO DE RESULTADO"?"#856404":"#888780";
                const alertaBg   = alerta==="VENCIDO"?"#EEEDFE":alerta==="ENVIAR OFÍCIO"?"#FDECEA":alerta==="REUNIÃO DE RESULTADO"?"#FFF3CD":"transparent";

                return (
                  <tr key={row.id} style={{background:i%2===0?"#fff":"#fafaf8"}}>
                    <td style={{...tdS,fontWeight:600}}>{row.cidade}</td>
                    <td style={tdS}><span style={{fontSize:11,padding:"2px 6px",borderRadius:4,background:"#f5f5f3",fontWeight:600}}>{row.uf}</span></td>
                    <td style={{...tdS,color:"#888780"}}>{row.consultor}</td>
                    <td style={tdS}><Badge value={row.gestor}/></td>
                    <td style={tdS}><Badge value={row.embarque}/></td>
                    <td style={tdS}><Badge value={row.lms}/></td>
                    <td style={tdS}>
                      <div style={{display:"flex",flexDirection:"column",gap:3}}>
                        <Badge value={row.avSond}/>
                        {row.avSondTipo&&<Badge value={row.avSondTipo}/>}
                      </div>
                    </td>
                    <td style={{...tdS,minWidth:100}}><ProgressBar pct={row.progresso_pct}/></td>
                    <td style={{...tdS,color:saldoColor,fontWeight:600,fontSize:12}}>
                      {row.saldo===0?"—":"R$"+Math.round(row.saldo).toLocaleString("pt-BR")}
                    </td>
                    <td style={{...tdS,fontSize:11,minWidth:90}}>
                      <div style={{display:"flex",flexDirection:"column",gap:3}}>
                        <span style={{color:"#888780"}}>{row.vigência||"—"}</span>
                        {alerta&&(
                          <span style={{fontSize:10,padding:"1px 5px",borderRadius:3,background:alertaBg,color:alertaColor,fontWeight:600}}>
                            {alerta}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={tdS}><SaudeBadge value={row.status_orcamento}/></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{marginTop:10,fontSize:11,color:"#888780"}}>
          Dados carregados da planilha Google Sheets em tempo real.
        </div>
      </>}
    </div>
  );
}
