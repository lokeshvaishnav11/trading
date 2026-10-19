// // import React, { useEffect, useState } from "react";
// // import { createRoot } from "react-dom/client";
// // import "./style.css";
// // const entities = [
// //   "users",
// //   "deposits",
// //   "withdrawals",
// //   "trades",
// //   "pairs",
// //   "bonuses",
// //   "tickets",
// //   "notices",
// //   "settings",
// //   "audit",
// // ];
// // const fields = {
// //   users: ["name", "country", "currency", "status"],
// //   deposits: ["note"],
// //   withdrawals: ["status"],
// //   pairs: [
// //     "symbol",
// //     "category",
// //     "enabled",
// //     "payout1",
// //     "payout5",
// //     "source",
// //   ],
// //   bonuses: ["code", "percent", "minUSD", "enabled"],
// //   tickets: ["status", "reply"],
// //   notices: ["title", "message", "enabled"],
// //   settings: ["key", "value"],
// // };
// // const creatable = [
// //   "pairs",
// //   "bonuses",
// //   "notices",
// //   "settings",
// // ];
// // const API_URL = import.meta.env.VITE_API_URL || "/api";
// // const api = async (path, method = "GET", body) => {
// //   const token = sessionStorage.getItem("qx_admin") || "";
// //   const response = await fetch(API_URL + path, {
// //     method,
// //     headers: {
// //       "Content-Type": "application/json",
// //       Authorization: `Bearer ${token}`,
// //     },
// //     body:
// //       body !== undefined
// //         ? JSON.stringify(body)
// //         : undefined,
// //   });
// //   const result = await response.json();
// //   if (!response.ok) {
// //     throw new Error(result.error || "Request failed");
// //   }
// //   return result;
// // };
// // function ScheduleEditor() {
// //   const [symbol,setSymbol]=useState('EUR/USD');
// //   const [rows,setRows]=useState([]);
// //   const [busy,setBusy]=useState(false);
// //   const [notice,setNotice]=useState('');
// //   const [dirty,setDirty]=useState(false);
// //   const path = '/admin/minute-directions?symbol=' + encodeURIComponent(symbol);
// //   const clock=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
// //   const reload=async()=>{
// //     setBusy(true);setNotice('');
// //     try{const data=await api(path);setRows(data.rows||[]);setDirty(false);}
// //     catch(e){setNotice(e.message);}finally{setBusy(false);}
// //   };
// //   useEffect(()=>{reload();},[symbol]);
// //   const setDirection=(minute,direction)=>{
// //     setRows(old=>{
// //       const without=old.filter(x=>x.minute!==minute);
// //       return direction?[...without,{minute,direction}].sort((a,b)=>a.minute-b.minute):without;
// //     });setDirty(true);
// //   };
// //   const save=async()=>{
// //     setBusy(true);setNotice('');
// //     try{await api(path,'PUT',{rows:rows.map(({minute,direction})=>({minute,direction}))});setDirty(false);setNotice('UP/DOWN settings saved to database');}
// //     catch(e){setNotice(e.message);}finally{setBusy(false);}
// //   };
// //   return <section style={{padding:18,background:'#111d2b',color:'#f0f5ff',borderRadius:12}}>
// //     <h2>Time-based UP / DOWN Settings</h2>
// //     <p>07:00–23:50 IST, every 10 minutes. These settings repeat daily and only save to the database; they do not affect chart prices or trade results.</p>
// //     <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:18}}>
// //       <select value={symbol} onChange={e=>setSymbol(e.target.value)}>{['EUR/USD','GBP/USD','BTC/USD'].map(x=><option key={x} value={x}>{x}</option>)}</select>
// //       <button type="button" disabled={busy||!dirty} onClick={save}>{busy?'Saving...':'Save Settings'}</button>
// //       <button type="button" disabled={busy} onClick={reload}>Reload</button>
// //     </div>
// //     {notice&&<p role="status">{notice}</p>}
// //     <div style={{maxHeight:'65vh',overflow:'auto'}}><table style={{width:'100%'}}><thead><tr><th>Time (IST)</th><th>Direction</th></tr></thead><tbody>
// //       {Array.from({length:102},(_,i)=>420+i*10).map(minute=>{
// //         const value=rows.find(x=>x.minute===minute)?.direction||'';
// //         return <tr key={minute}><td>{clock(minute)}</td><td><select value={value} disabled={busy} onChange={e=>setDirection(minute,e.target.value)}>
// //           <option value="">Not set</option><option value="UP">🟢 UP</option><option value="DOWN">🔴 DOWN</option>
// //         </select></td></tr>;
// //       })}
// //     </tbody></table></div>
// //   </section>;
// // }

