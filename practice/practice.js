// The student's practice page: reads the link, loads the bank files for those lessons, chooses the questions
// (the same link always gives the same set), builds them as the usual lesson games, then starts games.js.
// Link: index.html?student=<code>&who=<name>&l=gt-3,gt-4,v-1&focus=gt-4&n=10&d=2026-11-10 (see SCHEMA.md).
(function () {
  var P = window.PRACTICE;
  var Q = new URLSearchParams(location.search);
  var main = document.querySelector("main");
  var head = document.querySelector("header.top");

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function list(v) {
    var seen = {};
    return String(v || "").toLowerCase().split(/[\s,]+/).filter(function (x) { if (!x || seen[x] || P.IDS.indexOf(x) < 0) return false; seen[x] = 1; return true; });
  }
  function today() { var t = new Date(); return t.getFullYear() + "-" + ("0" + (t.getMonth() + 1)).slice(-2) + "-" + ("0" + t.getDate()).slice(-2); }

  // ---------- Seeded random: the same student + date always gives the same numbers ----------
  function hash(str) {
    var h = 2166136261 >>> 0;
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
    return h >>> 0;
  }
  function rng(seed) {
    var a = hash(seed) || 1;
    return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function shuffle(arr, rnd) { var a = arr.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  // ---------- Read the link ----------
  var code = String(Q.get("student") || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);
  var name = String(Q.get("who") || "").trim().replace(/[<>]/g, "").slice(0, 60);
  var d = /^\d{4}-\d{2}-\d{2}$/.test(Q.get("d") || "") ? Q.get("d") : today();
  var n = parseInt(Q.get("n"), 10); if (!(n > 0)) n = 10; n = Math.min(n, 40);
  var want = list(Q.get("l"));
  var focusWant = list(Q.get("focus")).filter(function (id) { return want.indexOf(id) > -1; });
  var ITEM = "practice-" + d;

  function broken() {
    document.title = "Your Practice";
    head.innerHTML = "";
    head.append(el("p", "eyebrow", "Practice from Bill's English lessons"), el("h1", null, "Your practice"));
    main.innerHTML = "";
    var box = el("div", "rule");
    box.append(el("p", null, "This practice link isn't complete. Ask Bill for a new one."));
    box.append(el("p", "hint", "If you copied the link from a message, check that you copied all of it."));
    main.append(box);
    main.hidden = false;
  }
  if (!want.length) { broken(); return; }

  P.load(want, "", function () {
    var ok = want.filter(function (id) { return P.lessons[id]; });
    if (!ok.length) { broken(); return; }
    try { build(ok); } catch (e) { broken(); if (window.console) console.error(e); }
  });

  // ---------- Choose the set ----------
  // About half from the focus lessons (if any), the rest spread across the other lessons in turn.
  // Within a lesson, the next question is the kind used least so far, so each set has a mix of kinds.
  function choose(ids, focus, total, rnd) {
    var pools = {}, chosen = [], kinds = { pick: 0, type: 0, spot: 0, order: 0 };
    ids.forEach(function (id) { pools[id] = shuffle(P.lessons[id].items.filter(function (it) { return !P.problem(it); }), rnd); });
    var taken = {};
    function from(lessonIds, count) {
      var order = shuffle(lessonIds, rnd), got = 0, more = true;
      while (got < count && more) {
        more = false;
        for (var k = 0; k < order.length && got < count; k++) {
          var pool = pools[order[k]].filter(function (it) { return !taken[it.id]; });
          if (!pool.length) continue;
          more = true;
          var best = pool[0];
          pool.forEach(function (it) { if (kinds[it.type] < kinds[best.type]) best = it; });
          taken[best.id] = 1; kinds[best.type]++; got++;
          chosen.push({ lesson: order[k], item: best });
        }
      }
      return got;
    }
    var others = ids.filter(function (id) { return focus.indexOf(id) < 0; });
    if (focus.length && others.length) {
      var half = Math.round(total / 2);
      var gotF = from(focus, half);
      var gotO = from(others, total - gotF);
      if (gotF + gotO < total) from(focus, total - gotF - gotO);
    } else {
      from(ids, total);
    }
    return chosen;
  }

  // ---------- Build the games (the same markup as the worksheets) ----------
  var KINDS = [
    { type: "pick", cls: "g-pick", h: "Choose the right word", how: "Tap the right word for each gap." },
    { type: "spot", cls: "g-spot", h: "Find the mistake", how: "Tap the wrong word or words, then choose the correct words. If the sentence is correct, tap No mistake." },
    { type: "type", cls: "g-type", h: "Type the missing word", how: "Type the missing word or words, then tap Check. Hint shows how the answer starts." },
    { type: "order", cls: "g-order", h: "Put the words in order", how: "Tap the words in the right order to make a sentence. Tap a word in your sentence to send it back." }
  ];
  function gapLine(li, q, middle) {
    var parts = String(q).split("___");
    li.append(document.createTextNode(parts[0]));
    middle.forEach(function (m) { li.append(m); });
    li.append(document.createTextNode(parts.slice(1).join("___")));
  }
  function hidden() { var f = document.createElement("input"); f.type = "hidden"; f.className = "blank"; return f; }
  function makeItem(type, x, rnd, num) {
    var it = x.item, li = el("li");
    li.dataset.why = it.why;
    li.dataset.pid = it.id;
    li.dataset.lesson = x.lesson;
    if (type === "pick") {
      var opts = shuffle(it.opts, rnd);
      li.dataset.a = String(opts.indexOf(it.a));
      li.dataset.form = it.a;
      li.dataset.q = it.q;
      var gap = el("span", "gap game-ui"), box = el("span", "opts game-ui");
      opts.forEach(function (o) { var b = el("button", null, o); b.type = "button"; box.append(b); });
      gapLine(li, it.q, [gap, hidden()]);
      li.append(document.createTextNode(" "), box);
    } else if (type === "type") {
      var a = (Array.isArray(it.a) ? it.a : [it.a]).map(function (s) { return String(s).trim(); }).filter(Boolean);
      li.dataset.q = it.q;
      var f = document.createElement("input");
      f.type = "text"; f.className = "blank mid"; f.setAttribute("aria-label", "Answer " + num);
      f.autocomplete = "off"; f.spellcheck = false; f.setAttribute("autocapitalize", "off"); f.dataset.ok = a.join("|");
      gapLine(li, it.q, [f]);
    } else if (type === "spot") {
      li.dataset.q = it.q;
      li.dataset.bad = String(it.bad || "").trim();
      li.dataset.fix = li.dataset.bad ? it.fix : "";
      li.dataset.opts = li.dataset.bad ? shuffle(P.spotOpts(it), rnd).join(",") : "";
      li.append(el("span", "sent", it.q), hidden());
    } else if (type === "order") {
      var ans = String(it.a).trim();
      li.dataset.answer = ans;
      if (it.alt && it.alt.length) li.dataset.alt = it.alt.join("|");
      if (it.names && it.names.length) li.dataset.names = [].concat(it.names).join(",");
      li.dataset.q = "Put the words in order: " + ans;
      li.append(hidden());
    }
    return li;
  }

  function build(ok) {
    var rnd = rng(code + "|" + d);
    var focus = focusWant.filter(function (id) { return ok.indexOf(id) > -1; });
    var set = choose(ok, focus, n, rnd);
    if (!set.length) { broken(); return; }

    var when = (function () { var p = d.split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }); })();
    document.title = "Your Practice for " + when;
    document.body.dataset.item = ITEM;
    document.body.dataset.mastered = "Practice complete!";

    // Header
    head.innerHTML = "";
    head.append(el("p", "eyebrow", (name ? "Hi " + name + " · " : "") + "Practice from Bill's English lessons"));
    head.append(el("h1", null, "Your practice for " + when));
    var lessonsUsed = ok.filter(function (id) { return set.some(function (x) { return x.lesson === id; }); });
    head.append(el("p", "lead", set.length + " question" + (set.length > 1 ? "s" : "") + " from lesson" + (lessonsUsed.length > 1 ? "s" : "") + " you've done. Not sure? Have a guess."));
    var tools = el("div", "tools");
    var redo = el("button", "ghost", "Start this practice again"); redo.type = "button";
    redo.addEventListener("click", function () {
      if (!confirm("Clear your answers and start this practice again?")) return;
      if (window.lessonGames) window.lessonGames.reset();
      try { localStorage.removeItem(FIRST); } catch (e) {}
      location.reload();
    });
    tools.append(el("span", "hint", "Green dot = right first time. A wrong answer shows you why. Your progress stays on this device."), redo);
    head.append(tools);

    // Exercises, grouped by kind
    main.innerHTML = "";
    var part = 0;
    KINDS.forEach(function (k) {
      var xs = shuffle(set.filter(function (x) { return x.item.type === k.type; }), rnd);
      if (!xs.length) return;
      part++;
      var g = k.type + "-" + hash(xs.map(function (x) { return x.item.id; }).join(",")).toString(36);
      var h = el("h2", "ex", "Part " + part + ": " + k.h); h.id = "part" + part;
      var ol = el("ol", k.cls); ol.dataset.g = g;
      if (k.type === "spot" && xs.some(function (x) { return !String(x.item.bad || "").trim(); })) ol.setAttribute("data-allow-ok", "");
      xs.forEach(function (x, i) { ol.append(makeItem(k.type, x, rnd, i + 1)); });
      main.append(h, el("p", null, k.how), ol);
    });

    // Which lessons this covers, with links to the worksheets
    var cov = el("section", "covers");
    cov.append(el("h2", "ex", "This practice covers"));
    var ul = el("ul");
    lessonsUsed.forEach(function (id) {
      var L = P.lessons[id], li = el("li"), a = el("a", null, L.title);
      a.href = "../" + L.page; a.target = "_blank"; a.rel = "noopener";
      li.append(a);
      var c = set.filter(function (x) { return x.lesson === id; }).length;
      li.append(document.createTextNode(" (" + c + " question" + (c > 1 ? "s" : "") + ")"));
      ul.append(li);
    });
    cov.append(ul, el("p", "hint", "Want to look again? Open the worksheet. Your answers there are kept separately."));
    main.append(cov);
    main.hidden = false;

    // Remember the first thing typed in each "type" question, so Bill can see the mistake (games.js keeps only the right answer).
    var FIRST = "practice-first-" + ITEM + "-" + hash(set.map(function (x) { return x.item.id; }).join(",")).toString(36);
    var first = {};
    try { first = JSON.parse(localStorage.getItem(FIRST) || "{}") || {}; } catch (e) {}
    function noteFirst(f) {
      var li = f && f.closest(".g-type > li");
      if (!li || li.classList.contains("done") || first[li.dataset.pid] != null || !f.value.trim()) return;
      first[li.dataset.pid] = f.value.trim();
      try { localStorage.setItem(FIRST, JSON.stringify(first)); } catch (e) {}
    }
    document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest(".g-type .g-check"); if (b) noteFirst(b.closest("li").querySelector("input.blank")); }, true);
    document.addEventListener("keydown", function (e) { if (e.key === "Enter" && e.target.matches && e.target.matches(".g-type input.blank")) noteFirst(e.target); }, true);

    // Now the page is built: start the games, then the connection to Bill's spreadsheet, then the Send box.
    addScript("../games.js?v=1794400000", function () {
      addScript("../api.js?v=1792889681", function () { sendBox(set, ok, focus, first); });
    });
  }
  function addScript(src, then) {
    var s = document.createElement("script"); s.src = src;
    s.onload = then; s.onerror = then;
    document.body.appendChild(s);
  }

  // ---------- "Send my practice to Bill" ----------
  // Same submitWork call as work.js on the worksheets (sections of q/a, so Bill's sheet shows it as usual),
  // with each question labelled "[item id · result]", plus an extra "practice" field with the details per item.
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function slug(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) || "student"; }
  function who() {
    var saved = store("pron.me");
    if (code) return { code: code, name: name || (saved && saved.code === code ? saved.name : "") };
    return saved && saved.code ? saved : { code: "", name: "" };
  }
  function rightAnswer(it) {
    if (it.type === "pick") return it.a;
    if (it.type === "type") return [].concat(it.a).join(" / ");
    if (it.type === "order") return it.a;
    if (it.type === "spot") return String(it.bad || "").trim() ? it.bad + " → " + it.fix : "Correct, no mistake";
    return "";
  }
  function collect(set, ok, focus, first) {
    var state = {};
    try { state = JSON.parse(localStorage.getItem("game-" + location.pathname + "#" + ITEM) || "{}") || {}; } catch (e) {}
    var byId = {}; set.forEach(function (x) { byId[x.item.id] = x; });
    var sections = [], items = [], key = [], num = 0, done = 0, firstTry = 0;
    main.querySelectorAll("ol[data-g]").forEach(function (ol) {
      var st = state[ol.dataset.g] || {};
      var h = (function (p) { while (p && p.tagName !== "H2") p = p.previousElementSibling; return p ? p.textContent.trim() : ""; })(ol.previousElementSibling);
      var sec = { h: h, qs: [] };
      Array.prototype.forEach.call(ol.children, function (li, i) {
        var x = byId[li.dataset.pid]; if (!x) return;
        var it = x.item, s = st[i] || {}, miss = s.miss || 0, isDone = !!s.done || li.classList.contains("done");
        var f = li.querySelector("input.blank");
        var answer = f ? f.value.trim() : "";
        var result = isDone ? (miss ? "later" : "first") : (miss ? "trying" : "open");
        var label = result === "first" ? "✓ first try" : result === "later" ? "✓ after " + miss + " wrong" : result === "trying" ? "✗ not finished, " + miss + " wrong" : "not answered";
        if (it.type === "type" && miss && first[it.id] && answer.toLowerCase() !== first[it.id].toLowerCase()) answer += " (first try: " + first[it.id] + ")";
        num++; if (isDone) done++; if (result === "first") firstTry++;
        sec.qs.push({ q: "[" + it.id + " · " + label + "] " + li.dataset.q, a: answer });
        key.push(num + ". " + it.id + ": " + rightAnswer(it));
        items.push({ n: num, lesson: x.lesson, id: it.id, type: it.type, q: li.dataset.q, answer: answer, correct: rightAnswer(it),
          result: result, firstTry: result === "first", done: isDone, wrong: miss, firstAnswer: it.type === "type" ? (first[it.id] || "") : "" });
      });
      if (sec.qs.length) sections.push(sec);
    });
    sections.unshift({ h: "Practice summary", qs: [
      { q: "Right first time", a: firstTry + " of " + num + (done < num ? " (" + done + " finished)" : "") },
      { q: "Lessons", a: ok.join(", ") + (focus.length ? " (focus: " + focus.join(", ") + ")" : "") }
    ] });
    return { sections: sections, key: key.join("\n"), done: done,
      practice: { set: ITEM, date: d, lessons: ok, focus: focus, n: n, total: num, done: done, firstTry: firstTry, items: items } };
  }
  function sendBox(set, ok, focus, first) {
    if (!window.google || !google.script) return;
    var box = el("section", "send-box");
    box.append(el("h2", "ex", "Finished? Send my practice to Bill"));
    box.append(el("p", "hint", "Bill will see which questions you got right first time, so he knows what to practise with you next."));
    var me = who(), nameIn = null;
    if (!me.name) {
      var lab = el("label", "send-name"); lab.append(el("span", null, "Your name"));
      nameIn = document.createElement("input"); nameIn.type = "text"; nameIn.className = "blank long"; nameIn.autocomplete = "name"; nameIn.placeholder = "First name and last initial";
      lab.append(nameIn); box.append(lab);
    }
    var note = document.createElement("textarea"); note.className = "blank area"; note.rows = 2;
    note.placeholder = "A message for Bill (optional), for example a question you're not sure about";
    note.setAttribute("aria-label", "A message for Bill (optional)");
    box.append(note);
    var row = el("div", "send-row"), btn = el("button", null, "Send my practice to Bill"); btn.type = "button";
    var msg = el("p", "send-msg"); msg.setAttribute("aria-live", "polite");
    row.append(btn); box.append(row, msg);
    var sentKey = "work-sent-" + location.pathname + "#" + ITEM;
    var last = store(sentKey);
    if (last) msg.textContent = "You sent this practice on " + new Date(last).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }) + ". If you do more, you can send it again.";
    main.insertBefore(box, main.querySelector(".covers"));

    btn.addEventListener("click", function () {
      var m = who();
      if (!m.name && nameIn) {
        var nm = nameIn.value.trim().replace(/[<>]/g, "");
        if (!nm) { msg.className = "send-msg bad"; msg.textContent = "Please type your name first."; nameIn.focus(); return; }
        m = { code: m.code || slug(nm) + "-" + Math.random().toString(36).slice(2, 5), name: nm };
        store("pron.me", m);
      }
      if (!m.code) m.code = slug(m.name) + "-" + Math.random().toString(36).slice(2, 5);
      var data = collect(set, ok, focus, first);
      if (!data.done && !data.practice.items.some(function (x) { return x.wrong; }) && !note.value.trim()) {
        msg.className = "send-msg bad"; msg.textContent = "Answer some questions first, then send them."; return;
      }
      btn.disabled = true; msg.className = "send-msg"; msg.textContent = "Sending…";
      google.script.run.withSuccessHandler(function () {
        btn.disabled = false; store(sentKey, Date.now());
        msg.className = "send-msg ok"; msg.textContent = "Sent. Thank you! Bill has your practice.";
      }).withFailureHandler(function () {
        btn.disabled = false; msg.className = "send-msg bad"; msg.textContent = "Sorry, it did not send. Check your internet and try again in a minute.";
      }).submitWork({
        student: m.code, who: m.name, item: ITEM, title: (document.querySelector("h1") || {}).textContent || ITEM,
        page: location.pathname, note: note.value.trim(), sections: data.sections, sorts: [], key: data.key,
        practice: data.practice
      });
    });
  }
})();
