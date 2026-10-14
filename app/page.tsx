"use client";

import { useEffect, useMemo, useState } from "react";

type User = { id: string; name: string; email: string; role: "admin" | "watchman" | "resident"; building?: string; flat?: string };
type Visitor = { _id: string; visitorName: string; phone: string; purpose: string; building: string; flat: string; status: string; createdAt: string; entryAt?: string; exitAt?: string; residentId?: string };
type Stats = { total: number; pending: number; approved: number; entered: number; buildings: number; residents: number; watchmen: number };
const labels: Record<string, Record<string,string>> = {
  gu: { dashboard:"ડેશબોર્ડ", visitors:"વિઝિટર્સ", residents:"રહેવાસીઓ", buildings:"બિલ્ડિંગ", logout:"લૉગ આઉટ", welcome:"સોસાયટી સુરક્ષા ડેશબોર્ડ", subtitle:"વિઝિટર પ્રવેશને સુરક્ષિત અને સરળ બનાવો.", total:"આજના વિઝિટર્સ", pending:"મંજૂરી બાકી", approved:"મંજૂર", entered:"અંદર છે", newVisitor:"નવો વિઝિટર", visitorName:"વિઝિટરનું નામ", phone:"મોબાઇલ નંબર", purpose:"આવવાનું કારણ", building:"બિલ્ડિંગ", flat:"ફ્લેટ નંબર", resident:"રહેવાસી", submit:"મંજૂરી માટે મોકલો", recent:"તાજેતરના વિઝિટર્સ", all:"બધા", approve:"મંજૂર કરો", reject:"નકારો", enter:"પ્રવેશ નોંધો", exit:"બહાર નોંધો", status:"સ્થિતિ", actions:"કાર્ય", noVisitors:"હજુ કોઈ વિઝિટર નથી.", login:"લૉગિન", email:"ઈમેઇલ", password:"પાસવર્ડ", signIn:"સાઇન ઇન", role:"ભૂમિકા", name:"નામ", addUser:"યુઝર ઉમેરો", createUser:"યુઝર બનાવો", residentsCount:"રહેવાસીઓ", watchmenCount:"વોચમેન", buildingCount:"બિલ્ડિંગ", export:"CSV ડાઉનલોડ", refresh:"રીફ્રેશ", language:"ભાષા", demoHint:"શરૂઆતમાં Admin એકાઉન્ટ સેટ કરવા README જુઓ." },
  hi: { dashboard:"डैशबोर्ड", visitors:"विज़िटर", residents:"निवासी", buildings:"बिल्डिंग", logout:"लॉग आउट", welcome:"सोसायटी सुरक्षा डैशबोर्ड", subtitle:"विज़िटर प्रवेश को सुरक्षित और आसान बनाएं।", total:"आज के विज़िटर", pending:"अनुमति बाकी", approved:"स्वीकृत", entered:"अंदर हैं", newVisitor:"नया विज़िटर", visitorName:"विज़िटर का नाम", phone:"मोबाइल नंबर", purpose:"आने का कारण", building:"बिल्डिंग", flat:"फ्लैट नंबर", resident:"निवासी", submit:"अनुमति के लिए भेजें", recent:"हाल के विज़िटर", all:"सभी", approve:"स्वीकृत करें", reject:"अस्वीकार करें", enter:"प्रवेश दर्ज करें", exit:"बाहर दर्ज करें", status:"स्थिति", actions:"कार्य", noVisitors:"अभी कोई विज़िटर नहीं।", login:"लॉगिन", email:"ईमेल", password:"पासवर्ड", signIn:"साइन इन", role:"भूमिका", name:"नाम", addUser:"यूज़र जोड़ें", createUser:"यूज़र बनाएं", residentsCount:"निवासी", watchmenCount:"गार्ड", buildingCount:"बिल्डिंग", export:"CSV डाउनलोड", refresh:"रिफ्रेश", language:"भाषा", demoHint:"Admin अकाउंट सेट करने के लिए README देखें." },
  en: { dashboard:"Dashboard", visitors:"Visitors", residents:"Residents", buildings:"Buildings", logout:"Log out", welcome:"Society security dashboard", subtitle:"Make visitor access safer and simpler.", total:"Today's visitors", pending:"Awaiting approval", approved:"Approved", entered:"Currently inside", newVisitor:"New visitor", visitorName:"Visitor name", phone:"Mobile number", purpose:"Purpose of visit", building:"Building", flat:"Flat number", resident:"Resident", submit:"Send for approval", recent:"Recent visitors", all:"All", approve:"Approve", reject:"Reject", enter:"Record entry", exit:"Record exit", status:"Status", actions:"Actions", noVisitors:"No visitors yet.", login:"Login", email:"Email", password:"Password", signIn:"Sign in", role:"Role", name:"Name", addUser:"Add user", createUser:"Create user", residentsCount:"Residents", watchmenCount:"Watchmen", buildingCount:"Buildings", export:"Download CSV", refresh:"Refresh", language:"Language", demoHint:"See README to set up the first Admin account." }
};