// // function App() {
// //   const [logged, setLogged] = useState(false);
// //   const [email, setEmail] = useState("");
// //   const [pass, setPass] = useState("");
// //   const [tab, setTab] = useState("overview");
// //   const [rows, setRows] = useState([]);
// //   const [stats, setStats] = useState({});
// //   const [error, setError] = useState("");
// //   const [message, setMessage] = useState("");
// //   const [loading, setLoading] = useState(false);
// //   const [edit, setEdit] = useState(null);
// //   const [draft, setDraft] = useState({});
// //   const load = async (selectedTab = tab) => {
// //     try {
// //       setError("");
// //       if (selectedTab === "schedules") return;
// //       if (selectedTab === "overview") {
// //         const data = await api("/admin/overview");
// //         setStats(data);
// //       } else {
// //         const data = await api(`/admin/${selectedTab}`);
// //         setRows(data.rows || []);
// //       }
// //     } catch (err) {
// //       setError(err.message);
// //     }
// //   };
// //   useEffect(() => {
// //     const token = sessionStorage.getItem("qx_admin");
// //     if (!token) return;
// //     api("/auth/me")
// //       .then((data) => {
// //         if (data.user.role === "admin") {
// //           setLogged(true);
// //         } else {
// //           sessionStorage.removeItem("qx_admin");
// //         }
// //       })
// //       .catch(() => {
// //         sessionStorage.removeItem("qx_admin");
// //       });
// //   }, []);
// //   useEffect(() => {
// //     if (logged) {
// //       load(tab);
// //     }
// //   }, [logged, tab]);
// //   const login = async (event) => {
// //     event.preventDefault();
// //     try {
// //       setError("");
// //       setLoading(true);
// //       const data = await api("/auth/login", "POST", {
// //         email,
// //         password: pass,
// //       });
// //       if (data.user.role !== "admin") {
// //         throw new Error("Admin role required");
// //       }
// //       sessionStorage.setItem("qx_admin", data.token);
// //       setLogged(true);
// //     } catch (err) {
// //       setError(err.message);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };
// //   const logout = () => {
// //     sessionStorage.removeItem("qx_admin");
// //     setLogged(false);
// //     setTab("overview");
// //     setRows([]);
// //     setStats({});
// //     setEdit(null);
// //   };
// //   const save = async (event) => {
// //     event.preventDefault();
// //     try {
// //       setError("");
// //       setMessage("");
// //       setLoading(true);
// //       const data = { ...draft };
// //       for (const key of [
// //         "payout1",
// //         "payout5",
// //         "percent",
// //         "minUSD",
// //       ]) {
// //         if (key in data) {
// //           data[key] = Number(data[key]);
// //         }
// //       }
// //       if ("enabled" in data) {
// //         data.enabled =
// //           data.enabled === true ||
// //           data.enabled === "true";
// //       }
// //       const isNew = edit === "new";
// //       const endpoint = isNew
// //         ? `/admin/${tab}`
// //         : `/admin/${tab}/${edit}`;
// //       await api(
// //         endpoint,
// //         isNew ? "POST" : "PATCH",
// //         data
// //       );
// //       setEdit(null);
// //       setDraft({});
// //       setMessage("Record saved successfully");
// //       await load();
// //     } catch (err) {
// //       setError(err.message);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };
// //   const approveDeposit = async (deposit) => {
// //     const confirmed = window.confirm(
// //       `Confirm that payment of $${deposit.amountUSD} ` +
// //       `has been independently verified. ` +
// //       `Approve and credit the user's balance?`
// //     );
// //     if (!confirmed) return;
// //     try {
// //       setError("");
// //       setMessage("");
// //       setLoading(true);
// //       const result = await api(
// //         `/admin/deposits/${deposit._id}/approve`,
// //         "PATCH",
// //         { note: "Payment manually verified" }
// //       );
// //       setMessage(
// //         `Deposit approved. $${result.creditedAmount} ` +
// //         `credited. New balance: $${result.newBalance}`
// //       );
// //       await load("deposits");
// //     } catch (err) {
// //       setError(err.message);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };
// //   const remove = async (id) => {
// //     if (!window.confirm("Delete this configuration record?")) {
// //       return;
// //     }
// //     try {
// //       setError("");
// //       setLoading(true);
// //       await api(`/admin/${tab}/${id}`, "DELETE");
// //       await load();
// //     } catch (err) {
// //       setError(err.message);
// //     } finally {
// //       setLoading(false);
// //     }
// //   };
// //   const openEdit = (record) => {
// //     setEdit(record._id);
// //     const values = Object.fromEntries(
// //       (fields[tab] || []).map((key) => [
// //         key,
// //         record[key] ?? "",
// //       ])
// //     );
// //     setDraft(values);
// //   };
// //   const openCreate = () => {
// //     setEdit("new");
// //     setDraft({});
// //   };
// //   const formatValue = (value) => {
// //     if (value === null || value === undefined) {
// //       return "";
// //     }
// //     if (typeof value === "object") {
// //       return JSON.stringify(value);
// //     }
// //     return String(value);
// //   };
// //   const tableColumns = [
// //     ...new Set(
// //       rows.flatMap((record) =>
// //         Object.keys(record).filter(
// //           (key) =>
// //             !["__v", "passwordHash", "_id"].includes(key)
// //         )
// //       )
// //     ),
// //   ].slice(0, 11);
// //   if (!logged) {
// //     return (
// //       <main className="login">
// //         <form onSubmit={login}>
// //           <h1>◈ Quotexx Admin</h1>
// //           <p>Authorized administrators only</p>
// //           <input
// //             type="email"
// //             placeholder="Admin email"
// //             value={email}
// //             onChange={(e) => setEmail(e.target.value)}
// //             required
// //           />
// //           <input
// //             type="password"
// //             placeholder="Password"
// //             value={pass}
// //             onChange={(e) => setPass(e.target.value)}
// //             required
// //           />
// //           <button type="submit" disabled={loading}>
// //             {loading ? "Signing in..." : "Sign in"}
// //           </button>
// //           {error && <p className="error">{error}</p>}
// //         </form>
// //       </main>
// //     );
// //   }
// //   return (
// //     <div className="layout">
// //       <aside>
// //         <h2>◈ Quotexx</h2>
// //         <small>ADMIN CONSOLE</small>
// //         {["overview", "schedules", ...entities].map((item) => (
// //           <button
// //             key={item}
// //             className={tab === item ? "selected" : ""}
// //             onClick={() => {
// //               setTab(item);
// //               setEdit(null);
// //               setMessage("");
// //             }}
// //           >
// //             {item[0].toUpperCase() + item.slice(1)}
// //           </button>
// //         ))}
// //         <button onClick={logout}>Log out</button>
// //       </aside>
// //       <main>
// //         <div className="top">
// //           <h1>
// //             {tab[0].toUpperCase() + tab.slice(1)}
// //           </h1>
// //           <button
// //             onClick={() => load()}
// //             disabled={loading}
// //           >
// //             Refresh
// //           </button>
// //         </div>
// //         {error && <p className="error">{error}</p>}
// //         {message && (
// //           <p style={{ color: "#16a34a" }}>
// //             {message}
// //           </p>
// //         )}
// //         {tab === "schedules" ? (<ScheduleEditor />) : tab === "overview" ? (
// //           <div className="cards">
// //             {Object.entries(stats).map(([key, value]) => (
// //               <section key={key}>
// //                 <small>{key}</small>
// //                 <strong>{formatValue(value)}</strong>
// //               </section>
// //             ))}
// //           </div>
// //         ) : (
// //           <>
// //             <div className="tools">
// //               <span>
// //                 {rows.length} records on this page
// //               </span>
// //               {creatable.includes(tab) && (
// //                 <button onClick={openCreate}>
// //                   + Add record
// //                 </button>
// //               )}
// //             </div>
// //             <div className="scroll">
// //               <table>
// //                 <thead>
// //                   <tr>
// //                     <th>ID</th>
// //                     {tableColumns.map((column) => (
// //                       <th key={column}>{column}</th>
// //                     ))}
// //                     <th>Actions</th>
// //                   </tr>
// //                 </thead>
// //                 <tbody>
// //                   {rows.map((record) => (
// //                     <tr key={record._id}>
// //                       <td>
// //                         {String(record._id).slice(-7)}
// //                       </td>
// //                       {tableColumns.map((column) => (
// //                         <td key={column}>
// //                           {formatValue(record[column])}
// //                         </td>
// //                       ))}
// //                       <td>
// //                         {tab === "deposits" &&
// //                           record.status === "pending" && (
// //                             <button
// //                               type="button"
// //                               disabled={loading}
// //                               onClick={() =>
// //                                 approveDeposit(record)
// //                               }
// //                             >
// //                               Approve + Credit
// //                             </button>
// //                           )}
// //                         {(fields[tab] || []).length > 0 && (
// //                           <button
// //                             type="button"
// //                             disabled={loading}
// //                             onClick={() => openEdit(record)}
// //                           >
// //                             Edit
// //                           </button>
// //                         )}
// //                         {creatable.includes(tab) && (
// //                           <button
// //                             type="button"
// //                             className="danger"
// //                             disabled={loading}
// //                             onClick={() =>
// //                               remove(record._id)
// //                             }
// //                           >
// //                             Delete
// //                           </button>
// //                         )}
// //                       </td>
// //                     </tr>
// //                   ))}
// //                 </tbody>
// //               </table>
// //             </div>
// //           </>
// //         )}
// //         {edit && (
// //           <div className="shade">
// //             <form className="modal" onSubmit={save}>
// //               <h2>
// //                 {edit === "new" ? "New" : "Edit"} {tab}
// //               </h2>
// //               {(fields[tab] || []).map((key) => (
// //                 <label key={key}>
// //                   {key}
// //                   {key === "enabled" ? (
// //                     <select
// //                       value={String(draft[key] ?? "true")}
// //                       onChange={(e) =>
// //                         setDraft({
// //                           ...draft,
// //                           [key]: e.target.value,
// //                         })
// //                       }
// //                     >
// //                       <option value="true">Enabled</option>
// //                       <option value="false">Disabled</option>
// //                     </select>
// //                   ) : (
// //                     <input
// //                       value={String(draft[key] ?? "")}
// //                       onChange={(e) =>
// //                         setDraft({
// //                           ...draft,
// //                           [key]: e.target.value,
// //                         })
// //                       }
// //                     />
// //                   )}
// //                 </label>
// //               ))}
// //               <div>
// //                 <button type="submit" disabled={loading}>
// //                   {loading ? "Saving..." : "Save"}
// //                 </button>
// //                 <button
// //                   type="button"
// //                   onClick={() => setEdit(null)}
// //                 >
// //                   Cancel
// //                 </button>
// //               </div>
// //             </form>
// //           </div>
// //         )}
// //       </main>
// //     </div>
// //   );
// // }
// // createRoot(
// //   document.getElementById("root")
// // ).render(<App />);



