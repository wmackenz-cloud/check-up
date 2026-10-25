(function () {
  var note = document.getElementById("copied");
  document.querySelectorAll("[data-copy]").forEach(function (b) {
    b.addEventListener("click", function () {
      var url = new URL(b.getAttribute("data-copy"), location.href).href;
      var done = function (t) { if (note) { note.textContent = t; setTimeout(function () { note.textContent = ""; }, 4000); } };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(function () { done("Copied: " + url); }, function () { prompt("Copy this link:", url); });
      else prompt("Copy this link:", url);
    });
  });
  // Word sorting exercises
  document.querySelectorAll(".sorter").forEach(function (box) {
    var k = box.dataset.k, sel = null;
    var chips = box.querySelectorAll(".chip"), bank = box.querySelector(".bank"), result = box.querySelector(".sort-result");
    var place = saved[k] || {};
    function dropFor(col) { return col === "" ? bank : box.querySelector('.col .drop[data-col="' + col + '"]'); }
    chips.forEach(function (c) { var at = place[c.dataset.i]; if (at !== undefined && at !== "") { var d = dropFor(String(at)); if (d) d.appendChild(c); } });
    function store() {
      place = {}; chips.forEach(function (c) { place[c.dataset.i] = c.parentNode.dataset.col; });
      saved[k] = place; try { localStorage.setItem(key, JSON.stringify(saved)); } catch (e) {}
    }
    function clearMarks() { chips.forEach(function (c) { c.classList.remove("ok", "bad"); }); result.textContent = ""; }
    function select(c) { if (sel) sel.classList.remove("picked"); sel = (sel === c) ? null : c; if (sel) sel.classList.add("picked"); box.classList.toggle("picking", !!sel); }
    function moveTo(drop) { if (!sel || !drop) return; drop.appendChild(sel); sel.classList.remove("picked"); sel = null; box.classList.remove("picking"); clearMarks(); store(); }
    box.addEventListener("click", function (e) {
      var c = e.target.closest(".chip");
      if (c) { if (sel && sel !== c && c.parentNode !== sel.parentNode) { moveTo(c.parentNode); } else { select(c); } return; }
      var d = e.target.closest(".drop") || (e.target.closest(".col") && e.target.closest(".col").querySelector(".drop"));
      if (d) moveTo(d);
    });
    box.addEventListener("dragstart", function (e) { var c = e.target.closest(".chip"); if (!c) return; select(c); if (sel !== c) select(c); e.dataTransfer.setData("text/plain", c.dataset.i); });
    box.addEventListener("dragover", function (e) { if (e.target.closest(".drop, .col")) e.preventDefault(); });
    box.addEventListener("drop", function (e) {
      e.preventDefault();
      var i = e.dataTransfer.getData("text/plain"); var c = box.querySelector('.chip[data-i="' + i + '"]'); if (!c) return;
      sel = c; moveTo(e.target.closest(".drop") || (e.target.closest(".col") && e.target.closest(".col").querySelector(".drop")));
    });
    box.querySelector(".sort-check").addEventListener("click", function () {
      var right = 0, left = 0;
      chips.forEach(function (c) {
        c.classList.remove("ok", "bad");
        var col = c.parentNode.dataset.col;
        if (col === "") { left++; return; }
        if (col === c.dataset.a) { right++; c.classList.add("ok"); } else c.classList.add("bad");
      });
      result.textContent = right + " of " + chips.length + " correct" + (left ? " (" + left + " still to place)" : (right === chips.length ? ". Well done!" : ". Move the red ones and check again."));
    });
    box.querySelector(".sort-reset").addEventListener("click", function () { chips.forEach(function (c) { bank.appendChild(c); }); select(null); if (sel) select(sel); clearMarks(); store(); });
  });
  var pr = document.getElementById("print");
  if (pr) pr.addEventListener("click", function () { window.print(); });
})();