export default function Home() {
  const [lang, setLang] = useState("gu");
  const [user, setUser] = useState<User | null>(null);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [stats, setStats] = useState<Stats>({ total:0,pending:0,approved:0,entered:0,buildings:0,residents:0,watchmen:0 });
  const [users, setUsers] = useState<User[]>([]);
  const [tab, setTab] = useState("visitors");
  const [statusFilter, setStatusFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [form, setForm] = useState({ visitorName:"", phone:"", purpose:"Guest visit", building:"", flat:"" });
  const [userForm, setUserForm] = useState({ name:"", email:"", password:"", role:"resident", building:"", flat:"" });
  const t = labels[lang];

  async function api(url:string, options:RequestInit = {}) {
    const res = await fetch(url, { ...options, headers: { "Content-Type":"application/json", ...(options.headers || {}) } });
    const data = await res.json().catch(()=>({}));
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  }
  async function load() {
    try {
      const me = await api("/api/auth/me");
      setUser(me.user);
      const data = await api("/api/visitors");
      setVisitors(data.visitors);
      setStats(data.stats);
      if (me.user.role === "admin") {
        const ud = await api("/api/users");
        setUsers(ud.users);
      }
    } catch (e:any) { if (e.message !== "લોગિન જરૂરી છે / Login required" && e.message !== "Login required") setError(e.message); }
  }
  useEffect(()=>{ load(); },[]);
  async function login(e:React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try { const d = await api("/api/auth/login",{method:"POST",body:JSON.stringify({email,password})}); setUser(d.user); await load(); }
    catch(e:any){setError(e.message);} finally{setBusy(false);}
  }
  async function logout() { await api("/api/auth/logout",{method:"POST"}); setUser(null); setVisitors([]); }
  async function createVisitor(e:React.FormEvent) {
    e.preventDefault(); setBusy(true); setError("");
    try {
      await api("/api/visitors",{method:"POST",body:JSON.stringify(form)});
      setForm({visitorName:"",phone:"",purpose:"Guest visit",building:"",flat:""});
      await load();
    } catch(e:any){setError(e.message);} finally{setBusy(false);}
  }
  async function action(id:string, actionName:string) {
    setError("");
    try { await api(`/api/visitors/${id}/action`,{method:"POST",body:JSON.stringify({action:actionName})}); await load(); }
    catch(e:any){setError(e.message);}
  }
  async function addUser(e:React.FormEvent) {
    e.preventDefault(); setError("");
    try {
      await api("/api/users",{method:"POST",body:JSON.stringify(userForm)});
      setUserForm({name:"",email:"",password:"",role:"resident",building:"",flat:""});
      await load();
    } catch(e:any){setError(e.message);}
  }
  const visibleVisitors = useMemo(()=>visitors.filter(v=>statusFilter==="all"||v.status===statusFilter),[visitors,statusFilter]);
  function exportCsv() {
    const rows = [["Name","Phone","Purpose","Building","Flat","Status","Created At"],...visitors.map(v=>[v.visitorName,v.phone,v.purpose,v.building,v.flat,v.status,v.createdAt])];
    const csv = rows.map(r=>r.map(x=>`"${String(x??"").replace(/"/g,'""')}"`).join(",")).join("\r\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"})); a.download="societysetu-visitors.csv"; a.click(); URL.revokeObjectURL(a.href);
  }
  function whatsapp(v:Visitor) {
    const text = `SocietySetu visitor request: ${v.visitorName}, ${v.phone}, ${v.building}-${v.flat}. Purpose: ${v.purpose}. Please log in to SocietySetu to approve or reject.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank","noopener,noreferrer");
  }

  if (!user) return <main className="login-wrap"><section className="login-card">
    <div className="brand"><div className="logo">⌂</div><div>SocietySetu<div className="subbrand">Visitor Management · સુરક્ષિત સોસાયટી</div></div></div>
    <div className="eyebrow">{t.login}</div><h1>{t.welcome}</h1><p>{t.demoHint}</p>
    {error && <div className="error">{error}</div>}
    <form className="stack" onSubmit={login} style={{marginTop:22}}>
      <label className="field">{t.language}<select value={lang} onChange={e=>setLang(e.target.value)}><option value="gu">ગુજરાતી</option><option value="hi">हिन्दी</option><option value="en">English</option></select></label>
      <label className="field">{t.email}<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username"/></label>
      <label className="field">{t.password}<input type="password" required value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></label>
      <button className="btn" disabled={busy}>{busy?"…":t.signIn}</button>
    </form><div className="footer">Access is restricted to registered society members.</div>
  </section></main>;

  return <div className="shell">
    <header className="topbar"><div className="brand"><div className="logo">⌂</div><div>SocietySetu<div className="subbrand">Visitor Management System</div></div></div>
      <div className="top-actions"><select aria-label={t.language} value={lang} onChange={e=>setLang(e.target.value)}><option value="gu">ગુજરાતી</option><option value="hi">हिन्दी</option><option value="en">English</option></select><span className="muted">{user.name} · {user.role}</span><button className="btn secondary" onClick={logout}>{t.logout}</button></div>
    </header>
    <main className="container">
      <div className="hero"><div><div className="eyebrow">SOCIETY OPERATIONS</div><h1>{t.welcome}</h1><p>{t.subtitle}</p></div><button className="btn secondary" onClick={load}>↻ {t.refresh}</button></div>
      {error && <div className="error">{error}</div>}
      <div className="grid">
        <div className="stat"><div className="stat-label">{t.total}</div><div className="stat-number">{stats.total}</div></div>
        <div className="stat"><div className="stat-label">{t.pending}</div><div className="stat-number">{stats.pending}</div></div>
        <div className="stat"><div className="stat-label">{t.approved}</div><div className="stat-number">{stats.approved}</div></div>
        <div className="stat"><div className="stat-label">{t.entered}</div><div className="stat-number">{stats.entered}</div></div>
      </div>
      <nav className="tabs">
        <button className={`tab ${tab==="visitors"?"active":""}`} onClick={()=>setTab("visitors")}>{t.visitors}</button>
        {user.role==="admin" && <button className={`tab ${tab==="users"?"active":""}`} onClick={()=>setTab("users")}>{t.residents} / {t.buildings}</button>}
      </nav>
      {tab==="visitors" && <div className="layout">
        {(user.role==="watchman"||user.role==="admin") && <section className="panel"><h2>{t.newVisitor}</h2><form onSubmit={createVisitor} className="form-grid">
          <label className="field full">{t.visitorName}<input required maxLength={100} value={form.visitorName} onChange={e=>setForm({...form,visitorName:e.target.value})}/></label>
          <label className="field">{t.phone}<input required type="tel" maxLength={20} value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></label>
          <label className="field">{t.purpose}<input required maxLength={300} value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})}/></label>
          <label className="field">{t.building}<input required value={form.building} onChange={e=>setForm({...form,building:e.target.value})} placeholder="A"/></label>
          <label className="field">{t.flat}<input required value={form.flat} onChange={e=>setForm({...form,flat:e.target.value})} placeholder="302"/></label>
          <div className="field full"><button className="btn" disabled={busy}>{t.submit}</button></div>
        </form><p className="muted" style={{marginTop:12}}>The resident must approve before entry can be recorded.</p></section>}
        <section className="panel"><div className="row-between"><h2>{t.recent}</h2><div className="actions"><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="all">{t.all}</option>{["pending","approved","rejected","entered","exited"].map(s=><option key={s} value={s}>{s}</option>)}</select><button className="btn secondary small" onClick={exportCsv}>{t.export}</button></div></div>
          <div className="table-wrap"><table><thead><tr><th>{t.visitorName}</th><th>{t.building} / {t.flat}</th><th>{t.status}</th><th>{t.actions}</th></tr></thead><tbody>
          {visibleVisitors.map(v=><tr key={v._id}><td><strong>{v.visitorName}</strong><div className="muted">{v.phone}</div><div className="muted">{v.purpose}</div></td><td>{v.building} / {v.flat}</td><td><span className={`status ${v.status}`}>{v.status}</span><div className="muted">{new Date(v.createdAt).toLocaleString()}</div></td><td><div className="actions">
            {user.role==="resident" && v.status==="pending" && <><button className="btn small" onClick={()=>action(v._id,"approve")}>{t.approve}</button><button className="btn danger small" onClick={()=>action(v._id,"reject")}>{t.reject}</button></>}
            {user.role==="watchman" && v.status==="approved" && <button className="btn small" onClick={()=>action(v._id,"enter")}>{t.enter}</button>}
            {user.role==="watchman" && v.status==="entered" && <button className="btn secondary small" onClick={()=>action(v._id,"exit")}>{t.exit}</button>}
            {user.role==="watchman" && v.status==="pending" && <button className="btn secondary small" onClick={()=>whatsapp(v)}>WhatsApp</button>}
          </div></td></tr>)}
          {!visibleVisitors.length && <tr><td colSpan={4}><p>{t.noVisitors}</p></td></tr>}
          </tbody></table></div>
        </section>
      </div>}
      {tab==="users" && user.role==="admin" && <div className="layout">
        <section className="panel"><h2>{t.addUser}</h2><form className="form-grid" onSubmit={addUser}>
          <label className="field full">{t.name}<input required value={userForm.name} onChange={e=>setUserForm({...userForm,name:e.target.value})}/></label>
          <label className="field full">{t.email}<input type="email" required value={userForm.email} onChange={e=>setUserForm({...userForm,email:e.target.value})}/></label>
          <label className="field full">{t.password}<input type="password" minLength={10} required value={userForm.password} onChange={e=>setUserForm({...userForm,password:e.target.value})}/></label>
          <label className="field">{t.role}<select value={userForm.role} onChange={e=>setUserForm({...userForm,role:e.target.value})}><option value="resident">Resident</option><option value="watchman">Watchman</option><option value="admin">Admin</option></select></label>
          <label className="field">{t.building}<input value={userForm.building} onChange={e=>setUserForm({...userForm,building:e.target.value})}/></label>
          <label className="field full">{t.flat}<input value={userForm.flat} onChange={e=>setUserForm({...userForm,flat:e.target.value})}/></label>
          <div className="field full"><button className="btn">{t.createUser}</button></div>
        </form></section>
        <section className="panel"><h2>{t.residents} / {t.buildings}</h2><div className="grid" style={{gridTemplateColumns:"repeat(2,minmax(0,1fr))"}}><div className="stat"><div className="stat-label">{t.residentsCount}</div><div className="stat-number">{stats.residents}</div></div><div className="stat"><div className="stat-label">{t.watchmenCount}</div><div className="stat-number">{stats.watchmen}</div></div><div className="stat"><div className="stat-label">{t.buildingCount}</div><div className="stat-number">{stats.buildings}</div></div></div>
          <div className="table-wrap"><table><thead><tr><th>{t.name}</th><th>{t.role}</th><th>{t.building} / {t.flat}</th></tr></thead><tbody>{users.map(u=><tr key={u.id}><td>{u.name}<div className="muted">{u.email}</div></td><td>{u.role}</td><td>{u.building||"—"} / {u.flat||"—"}</td></tr>)}</tbody></table></div>
        </section>
      </div>}
      <div className="footer">SocietySetu · Secure access workflow · MongoDB-backed · Configure secrets before deployment</div>
    </main>
  </div>;
}