// import React, { useEffect, useState } from "react";

// import { createRoot } from "react-dom/client";

// import "./style.css";

// const entities = [

//   "users",

//   "deposits",

//   "withdrawals",

//   "trades",

//   "pairs",

//   "bonuses",

//   "tickets",

//   "notices",

//   "settings",

//   "audit",

// ];

// const fields = {

//   users: ["name", "country", "currency", "status"],

//   deposits: ["note"],

//   withdrawals: ["status"],

//   pairs: [

//     "symbol",

//     "category",

//     "enabled",

//     "payout1",

//     "payout5",

//     "source",

//   ],

//   bonuses: ["code", "percent", "minUSD", "enabled"],

//   tickets: ["status", "reply"],

//   notices: ["title", "message", "enabled"],

//   settings: ["key", "value"],

// };

// const creatable = [

//   "pairs",

//   "bonuses",

//   "notices",

//   "settings",

// ];

// const API_URL = import.meta.env.VITE_API_URL || "/api";

// const api = async (path, method = "GET", body) => {

//   const token = sessionStorage.getItem("qx_admin") || "";

//   const response = await fetch(API_URL + path, {

//     method,

//     headers: {

//       "Content-Type": "application/json",

//       Authorization: `Bearer ${token}`,

//     },

//     body:

