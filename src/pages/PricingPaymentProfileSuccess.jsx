// ============================================================
// src/pages/Pricing.jsx
// ============================================================
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

const PLANS = [
  { id:"trial",   name:"Free Trial", price:0,     period:"7 days",   color:"var(--accent)",  badge:"START HERE", badgeColor:"var(--accent)",  features:["Full access for 7 days","Meal & workout tracking","5 food scans","Progress tracking"], btnStyle:"outline-green" },
  { id:"monthly", name:"Monthly",    price:2000,  period:"per month", color:"var(--accent2)", badge:"POPULAR",    badgeColor:"var(--accent2)", features:["Everything in Trial","Unlimited food scans","Advanced charts","Priority support"], btnStyle:"solid-blue" },
  { id:"annual",  name:"Annual",     price:18000, period:"per year",  color:"var(--accent4)", badge:"BEST VALUE", badgeColor:"var(--accent4)", features:["Everything in Monthly","Save ₦6,000 vs monthly","Export your data","Early access features"], btnStyle:"outline-yellow" },
];

export default function Pricing() {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [activeSub, setActiveSub] = useState(null);

  useEffect(() => {
    if (user?.id) {
      API.get(`/subscriptions/user/${user.id}/check`).then(r => setActiveSub(r.data)).catch(() => {});
    }
  }, [user?.id]);

  const handleSelect = async (plan) => {
    if (plan.id === "trial") {
      try {
        await API.post(`/subscriptions/trial/${user.id}`);
        alert("Free trial activated! You have 7 days of full access.");
        navigate("/dashboard");
      } catch(err) { alert(err.response?.data?.message || "Could not activate trial."); }
    } else {
      navigate("/payment", { state: { plan } });
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", flexDirection:"column", alignItems:"center", padding:"50px 20px" }}>
      <div style={{ textAlign:"center", marginBottom:40, maxWidth:520 }}>
        <div style={{ display:"inline-block", background:"rgba(0,229,160,0.1)", border:"1px solid rgba(0,229,160,0.3)", borderRadius:20, padding:"3px 14px", fontSize:11, fontWeight:700, color:"var(--accent)", letterSpacing:"0.1em", marginBottom:14 }}>CHOOSE YOUR PLAN</div>
        <h1 style={{ fontFamily:"var(--font-display)", fontSize:36, fontWeight:800, letterSpacing:"-0.03em", color:"var(--text)", marginBottom:14 }}>Start your fitness journey today</h1>
        <p style={{ color:"var(--muted)", fontSize:14, lineHeight:1.7 }}>Begin with a 7-day free trial. No credit card required.</p>
      </div>

      {activeSub?.active && (
        <div style={{ background:"rgba(0,229,160,0.08)", border:"1px solid rgba(0,229,160,0.3)", borderRadius:10, padding:"12px 20px", marginBottom:28, fontSize:13, color:"var(--accent)", display:"flex", gap:12, alignItems:"center" }}>
          ✅ You have an active subscription.
          <button onClick={() => navigate("/dashboard")} style={{ background:"none", border:"none", color:"var(--accent)", cursor:"pointer", fontWeight:700, textDecoration:"underline" }}>Go to Dashboard →</button>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(260px,1fr))", gap:20, width:"100%", maxWidth:900 }}>
        {PLANS.map(plan => (
          <div key={plan.id} style={{
            background:"var(--card)", border:`1px solid ${plan.id==="monthly"?plan.color:"var(--border)"}`,
            borderRadius:18, padding:28, display:"flex", flexDirection:"column", position:"relative",
            boxShadow: plan.id==="monthly" ? `0 0 40px rgba(0,153,255,0.12)` : "none",
          }}>
            <div style={{ position:"absolute", top:-11, left:20, background:plan.badgeColor, color:"#0a0e1a", fontSize:9, fontWeight:800, letterSpacing:"0.1em", padding:"3px 10px", borderRadius:20 }}>{plan.badge}</div>
            <h2 style={{ fontFamily:"var(--font-display)", fontSize:20, fontWeight:800, marginBottom:6, color:plan.color }}>{plan.name}</h2>
            <div style={{ marginBottom:20 }}>
              <span style={{ fontFamily:"var(--font-display)", fontSize:36, fontWeight:800, color:"var(--text)" }}>{plan.price===0?"Free":`₦${plan.price.toLocaleString()}`}</span>
              <span style={{ color:"var(--muted)", fontSize:13, marginLeft:6 }}>{plan.period}</span>
            </div>
            <ul style={{ listStyle:"none", flex:1, marginBottom:22 }}>
              {plan.features.map(f => (
                <li key={f} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:9, fontSize:13, color:"var(--text)" }}>
                  <span style={{ color:plan.color, fontSize:14 }}>✓</span>{f}
                </li>
              ))}
            </ul>
            <button onClick={() => handleSelect(plan)} className="btn" style={{
              width:"100%", padding:13, fontSize:14, fontWeight:700, borderRadius:10,
              background: plan.btnStyle==="solid-blue" ? plan.color : "transparent",
              color: plan.btnStyle==="solid-blue" ? "#0a0e1a" : plan.color,
              border: `2px solid ${plan.color}`,
            }}>
              {plan.price===0?"Start Free Trial →":`Subscribe ${plan.name} →`}
            </button>
          </div>
        ))}
      </div>
      <p style={{ marginTop:32, color:"var(--muted)", fontSize:12 }}>🔒 Secured by Paystack · Cancel anytime · No hidden fees</p>
    </div>
  );
}


