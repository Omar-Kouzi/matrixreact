import { useEffect, useState } from "react";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { db } from "../assets/firebase/config";
import { getUsers, getAllDocuments, updateDocument } from "../assets/firebase/firestore";
import "../styles/dashboard/AdminPanel.css";

const stages = ["requested", "message_received", "instructions_sent", "payment_received", "active"];
const labels = ["Request sent", "Message received", "Instructions sent", "Payment received", "Subscription active"];
const paymentMethods = [
  ["whatsapp_manual", "Manual / WhatsApp"], ["whish", "Whish"],
  ["bank_transfer", "Bank transfer"], ["cash", "Cash"], ["other", "Other"],
];
function dateText(value) {
  const d = value?.toDate ? value.toDate() : value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toLocaleString() : "Not recorded";
}

export default function Dusers() {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [notes, setNotes] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [u, r] = await Promise.all([getUsers(), getAllDocuments("subscriptionRequests")]);
      setUsers(u);
      setRequests(r.sort((a, b) => {
        const time = (value) => value?.toDate?.()?.getTime?.() || (value ? new Date(value).getTime() : 0);
        return time(b.createdAt) - time(a.createdAt);
      }));
      setNotes((old) => {
        const next = { ...old };
        r.forEach((request) => { if (next[request.id] === undefined) next[request.id] = request.adminNotes || ""; });
        return next;
      });
    } catch (e) {
      setNotice(`Could not load users or requests: ${e.message}`);
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const updateRequest = async (req, patch) => {
    setBusy(req.id); setNotice("");
    const now = new Date();
    const update = { ...patch, updatedAt: now };
    if (patch.status === "message_received") { update.messageReceived = true; update.messageReceivedAt = req.messageReceivedAt || now; }
    if (patch.status === "instructions_sent") { update.messageReceived = true; update.messageReceivedAt = req.messageReceivedAt || now; update.instructionsSent = true; update.instructionsSentAt = req.instructionsSentAt || now; }
    if (patch.status === "payment_received") { update.messageReceived = true; update.messageReceivedAt = req.messageReceivedAt || now; update.instructionsSent = true; update.instructionsSentAt = req.instructionsSentAt || now; update.paymentReceived = true; update.paymentReceivedAt = req.paymentReceivedAt || now; }
    if (patch.status === "active") { update.messageReceived = true; update.messageReceivedAt = req.messageReceivedAt || now; update.instructionsSent = true; update.instructionsSentAt = req.instructionsSentAt || now; update.paymentReceived = true; update.paymentReceivedAt = req.paymentReceivedAt || now; update.activatedAt = req.activatedAt || now; }
    if (patch.status === "requested") { update.messageReceived = false; update.instructionsSent = false; update.paymentReceived = false; }
    try {
      await updateDocument("subscriptionRequests", req.id, update);
      await load(); setNotice("Request tracking updated.");
    } catch (e) { setNotice(`Update failed: ${e.message}`); }
    finally { setBusy(""); }
  };

  const saveNotes = async (req) => {
    setBusy(req.id); setNotice("");
    try {
      await updateDocument("subscriptionRequests", req.id, { adminNotes: notes[req.id] || "", updatedAt: new Date() });
      setNotice("Internal note saved for this request.");
    } catch (e) { setNotice(`Could not save note: ${e.message}`); }
    finally { setBusy(""); }
  };

  const updatePaymentMethod = async (uid, value) => {
    setBusy(uid); setNotice("");
    try {
      await updateDocument("users", uid, { paymentMethod: value, paymentMethodUpdatedAt: new Date() });
      setUsers((old) => old.map((u) => u.id === uid ? { ...u, paymentMethod: value } : u));
      setNotice("Payment method saved.");
    } catch (e) { setNotice(`Could not save payment method: ${e.message}`); }
    finally { setBusy(""); }
  };

  const activate = async (req) => {
    if (!req.paymentReceived && req.status !== "payment_received") {
      setNotice("First verify the payment, then set the request stage to Payment received before activating it.");
      return;
    }
    if (!window.confirm(`Confirm that payment for ${req.plan?.toUpperCase()} has actually arrived before activating this subscription.`)) return;
    setBusy(req.id); setNotice("");
    try {
      const userRef = doc(db, "users", req.uid);
      const userSnapshot = await getDoc(userRef);
      if (!userSnapshot.exists()) throw new Error("The customer profile no longer exists.");
      if (!["plus", "pro"].includes(req.plan)) throw new Error("This request contains an invalid plan.");
      const current = userSnapshot.data();
      const now = new Date();
      const existingEnd = current.subscriptionEndDate?.toDate
        ? current.subscriptionEndDate.toDate()
        : current.subscriptionEndDate ? new Date(current.subscriptionEndDate) : null;
      const start = existingEnd && existingEnd > now ? existingEnd : now;
      const end = new Date(start);
      if (req.billing === "yearly") end.setFullYear(end.getFullYear() + 1);
      else end.setDate(end.getDate() + 30);

      // Update the user's subscription and the request in one atomic batch.
      // This avoids a half-activated state if one of the writes fails.
      const batch = writeBatch(db);
      batch.update(userRef, {
        subscription: req.plan,
        subscriptionBilling: req.billing === "yearly" ? "yearly" : "monthly",
        subscriptionStartDate: start,
        subscriptionEndDate: end,
        subscriptionUpdatedAt: now,
      });
      batch.update(doc(db, "subscriptionRequests", req.id), {
        status: "active",
        messageReceived: true,
        messageReceivedAt: req.messageReceivedAt || now,
        instructionsSent: true,
        instructionsSentAt: req.instructionsSentAt || now,
        paymentReceived: true,
        paymentReceivedAt: req.paymentReceivedAt || now,
        activatedAt: now,
        updatedAt: now,
      });
      await batch.commit();
      await load(); setNotice("Subscription activated after payment confirmation.");
    } catch (e) { setNotice(`Activation failed: ${e.message}`); }
    finally { setBusy(""); }
  };

  const filtered = users.filter((u) => `${u.name || u.fullName || ""} ${u.email || ""} ${u.id}`.toLowerCase().includes(search.toLowerCase()));
  if (loading) return <main className="admin-page page">Loading users and payment requests…</main>;

  return (
    <main className="admin-page page">
      <div className="admin-heading"><span>MEMBERS & PAYMENTS</span><h1>Users and subscriptions</h1><p>Track each customer request from the first WhatsApp message through payment verification and subscription activation.</p></div>
      {notice && <p className="admin-notice" role="status">{notice}</p>}

      <section className="admin-section">
        <div className="admin-section-heading"><div><h2>Subscription request tracker</h2><p>WhatsApp messages cannot be read automatically. Mark a message received when you see it in WhatsApp, then update each stage below.</p></div><button className="admin-button light" onClick={load}>Refresh requests</button></div>
        {requests.length === 0 ? <p className="admin-empty">No requests yet. When a user requests a plan from the Plans page, the request will appear here.</p> : requests.map((req) => {
          const stage = Math.max(0, stages.indexOf(req.status || "requested"));
          const user = users.find((u) => u.id === req.uid);
          const completed = req.status === "cancelled" ? -1 : stage;
          return (
            <article className="admin-request" key={req.id}>
              <div className="admin-request-top"><div><h3>{req.name || "Matrix customer"}</h3><p>{req.email || "No email"} · {req.planName || req.plan?.toUpperCase() || "Plan not set"} · {req.billing || "monthly"}</p><small>Request created: {dateText(req.createdAt)} · User ID: {req.uid || "—"}</small></div><strong>${Number(req.price || 0).toFixed(2)} USD</strong></div>
              <div className="admin-progress" aria-label={`Payment progress: ${Math.max(0, completed + 1)} of 5 steps`}><div className="admin-progress-fill" style={{ width: `${completed < 0 ? 0 : ((completed + 1) / stages.length) * 100}%` }} /></div>
              <div className="admin-progress-labels">{labels.map((label, i) => <span className={i <= completed ? "done" : ""} key={label}>{label}</span>)}</div>
              <div className="admin-request-timeline">
                <div><span>Request created</span><strong>{dateText(req.createdAt)}</strong></div>
                <div><span>Message received</span><strong>{req.messageReceived ? dateText(req.messageReceivedAt || req.updatedAt) : "Not yet marked"}</strong></div>
                <div><span>Instructions sent</span><strong>{req.instructionsSent ? dateText(req.instructionsSentAt || req.updatedAt) : "Not yet marked"}</strong></div>
                <div><span>Payment received</span><strong>{req.paymentReceived ? dateText(req.paymentReceivedAt || req.updatedAt) : "Not yet confirmed"}</strong></div>
                <div><span>Subscription active</span><strong>{req.status === "active" ? dateText(req.activatedAt || req.updatedAt) : "Not active"}</strong></div>
              </div>
              <div className="admin-request-controls">
                <label>Current stage<select value={req.status || "requested"} disabled={busy === req.id} onChange={(e) => updateRequest(req, { status: e.target.value })}><option value="requested">Request sent</option><option value="message_received">Message received</option><option value="instructions_sent">Instructions sent</option><option value="payment_received">Payment received (verified)</option><option value="active" disabled>Subscription active (use activation button)</option><option value="cancelled">Cancelled</option></select></label>
                <label>Payment method<select value={req.paymentMethod || "whatsapp_manual"} disabled={busy === req.id} onChange={(e) => updateRequest(req, { paymentMethod: e.target.value })}>{paymentMethods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <button className="admin-button" disabled={Boolean(busy) || req.status === "active" || req.status === "cancelled"} onClick={() => activate(req)}>Verify payment & activate</button>
              </div>
              <div className="admin-notes-row"><label>Internal admin notes<textarea value={notes[req.id] ?? req.adminNotes ?? ""} onChange={(e) => setNotes((old) => ({ ...old, [req.id]: e.target.value }))} placeholder="Example: contacted on WhatsApp, sent Whish details, waiting for screenshot…" /></label><button className="admin-button light" disabled={busy === req.id} onClick={() => saveNotes(req)}>Save note</button></div>
              <small className="admin-request-foot">User subscription: <strong>{user?.subscription || "free"}</strong> · Last updated: {dateText(req.updatedAt)}</small>
            </article>
          );
        })}
      </section>

      <section className="admin-section">
        <div className="admin-section-heading"><div><h2>All users</h2><p>Set the preferred payment method for each account and check its current subscription expiry.</p></div><input className="admin-search" placeholder="Search name, email, or UID" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
        <div className="admin-user-list">{filtered.map((u) => <article className="admin-user-row" key={u.id}><div className="admin-user-info"><strong>{u.name || u.fullName || u.displayName || "Unnamed user"}</strong><span>{u.email || "No email"}</span><small>{u.id}</small></div><span className={`admin-subscription-pill ${u.subscription || "free"}`}>{(u.subscription || "free").toUpperCase()}</span><div className="admin-user-method"><label>Payment method<select value={u.paymentMethod || "not_set"} disabled={busy === u.id} onChange={(e) => updatePaymentMethod(u.id, e.target.value)}><option value="not_set">Not set</option>{paymentMethods.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><small>Expires: {dateText(u.subscriptionEndDate)}</small></div></article>)}{filtered.length === 0 && <p className="admin-empty">No users match your search.</p>}</div>
      </section>
    </main>
  );
}