//       body !== undefined

//         ? JSON.stringify(body)

//         : undefined,

//   });

//   const result = await response.json();

//   if (!response.ok) {

//     throw new Error(result.error || "Request failed");

//   }

//   return result;

// };

// function ScheduleEditor() {

//   const [symbol,setSymbol]=useState('USD/BRL (OTC)');

//   const [rows,setRows]=useState([]);

//   const [busy,setBusy]=useState(false);

//   const [notice,setNotice]=useState('');

//   const [dirty,setDirty]=useState(false);

//   const path = '/admin/minute-directions?symbol=' + encodeURIComponent(symbol);

//   const clock=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;

//   const reload=async()=>{

//     setBusy(true);setNotice('');

//     try{const data=await api(path);setRows(data.rows||[]);setDirty(false);}

//     catch(e){setNotice(e.message);}finally{setBusy(false);}

//   };

//   useEffect(()=>{reload();},[symbol]);

//   const setDirection=(minute,direction)=>{

//     setRows(old=>{

//       const without=old.filter(x=>x.minute!==minute);

//       return direction?[...without,{minute,direction}].sort((a,b)=>a.minute-b.minute):without;

//     });setDirty(true);

//   };

//   const save=async()=>{

//     setBusy(true);setNotice('');

//     try{await api(path,'PUT',{rows:rows.map(({minute,direction})=>({minute,direction}))});setDirty(false);setNotice('UP/DOWN settings saved to database');}

//     catch(e){setNotice(e.message);}finally{setBusy(false);}

//   };

//   return <section style={{padding:18,background:'#111d2b',color:'#f0f5ff',borderRadius:12}}>

//     <h2>Time-based UP / DOWN Settings</h2>

//     <p>07:00–23:50 IST, every 10 minutes. These settings repeat daily and only save to the database; they do not affect chart prices or trade results.</p>

//     <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:18}}>

//       <select value={symbol} onChange={e=>setSymbol(e.target.value)}>{['USD/BRL (OTC)','EUR/USD','GBP/USD','BTC/USD'].map(x=><option key={x} value={x}>{x}</option>)}</select>

//       <button type="button" disabled={busy||!dirty} onClick={save}>{busy?'Saving...':'Save Settings'}</button>

//       <button type="button" disabled={busy} onClick={reload}>Reload</button>

//     </div>

//     {notice&&<p role="status">{notice}</p>}

//     <div style={{maxHeight:'65vh',overflow:'auto'}}><table style={{width:'100%'}}><thead><tr><th>Time (IST)</th><th>Direction</th></tr></thead><tbody>

//       {Array.from({length:102},(_,i)=>420+i*10).map(minute=>{

//         const value=rows.find(x=>x.minute===minute)?.direction||'';

//         return <tr key={minute}><td>{clock(minute)}</td><td><select value={value} disabled={busy} onChange={e=>setDirection(minute,e.target.value)}>

//           <option value="">Not set</option><option value="UP">🟢 UP</option><option value="DOWN">🔴 DOWN</option>

//         </select></td></tr>;

//       })}

//     </tbody></table></div>

//   </section>;

// }



// function App() {

//   const [logged, setLogged] = useState(false);

//   const [email, setEmail] = useState("");

//   const [pass, setPass] = useState("");

//   const [tab, setTab] = useState("overview");

//   const [rows, setRows] = useState([]);

//   const [stats, setStats] = useState({});

//   const [error, setError] = useState("");

//   const [message, setMessage] = useState("");

//   const [loading, setLoading] = useState(false);

//   const [edit, setEdit] = useState(null);

//   const [draft, setDraft] = useState({});

//   const load = async (selectedTab = tab) => {

//     try {

//       setError("");

//       if (selectedTab === "schedules") return;

//       if (selectedTab === "overview") {

//         const data = await api("/admin/overview");

//         setStats(data);

//       } else {

//         const data = await api(`/admin/${selectedTab}`);

//         setRows(data.rows || []);

//       }

//     } catch (err) {

//       setError(err.message);

//     }

//   };

//   useEffect(() => {

//     const token = sessionStorage.getItem("qx_admin");

//     if (!token) return;

//     api("/auth/me")

//       .then((data) => {

//         if (data.user.role === "admin") {

//           setLogged(true);

//         } else {

//           sessionStorage.removeItem("qx_admin");

//         }

//       })

//       .catch(() => {

//         sessionStorage.removeItem("qx_admin");

//       });

//   }, []);

//   useEffect(() => {

//     if (logged) {

//       load(tab);

//     }

//   }, [logged, tab]);

//   const login = async (event) => {

//     event.preventDefault();

//     try {

//       setError("");

//       setLoading(true);

//       const data = await api("/auth/login", "POST", {

//         email,

//         password: pass,

//       });

//       if (data.user.role !== "admin") {

//         throw new Error("Admin role required");

//       }

//       sessionStorage.setItem("qx_admin", data.token);

//       setLogged(true);

//     } catch (err) {

//       setError(err.message);

//     } finally {

//       setLoading(false);

//     }

//   };

//   const logout = () => {

//     sessionStorage.removeItem("qx_admin");

//     setLogged(false);

//     setTab("overview");

//     setRows([]);

//     setStats({});

//     setEdit(null);

//   };

//   const save = async (event) => {

//     event.preventDefault();

//     try {

//       setError("");

//       setMessage("");

//       setLoading(true);

//       const data = { ...draft };

//       for (const key of [

