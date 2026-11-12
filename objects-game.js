// "Move the pieces": the student slides the thing (direct object), the person (indirect object) and to/for
// into different places, and the sentence is judged as they go. Markup:
//   <ol class="obj-game" data-g="name"><li data-start="Can you explain" data-end="?" data-pieces="the rules|to|me"
//       data-ok="the rules to me" data-bad='{"me the rules":"why..."}' data-q="..."><input class="blank" type="hidden" data-k="..."></li></ol>
// Pieces in the sentence row are read in order; pieces left in the tray are not used.
(function () {
  function el(t, c, x) { var n = document.createElement(t); if (c) n.className = c; if (x != null) n.textContent = x; return n; }
  var KEY = "objgame-" + location.pathname;
  var saved = {}; try { saved = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) {}
  function save() { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {} }
  document.querySelectorAll(".obj-game > li").forEach(function (li, idx) {
    var input = li.querySelector("input.blank"), id = input.dataset.k;
    var ok = li.dataset.ok.split("|"), bad = JSON.parse(li.dataset.bad || "{}");
    var pieces = li.dataset.pieces.split("|");
    var found = (saved[id] && saved[id].found) || [];
    var row = el("div", "og-row"), start = el("span", "og-fixed", li.dataset.start), line = el("span", "og-line"), end = el("span", "og-fixed", li.dataset.end || ".");
    row.append(start, line, end);
    var trayLab = el("div", "og-traylab", "Pieces not used:"), tray = el("div", "og-tray");
    var verdict = el("p", "og-verdict"); verdict.setAttribute("aria-live", "polite");
    var chips = pieces.map(function (p) { var b = el("button", "og-chip", p); b.type = "button"; b.dataset.p = p; return b; });
    var held = null;
    function slots(container) {
      // A drop point before each chip and at the end.
      container.querySelectorAll(".og-slot").forEach(function (s) { s.remove(); });
      var kids = Array.prototype.slice.call(container.querySelectorAll(".og-chip"));
      kids.concat([null]).forEach(function (k) {
        var s = el("button", "og-slot"); s.type = "button"; s.setAttribute("aria-label", "Put it here");
        s.addEventListener("click", function () { if (held) { container.insertBefore(held, s); drop(); } });
        s.addEventListener("dragover", function (e) { e.preventDefault(); s.classList.add("over"); });
        s.addEventListener("dragleave", function () { s.classList.remove("over"); });
        s.addEventListener("drop", function (e) { e.preventDefault(); if (held) { container.insertBefore(held, s); drop(); } });
        container.insertBefore(s, k);
      });
    }
    function drop() { if (held) held.classList.remove("held"); held = null; li.classList.remove("holding"); slots(line); slots(tray); judge(); }
    chips.forEach(function (b) {
      b.draggable = true;
      b.addEventListener("click", function () {
        if (held === b) { drop(); return; }
        if (held) held.classList.remove("held");
        held = b; b.classList.add("held"); li.classList.add("holding");
      });
      b.addEventListener("dragstart", function () { held = b; b.classList.add("held"); li.classList.add("holding"); });
      b.addEventListener("dragend", function () { if (held) drop(); });
    });
    // Start: all pieces in the sentence, in a wrong or neutral order given by data-first, else as listed.
    var first = (li.dataset.first || pieces.join("|")).split("|");
    first.forEach(function (p) { var c = chips.find(function (x) { return x.dataset.p === p; }); if (c) line.append(c); });
    chips.forEach(function (c) { if (!c.parentNode) tray.append(c); });
    var count = el("p", "og-count");
    li.append(row, trayLab, tray, verdict, count);
    function sentence() { return Array.prototype.map.call(line.querySelectorAll(".og-chip"), function (c) { return c.dataset.p; }).join(" "); }
    function judge() {
      var s = sentence(), full = li.dataset.start + " " + s + (li.dataset.end || ".");
      if (ok.indexOf(s) > -1) {
        verdict.className = "og-verdict good"; verdict.textContent = "✓ Makes sense: " + full;
        if (found.indexOf(s) < 0) { found.push(s); saved[id] = { found: found }; save(); }
        input.value = found.map(function (f) { return li.dataset.start + " " + f + (li.dataset.end || "."); }).join(" / ");
        input.dispatchEvent(new Event("input", { bubbles: true }));
        li.classList.add("done");
      } else {
        verdict.className = "og-verdict bad";
        verdict.textContent = "✗ " + (bad[s] || "That doesn't sound right in English. Ask: verb + WHAT? Put the thing first, then to or for + the person.");
      }
      count.textContent = ok.length > 1 ? "Correct orders found: " + found.length + " of " + ok.length + (found.length < ok.length && found.length ? ". There is another one. Can you find it?" : found.length === ok.length ? ". You found them all!" : "") : "";
    }
    slots(line); slots(tray); judge();
  });
})();
