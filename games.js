// Lesson games: instant feedback for exercises, and a celebration for a perfect score.
// Kinds of game (each inside an exercise):
//   <ol class="g-pick" data-g="name">  each <li data-a="1" data-form="done" data-q="..."> with a <span class="gap"></span>
//         and <span class="opts"><button>make</button>...</span>: tap the right word.
//   <ol class="g-spot" data-g="name" [data-allow-ok]>  each <li data-bad="have met" data-fix="met" data-opts="met,have met" data-q="...">
//         with <span class="sent">sentence</span>: tap the wrong word(s), then pick the fix. data-bad="" = the sentence is correct,
//         and data-allow-ok on the list adds a "No mistake" button.
//   <ol class="g-type" data-g="name">  each <li data-q="..."> with <input class="blank" data-ok="went|have gone">: type, then Check.
//         A Hint shows the first word; after two tries, Show answer appears.
//   <ol class="g-order" data-g="name">  each <li data-answer="Have you ever been to Japan?" [data-alt="other|correct orders"] [data-names="Japan"]>
//         with a hidden <input class="blank">: tap the words to build the sentence. Right words stay; wrong ones go back.
//   <div class="g-match" data-g="name"><ul><li data-l="take a break" data-r="stop working for a while">...</ul></div>
//         (each li holds a hidden <input class="blank">): tap a card, then its partner.
//   <div class="sorter g-sort" data-k="name">  the usual sorter, but each word is marked the moment it lands.
//   <div class="g-write" data-task="..." data-focus="...">  free writing with "Check my writing": Claude checks each sentence
//         through Bill's Writing checker (tools/writing-checker.gs).
// Across the page: a streak counter ("3 in a row!") and a star for each perfect exercise; all stars = "Lesson mastered!".
// Every answer lands in an <input class="blank"> so "Send my answers to Bill" still sends what the student did.
(function () {
  // The Writing checker's Web app URL (from Deploy > New deployment in Google Apps Script). Empty = not switched on yet.
  var CHECK_URL = "https://script.google.com/macros/s/AKfycbwcHoLZKBVnHnWlq9iPzGgDbsP8z0MSFQUpdjWA8TcBrGlcPz98puFF9nqJN2Qbyqu-/exec";
  // Progress is saved per lesson (the page address plus the lesson's name), so two lessons can never share it.
  var KEY = "game-" + location.pathname + "#" + (document.body.dataset.item || document.title);
  var state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function btn(text, cls) { var b = el("button", cls || null, text); b.type = "button"; return b; }
  function flash(n, cls) { n.classList.remove(cls); void n.offsetWidth; n.classList.add(cls); setTimeout(function () { n.classList.remove(cls); }, 700); }
  function fresh(g, kind) { var st = state[g]; if (!st || st.kind !== kind) { st = state[g] = { kind: kind }; } return st; }
  function again(g) { return function () { delete state[g]; save(); location.reload(); }; }

  // ---------- Streak: right first time, several in a row ----------
  var streak = { n: 0,
    hit: function (near) {
      this.n++;
      if (this.n >= 3 && (this.n === 3 || this.n === 5 || this.n % 5 === 0)) {
        var t = el("span", "g-streak", this.n + " in a row!"); t.setAttribute("aria-hidden", "true");
        (near.closest("li, .sorter") || near).append(t); setTimeout(function () { t.remove(); }, 1600);
      }
    },
    miss: function () { this.n = 0; }
  };

  // ---------- Stars: one per exercise, gold when it is perfect ----------
  var stars = { list: [], pill: null,
    add: function (id, label) { this.list.push({ id: id, label: label, v: "" }); },
    set: function (id, v, quiet) {
      var s = this.list.filter(function (x) { return x.id === id; })[0]; if (!s) return;
      var was = s.v; s.v = v; this.draw();
      if (v === "gold" && was !== "gold" && !quiet && this.list.every(function (x) { return x.v === "gold"; })) {
        setTimeout(function () { celebrate(stars.pill, "Lesson mastered!", true); }, 900);
      }
    },
    draw: function () {
      if (!this.list.length) return;
      if (!this.pill) {
        this.pill = el("div", "g-stars game-ui");
        this.pill.setAttribute("role", "status");
        document.body.append(this.pill);
      }
      var gold = this.list.filter(function (x) { return x.v === "gold"; }).length;
      this.pill.innerHTML = "";
      this.list.forEach(function (x) {
        var s = el("span", "g-s " + x.v, "★"); s.title = x.label + (x.v === "gold" ? ": perfect" : x.v ? ": done" : ""); stars.pill.append(s);
      });
      this.pill.append(el("span", "g-s-txt", gold + " of " + this.list.length + " perfect"));
      this.pill.classList.toggle("all", gold === this.list.length);
      this.pill.setAttribute("aria-label", gold + " of " + this.list.length + " exercises perfect");
    }
  };
  function labelFor(node) {
    var h = node.previousElementSibling;
    while (h && !/^H2$/.test(h.tagName)) h = h.previousElementSibling;
    return h ? h.textContent.replace(/:.*/, "").trim() : "Exercise";
  }

  // ---------- The score bar under each game: one dot per question ----------
  function scoreBar(host, total, g) {
    var id = g; stars.add(id, labelFor(host));
    var bar = el("div", "g-bar game-ui");
    var dots = el("div", "g-dots"); dots.setAttribute("aria-hidden", "true");
    for (var i = 0; i < total; i++) dots.append(el("span", "g-dot"));
    var txt = el("p", "g-txt"); txt.setAttribute("aria-live", "polite");
    var tryAgain = btn("Try again for a perfect score", "ghost g-again"); tryAgain.hidden = true;
    tryAgain.addEventListener("click", again(g));
    bar.append(dots, txt, tryAgain);
    host.after(bar);
    return { el: bar,
      update: function (marks, quiet) { // marks: array of "", "first", "later"
        var done = 0, first = 0;
        marks.forEach(function (m, i) { dots.children[i].className = "g-dot" + (m ? " " + m : ""); if (m) done++; if (m === "first") first++; });
        tryAgain.hidden = true;
        if (done < total) { txt.textContent = done ? done + " of " + total + " done, " + first + " right first time." : "Score: right first time = a green dot."; return false; }
        if (first === total) {
          txt.innerHTML = "<strong>Perfect!</strong> " + total + " out of " + total + " right first time.";
          bar.classList.add("perfect"); stars.set(id, "gold", quiet);
          if (!quiet) celebrate(bar);
        } else {
          bar.classList.remove("perfect"); stars.set(id, "done", quiet);
          txt.innerHTML = "<strong>All done!</strong> " + first + " of " + total + " right first time.";
          tryAgain.hidden = false;
        }
        return true;
      }
    };
  }
  function marksOf(st, n) { var m = []; for (var i = 0; i < n; i++) { var s = st[i]; m.push(s && s.done ? (s.miss ? "later" : "first") : ""); } return m; }

  // ---------- Tap the right word ----------
  document.querySelectorAll(".g-pick").forEach(function (list) {
    var g = list.dataset.g, items = Array.prototype.slice.call(list.children);
    var st = fresh(g, "pick");
    var bar = scoreBar(list, items.length, g);
    items.forEach(function (li, i) {
      var gap = li.querySelector(".gap"), opts = li.querySelectorAll(".opts button"), input = li.querySelector("input.blank");
      var s = st[i] || { miss: 0, tried: [] };
      function solve(quietly) {
        gap.textContent = li.dataset.form; gap.classList.add("solved"); li.classList.add("done");
        opts.forEach(function (b, j) { b.disabled = true; if (String(j) === li.dataset.a) b.classList.add("ok"); });
        input.value = li.dataset.form + (s.tried.length ? " (tried first: " + s.tried.join(", ") + ")" : "");
        if (!quietly) flash(gap, "pop");
      }
      opts.forEach(function (b, j) {
        b.type = "button";
        if (s.tried.indexOf(b.textContent) > -1) { b.disabled = true; b.classList.add("bad"); }
        b.addEventListener("click", function () {
          if (li.classList.contains("done")) return;
          if (String(j) === li.dataset.a) {
            s.done = true; st[i] = s; save(); solve(false);
            if (!s.miss) streak.hit(gap);
            bar.update(marksOf(st, items.length));
          } else { s.miss++; s.tried.push(b.textContent); st[i] = s; save(); streak.miss(); b.classList.add("bad"); b.disabled = true; flash(b, "shake"); flash(gap, "shake"); }
        });
      });
      if (s.done) solve(true);
    });
    bar.update(marksOf(st, items.length), true);
  });

  // ---------- Find the mistake, then fix it ----------
  function bare(w) { return w.replace(/^[^\w']+|[^\w']+$/g, "").toLowerCase(); }
  document.querySelectorAll(".g-spot").forEach(function (list) {
    var g = list.dataset.g, items = Array.prototype.slice.call(list.children), allowOk = list.hasAttribute("data-allow-ok");
    var st = fresh(g, "spot");
    var bar = scoreBar(list, items.length, g);
    items.forEach(function (li, i) {
      var sent = li.querySelector(".sent"), input = li.querySelector("input.blank");
      var s = st[i] || { miss: 0, found: false };
      var original = sent.textContent.trim(), words = original.split(/\s+/), tokens = [];
      sent.textContent = "";
      words.forEach(function (w, j) {
        var m = w.match(/^(.*?)([.,?!]*)$/), t = btn(m[1], "g-word");
        tokens.push(t); sent.append(t); if (m[2]) sent.append(m[2]); if (j < words.length - 1) sent.append(" ");
      });
      // Which words are wrong (one word, or a few in a row).
      var badWords = (li.dataset.bad || "").trim() ? li.dataset.bad.trim().toLowerCase().split(/\s+/) : [], badAt = [];
      for (var j = 0; badWords.length && j + badWords.length <= tokens.length; j++) {
        if (badWords.every(function (w, k) { return bare(tokens[j + k].textContent) === w; })) { for (var k = 0; k < badWords.length; k++) badAt.push(j + k); break; }
      }
      var isOk = !badWords.length;
      var hint = el("span", "g-hint game-ui", isOk || allowOk ? "Tap the mistake, or tap No mistake." : "Tap the wrong word.");
      var row = el("span", "g-row game-ui"), okBtn = null;
      if (allowOk) { okBtn = btn("No mistake ✓", "g-okbtn"); row.append(okBtn); }
      var opts = el("span", "opts game-ui"); opts.hidden = true;
      (li.dataset.opts || "").split(",").filter(Boolean).forEach(function (o) {
        var b = btn(o);
        b.addEventListener("click", function () {
          if (li.classList.contains("done")) return;
          if (o === li.dataset.fix) { s.done = true; st[i] = s; save(); solve(false); if (!s.miss) streak.hit(sent); bar.update(marksOf(st, items.length)); }
          else { s.miss++; st[i] = s; save(); streak.miss(); b.classList.add("bad"); b.disabled = true; flash(b, "shake"); }
        });
        opts.append(b);
      });
      row.append(opts);
      sent.after(hint, row);
      function found() {
        badAt.forEach(function (j) { tokens[j].classList.add("found"); });
        hint.textContent = "Good. Now choose the right words:"; opts.hidden = false; if (okBtn) okBtn.hidden = true; li.classList.add("found");
      }
      function solve(quietly) {
        if (isOk) {
          okBtn.classList.add("ok"); okBtn.disabled = true; li.classList.add("done", "found"); hint.textContent = "";
          tokens.forEach(function (x) { x.disabled = true; });
          input.value = "Correct, no mistake" + (s.miss ? " (" + s.miss + " wrong tr" + (s.miss > 1 ? "ies" : "y") + " first)" : "");
          if (!quietly) flash(okBtn, "pop");
          return;
        }
        if (!li.classList.contains("found")) found();
        var first = tokens[badAt[0]];
        badAt.forEach(function (j, n) { var t = tokens[j]; t.classList.remove("found"); if (n) t.hidden = true; });
        first.textContent = li.dataset.fix; first.classList.add("fixed");
        opts.querySelectorAll("button").forEach(function (b) { b.disabled = true; if (b.textContent === li.dataset.fix) b.classList.add("ok"); });
        hint.textContent = ""; li.classList.add("done");
        tokens.forEach(function (x) { x.disabled = true; });
        var shown = sent.cloneNode(true); shown.querySelectorAll("[hidden]").forEach(function (x) { x.remove(); });
        input.value = shown.textContent.replace(/\s+/g, " ").trim() + (s.miss ? " (" + s.miss + " wrong tr" + (s.miss > 1 ? "ies" : "y") + " first)" : "");
        if (!quietly) flash(first, "pop");
      }
      function wrong(n) { s.miss++; st[i] = s; save(); streak.miss(); n.classList.add("nope"); flash(n, "shake"); setTimeout(function () { n.classList.remove("nope"); }, 700); }
      tokens.forEach(function (t, j) {
        t.addEventListener("click", function () {
          if (li.classList.contains("found")) return;
          if (badAt.indexOf(j) > -1) { s.found = true; st[i] = s; save(); found(); badAt.forEach(function (k) { flash(tokens[k], "pop"); }); }
          else wrong(t);
        });
      });
      if (okBtn) okBtn.addEventListener("click", function () {
        if (li.classList.contains("done") || li.classList.contains("found")) return;
        if (isOk) { s.done = true; st[i] = s; save(); solve(false); if (!s.miss) streak.hit(sent); bar.update(marksOf(st, items.length)); }
        else { wrong(okBtn); }
      });
      if (s.done) solve(true); else if (s.found) found();
    });
    bar.update(marksOf(st, items.length), true);
  });

  // ---------- Type the answer, then check ----------
  function norm(t) {
    return " " + String(t || "").toLowerCase().replace(/[‘’]/g, "'")
      .replace(/\bcan't\b/g, "can not").replace(/\bwon't\b/g, "will not").replace(/n't\b/g, " not").replace(/'ve\b/g, " have")
      .replace(/'re\b/g, " are").replace(/'m\b/g, " am").replace(/[.,!?;:"]/g, " ").replace(/\s+/g, " ").trim() + " ";
  }
  document.querySelectorAll(".g-type").forEach(function (list) {
    var g = list.dataset.g, items = Array.prototype.slice.call(list.children);
    var st = fresh(g, "type");
    var bar = scoreBar(list, items.length, g);
    items.forEach(function (li, i) {
      var ins = Array.prototype.slice.call(li.querySelectorAll("input.blank[data-ok]"));
      var s = st[i] || { miss: 0 };
      var acts = el("span", "g-type-acts game-ui");
      var check = btn("Check", "g-check"), hint = btn("Hint", "ghost g-hintbtn"), show = btn("Show answer", "ghost g-showbtn");
      var msg = el("span", "g-type-msg"); msg.setAttribute("aria-live", "polite");
      show.hidden = s.miss < 2;
      acts.append(check, hint, show, msg);
      li.append(acts);
      function answers(f) { return f.dataset.ok.split("|"); }
      // Make each box wide enough for its longest answer.
      ins.forEach(function (f) { var n = Math.max.apply(null, answers(f).map(function (a) { return a.length; })); f.style.width = Math.max(6, n + 3) + "ch"; f.style.maxWidth = "100%"; });
      function right(f) { var v = norm(f.value); return answers(f).some(function (a) { return norm(a) === v; }); }
      function solve(quietly) {
        li.classList.add("done");
        ins.forEach(function (f, k) { if (s.vals) f.value = s.vals[k]; f.readOnly = true; f.classList.remove("bad"); f.classList.add("ok"); });
        acts.querySelectorAll("button").forEach(function (b) { b.hidden = true; });
        msg.textContent = s.miss ? "" : "✓ Right first time!";
        if (!quietly) ins.forEach(function (f) { flash(f, "pop"); });
      }
      function doCheck() {
        if (li.classList.contains("done")) return;
        if (ins.some(function (f) { return !f.value.trim(); })) { msg.textContent = "Fill in the gap first."; return; }
        if (ins.every(right)) {
          s.done = true; s.vals = ins.map(function (f) { return f.value; }); st[i] = s; save(); solve(false);
          if (!s.miss) streak.hit(ins[0]); else msg.textContent = "✓ Got it!";
          bar.update(marksOf(st, items.length));
        } else {
          s.miss++; st[i] = s; save(); streak.miss();
          ins.forEach(function (f) { if (!right(f)) { f.classList.add("bad"); flash(f, "shake"); } });
          msg.textContent = s.miss === 1 ? "Not quite. Try again, or tap Hint." : "Not yet. Look at the rule again, or tap Show answer.";
          show.hidden = s.miss < 2;
        }
      }
      check.addEventListener("click", doCheck);
      ins.forEach(function (f) {
        f.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); doCheck(); } });
        f.addEventListener("input", function () { f.classList.remove("bad"); });
      });
      hint.addEventListener("click", function () {
        var f = ins.filter(function (x) { return !right(x); })[0] || ins[0];
        var first = answers(f)[0].split(" ")[0];
        f.value = first + (answers(f)[0].indexOf(" ") > -1 ? " " : ""); f.focus(); f.classList.remove("bad");
        if (!s.hint) { s.hint = true; s.miss++; st[i] = s; save(); streak.miss(); }
        msg.textContent = "The answer starts with “" + first + "”.";
      });
      show.addEventListener("click", function () {
        ins.forEach(function (f) { f.value = answers(f)[0]; f.dispatchEvent(new Event("input", { bubbles: true })); });
        s.done = true; s.vals = ins.map(function (f) { return f.value; }); s.miss = Math.max(1, s.miss); st[i] = s; save();
        solve(false); msg.textContent = "Read the answer, then try it again later.";
        bar.update(marksOf(st, items.length));
      });
      if (s.done && s.vals && s.vals.length === ins.length) solve(true); else if (s.done) { s.done = false; }
    });
    bar.update(marksOf(st, items.length), true);
  });

  // ---------- Word order: tap the words to build the sentence ----------
  function shuffled(arr, seed) {
    var a = arr.slice(), x = seed || 7;
    for (var i = a.length - 1; i > 0; i--) { x = (x * 9301 + 49297) % 233280; var j = Math.floor(x / 233280 * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function seedOf(t) { var h = 0; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) % 100000; return h + 1; }
  document.querySelectorAll(".g-order").forEach(function (list) {
    var g = list.dataset.g, items = Array.prototype.slice.call(list.children);
    var st = fresh(g, "order");
    var bar = scoreBar(list, items.length, g);
    items.forEach(function (li, i) {
      var input = li.querySelector("input.blank"), s = st[i] || { miss: 0 };
      var answer = li.dataset.answer.trim(), end = (answer.match(/[.?!]$/) || [""])[0];
      var words = answer.slice(0, answer.length - end.length).trim().split(/\s+/);
      var keepCap = function (w) { return w === "I" || /^[A-Z]{2,}$/.test(w) || (li.dataset.names || "").split(",").indexOf(w) > -1; };
      var shown = words.map(function (w, k) { return k === 0 && !keepCap(w) ? w.charAt(0).toLowerCase() + w.slice(1) : w; });
      var okLists = [words].concat((li.dataset.alt || "").split("|").filter(Boolean).map(function (a) { return a.replace(/[.?!]$/, "").trim().split(/\s+/); }));
      var box = el("div", "g-order-box game-ui");
      var line = el("div", "g-line"); line.setAttribute("aria-label", "Your sentence");
      var endMark = el("span", "g-end", end);
      var bank = el("div", "g-bank"); bank.setAttribute("aria-label", "Words to use");
      var row = el("div", "g-order-acts");
      var redo = btn("Start again", "ghost g-redo"); var msg = el("span", "g-type-msg"); msg.setAttribute("aria-live", "polite");
      row.append(redo, msg);
      box.append(line, bank, row);
      li.append(box);
      var chips = shuffled(shown.map(function (w, k) { return { w: w, k: k }; }), seedOf(answer));
      if (chips.map(function (c) { return c.k; }).join() === shown.map(function (w, k) { return k; }).join()) chips.reverse();
      chips = chips.map(function (c) { var b = btn(c.w, "g-chip"); b.dataset.w = c.w; bank.append(b); return b; });
      line.append(endMark);
      function built() { return Array.prototype.map.call(line.querySelectorAll(".g-chip"), function (b) { return b.dataset.w; }); }
      function same(a, b) { return a.length === b.length && a.every(function (w, k) { return w.toLowerCase() === b[k].toLowerCase(); }); }
      function solve(quietly) {
        li.classList.add("done");
        line.innerHTML = ""; words.forEach(function (w) { var b = btn(w, "g-chip ok"); b.disabled = true; line.append(b); });
        line.append(endMark); bank.hidden = true; redo.hidden = true;
        msg.textContent = s.miss ? "✓ Got it!" : "✓ Right first time!";
        input.value = answer + (s.miss ? " (" + s.miss + " wrong tr" + (s.miss > 1 ? "ies" : "y") + " first)" : "");
        if (!quietly) flash(line, "pop");
      }
      function check() {
        var b = built(); if (b.length < words.length) return;
        if (okLists.some(function (ok) { return same(b, ok); })) {
          s.done = true; st[i] = s; save(); solve(false); if (!s.miss) streak.hit(line); bar.update(marksOf(st, items.length));
          return;
        }
        s.miss++; st[i] = s; save(); streak.miss();
        var placed = line.querySelectorAll(".g-chip");
        placed.forEach(function (c, k) { c.classList.add(c.dataset.w.toLowerCase() === words[k].toLowerCase() ? "ok" : "bad"); });
        flash(line, "shake");
        msg.textContent = "Not quite. The green words are in the right place.";
        setTimeout(function () { placed.forEach(function (c) { if (c.classList.contains("bad")) { c.classList.remove("bad"); bank.append(c); } c.classList.remove("ok"); }); }, 1100);
      }
      bank.addEventListener("click", function (e) { var c = e.target.closest(".g-chip"); if (!c || li.classList.contains("done")) return; line.insertBefore(c, endMark); msg.textContent = ""; check(); });
      line.addEventListener("click", function (e) { var c = e.target.closest(".g-chip"); if (!c || li.classList.contains("done")) return; bank.append(c); });
      redo.addEventListener("click", function () { line.querySelectorAll(".g-chip").forEach(function (c) { bank.append(c); }); msg.textContent = ""; });
      if (s.done) solve(true);
    });
    bar.update(marksOf(st, items.length), true);
  });

  // ---------- Matching pairs: tap one, then its partner ----------
  document.querySelectorAll(".g-match").forEach(function (box) {
    var g = box.dataset.g, src = Array.prototype.slice.call(box.querySelectorAll("li[data-l]"));
    var st = fresh(g, "match");
    var board = el("div", "g-board game-ui"), left = el("div", "g-col"), right = el("div", "g-col");
    board.append(left, right);
    box.append(board);
    var bar = scoreBar(board, src.length, g);
    var sel = null, colors = 0;
    var L = src.map(function (li, i) { var b = btn(li.dataset.l, "g-card"); b.dataset.i = i; b.dataset.side = "l"; left.append(b); return b; });
    var R = shuffled(src.map(function (li, i) { return i; }), seedOf(src.map(function (li) { return li.dataset.r; }).join())).map(function (i) {
      var b = btn(src[i].dataset.r, "g-card"); b.dataset.i = i; b.dataset.side = "r"; right.append(b); return b;
    });
    var Rby = {}; R.forEach(function (b) { Rby[b.dataset.i] = b; });
    function lock(i, quietly) {
      var s = st[i], n = (colors++ % 6) + 1;
      [L[i], Rby[i]].forEach(function (b) { b.classList.remove("picked"); b.classList.add("ok", "c" + n); b.disabled = true; if (!quietly) flash(b, "pop"); });
      // Move the meaning next to its partner, so the finished board reads as a list.
      var cur = Array.prototype.slice.call(right.children), slots = new Array(src.length);
      cur.forEach(function (c) { if (c.disabled) slots[Number(c.dataset.i)] = c; });
      var rest = cur.filter(function (c) { return !c.disabled; });
      for (var k = 0; k < slots.length; k++) { if (!slots[k]) slots[k] = rest.shift(); }
      slots.forEach(function (c) { right.append(c); });
      var input = src[i].querySelector("input.blank");
      if (input) input.value = src[i].dataset.l + " = " + src[i].dataset.r + (s.miss ? " (" + s.miss + " wrong tr" + (s.miss > 1 ? "ies" : "y") + " first)" : "");
    }
    board.addEventListener("click", function (e) {
      var b = e.target.closest(".g-card"); if (!b || b.disabled) return;
      if (!sel || sel.dataset.side === b.dataset.side) {
        if (sel) sel.classList.remove("picked");
        sel = (sel === b) ? null : b; if (sel) sel.classList.add("picked");
        return;
      }
      var a = sel; sel = null; a.classList.remove("picked");
      var li = a.dataset.side === "l" ? a : b, ri = a.dataset.side === "r" ? a : b, i = li.dataset.i;
      var s = st[i] || (st[i] = { miss: 0 });
      if (li.dataset.i === ri.dataset.i) {
        s.done = true; save(); lock(i, false); if (!s.miss) streak.hit(li); bar.update(marksOf(st, src.length));
      } else {
        s.miss++; save(); streak.miss();
        [li, ri].forEach(function (x) { x.classList.add("bad"); flash(x, "shake"); setTimeout(function () { x.classList.remove("bad"); }, 700); });
      }
    });
    src.forEach(function (li, i) { if (st[i] && st[i].done) lock(i, true); });
    bar.update(marksOf(st, src.length), true);
  });

  // ---------- Sorting with instant marking ----------
  document.querySelectorAll(".sorter.g-sort").forEach(function (box) {
    var g = "sort-" + box.dataset.k, sel = null;
    var st = state[g] || (state[g] = {});
    var chips = Array.prototype.slice.call(box.querySelectorAll(".chip")), bank = box.querySelector(".bank");
    var bar = scoreBar(box, chips.length, g);
    function info(c) { return st[c.dataset.i] || (st[c.dataset.i] = { miss: 0, done: false }); }
    function marks() { return chips.map(function (c) { var s = st[c.dataset.i]; return s && s.done ? (s.miss ? "later" : "first") : ""; }); }
    function colDrop(col) { return box.querySelector('.col .drop[data-col="' + col + '"]'); }
    function lock(c) { c.classList.add("ok"); c.draggable = false; c.setAttribute("aria-disabled", "true"); }
    chips.forEach(function (c) { var s = st[c.dataset.i]; if (s && s.done) { colDrop(c.dataset.a).appendChild(c); lock(c); } });
    function select(c) {
      if (sel) sel.classList.remove("picked");
      sel = (sel === c || !c || c.classList.contains("ok")) ? null : c;
      if (sel) sel.classList.add("picked");
      box.classList.toggle("picking", !!sel);
    }
    function place(c, drop) {
      if (!c || !drop || c.classList.contains("ok")) return;
      select(null);
      if (drop === bank) { bank.appendChild(c); return; }
      drop.appendChild(c);
      var s = info(c);
      if (drop.dataset.col === c.dataset.a) {
        s.done = true; save(); lock(c); flash(c, "pop"); if (!s.miss) streak.hit(c); bar.update(marks());
      } else {
        s.miss++; save(); streak.miss(); c.classList.add("bad"); flash(c, "shake");
        setTimeout(function () { c.classList.remove("bad"); bank.appendChild(c); }, 750);
      }
    }
    function dropAt(t) { return t.closest(".drop") || (t.closest(".col") && t.closest(".col").querySelector(".drop")); }
    box.addEventListener("click", function (e) {
      var c = e.target.closest(".chip");
      if (c) { if (sel && sel !== c && c.parentNode !== sel.parentNode) place(sel, c.parentNode); else select(c); return; }
      var d = dropAt(e.target); if (d && sel) place(sel, d);
    });
    box.addEventListener("dragstart", function (e) {
      var c = e.target.closest(".chip"); if (!c || c.classList.contains("ok")) { e.preventDefault(); return; }
      select(null); select(c); e.dataTransfer.setData("text/plain", c.dataset.i);
    });
    box.addEventListener("dragover", function (e) { if (e.target.closest(".drop, .col")) e.preventDefault(); });
    box.addEventListener("drop", function (e) {
      e.preventDefault();
      place(box.querySelector('.chip[data-i="' + e.dataTransfer.getData("text/plain") + '"]'), dropAt(e.target));
    });
    var reset = box.querySelector(".sort-reset");
    if (reset) reset.addEventListener("click", again(g));
    bar.update(marks(), true);
  });

  // ---------- Check my writing: a Check button for each sentence (Claude, through Bill's Writing checker) ----------
  var LABEL = { correct: "Correct", almost: "Almost", wrong: "Let's fix this", "off-task": "Check the task", empty: "" };
  document.querySelectorAll(".g-write").forEach(function (box) {
    var inputs = Array.prototype.filter.call(box.querySelectorAll("input.blank, textarea.blank"), function (f) { return f.type !== "hidden"; });
    var record = box.querySelector("input.g-record");
    var g = "write-" + (box.dataset.g || "w");
    var st = state[g]; if (!st || st.kind !== "write") st = state[g] = { kind: "write", items: {} };
    if (CHECK_URL) stars.add(g, labelFor(box));
    var summary = el("p", "g-write-msg game-ui"); summary.setAttribute("aria-live", "polite");
    box.append(summary);
    function prompt(f) {
      var li = f.closest("li"); if (!li) return "";
      var c = li.cloneNode(true); c.querySelectorAll("input, textarea, .game-ui").forEach(function (x) { x.remove(); });
      return c.textContent.replace(/\s+/g, " ").replace(/[:\s]+$/, "").trim();
    }
    var rows = inputs.map(function (f, i) {
      var go = btn("Check", "g-check g-wcheck game-ui");
      var fb = el("div", "g-fb game-ui"); fb.hidden = true; fb.setAttribute("aria-live", "polite");
      f.after(go); go.after(fb);
      f.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); go.click(); } });
      f.addEventListener("input", function () { if (st.items[i]) { fb.hidden = true; } });
      go.addEventListener("click", function () { check(i); });
      return { f: f, go: go, fb: fb };
    });
    function note(i, text) { var fb = rows[i].fb; fb.className = "g-fb game-ui info"; fb.innerHTML = ""; fb.append(el("span", "g-fb-note", text)); fb.hidden = false; }
    function show(i, quiet) {
      var it = st.items[i], r = it.result, fb = rows[i].fb;
      fb.innerHTML = ""; fb.className = "g-fb game-ui " + r.status; fb.hidden = false;
      fb.append(el("strong", "g-fb-tag", (r.status === "correct" ? "✓ " : "") + (LABEL[r.status] || "Check")));
      if (r.corrected && r.corrected !== it.text) { var c = el("span", "g-fb-fix"); c.append(el("span", "g-fb-lab", "Better: "), el("em", null, r.corrected)); fb.append(c); }
      if (r.note) fb.append(el("span", "g-fb-note", r.note));
      if (!quiet) flash(fb, "pop");
    }
    function tally(quiet) {
      var all = inputs.length, good = 0, done = 0;
      inputs.forEach(function (f, i) { var it = st.items[i]; if (it && it.text === f.value.trim()) { done++; if (it.result.status === "correct") good++; } });
      if (!done) { summary.textContent = ""; }
      else if (good === all) {
        summary.innerHTML = "<strong>Perfect!</strong> All " + all + " sentences are correct.";
        stars.set(g, "gold", quiet); if (!quiet) celebrate(summary);
      } else summary.textContent = good + " of " + all + " sentences correct so far.";
      if (record) record.value = inputs.map(function (f, i) { var it = st.items[i]; return it ? (i + 1) + ". " + it.text + " → " + (LABEL[it.result.status] || it.result.status) + (it.result.corrected ? " (" + it.result.corrected + ")" : "") : ""; }).filter(Boolean).join(" | ");
    }
    function check(i) {
      var row = rows[i], text = row.f.value.trim();
      if (!text) { note(i, "Write your answer first."); return; }
      if (!CHECK_URL) { note(i, "The writing check isn't switched on yet. Bill will check this one when you send your answers."); return; }
      row.go.disabled = true; row.go.textContent = "Checking…";
      var p = prompt(row.f), ctrl = window.AbortController ? new AbortController() : null, timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 30000);
      fetch(CHECK_URL, { method: "POST", body: JSON.stringify({ action: "checkWriting", args: [{
        lesson: (document.querySelector("h1") || {}).textContent || "",
        task: (box.dataset.task || "") + (p ? " This answer is for the prompt: “" + p + "”." : ""),
        focus: box.dataset.focus || "", answers: [text] }] }), signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j.ok) throw new Error(j.error || "failed");
          st.items[i] = { text: text, result: j.data.results[0] }; save();
          show(i, false); tally(false);
        })
        .catch(function (e) {
          var t = e && e.message || "";
          note(i, /busy day|Write something/.test(t) ? t : "Sorry, the check didn't work. Check your internet and try again in a minute.");
        })
        .then(function () { clearTimeout(timer); row.go.disabled = false; row.go.textContent = "Check"; });
    }
    // Show earlier checks again, for sentences that haven't changed since.
    inputs.forEach(function (f, i) { var it = st.items[i]; if (it && it.text === f.value.trim()) show(i, true); });
    tally(true);
  });

  stars.draw();

  // ---------- The celebration ----------
  function celebrate(near, text, big) {
    var badge = el("div", "g-perfect" + (big ? " big" : ""), text || "Perfect!");
    badge.setAttribute("aria-hidden", "true");
    badge.prepend(el("span", "g-star", "★"));
    (big ? document.body : near).append(badge);
    setTimeout(function () { badge.remove(); }, big ? 3600 : (calm ? 2200 : 2600));
    if (calm) return;
    var cv = el("canvas", "g-confetti"); document.body.append(cv);
    var ctx = cv.getContext("2d"), dpr = window.devicePixelRatio || 1;
    var W = innerWidth, H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);
    var colors = ["#1f5f73", "#2e7a50", "#e0a526", "#d65a3a", "#7fc0d1", "#9b6bd1"], bits = [];
    var origins = big ? [[W * .2, H * .45], [W * .5, H * .35], [W * .8, H * .45]] : (function () {
      var r = near.getBoundingClientRect(); return [[r.left + r.width / 2, Math.min(Math.max(r.top, 60), H - 60)]];
    })();
    origins.forEach(function (o) {
      for (var i = 0; i < 140; i++) {
        var a = Math.random() * Math.PI * 2, v = 4 + Math.random() * (big ? 12 : 9);
        bits.push({ x: o[0], y: o[1], vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, w: 6 + Math.random() * 6, h: 4 + Math.random() * 6,
          rot: Math.random() * 6, vr: (Math.random() - .5) * .4, c: colors[i % colors.length] });
      }
    });
    var t0 = performance.now(), dur = big ? 3200 : 2400;
    (function frame(t) {
      var life = (t - t0) / dur;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, life - .6) / .4);
      bits.forEach(function (b) {
        b.vy += .28; b.vx *= .985; b.x += b.vx; b.y += b.vy; b.rot += b.vr;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot); ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore();
      });
      if (life < 1) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  }
  window.lessonGames = { celebrate: celebrate, reset: function () { try { localStorage.removeItem(KEY); } catch (e) {} } };
})();