//         "payout1",

//         "payout5",

//         "percent",

//         "minUSD",

//       ]) {

//         if (key in data) {

//           data[key] = Number(data[key]);

//         }

//       }

//       if ("enabled" in data) {

//         data.enabled =

//           data.enabled === true ||

//           data.enabled === "true";

//       }

//       const isNew = edit === "new";

//       const endpoint = isNew

//         ? `/admin/${tab}`

//         : `/admin/${tab}/${edit}`;

//       await api(

//         endpoint,

//         isNew ? "POST" : "PATCH",

//         data

//       );

//       setEdit(null);

//       setDraft({});

//       setMessage("Record saved successfully");

//       await load();

//     } catch (err) {

//       setError(err.message);

//     } finally {

//       setLoading(false);

//     }

//   };

//   const approveDeposit = async (deposit) => {

//     const confirmed = window.confirm(

//       `Confirm that payment of $${deposit.amountUSD} ` +

//       `has been independently verified. ` +

//       `Approve and credit the user's balance?`

//     );

//     if (!confirmed) return;

//     try {

//       setError("");

//       setMessage("");

//       setLoading(true);

//       const result = await api(

//         `/admin/deposits/${deposit._id}/approve`,

//         "PATCH",

//         { note: "Payment manually verified" }

//       );

//       setMessage(

//         `Deposit approved. $${result.creditedAmount} ` +

//         `credited. New balance: $${result.newBalance}`

//       );

//       await load("deposits");

//     } catch (err) {

//       setError(err.message);

//     } finally {

//       setLoading(false);

//     }

//   };

//   const remove = async (id) => {

//     if (!window.confirm("Delete this configuration record?")) {

//       return;

//     }

//     try {

//       setError("");

//       setLoading(true);

//       await api(`/admin/${tab}/${id}`, "DELETE");

//       await load();

//     } catch (err) {

//       setError(err.message);

//     } finally {

//       setLoading(false);

//     }

//   };

//   const openEdit = (record) => {

//     setEdit(record._id);

//     const values = Object.fromEntries(

//       (fields[tab] || []).map((key) => [

//         key,

//         record[key] ?? "",

//       ])

//     );

//     setDraft(values);

//   };

//   const openCreate = () => {

//     setEdit("new");

//     setDraft({});

//   };

//   const formatValue = (value) => {

//     if (value === null || value === undefined) {

//       return "";

//     }

//     if (typeof value === "object") {

//       return JSON.stringify(value);

//     }

//     return String(value);

//   };

//   const tableColumns = [

//     ...new Set(

//       rows.flatMap((record) =>

//         Object.keys(record).filter(

//           (key) =>

//             !["__v", "passwordHash", "_id"].includes(key)

//         )

//       )

//     ),

//   ].slice(0, 11);

//   if (!logged) {

//     return (

//       <main className="login">

//         <form onSubmit={login}>

//           <h1>◈ Quotexx Admin</h1>

//           <p>Authorized administrators only</p>

//           <input

//             type="email"

//             placeholder="Admin email"

//             value={email}

//             onChange={(e) => setEmail(e.target.value)}

//             required

//           />

//           <input

//             type="password"

//             placeholder="Password"

//             value={pass}

//             onChange={(e) => setPass(e.target.value)}

//             required

//           />

//           <button type="submit" disabled={loading}>

//             {loading ? "Signing in..." : "Sign in"}

//           </button>

//           {error && <p className="error">{error}</p>}

//         </form>

//       </main>

//     );

//   }

//   return (

//     <div className="layout">

//       <aside>

//         <h2>◈ Quotexx</h2>

//         <small>ADMIN CONSOLE</small>

//         {["overview", "schedules", ...entities].map((item) => (

//           <button

//             key={item}

//             className={tab === item ? "selected" : ""}

//             onClick={() => {

//               setTab(item);

//               setEdit(null);

//               setMessage("");

//             }}

//           >

//             {item[0].toUpperCase() + item.slice(1)}

//           </button>

//         ))}

//         <button onClick={logout}>Log out</button>

//       </aside>

//       <main>

//         <div className="top">

//           <h1>

//             {tab[0].toUpperCase() + tab.slice(1)}

//           </h1>

//           <button

//             onClick={() => load()}

//             disabled={loading}

//           >

//             Refresh

//           </button>

//         </div>

//         {error && <p className="error">{error}</p>}

//         {message && (

//           <p style={{ color: "#16a34a" }}>

//             {message}

//           </p>

//         )}

//         {tab === "schedules" ? (<ScheduleEditor />) : tab === "overview" ? (

//           <div className="cards">

//             {Object.entries(stats).map(([key, value]) => (

//               <section key={key}>

//                 <small>{key}</small>

//                 <strong>{formatValue(value)}</strong>

//               </section>

//             ))}

//           </div>

//         ) : (

//           <>

//             <div className="tools">

//               <span>

//                 {rows.length} records on this page

//               </span>

//               {creatable.includes(tab) && (

//                 <button onClick={openCreate}>

//                   \+ Add record

//                 </button>

//               )}

//             </div>

//             <div className="scroll">

//               <table>

//                 <thead>

//                   <tr>

//                     <th>ID</th>

//                     {tableColumns.map((column) => (

//                       <th key={column}>{column}</th>

//                     ))}

//                     <th>Actions</th>

//                   </tr>

//                 </thead>

//                 <tbody>

//                   {rows.map((record) => (

//                     <tr key={record._id}>

//                       <td>

//                         {String(record._id).slice(-7)}

//                       </td>

//                       {tableColumns.map((column) => (

//                         <td key={column}>

//                           {formatValue(record[column])}

