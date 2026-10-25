// "Send my answers to Bill": collects what the student wrote on a worksheet or lesson page and sends it.
// Needs api.js on the page, and <body data-item="trap-3"> (or vocab-1, pron-1...) to say which piece of work this is.
(function () {
  const ITEM = document.body.dataset.item;
  const main = document.querySelector("main");
  if (!ITEM || !main || !window.google) return;

  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function slug(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) || "student"; }
  function el(tag, cls, text) { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function who() {
    const Q = new URLSearchParams(location.search);
    const c = String(Q.get("student") || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
    const saved = store("pron.me");
    if (c) return { code: c, name: (Q.get("who") || "").trim() || (saved && saved.code === c ? saved.name : "") };
    return saved && saved.code ? saved : { code: "", name: "" };
  }
  // Which fields count as answers (not the recorder notes, the word picker, or this box).
  function fields() {
    return Array.prototype.filter.call(main.querySelectorAll("input.blank, textarea.blank, input[type=checkbox][data-k]"), function (f) {
      return !f.closest("details.answers, .rec, #pick, .send-box");
    });
  }
  if (!fields().length && !main.querySelector(".sorter")) return;

  function questionText(f) {
    const host = f.closest("li, td, p") || f.parentNode;
    const tr = f.closest("tr");
    const node = (tr || host).cloneNode(true);
    node.querySelectorAll("input, textarea").forEach(function (x) { x.replaceWith(document.createTextNode(" ___ ")); });
    let t = node.textContent.replace(/\s+/g, " ").trim();
    if (!t || t === "___") {
      // A box on its own line: use the text just before it.
      let prev = (f.closest("p, div") || f).previousElementSibling;
      t = prev ? prev.textContent.replace(/\s+/g, " ").trim() : "Answer";
    }
    return t.slice(0, 300);
  }
  function headingFor(node) {
    let n = node;
    while (n && n !== main) {
      let s = n.previousElementSibling;
      while (s) { if (/^H[23]$/.test(s.tagName)) return s.textContent.trim(); s = s.previousElementSibling; }
      n = n.parentElement;
    }
    return "";
  }
  function collect() {
    const sections = []; let cur = null;
    fields().forEach(function (f) {
      const h = headingFor(f);
      if (!cur || cur.h !== h) { cur = { h: h, qs: [] }; sections.push(cur); }
      cur.qs.push({ q: questionText(f), a: f.type === "checkbox" ? (f.checked ? "Yes" : "No") : f.value });
    });
    const sorts = Array.prototype.map.call(main.querySelectorAll(".sorter"), function (box) {
      const cols = {}; box.querySelectorAll(".col").forEach(function (c) { cols[c.dataset.col] = (c.querySelector(".col-h") || {}).textContent || ""; });
      let right = 0;
      const placed = Array.prototype.map.call(box.querySelectorAll(".chip"), function (c) {
        const col = c.parentNode.dataset.col; const ok = col !== "" && col === c.dataset.a; if (ok) right++;
        return { w: c.textContent.replace(/[✓✗]/g, "").trim(), col: col === "" ? "" : cols[col], ok: ok };
      });
      return { h: headingFor(box), right: right, total: placed.length, placed: placed };
    });
    const keyEl = document.querySelector("details.answers .answers-body");
    // The key is usually folded away, so read its text rather than what is on screen.
    const key = keyEl ? Array.prototype.map.call(keyEl.querySelectorAll("h2, h3, p, li, tr"), function (n) { return n.textContent.replace(/\s+/g, " ").trim(); }).filter(Boolean).join("\n") : "";
    return { sections: sections, sorts: sorts, key: key };
  }

  // The box at the end of the page (before the answer key, so students send before they peek).
  const box = el("section", "send-box");
  box.append(el("h2", "ex", "Finished? Send your answers to Bill"));
  box.append(el("p", "hint", "Bill will see your answers before your next lesson. You can still check them with the answer key afterwards."));
  const me = who();
  let nameIn = null;
  if (!me.name) {
    const lab = el("label", "send-name"); lab.append(el("span", null, "Your name"));
    nameIn = document.createElement("input"); nameIn.type = "text"; nameIn.className = "blank long"; nameIn.autocomplete = "name"; nameIn.placeholder = "First name and last initial";
    lab.append(nameIn); box.append(lab);
  }
  const note = document.createElement("textarea"); note.className = "blank area"; note.rows = 2; note.placeholder = "A message for Bill (optional), for example a question about this worksheet";
  box.append(note);
  const row = el("div", "send-row");
  const btn = el("button", null, "Send my answers to Bill"); btn.type = "button";
  const msg = el("p", "send-msg"); msg.setAttribute("aria-live", "polite");
  row.append(btn); box.append(row, msg);
  const sentKey = "work-sent-" + location.pathname;
  const last = store(sentKey);
  if (last) msg.textContent = "You sent your answers on " + new Date(last).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }) + ". If you change them, you can send them again.";
  const ans = main.querySelector("details.answers");
  if (ans) main.insertBefore(box, ans); else main.appendChild(box);

  btn.addEventListener("click", function () {
    let m = who();
    if (!m.name && nameIn) {
      const n = nameIn.value.trim().replace(/[<>]/g, "");
      if (!n) { msg.className = "send-msg bad"; msg.textContent = "Please type your name first."; nameIn.focus(); return; }
      m = { code: m.code || slug(n) + "-" + Math.random().toString(36).slice(2, 5), name: n };
      store("pron.me", m);
    }
    if (!m.code) m.code = slug(m.name) + "-" + Math.random().toString(36).slice(2, 5);
    const data = collect();
    const filled = data.sections.reduce(function (n, s) { return n + s.qs.filter(function (q) { return q.a && q.a !== "No"; }).length; }, 0)
      + data.sorts.reduce(function (n, s) { return n + s.placed.filter(function (p) { return p.col; }).length; }, 0);
    if (!filled && !note.value.trim()) { msg.className = "send-msg bad"; msg.textContent = "Fill in some answers first, then send them."; return; }
    btn.disabled = true; msg.className = "send-msg"; msg.textContent = "Sending…";
    google.script.run.withSuccessHandler(function () {
      btn.disabled = false; store(sentKey, Date.now());
      msg.className = "send-msg ok"; msg.textContent = "Sent. Bill has your answers. Now open “Check your answers” to see how you did.";
    }).withFailureHandler(function () {
      btn.disabled = false; msg.className = "send-msg bad"; msg.textContent = "Sorry, it did not send. Check your internet and try again in a minute.";
    }).submitWork({
      student: m.code, who: m.name, item: ITEM, title: (document.querySelector("h1") || {}).textContent || ITEM,
      page: location.pathname, note: note.value.trim(), sections: data.sections, sorts: data.sorts, key: data.key
    });
  });
})();