// ============================================================
// src/pages/Payment.jsx
// ============================================================
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

const PAYSTACK_PUBLIC_KEY = "pk_test_a2cb7edda31baa9d947da79ae1119c29a3453a01";

export default function Payment() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const plan       = location.state?.plan;
  const [loading,  setLoading]  = useState(false);
  const [loaded,   setLoaded]   = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    if (!plan) { navigate("/pricing"); return; }
    const s = document.createElement("script");
    s.src = "https://js.paystack.co/v1/inline.js";
    s.onload = () => setLoaded(true);
    document.body.appendChild(s);
    return () => document.body.removeChild(s);
  }, []);

  const handlePay = () => {
    if (!loaded) { setError("Payment system loading, please wait..."); return; }
    setError(""); setLoading(true);
    const ref = `FIT_${user.id}_${Date.now()}`;
      const popup = new Paystack();
      await popup.checkout({
        key: PAYSTACK_PUBLIC_KEY,
        email: user.email || `${user.username}@fittracker.app`,
        amount: plan.price * 100,
        currency: "NGN",
        reference: ref,
        metadata: { userId: user.id, plan: plan.id.toUpperCase() },
        onSuccess: async (transaction) => {
          const resolvedReference = transaction?.reference || ref;
          try {
            await API.post("/subscriptions/verify", { reference: resolvedReference, userId: user.id, plan: plan.id.toUpperCase() });
            navigate("/payment-success", { state: { plan, reference: resolvedReference } });
          } catch {
            setError("Verification failed. Keep reference: " + resolvedReference);
          } finally {
            setLoading(false);
          }
        },
        onCancel: () => {
          setLoading(false);
          setError("Payment cancelled. Try again when ready.");
        },
        onError: (paystackError) => {
          setLoading(false);
          setError(paystackError?.message || "Payment failed to start.");
        },
      });
  };

  if (!plan) return null;

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ width:"100%", maxWidth:460 }}>
        <button onClick={() => navigate("/pricing")} className="btn btn-ghost" style={{ marginBottom:20, fontSize:13 }}>← Back to Plans</button>
        <div className="card">
          <div style={{ textAlign:"center", paddingBottom:20, borderBottom:"1px solid var(--border)", marginBottom:20 }}>
            <div style={{ fontSize:36, marginBottom:10 }}>💳</div>
            <h1 style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:800, marginBottom:6, color:"var(--text)" }}>Complete Payment</h1>
            <p style={{ color:"var(--muted)", fontSize:13 }}>Subscribing to the <strong style={{ color:"var(--accent2)" }}>{plan.name}</strong> plan</p>
          </div>
          <div style={{ marginBottom:20 }}>
            {[["Plan", plan.name],["Duration", plan.period],["Amount", `₦${plan.price.toLocaleString()}`]].map(([k,v]) => (
              <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:10, fontSize:14 }}>
                <span style={{ color:"var(--muted)" }}>{k}</span>
                <strong style={{ color: k==="Amount"?"var(--accent2)":"var(--text)", fontSize: k==="Amount"?18:14 }}>{v}</strong>
              </div>
            ))}
          </div>
          {error && <div className="alert alert-error" style={{ marginBottom:14 }}>⚠️ {error}</div>}
          <button onClick={handlePay} disabled={loading||!loaded} className="btn btn-primary" style={{ width:"100%", padding:13, fontSize:15, borderRadius:10 }}>
            {loading ? "Processing..." : `Pay ₦${plan.price.toLocaleString()} with Paystack →`}
          </button>
          <p style={{ textAlign:"center", marginTop:14, fontSize:11, color:"var(--muted)" }}>🔒 Secured by Paystack · We never store your card details</p>
          <div style={{ marginTop:12, background:"rgba(255,209,102,0.08)", border:"1px solid rgba(255,209,102,0.3)", borderRadius:8, padding:"8px 12px", fontSize:11, color:"var(--accent4)", textAlign:"center" }}>
            🧪 Test card: <strong>4084 0840 8408 4081</strong> · Expiry: any future date · CVV: 408 · PIN: 0000
          </div>
        </div>
      </div>
    </div>
  );
}