//                         </td>

//                       ))}

//                       <td>

//                         {tab === "deposits" &&

//                           record.status === "pending" && (

//                             <button

//                               type="button"

//                               disabled={loading}

//                               onClick={() =>

//                                 approveDeposit(record)

//                               }

//                             >

//                               Approve + Credit

//                             </button>

//                           )}

//                         {(fields[tab] || []).length > 0 && (

//                           <button

//                             type="button"

//                             disabled={loading}

//                             onClick={() => openEdit(record)}

//                           >

//                             Edit

//                           </button>

//                         )}

//                         {creatable.includes(tab) && (

//                           <button

//                             type="button"

//                             className="danger"

//                             disabled={loading}

//                             onClick={() =>

//                               remove(record._id)

//                             }

//                           >

//                             Delete

//                           </button>

//                         )}

//                       </td>

//                     </tr>

//                   ))}

//                 </tbody>

//               </table>

//             </div>

//           </>

//         )}

//         {edit && (

//           <div className="shade">

//             <form className="modal" onSubmit={save}>

//               <h2>

//                 {edit === "new" ? "New" : "Edit"} {tab}

//               </h2>

//               {(fields[tab] || []).map((key) => (

//                 <label key={key}>

//                   {key}

//                   {key === "enabled" ? (

//                     <select

//                       value={String(draft[key] ?? "true")}

//                       onChange={(e) =>

//                         setDraft({

//                           ...draft,

//                           [key]: e.target.value,

//                         })

//                       }

//                     >

//                       <option value="true">Enabled</option>

//                       <option value="false">Disabled</option>

//                     </select>

//                   ) : (

//                     <input

//                       value={String(draft[key] ?? "")}

//                       onChange={(e) =>

//                         setDraft({

//                           ...draft,

//                           [key]: e.target.value,

//                         })

//                       }

//                     />

//                   )}

//                 </label>

//               ))}

//               <div>

//                 <button type="submit" disabled={loading}>

//                   {loading ? "Saving..." : "Save"}

//                 </button>

//                 <button

//                   type="button"

//                   onClick={() => setEdit(null)}

//                 >

//                   Cancel

//                 </button>

//               </div>

//             </form>

//           </div>

//         )}

//       </main>

//     </div>

//   );

// }

// createRoot(

//   document.getElementById("root")

// ).render(<App />);



import React, { useEffect, useState } from "react";

import { createRoot } from "react-dom/client";

import "./style.css";

const entities = [

  "users",

  "deposits",

  "withdrawals",
  "gateway-payments",

  "trades",

  "pairs",

  "bonuses",

  "tickets",

  "notices",

  "settings",

  "audit",

];

const fields = {

  users: ["name", "country", "currency", "status"],

  deposits: ["note"],

  withdrawals: [],

  pairs: [

    "symbol",

    "category",

    "enabled",

    "payout1",

    "payout5",

    "source",

  ],

  bonuses: ["code", "percent", "minUSD", "enabled"],

  tickets: ["status", "reply"],

  notices: ["title", "message", "enabled"],

  settings: ["key", "value"],

};

const creatable = [

  "pairs",

  "bonuses",

  "notices",

  "settings",

];

const API_URL = import.meta.env.VITE_API_URL || "/api";

const api = async (path, method = "GET", body) => {

  const token = sessionStorage.getItem("qx_admin") || "";

  const response = await fetch(API_URL + path, {

    method,

    headers: {

      "Content-Type": "application/json",

      Authorization: `Bearer ${token}`,

    },

    body:

      body !== undefined

        ? JSON.stringify(body)

        : undefined,

  });

  const result = await response.json();

  if (!response.ok) {

    throw new Error(result.error || "Request failed");

  }

  return result;

};

function ScheduleEditor() {

  const [symbol,setSymbol]=useState('USD/BRL (OTC)');

  const [rows,setRows]=useState([]);

  const [busy,setBusy]=useState(false);

  const [notice,setNotice]=useState('');

  const [dirty,setDirty]=useState(false);

  const path = '/admin/minute-directions?symbol=' + encodeURIComponent(symbol);

  const clock=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;

  const reload=async()=>{

    setBusy(true);setNotice('');

    try{const data=await api(path);setRows(data.rows||[]);setDirty(false);}

    catch(e){setNotice(e.message);}finally{setBusy(false);}

  };

  useEffect(()=>{reload();},[symbol]);

  const setDirection=(minute,direction)=>{

    setRows(old=>{

      const without=old.filter(x=>x.minute!==minute);

      return direction?[...without,{minute,direction}].sort((a,b)=>a.minute-b.minute):without;

    });setDirty(true);

  };

  const save=async()=>{

    setBusy(true);setNotice('');

    try{await api(path,'PUT',{rows:rows.map(({minute,direction})=>({minute,direction}))});setDirty(false);setNotice('UP/DOWN settings saved to database');}

    catch(e){setNotice(e.message);}finally{setBusy(false);}

  };

  return <section style={{padding:18,background:'#111d2b',color:'#f0f5ff',borderRadius:12}}>

    <h2>Time-based UP / DOWN Settings</h2>

    <p>07:00–23:50 IST, every 10 minutes. These settings repeat daily and only save to the database; they do not affect chart prices or trade results.</p>

    <div style={{display:'flex',gap:12,flexWrap:'wrap',marginBottom:18}}>

      <select value={symbol} onChange={e=>setSymbol(e.target.value)}>{['USD/BRL (OTC)','EUR/USD','GBP/USD','BTC/USD'].map(x=><option key={x} value={x}>{x}</option>)}</select>

      <button type="button" disabled={busy||!dirty} onClick={save}>{busy?'Saving...':'Save Settings'}</button>

      <button type="button" disabled={busy} onClick={reload}>Reload</button>

    </div>

    {notice&&<p role="status">{notice}</p>}

    <div style={{maxHeight:'65vh',overflow:'auto'}}><table style={{width:'100%'}}><thead><tr><th>Time (IST)</th><th>Direction</th></tr></thead><tbody>

      {Array.from({length:102},(_,i)=>420+i*10).map(minute=>{

        const value=rows.find(x=>x.minute===minute)?.direction||'';

        return <tr key={minute}><td>{clock(minute)}</td><td><select value={value} disabled={busy} onChange={e=>setDirection(minute,e.target.value)}>

          <option value="">Not set</option><option value="UP">🟢 UP</option><option value="DOWN">🔴 DOWN</option>

        </select></td></tr>;

      })}

    </tbody></table></div>

  </section>;

}



