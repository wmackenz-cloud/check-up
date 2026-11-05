// Lesson games: instant feedback for exercises, and a celebration for a perfect score.
// Three kinds, each inside an exercise:
//   <ol class="g-pick" data-g="name">  each <li data-a="1" data-form="done" data-q="...">  with a <span class="gap"></span>
//                                      and a <span class="opts"><button>make</button>...</span>: tap the right word.
//   <ol class="g-spot" data-g="name">  each <li data-bad="did" data-fix="made" data-opts="made,did,took" data-q="...">
//                                      with <span class="sent">sentence</span>: tap the wrong word, then pick the fix.
//   <div class="sorter g-sort" data-k="name">  the usual sorter, but each word is marked the moment it lands.
//   <div class="g-write" data-task="..." data-focus="...">  free writing (input.blank boxes) with a "Check my writing"
//                                      button: Claude checks each sentence through Bill's Writing checker (tools/writing-checker.gs).
// Every <li> holds a hidden <input class="blank"> so "Send my answers to Bill" still sends what the student did.
(function () {
  // The Writing checker's Web app URL (from Deploy > New deployment in Google Apps Script). Empty = not switched on yet.
  var CHECK_URL = "";
  var KEY = "game-" + location.pathname;
  var state = {};
  try { state = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
  var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function flash(n, cls) { n.classList.remove(cls); void n.offsetWidth; n.classList.add(cls); setTimeout(function () { n.classList.remove(cls); }, 700); }

  // ---------- The score bar under each game: one dot per question ----------
  function scoreBar(host, total, onAgain) {
    var bar = el("div", "g-bar game-ui");
    var dots = el("div", "g-dots"); dots.setAttribute("aria-hidden", "true");
    for (var i = 0; i < total; i++) dots.append(el("span", "g-dot"));
    var txt = el("p", "g-txt"); txt.setAttribute("aria-live", "polite");
    var again = el("button", "ghost g-again", "Try again for a perfect score"); again.type = "button"; again.hidden = true;
    again.addEventListener("click", onAgain);
    bar.append(dots, txt, again);
    host.after(bar);
    return {
      update: function (marks, quiet) { // marks: array of "", "first", "later"
        var done = 0, first = 0;
        marks.forEach(function (m, i) { dots.children[i].className = "g-dot" + (m ? " " + m : ""); if (m) done++; if (m === "first") first++; });
        again.hidden = true;
        if (done < total) { txt.textContent = done ? done + " of " + total + " done, " + first + " right first time." : "Score: right first time = a green dot."; return; }
        if (first === total) {
          txt.innerHTML = "<strong>Perfect!</strong> " + total + " out of " + total + " right first time.";
          if (!quiet) celebrate(bar);
          bar.classList.add("perfect");
        } else {
          bar.classList.remove("perfect");
          txt.innerHTML = "<strong>All done!</strong> " + first + " of " + total + " right first time.";
          again.hidden = false;
        }
      }
    };
  }

  // ---------- Tap the right word ----------
  document.querySelectorAll(".g-pick").forEach(function (list) {
    var g = list.dataset.g, items = Array.prototype.slice.call(list.children);
    var st = state[g] || (state[g] = {});
    var bar = scoreBar(list, items.length, function () { delete state[g]; save(); location.reload(); });
    function marks() { return items.map(function (li, i) { var s = st[i]; return s && s.done ? (s.miss ? "later" : "first") : ""; }); }
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
          if (String(j) === li.dataset.a) { s.done = true; st[i] = s; save(); solve(false); bar.update(marks()); }
          else { s.miss++; s.tried.push(b.textContent); st[i] = s; save(); b.classList.add("bad"); b.disabled = true; flash(b, "shake"); flash(gap, "shake"); }
        });
      });
      if (s.done) solve(true);
    });
    bar.update(marks(), true);
  });

  // ---------- Find the mistake, then fix it ----------
  document.querySelectorAll(".g-spot").forEach(function (list) {
    var g = list.dataset.g, items = Array.prototype.slice.call(list.children);
    var st = state[g] || (state[g] = {});
    var bar = scoreBar(list, items.length, function () { delete state[g]; save(); location.reload(); });
    function marks() { return items.map(function (li, i) { var s = st[i]; return s && s.done ? (s.miss ? "later" : "first") : ""; }); }
    items.forEach(function (li, i) {
      var sent = li.querySelector(".sent"), input = li.querySelector("input.blank");
      var s = st[i] || { miss: 0, found: false };
      var words = sent.textContent.trim().split(/\s+/), badAt = -1, tokens = [];
      sent.textContent = "";
      words.forEach(function (w, j) {
        var bare = w.replace(/[.,?!]+$/, ""), tail = w.slice(bare.length);
        var t = el("button", "g-word", bare); t.type = "button";
        if (badAt < 0 && bare.toLowerCase() === li.dataset.bad.toLowerCase()) badAt = j;
        tokens.push(t);
        sent.append(t); if (tail) sent.append(tail); if (j < words.length - 1) sent.append(" ");
      });
      var opts = el("span", "opts game-ui"); opts.hidden = true;
      var hint = el("span", "g-hint game-ui", "Tap the wrong word.");
      li.dataset.opts.split(",").forEach(function (o) {
        var b = el("button", null, o); b.type = "button";
        b.addEventListener("click", function () {
          if (li.classList.contains("done")) return;
          if (o === li.dataset.fix) { s.done = true; st[i] = s; save(); solve(false); bar.update(marks()); }
          else { s.miss++; st[i] = s; save(); b.classList.add("bad"); b.disabled = true; flash(b, "shake"); }
        });
        opts.append(b);
      });
      sent.after(hint, opts);
      function found() {
        var t = tokens[badAt]; t.classList.add("found"); hint.textContent = "Good. Now choose the right word:"; opts.hidden = false; li.classList.add("found");
      }
      function solve(quietly) {
        if (!li.classList.contains("found")) found();
        var t = tokens[badAt]; t.textContent = li.dataset.fix; t.classList.remove("found"); t.classList.add("fixed");
        opts.querySelectorAll("button").forEach(function (b) { b.disabled = true; if (b.textContent === li.dataset.fix) b.classList.add("ok"); });
        hint.textContent = ""; li.classList.add("done");
        tokens.forEach(function (x) { x.disabled = true; });
        input.value = sent.textContent.replace(/\s+/g, " ").trim() + (s.miss ? " (" + s.miss + " wrong tr" + (s.miss > 1 ? "ies" : "y") + " first)" : "");
        if (!quietly) flash(t, "pop");
      }
      tokens.forEach(function (t, j) {
        t.addEventListener("click", function () {
          if (li.classList.contains("found")) return;
          if (j === badAt) { s.found = true; st[i] = s; save(); found(); flash(t, "pop"); }
          else { s.miss++; st[i] = s; save(); t.classList.add("nope"); flash(t, "shake"); setTimeout(function () { t.classList.remove("nope"); }, 700); }
        });
      });
      if (s.done) solve(true); else if (s.found) found();
    });
    bar.update(marks(), true);
  });

  // ---------- Sorting with instant marking ----------
  document.querySelectorAll(".sorter.g-sort").forEach(function (box) {
    var g = "sort-" + box.dataset.k, sel = null;
    var st = state[g] || (state[g] = {});
    var chips = Array.prototype.slice.call(box.querySelectorAll(".chip")), bank = box.querySelector(".bank");
    var bar = scoreBar(box, chips.length, function () { delete state[g]; save(); location.reload(); });
    function info(c) { return st[c.dataset.i] || (st[c.dataset.i] = { miss: 0, done: false }); }
    function marks() { return chips.map(function (c) { var s = st[c.dataset.i]; return s && s.done ? (s.miss ? "later" : "first") : ""; }); }
    function colDrop(col) { return box.querySelector('.col .drop[data-col="' + col + '"]'); }
    chips.forEach(function (c) {
      var s = st[c.dataset.i];
      if (s && s.done) { colDrop(c.dataset.a).appendChild(c); lock(c); }
    });
    function lock(c) { c.classList.add("ok"); c.draggable = false; c.setAttribute("aria-disabled", "true"); }
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
        s.done = true; save(); lock(c); flash(c, "pop"); bar.update(marks());
      } else {
        s.miss++; save(); c.classList.add("bad"); flash(c, "shake");
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
      var c = box.querySelector('.chip[data-i="' + e.dataTransfer.getData("text/plain") + '"]');
      place(c, dropAt(e.target));
    });
    var reset = box.querySelector(".sort-reset");
    if (reset) reset.addEventListener("click", function () { delete state[g]; save(); location.reload(); });
    bar.update(marks(), true);
  });

  // ---------- Check my writing (Claude, through Bill's Writing checker) ----------
  var LABEL = { correct: "Correct", almost: "Almost", wrong: "Let's fix this", "off-task": "Check the task", empty: "" };
  document.querySelectorAll(".g-write").forEach(function (box) {
    var inputs = Array.prototype.filter.call(box.querySelectorAll("input.blank, textarea.blank"), function (f) { return f.type !== "hidden"; });
    var record = box.querySelector("input.g-record");
    var g = "write-" + (box.dataset.g || "w"), st = state[g];
    var acts = el("div", "g-write-acts game-ui");
    var btn = el("button", null, "Check my writing"); btn.type = "button";
    var msg = el("p", "g-write-msg"); msg.setAttribute("aria-live", "polite");
    acts.append(btn, msg); box.append(acts);
    var boxes = inputs.map(function (f) { var fb = el("div", "g-fb game-ui"); fb.hidden = true; f.after(fb); return fb; });

    function show(results, texts, quiet) {
      var good = 0, done = 0;
      results.forEach(function (r, i) {
        var fb = boxes[i]; fb.innerHTML = ""; fb.className = "g-fb game-ui " + r.status;
        if (r.status === "empty") { fb.hidden = true; return; }
        done++; if (r.status === "correct") good++;
        fb.hidden = false;
        fb.append(el("strong", "g-fb-tag", (r.status === "correct" ? "✓ " : "") + (LABEL[r.status] || "Check")));
        if (r.corrected && r.corrected !== texts[i]) { var c = el("span", "g-fb-fix"); c.append(el("span", "g-fb-lab", "Better: "), el("em", null, r.corrected)); fb.append(c); }
        if (r.note) fb.append(el("span", "g-fb-note", r.note));
        if (!quiet) flash(fb, "pop");
      });
      var all = inputs.length;
      if (done === all && good === all) {
        msg.innerHTML = "<strong>Perfect!</strong> All " + all + " sentences are correct.";
        if (!quiet) celebrate(acts);
      } else if (done < all) msg.textContent = good + " correct so far. Write all " + all + " sentences, then check again.";
      else msg.textContent = good + " of " + all + " correct. Change the sentences that need it, then check again.";
      if (record) record.value = results.map(function (r, i) { return (i + 1) + ". " + texts[i] + " → " + (LABEL[r.status] || r.status) + (r.corrected ? " (" + r.corrected + ")" : ""); }).join(" | ");
    }
    // Show the last check again, if the sentences haven't changed since.
    if (st && st.texts && st.texts.join("\n") === inputs.map(function (f) { return f.value.trim(); }).join("\n")) show(st.results, st.texts, true);
    inputs.forEach(function (f, i) { f.addEventListener("input", function () { boxes[i].hidden = true; }); });

    btn.addEventListener("click", function () {
      var texts = inputs.map(function (f) { return f.value.trim(); });
      if (!texts.some(Boolean)) { msg.textContent = "Write your sentences first."; return; }
      if (!CHECK_URL) { msg.textContent = "The writing check isn't switched on yet. Send your answers to Bill instead."; return; }
      btn.disabled = true; btn.textContent = "Checking…"; msg.textContent = "";
      var ctrl = window.AbortController ? new AbortController() : null, timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 30000);
      fetch(CHECK_URL, { method: "POST", body: JSON.stringify({ action: "checkWriting", args: [{
        lesson: (document.querySelector("h1") || {}).textContent || "", task: box.dataset.task || "", focus: box.dataset.focus || "", answers: texts }] }),
        signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j.ok) throw new Error(j.error || "failed");
          state[g] = { texts: texts, results: j.data.results }; save();
          show(j.data.results, texts, false);
        })
        .catch(function (e) {
          var t = e && e.message || "";
          msg.textContent = /busy day|Write something/.test(t) ? t : "Sorry, the check didn't work. Check your internet and try again in a minute.";
        })
        .then(function () { clearTimeout(timer); btn.disabled = false; btn.textContent = "Check my writing"; });
    });
  });

  // ---------- The celebration ----------
  function celebrate(near) {
    var badge = el("div", "g-perfect", "Perfect!");
    badge.setAttribute("aria-hidden", "true");
    var star = el("span", "g-star", "★"); badge.prepend(star);
    near.append(badge);
    setTimeout(function () { badge.remove(); }, calm ? 2200 : 2600);
    if (calm) return;
    var cv = el("canvas", "g-confetti"); document.body.append(cv);
    var ctx = cv.getContext("2d"), dpr = window.devicePixelRatio || 1;
    var W = innerWidth, H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);
    var r = near.getBoundingClientRect(), ox = r.left + r.width / 2, oy = Math.min(Math.max(r.top, 60), H - 60);
    var colors = ["#1f5f73", "#2e7a50", "#e0a526", "#d65a3a", "#7fc0d1", "#9b6bd1"], bits = [];
    for (var i = 0; i < 140; i++) {
      var a = Math.random() * Math.PI * 2, v = 4 + Math.random() * 9;
      bits.push({ x: ox, y: oy, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, w: 6 + Math.random() * 6, h: 4 + Math.random() * 6,
        rot: Math.random() * 6, vr: (Math.random() - .5) * .4, c: colors[i % colors.length] });
    }
    var t0 = performance.now();
    (function frame(t) {
      var life = (t - t0) / 2400;
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