// ============================================================
// src/pages/PaymentSuccess.jsx
// ============================================================
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

export default function PaymentSuccess() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useAuth();
  const reference  = new URLSearchParams(location.search).get("reference") || location.state?.reference;
  const plan       = location.state?.plan;
  const [sub,      setSub]      = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [countdown,setCountdown]= useState(5);

  useEffect(() => {
    if (user?.id) {
      API.get(`/subscriptions/user/${user.id}`).then(r => setSub(r.data)).catch(() => {}).finally(() => setLoading(false));
    } else { setLoading(false); }
  }, [user?.id]);

  useEffect(() => {
    if (loading) return;
    const t = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(t); navigate("/dashboard"); } return c - 1; }), 1000);
    return () => clearInterval(t);
  }, [loading]);

  if (loading) return <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)" }}><div style={{ textAlign:"center", color:"var(--muted)" }}><div style={{ fontSize:28, marginBottom:10 }}>⏳</div><div>Confirming subscription...</div></div></div>;

  const planName = sub?.plan || plan?.name || "Monthly";
  const endDate  = sub?.endDate || "30 days";
  const daysLeft = sub?.daysRemaining || 30;

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"var(--bg)", padding:20 }}>
      <div style={{ width:"100%", maxWidth:460, textAlign:"center" }} className="fade-up">
        <div style={{ width:80, height:80, borderRadius:"50%", background:"rgba(0,229,160,0.1)", border:"2px solid var(--accent)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 22px", fontSize:36 }}>✅</div>
        <h1 style={{ fontFamily:"var(--font-display)", fontSize:26, fontWeight:800, color:"var(--text)", marginBottom:10 }}>Payment Successful!</h1>
        <p style={{ color:"var(--muted)", fontSize:14, lineHeight:1.7, marginBottom:24 }}>Your <strong style={{ color:"var(--accent)" }}>{planName}</strong> subscription is now active. Welcome!</p>
        <div className="card" style={{ marginBottom:20, textAlign:"left" }}>
          {[["Plan", planName],["Status", "Active ✓"],["Expires", endDate],["Days Left", `${daysLeft} days`],...(reference ? [["Reference", reference]] : [])].map(([k,v]) => (
            <div key={k} style={{ display:"flex", justifyContent:"space-between", marginBottom:9, fontSize:14, borderBottom:"1px solid var(--border)", paddingBottom:9 }}>
              <span style={{ color:"var(--muted)" }}>{k}</span>
              <strong style={{ color:k==="Status"?"var(--accent)":"var(--text)" }}>{v}</strong>
            </div>
          ))}
        </div>
        <button className="btn btn-primary" style={{ width:"100%", padding:13, fontSize:15, borderRadius:12, marginBottom:10 }} onClick={() => navigate("/dashboard")}>Go to Dashboard →</button>
        <p style={{ fontSize:12, color:"var(--muted)" }}>Redirecting in <strong>{countdown}</strong> second{countdown !== 1 ? "s" : ""}...</p>
      </div>
    </div>
  );
}