function App() {

  const [logged, setLogged] = useState(false);

  const [email, setEmail] = useState("");

  const [pass, setPass] = useState("");

  const [tab, setTab] = useState("overview");

  const [rows, setRows] = useState([]);

  const [stats, setStats] = useState({});

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);

  const [edit, setEdit] = useState(null);

  const [draft, setDraft] = useState({});

  const load = async (selectedTab = tab) => {

    try {

      setError("");

      if (selectedTab === "schedules") return;

      if (selectedTab === "overview") {

        const data = await api("/admin/overview");

        setStats(data);

      } else {

        const data = await api(`/admin/${selectedTab}`);

        setRows(data.rows || []);

      }

    } catch (err) {

      setError(err.message);

    }

  };

  useEffect(() => {

    const token = sessionStorage.getItem("qx_admin");

    if (!token) return;

    api("/auth/me")

      .then((data) => {

        if (data.user.role === "admin") {

          setLogged(true);

        } else {

          sessionStorage.removeItem("qx_admin");

        }

      })

      .catch(() => {

        sessionStorage.removeItem("qx_admin");

      });

  }, []);

  useEffect(() => {

    if (logged) {

      load(tab);

    }

  }, [logged, tab]);

  const login = async (event) => {

    event.preventDefault();

    try {

      setError("");

      setLoading(true);

      const data = await api("/auth/login", "POST", {

        email,

        password: pass,

      });

      if (data.user.role !== "admin") {

        throw new Error("Admin role required");

      }

      sessionStorage.setItem("qx_admin", data.token);

      setLogged(true);

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }

  };

  const logout = () => {

    sessionStorage.removeItem("qx_admin");

    setLogged(false);

    setTab("overview");

    setRows([]);

    setStats({});

    setEdit(null);

  };

  const save = async (event) => {

    event.preventDefault();

    try {

      setError("");

      setMessage("");

      setLoading(true);

      const data = { ...draft };

      for (const key of [

        "payout1",

        "payout5",

        "percent",

        "minUSD",

      ]) {

        if (key in data) {

          data[key] = Number(data[key]);

        }

      }

      if ("enabled" in data) {

        data.enabled =

          data.enabled === true ||

          data.enabled === "true";

      }

      const isNew = edit === "new";

      const endpoint = isNew

        ? `/admin/${tab}`

        : `/admin/${tab}/${edit}`;

      await api(

        endpoint,

        isNew ? "POST" : "PATCH",

        data

      );

      setEdit(null);

      setDraft({});

      setMessage("Record saved successfully");

      await load();

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }

  };

  const approveDeposit = async (deposit) => {

    const confirmed = window.confirm(

      `Confirm that payment of $${deposit.amountUSD} ` +

      `has been independently verified. ` +

      `Approve and credit the user's balance?`

    );

    if (!confirmed) return;

    try {

      setError("");

      setMessage("");

      setLoading(true);

      const result = await api(

        `/admin/deposits/${deposit._id}/approve`,

        "PATCH",

        { note: "Payment manually verified" }

      );

      setMessage(

        `Deposit approved. $${result.creditedAmount} ` +

        `credited. New balance: $${result.newBalance}`

      );

      await load("deposits");

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }

  };

  const approveGateway = async payment => {
    if (!window.confirm(`Approve ${payment.orderId} for INR ${payment.amountINR}? ONLY proceed after independently verifying receipt with the payment provider. This credits the LIVE wallet.`)) return;
    try {
      setLoading(true);setError("");setMessage("");
      const result=await api(`/admin/gateway-payments/${payment._id}/approve`,"PATCH",{paymentVerified:true});
      setMessage(`Verified gateway payment. Credited $${result.creditedAmount}.`);
      await load("gateway-payments");
    } catch(e){setError(e.message)} finally{setLoading(false)}
  };
  const approveWithdrawal = async withdrawal => {
    if (!window.confirm(`Approve withdrawal of $${withdrawal.amountUSD} to ${withdrawal.destination}? This debits LIVE balance once; external payout must still be sent.`)) return;
    try {
      setLoading(true);setError("");setMessage("");
      const result=await api(`/admin/withdrawals/${withdrawal._id}/approve`,"PATCH",{});
      setMessage(`Withdrawal approved. LIVE balance: $${result.newBalance}. Arrange external payout separately.`);
      await load("withdrawals");
    } catch(e){setError(e.message)} finally{setLoading(false)}
  };
  const remove = async (id) => {

    if (!window.confirm("Delete this configuration record?")) {

      return;

    }

    try {

      setError("");

      setLoading(true);

      await api(`/admin/${tab}/${id}`, "DELETE");

      await load();

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }

  };

  const openEdit = (record) => {

    setEdit(record._id);

    const values = Object.fromEntries(

      (fields[tab] || []).map((key) => [

        key,

        record[key] ?? "",

      ])

    );

    setDraft(values);

  };

  const openCreate = () => {

    setEdit("new");

    setDraft({});

  };

  const formatValue = (value) => {

    if (value === null || value === undefined) {

      return "";

    }

    if (typeof value === "object") {

      return JSON.stringify(value);

    }

    return String(value);

  };

  const tableColumns = [

    ...new Set(

      rows.flatMap((record) =>

        Object.keys(record).filter(

          (key) =>

            !["__v", "passwordHash", "_id"].includes(key)

        )

      )

    ),

  ].slice(0, 11);

  if (!logged) {

    return (

      <main className="login">

        <form onSubmit={login}>

          <h1>◈ Quotexx Admin</h1>

          <p>Authorized administrators only</p>

          <input

            type="email"

            placeholder="Admin email"

            value={email}

            onChange={(e) => setEmail(e.target.value)}

            required

          />

          <input

            type="password"

            placeholder="Password"

            value={pass}

            onChange={(e) => setPass(e.target.value)}

            required

          />

          <button type="submit" disabled={loading}>

            {loading ? "Signing in..." : "Sign in"}

          </button>

          {error && <p className="error">{error}</p>}

        </form>

      </main>

    );

  }

  return (

    <div className="layout">

      <aside>

        <h2>◈ Quotexx</h2>

        <small>ADMIN CONSOLE</small>

        {["overview", "schedules", ...entities].map((item) => (

          <button

            key={item}

            className={tab === item ? "selected" : ""}

            onClick={() => {

              setTab(item);

              setEdit(null);

              setMessage("");

            }}

          >

            {item[0].toUpperCase() + item.slice(1)}

          </button>

        ))}

        <button onClick={logout}>Log out</button>

      </aside>

      <main>

        <div className="top">

          <h1>

            {tab[0].toUpperCase() + tab.slice(1)}

          </h1>

          <button

            onClick={() => load()}

            disabled={loading}

          >

            Refresh

          </button>

        </div>

        {error && <p className="error">{error}</p>}

        {message && (

          <p style={{ color: "#16a34a" }}>

            {message}

          </p>

        )}

        {tab === "schedules" ? (<ScheduleEditor />) : tab === "overview" ? (

          <div className="cards">

            {Object.entries(stats).map(([key, value]) => (

              <section key={key}>

                <small>{key}</small>

                <strong>{formatValue(value)}</strong>

              </section>

            ))}

          </div>

        ) : (

          <>

            <div className="tools">

              <span>

                {rows.length} records on this page

              </span>

              {creatable.includes(tab) && (

                <button onClick={openCreate}>

                  \+ Add record

                </button>

              )}

            </div>

            <div className="scroll">

              <table>

                <thead>

                  <tr>

                    <th>ID</th>

                    {tableColumns.map((column) => (

                      <th key={column}>{column}</th>

                    ))}

                    <th>Actions</th>

                  </tr>

                </thead>

                <tbody>

                  {rows.map((record) => (

                    <tr key={record._id}>

                      <td>

                        {String(record._id).slice(-7)}

                      </td>

                      {tableColumns.map((column) => (

                        <td key={column}>

                          {formatValue(record[column])}

                        </td>

                      ))}

                      <td>

                        {tab === "deposits" &&

                          record.status === "pending" && (

                            <button

                              type="button"

                              disabled={loading}

                              onClick={() =>

                                approveDeposit(record)

                              }

                            >

                              Approve + Credit

                            </button>

                          )}

                        {tab === "gateway-payments" && record.status === "pending" && (
                          <button type="button" disabled={loading} onClick={() => approveGateway(record)}>Verify + Approve</button>
                        )}
                        {tab === "withdrawals" && record.status === "pending" && (
                          <button type="button" disabled={loading} onClick={() => approveWithdrawal(record)}>Approve Withdrawal</button>
                        )}
                        {(fields[tab] || []).length > 0 && (

                          <button

                            type="button"

                            disabled={loading}

                            onClick={() => openEdit(record)}

                          >

                            Edit

                          </button>

                        )}

                        {creatable.includes(tab) && (

                          <button

                            type="button"

                            className="danger"

                            disabled={loading}

                            onClick={() =>

                              remove(record._id)

                            }

                          >

                            Delete

                          </button>

                        )}

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          </>

        )}

        {edit && (

          <div className="shade">

            <form className="modal" onSubmit={save}>

              <h2>

                {edit === "new" ? "New" : "Edit"} {tab}

              </h2>

              {(fields[tab] || []).map((key) => (

                <label key={key}>

                  {key}

                  {key === "enabled" ? (

                    <select

                      value={String(draft[key] ?? "true")}

                      onChange={(e) =>

                        setDraft({

                          ...draft,

                          [key]: e.target.value,

                        })

                      }

                    >

                      <option value="true">Enabled</option>

                      <option value="false">Disabled</option>

                    </select>

                  ) : (

                    <input

                      value={String(draft[key] ?? "")}

                      onChange={(e) =>

                        setDraft({

                          ...draft,

                          [key]: e.target.value,

                        })

                      }

                    />

                  )}

                </label>

              ))}

              <div>

                <button type="submit" disabled={loading}>

                  {loading ? "Saving..." : "Save"}

                </button>

                <button

                  type="button"

                  onClick={() => setEdit(null)}

                >

                  Cancel

                </button>

              </div>

            </form>

          </div>

        )}

      </main>

    </div>

  );

}

createRoot(

  document.getElementById("root")

).render(<App />);
