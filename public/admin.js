// PSUT MailBox - admin portal
(function () {
  const { t } = window.I18n;
  const $ = (id) => document.getElementById(id);
  let all = [];
  let current = null;
  let folder = ""; // status filter from the sidebar

  // ---------- helpers
  function toast(msg) {
    const t = $("toast");
    window.I18n.label(t, msg);
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2400);
  }
  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(window.I18n.lang === "ar" ? "ar-JO" : "en-GB", { year: "numeric", month: "short", day: "numeric" }) +
      ", " + d.toLocaleTimeString(window.I18n.lang === "ar" ? "ar-JO" : "en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function tag(text, cls) {
    return el("span", "tag " + cls, t(text));
  }
  function statusTag(s) {
    return tag(s, "tag-" + s.replace(/\s+/g, "-"));
  }
  async function api(url, opts = {}) {
    let res;
    try {
      res = await fetch(url, {
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        ...opts,
      });
    } catch (_) {
      $("offline").classList.remove("hidden");
      throw new Error("Can't reach the server. Is start.bat running?");
    }
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      showLogin();
      throw new Error("Your session expired. Please sign in again.");
    }
    if (!res.ok) throw new Error(data.error || "Request failed.");
    return data;
  }

  // ---------- views
  function showLogin() {
    $("loginView").classList.remove("hidden");
    $("dashView").classList.add("hidden");
    $("logoutBtn").classList.add("hidden");
    $("password").focus();
  }
  function showDash() {
    $("loginView").classList.add("hidden");
    $("dashView").classList.remove("hidden");
    $("logoutBtn").classList.remove("hidden");
    load();
  }

  // ---------- login / logout
  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = $("loginError");
    err.classList.remove("show");
    try {
      let res;
      try {
        res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: $("password").value }),
        });
      } catch (_) {
        throw new Error("Can't reach the server. Is start.bat running?");
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Sign in failed.");
      $("password").value = "";
      showDash();
    } catch (ex) {
      window.I18n.label(err, ex.message);
      err.classList.add("show");
    }
  });

  $("logoutBtn").addEventListener("click", async () => {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    all = [];
    showLogin();
  });

  // ---------- data
  async function load() {
    try {
      const data = await api("/api/admin/submissions");
      all = data.submissions;
      render();
    } catch (ex) {
      toast(ex.message);
    }
  }

  function filtered() {
    const q = $("fSearch").value.trim().toLowerCase();
    const cat = $("fCategory").value;
    const type = $("fType").value;
    const ident = $("fIdentity").value;
    return all.filter((s) => {
      if (folder && s.status !== folder) return false;
      if (cat && s.category !== cat) return false;
      if (type && s.type !== type) return false;
      if (ident === "anon" && !s.anonymous) return false;
      if (ident === "named" && s.anonymous) return false;
      if (q) {
        const hay = [s.ref, s.subject, s.message, s.name, s.studentId, s.email].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function render() {
    const count = (st) => all.filter((s) => s.status === st).length;
    $("cAll").textContent = $("cAll2").textContent = all.length;
    $("cNew").textContent = count("New");
    $("cReview").textContent = count("In Review");
    $("cResolved").textContent = count("Resolved");
    $("cDismissed").textContent = count("Dismissed");
    $("cAnon").textContent = all.filter((s) => s.anonymous).length;

    const list = filtered();
    $("viewTitle").textContent = t(folder || "All messages");
    $("viewSub").textContent = window.I18n.lang === "ar" ? "عدد الرسائل: " + list.length : "Showing " + list.length + (list.length === 1 ? " message" : " messages");

    const tbody = $("rows");
    tbody.replaceChildren();
    list.forEach((s) => {
      const tr = document.createElement("tr");
      tr.tabIndex = 0;
      if (s.status === "New") tr.className = "unread";

      const tdSub = el("td");
      tdSub.append(el("div", "subj", s.subject), el("div", "prev", s.message));

      const tdType = el("td");
      tdType.append(tag(s.type, "tag-type"));

      const tdFrom = el("td", "nowrap");
      if (s.anonymous) tdFrom.append(tag("Anonymous", "tag-anon"));
      else tdFrom.textContent = s.name;

      const tdStatus = el("td");
      tdStatus.append(statusTag(s.status));

      const tdRef = el("td");
      tdRef.append(el("span", "mono", s.ref));

      tr.append(tdSub, el("td", "nowrap", t(s.category)), tdType, tdFrom, tdStatus,
        el("td", "nowrap", fmtDate(s.createdAt)), tdRef);

      tr.addEventListener("click", () => openDrawer(s));
      tr.addEventListener("keydown", (e) => { if (e.key === "Enter") openDrawer(s); });
      tbody.append(tr);
    });
    $("emptyState").classList.toggle("hidden", list.length > 0);
  }

  // ---------- sidebar folders
  $("folders").addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    folder = btn.dataset.status;
    document.querySelectorAll("#folders button").forEach((b) => b.classList.toggle("active", b === btn));
    render();
  });

  // ---------- drawer
  function openDrawer(s) {
    current = s;
    $("mRef").textContent = s.ref;
    $("mSubject").textContent = s.subject;
    $("mType").textContent = t(s.type);
    $("mCategory").textContent = t(s.category);
    $("mDate").textContent = fmtDate(s.createdAt);
    $("mUpdated").textContent = fmtDate(s.updatedAt);
    $("mFrom").replaceChildren(s.anonymous ? tag("Anonymous", "tag-anon") : document.createTextNode(s.name));
    $("mSid").textContent = s.studentId || "—";
    $("mEmail").replaceChildren();
    if (s.email) {
      const a = el("a", "", s.email);
      a.href = "mailto:" + s.email + "?subject=" + encodeURIComponent("Re: " + s.subject + " [" + s.ref + "]");
      $("mEmail").append(a);
    } else {
      $("mEmail").textContent = "—";
    }
    $("mMessage").textContent = s.message;
    $("mStatus").value = s.status;
    $("mNote").value = s.adminNote || "";
    $("scrim").classList.add("show");
    $("drawer").classList.add("show");
  }
  function closeDrawer() {
    $("scrim").classList.remove("show");
    $("drawer").classList.remove("show");
    current = null;
  }
  $("drawerClose").addEventListener("click", closeDrawer);
  $("scrim").addEventListener("click", closeDrawer);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); });

  $("mSave").addEventListener("click", async () => {
    if (!current) return;
    try {
      const data = await api("/api/admin/submissions/" + current.id, {
        method: "PATCH",
        body: JSON.stringify({ status: $("mStatus").value, adminNote: $("mNote").value }),
      });
      const i = all.findIndex((x) => x.id === current.id);
      if (i >= 0) all[i] = data.submission;
      render();
      closeDrawer();
      toast("Changes saved");
    } catch (ex) {
      toast(ex.message);
    }
  });

  $("mDelete").addEventListener("click", async () => {
    if (!current) return;
    if (!confirm(window.I18n.lang === "ar" ? "حذف " + current.ref + " نهائياً؟ لا يمكن التراجع عن هذا الإجراء." : "Delete " + current.ref + " permanently? This cannot be undone.")) return;
    try {
      await api("/api/admin/submissions/" + current.id, { method: "DELETE" });
      all = all.filter((x) => x.id !== current.id);
      render();
      closeDrawer();
      toast("Message deleted");
    } catch (ex) {
      toast(ex.message);
    }
  });

  // ---------- filters / actions
  ["fSearch", "fCategory", "fType", "fIdentity"].forEach((id) => $(id).addEventListener("input", render));
  $("refreshBtn").addEventListener("click", () => load().then(() => toast("Inbox refreshed")));

  $("exportBtn").addEventListener("click", () => {
    const list = filtered();
    const cols = ["ref", "createdAt", "type", "category", "subject", "message", "anonymous", "name", "studentId", "email", "status", "adminNote"];
    const esc = (v) => {
      let s = v === null || v === undefined ? "" : String(v);
      if (/^[=+\-@]/.test(s)) s = "'" + s; // prevent spreadsheet formula injection
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const csv = [cols.join(",")].concat(list.map((s) => cols.map((c) => esc(s[c])).join(","))).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "psut-mailbox-" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  window.addEventListener('languagechange', () => {
    render();
    if (current) {
      $("mType").textContent = t(current.type);
      $("mCategory").textContent = t(current.category);
      $("mDate").textContent = fmtDate(current.createdAt);
      $("mUpdated").textContent = fmtDate(current.updatedAt);
      if (current.anonymous) $("mFrom").replaceChildren(tag("Anonymous", "tag-anon"));
    }
  });
  // ---------- init
  fetch("/api/meta")
    .then((r) => r.json())
    .then((meta) => {
      const fill = (id, items) => items.forEach((v) => {
        const o = document.createElement("option");
        o.value = v; window.I18n.label(o, v);
        $(id).append(o);
      });
      fill("fCategory", meta.categories);
      fill("fType", meta.types);
      fill("mStatus", meta.statuses);
    })
    .catch(() => $("offline").classList.remove("hidden"));

  fetch("/api/admin/session")
    .then((r) => r.json())
    .then((d) => (d.authenticated ? showDash() : showLogin()))
    .catch(() => {
      $("offline").classList.remove("hidden");
      showLogin();
    });
})();