// ============================================================
// src/pages/Profile.jsx
// ============================================================
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../api/axios";

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const [profile, setProfile]  = useState(null);
  const [sub,     setSub]      = useState(null);
  const [editing, setEditing]  = useState(false);
  const [form,    setForm]     = useState({});
  const [saving,  setSaving]   = useState(false);
  const [success, setSuccess]  = useState("");
  const [error,   setError]    = useState("");
  const [tab,     setTab]      = useState("profile");

  useEffect(() => {
    if (!user?.id) return;
    API.get(`/users/${user.id}`).then(r => { setProfile(r.data); setForm(r.data); }).catch(() => {});
    API.get(`/subscriptions/user/${user.id}`).then(r => setSub(r.data)).catch(() => {});
  }, [user?.id]);

  const set = k => v => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      await API.put(`/users/${user.id}`, form);
      setProfile(form); setEditing(false);
      setSuccess("Profile updated!"); setTimeout(() => setSuccess(""), 3000);
    } catch (err) { setError(err.response?.data?.message || "Update failed."); }
    finally { setSaving(false); }
  };

  if (!profile) return <div className="loading">Loading profile...</div>;
  const isAdmin = profile.role === "ADMIN" || profile.role === "ROLE_ADMIN";

  const F = ({ label, k, type="text", opts }) => (
    <div className="form-group">
      <label className="label">{label}</label>
      {opts
        ? <select className="input" value={form[k]||""} onChange={e => set(k)(e.target.value)}>{opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select>
        : <input className="input" type={type} value={form[k]||""} onChange={e => set(k)(e.target.value)} />
      }
    </div>
  );

  return (
    <div className="page fade-up">
      <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24 }}>
        <div style={{ width:60, height:60, borderRadius:"50%", background:"rgba(0,153,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"var(--font-display)", fontSize:22, fontWeight:800, color:"var(--accent2)", flexShrink:0 }}>
          {profile.firstName?.[0] || profile.username?.[0] || "U"}
        </div>
        <div>
          <h1 style={{ fontFamily:"var(--font-display)", fontSize:20, fontWeight:800, color:"var(--text)", marginBottom:4 }}>{profile.firstName} {profile.lastName||""}</h1>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <span style={{ fontSize:13, color:"var(--muted)" }}>@{profile.username}</span>
            {isAdmin && <span className="badge badge-red" style={{ fontSize:10 }}>Admin</span>}
            {sub?.status==="ACTIVE" && <span className="badge badge-green" style={{ fontSize:10 }}>{sub.plan} Plan</span>}
          </div>
        </div>
        <button className="btn btn-danger" style={{ marginLeft:"auto", fontSize:13 }} onClick={() => { logout(); navigate("/login"); }}>Sign Out</button>
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom:14 }}>✅ {success}</div>}
      {error   && <div className="alert alert-error"   style={{ marginBottom:14 }}>⚠️ {error}</div>}

      <div style={{ display:"flex", gap:8, marginBottom:22 }}>
        {["profile","targets","subscription"].map(t => (
          <button key={t} onClick={() => setTab(t)} className="btn"
            style={{ padding:"7px 16px", fontSize:13, fontWeight:tab===t?700:400, background:tab===t?"var(--accent)":"var(--card)", color:tab===t?"#0a0e1a":"var(--muted)", border:"1px solid var(--border)", textTransform:"capitalize" }}>
            {t === "targets" ? "Daily Targets" : t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "profile" && (
        <div className="card">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <div style={{ fontSize:14, fontWeight:700 }}>Personal Information</div>
            {!editing
              ? <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={() => setEditing(true)}>Edit</button>
              : <div style={{ display:"flex", gap:8 }}><button className="btn btn-primary" style={{ fontSize:13 }} onClick={handleSave} disabled={saving}>{saving?"Saving...":"Save"}</button><button className="btn btn-ghost" style={{ fontSize:13 }} onClick={() => { setEditing(false); setForm(profile); }}>Cancel</button></div>
            }
          </div>
          {editing
            ? <div className="form-grid">
                <F label="First Name"    k="firstName" /><F label="Last Name"     k="lastName" />
                <F label="Email"         k="email"     type="email" /><F label="Age" k="age" type="number" />
                <F label="Weight (kg)"   k="weight"    type="number" /><F label="Height (m)" k="height" type="number" />
                <F label="Gender" k="gender" opts={[{v:"MALE",l:"Male"},{v:"FEMALE",l:"Female"},{v:"OTHER",l:"Other"}]} />
                <F label="Fitness Goal"  k="fitnessGoal"   opts={[{v:"WEIGHT_LOSS",l:"Weight Loss"},{v:"MUSCLE_GAIN",l:"Muscle Gain"},{v:"MAINTAIN_WEIGHT",l:"Maintain"},{v:"IMPROVE_FITNESS",l:"Improve Fitness"}]} />
                <F label="Activity Level" k="activityLevel" opts={[{v:"SEDENTARY",l:"Sedentary"},{v:"LIGHTLY_ACTIVE",l:"Lightly Active"},{v:"MODERATELY_ACTIVE",l:"Moderately Active"},{v:"VERY_ACTIVE",l:"Very Active"},{v:"EXTRA_ACTIVE",l:"Extra Active"}]} />
              </div>
            : <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                {[["Name",`${profile.firstName||""} ${profile.lastName||""}`],["Username",`@${profile.username}`],["Email",profile.email],["Age",profile.age?`${profile.age} yrs`:"—"],["Gender",profile.gender||"—"],["Weight",profile.weight?`${profile.weight} kg`:"—"],["Height",profile.height?`${profile.height} m`:"—"],["Goal",profile.fitnessGoal?.replace(/_/g," ")||"—"],["Activity",profile.activityLevel?.replace(/_/g," ")||"—"],["Member since",profile.createdAt?.split("T")[0]||"—"]].map(([k,v]) => (
                  <div key={k} style={{ background:"var(--bg2)", borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ fontSize:10, color:"var(--muted)", marginBottom:3 }}>{k}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{v||"—"}</div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {tab === "targets" && (
        <div className="card">
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:18 }}>
            <div style={{ fontSize:14, fontWeight:700 }}>Daily Targets</div>
            {!editing
              ? <button className="btn btn-ghost" style={{ fontSize:13 }} onClick={() => setEditing(true)}>Edit</button>
              : <div style={{ display:"flex", gap:8 }}><button className="btn btn-primary" style={{ fontSize:13 }} onClick={handleSave} disabled={saving}>{saving?"Saving...":"Save"}</button><button className="btn btn-ghost" style={{ fontSize:13 }} onClick={() => { setEditing(false); setForm(profile); }}>Cancel</button></div>
            }
          </div>
          {editing
            ? <div className="form-grid">
                <div className="form-group"><label className="label">Calorie Target (kcal)</label><input className="input" type="number" value={form.dailyCalorieTarget||""} onChange={e => set("dailyCalorieTarget")(+e.target.value)} placeholder="2000" /></div>
                <div className="form-group full"><label className="label">Water Target (ml)</label><input className="input" type="number" value={form.dailyWaterTarget||""} onChange={e => set("dailyWaterTarget")(+e.target.value)} placeholder="2500" /></div>
              </div>
            : <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:14 }}>
                {[{ l:"Daily Calories", v:profile.dailyCalorieTarget, u:"kcal", c:"var(--accent3)", i:"🔥" },{ l:"Daily Water", v:profile.dailyWaterTarget, u:"ml", c:"var(--accent2)", i:"💧" }].map(t => (
                  <div key={t.l} style={{ background:"var(--bg2)", borderRadius:10, padding:16, borderTop:`3px solid ${t.c}` }}>
                    <div style={{ fontSize:20, marginBottom:8 }}>{t.i}</div>
                    <div style={{ fontSize:10, color:"var(--muted)", textTransform:"uppercase", letterSpacing:"0.06em", marginBottom:4 }}>{t.l}</div>
                    <div style={{ fontFamily:"var(--font-display)", fontSize:24, fontWeight:800, color:t.c }}>{t.v?.toLocaleString()||"—"}<span style={{ fontSize:11, color:"var(--muted)", marginLeft:3 }}>{t.u}</span></div>
                  </div>
                ))}
              </div>
          }
        </div>
      )}

      {tab === "subscription" && (
        sub
          ? <div className="card">
              <div style={{ fontSize:14, fontWeight:700, marginBottom:18 }}>Current Subscription</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:18 }}>
                {[["Plan",sub.plan],["Status",sub.status],["Amount",sub.amount?`₦${Number(sub.amount).toLocaleString()}`:"Free"],["Started",sub.startDate],["Expires",sub.endDate],["Days Left",sub.daysRemaining?`${sub.daysRemaining} days`:"—"]].map(([k,v]) => (
                  <div key={k} style={{ background:"var(--bg2)", borderRadius:8, padding:"10px 12px" }}>
                    <div style={{ fontSize:10, color:"var(--muted)", marginBottom:3 }}>{k}</div>
                    <div style={{ fontSize:13, fontWeight:600, color:k==="Status"&&v==="ACTIVE"?"var(--accent)":k==="Status"?"var(--accent3)":"var(--text)" }}>{v||"—"}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button className="btn btn-primary" style={{ fontSize:13 }} onClick={() => navigate("/pricing")}>Upgrade / Renew</button>
                {sub.status === "ACTIVE" && (
                  <button className="btn btn-ghost" style={{ fontSize:13, color:"var(--accent3)" }}
                    onClick={async () => { if (window.confirm("Cancel subscription?")) { try { await API.post(`/subscriptions/user/${user.id}/cancel`); setSub(s => ({ ...s, status:"CANCELLED" })); setSuccess("Subscription cancelled."); } catch { setError("Could not cancel."); } } }}>
                    Cancel Subscription
                  </button>
                )}
              </div>
            </div>
          : <div className="card" style={{ textAlign:"center", padding:40 }}>
              <div style={{ fontSize:28, marginBottom:12 }}>📋</div>
              <div style={{ color:"var(--muted)", marginBottom:18 }}>No active subscription found.</div>
              <button className="btn btn-primary" onClick={() => navigate("/pricing")}>View Plans →</button>
            </div>
      )}
    </div>
  );
}
