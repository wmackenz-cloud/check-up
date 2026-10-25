// Pronunciation practice: record, listen, save to Bill, and replay saved recordings.
(function () {
  const LESSON = Number(document.body.dataset.lesson || 0);
  const ME_KEY = "pron.me";
  let me = null;

  // ---------- helpers ----------
  function api(action) {
    const args = Array.prototype.slice.call(arguments, 1);
    return new Promise(function (ok, fail) {
      google.script.run.withSuccessHandler(ok).withFailureHandler(fail)[action].apply(null, args);
    });
  }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || "null"); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }
  function slug(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30) || "student"; }
  function el(tag, attrs, kids) {
    const n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k.slice(0, 2) === "on") n.addEventListener(k.slice(2), attrs[k]);
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(c); });
    return n;
  }
  function mmss(s) { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); }
  function when(iso) {
    const d = new Date(iso);
    return isNaN(d) ? "" : d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" }) + ", " + d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  function pickMime() {
    if (!window.MediaRecorder) return null;
    const list = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm", "audio/ogg;codecs=opus", "audio/aac"];
    for (let i = 0; i < list.length; i++) if (MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(list[i])) return list[i];
    return "";
  }
  function toBase64(blob) {
    return new Promise(function (ok, fail) {
      const r = new FileReader();
      r.onload = function () { ok(String(r.result).split(",")[1] || ""); };
      r.onerror = fail;
      r.readAsDataURL(blob);
    });
  }
  function fromBase64(b64, mime) {
    const bin = atob(b64); const a = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return new Blob([a], { type: mime || "audio/webm" });
  }

  // ---------- who is recording ----------
  const whoBox = document.getElementById("who");
  function keepLinks() {
    if (!me) return;
    document.querySelectorAll("a.keep").forEach(function (a) {
      const u = new URL(a.getAttribute("href"), location.href);
      u.searchParams.set("student", me.code); u.searchParams.set("who", me.name);
      a.href = u.href;
    });
  }
  function renderWho(askCode) {
    whoBox.innerHTML = "";
    if (me && me.name) {
      whoBox.appendChild(el("span", {}, [document.createTextNode("Recording as "), el("strong", { text: me.name })]));
      whoBox.appendChild(el("button", { type: "button", class: "linkish", text: "Not you?", onclick: function () { me = null; store(ME_KEY, null); renderWho(""); refreshLists(); } }));
      keepLinks();
      return;
    }
    const input = el("input", { type: "text", autocomplete: "name", placeholder: "Your first name and last initial", "aria-label": "Your name", maxlength: "60" });
    const form = el("form", { onsubmit: function (ev) {
      ev.preventDefault();
      const name = input.value.trim().replace(/[<>]/g, "");
      if (!name) { input.focus(); return; }
      const code = askCode || (slug(name) + "-" + Math.random().toString(36).slice(2, 5));
      me = { code: code, name: name }; store(ME_KEY, me); renderWho(); refreshLists();
    } }, [el("label", { text: "Before you record, type your name:" }), input, el("button", { type: "submit", text: "Start" })]);
    whoBox.appendChild(form);
  }
  function startWho() {
    const saved = store(ME_KEY);
    if (window.STUDENT_CODE) {
      const who = (Q.get("who") || "").trim();
      me = { code: window.STUDENT_CODE, name: who || (saved && saved.code === window.STUDENT_CODE ? saved.name : "") };
      if (me.name) store(ME_KEY, me);
      renderWho(me.name ? undefined : window.STUDENT_CODE);
      loadInfo().then(function (i) {
        if (i.name && i.name !== me.name) { me = { code: window.STUDENT_CODE, name: i.name }; store(ME_KEY, me); renderWho(); }
        refreshLists();
      });
    } else {
      me = saved && saved.code ? saved : null;
      renderWho("");
      refreshLists();
    }
  }

  // ---------- recorder ----------
  const MIME = pickMime();
  function recorder(box) {
    const part = box.dataset.part || "rec";
    const label = box.dataset.label || "Recording";
    const max = Number(box.dataset.max || 180);
    let stream = null, rec = null, chunks = [], blob = null, url = "", t0 = 0, tick = null, actx = null, raf = 0, secs = 0;

    const timer = el("span", { class: "timer", text: "0:00" });
    const bar = el("i"); const meter = el("span", { class: "meter", "aria-hidden": "true" }, [bar]);
    const go = el("button", { type: "button", class: "go", text: "● Record" });
    const stop = el("button", { type: "button", class: "stop", text: "■ Stop", hidden: "" });
    const redo = el("button", { type: "button", class: "ghost", text: "Record again", hidden: "" });
    const save = el("button", { type: "button", text: "Save and send to Bill", hidden: "" });
    const audio = el("audio", { controls: "", hidden: "" });
    const note = el("textarea", { class: "blank area", rows: "2", placeholder: "A note for Bill (optional)", hidden: "" });
    const msg = el("p", { class: "msg", "aria-live": "polite" });

    box.innerHTML = "";
    box.appendChild(el("p", { class: "rec-title", text: label }));
    if (box.dataset.tip) box.appendChild(el("p", { class: "hint", text: box.dataset.tip }));
    box.appendChild(el("div", { class: "rec-row" }, [go, stop, timer, meter]));
    box.appendChild(audio); box.appendChild(note);
    box.appendChild(el("div", { class: "rec-row" }, [save, redo]));
    box.appendChild(msg);

    if (MIME === null || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      go.disabled = true;
      msg.className = "msg bad";
      msg.textContent = "This browser cannot record. Please open this page in Chrome or Safari, or record on your phone and send it to Bill on Preply.";
      return;
    }
    function say(t, cls) { msg.className = "msg" + (cls ? " " + cls : ""); msg.textContent = t; }
    function level(analyser) {
      const data = new Uint8Array(analyser.fftSize);
      (function loop() {
        analyser.getByteTimeDomainData(data);
        let peak = 0; for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i] - 128));
        bar.style.width = Math.min(100, peak * 1.6) + "%";
        raf = requestAnimationFrame(loop);
      })();
    }
    function cleanup() {
      clearInterval(tick); cancelAnimationFrame(raf); bar.style.width = "0";
      if (stream) stream.getTracks().forEach(function (tr) { tr.stop(); });
      if (actx) actx.close().catch(function () {});
      stream = null; actx = null; box.classList.remove("live");
    }
    go.addEventListener("click", function () {
      if (!me || !me.name) { say("Please type your name at the top of the page first.", "bad"); whoBox.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
      say("Asking to use your microphone…");
      navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }).then(function (s) {
        stream = s; chunks = [];
        rec = MIME ? new MediaRecorder(s, { mimeType: MIME }) : new MediaRecorder(s);
        rec.ondataavailable = function (e) { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = function () {
          secs = (Date.now() - t0) / 1000;
          cleanup();
          blob = new Blob(chunks, { type: (rec.mimeType || MIME || "audio/webm").split(";")[0] });
          if (url) URL.revokeObjectURL(url);
          url = URL.createObjectURL(blob);
          audio.src = url; audio.hidden = false; note.hidden = false;
          save.hidden = false; save.disabled = false; redo.hidden = false; go.hidden = true; stop.hidden = true;
          say("Listen to your recording. If you are happy with it, save it. If not, record again.");
        };
        try { actx = new (window.AudioContext || window.webkitAudioContext)(); const an = actx.createAnalyser(); an.fftSize = 512; actx.createMediaStreamSource(s).connect(an); level(an); } catch (e) {}
        rec.start(1000); t0 = Date.now();
        box.classList.add("live"); go.hidden = true; stop.hidden = false; redo.hidden = true; save.hidden = true; audio.hidden = true; note.hidden = true;
        say("Recording… Press Stop when you finish.");
        tick = setInterval(function () {
          const e = (Date.now() - t0) / 1000; timer.textContent = mmss(e);
          if (e >= max) { rec.stop(); }
        }, 250);
      }).catch(function (err) {
        cleanup();
        say(err && err.name === "NotAllowedError"
          ? "The microphone is blocked. Tap the lock or “aA” icon next to the web address, allow the microphone, then reload the page."
          : "No microphone was found. Check that one is connected, then try again.", "bad");
      });
    });
    stop.addEventListener("click", function () { if (rec && rec.state !== "inactive") rec.stop(); });
    redo.addEventListener("click", function () {
      blob = null; audio.hidden = true; audio.removeAttribute("src"); note.hidden = true; save.hidden = true; redo.hidden = true; go.hidden = false; timer.textContent = "0:00"; say("");
      go.click();
    });
    save.addEventListener("click", function () {
      if (!blob) return;
      save.disabled = true; redo.disabled = true; say("Saving… please keep this page open.");
      toBase64(blob).then(function (b64) {
        return api("saveRecording", { student: me.code, who: me.name, lesson: LESSON, part: part, label: label, mime: blob.type, seconds: Math.round(secs), note: note.value.trim().slice(0, 500), data: b64 });
      }).then(function () {
        say("Saved. Bill has your recording. You can find it under “Your recordings”.", "ok");
        save.hidden = true; redo.disabled = false; redo.hidden = false; note.value = ""; note.hidden = true; go.hidden = true;
        refreshLists();
      }).catch(function (err) {
        save.disabled = false; redo.disabled = false;
        say("Sorry, it did not save. Check your internet and press Save again in a minute.", "bad");
        if (window.console) console.warn("saveRecording failed:", err && err.message);
        const dl = el("a", { href: url, download: slug(me.name) + "-lesson" + LESSON + "-" + part + (blob.type.indexOf("mp4") > -1 ? ".m4a" : ".webm"), text: "Or download the recording and send it to Bill on Preply." });
        msg.appendChild(document.createElement("br")); msg.appendChild(dl);
      });
    });
  }

  // ---------- saved recordings ----------
  const players = {};
  function refreshLists() {
    document.querySelectorAll(".mine-list").forEach(function (ul) {
      ul.innerHTML = "";
      const empty = ul.nextElementSibling;
      if (!me || !me.code) { if (empty) empty.textContent = "Type your name at the top to see your recordings."; return; }
      if (empty) empty.textContent = "Loading your recordings…";
      api("listRecordings", me.code).then(function (items) {
        const only = Number(ul.dataset.lesson || 0);
        items = (items || []).filter(function (x) { return !only || x.lesson === only; });
        if (empty) empty.textContent = items.length ? "" : (only ? "No recordings for this lesson yet." : "No recordings yet.");
        items.forEach(function (x) { ul.appendChild(item(x, !only)); });
      }).catch(function () { if (empty) empty.textContent = "Your recordings could not be loaded right now. Try again later."; });
    });
  }
  function item(x, showLesson) {
    const li = el("li");
    const title = (showLesson ? (x.lesson > 6 ? "Drill " + (x.lesson - 6) : "Lesson " + x.lesson) + ": " : "") + x.label;
    const play = el("button", { type: "button", text: "▶ Play" });
    const del = el("button", { type: "button", class: "ghost", text: "Delete" });
    li.appendChild(el("div", {}, [el("strong", { text: title }), el("div", { class: "when", text: when(x.date) + (x.seconds ? " · " + mmss(x.seconds) : "") })]));
    li.appendChild(el("div", { class: "acts" }, [play, del]));
    if (x.note) li.appendChild(el("div", { class: "note", text: "Note: " + x.note }));
    play.addEventListener("click", function () {
      if (players[x.id]) { li.appendChild(players[x.id]); players[x.id].play(); play.hidden = true; return; }
      play.disabled = true; play.textContent = "Loading…";
      api("getRecording", me.code, x.id).then(function (r) {
        const a = el("audio", { controls: "" });
        a.src = URL.createObjectURL(fromBase64(r.data, r.mime));
        players[x.id] = a; li.appendChild(a); play.hidden = true;
        a.play().catch(function () {});
      }).catch(function () { play.disabled = false; play.textContent = "▶ Play"; alert("Sorry, that recording could not be loaded."); });
    });
    del.addEventListener("click", function () {
      if (!confirm("Delete “" + title + "” from " + when(x.date) + "? This cannot be undone.")) return;
      del.disabled = true;
      api("deleteRecording", me.code, x.id).then(refreshLists).catch(function () { del.disabled = false; alert("Sorry, it could not be deleted."); });
    });
    return li;
  }

  // ---------- written answers stay on this device ----------
  function keepAnswers() {
    const key = "pron.answers." + location.pathname;
    const saved = store(key) || {};
    document.querySelectorAll("[data-k]").forEach(function (f) {
      const k = f.dataset.k;
      if (f.type === "checkbox") { f.checked = !!saved[k]; f.addEventListener("change", function () { saved[k] = f.checked; store(key, saved); }); }
      else { f.value = saved[k] || ""; f.addEventListener("input", function () { saved[k] = f.value; store(key, saved); }); }
    });
  }

  document.querySelectorAll(".rec").forEach(recorder);
  keepAnswers();
  const pr = document.getElementById("print"); if (pr) pr.addEventListener("click", function () { window.print(); });
  startWho();
})();
