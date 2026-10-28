// Menu bar across the top of Bill's teacher pages. It matches the menu on Trial Intake, My Students and Results.
// Pages on this website open in the same tab; Claude pages and Google Drive open in a new tab.
(function () {
  var me = document.currentScript;
  var root = new URL("./", me.src).href; // the site's home folder
  var here = location.href.split(/[?#]/)[0];
  var CLAUDE = [
    { label: "Trial Intake", href: "https://claude.ai/artifact/4FLmes5j71KECkoW6goUrp" },
    { label: "My Students", href: "https://claude.ai/artifact/QFsUBGJkqCArmVdZji3y4X" },
    { label: "Results", href: "https://claude.ai/artifact/WzojtAyiYfuXcTMs7TyGwQ" }
  ];
  var RES = [
    { label: "Grammar Traps", note: "11 worksheets with teacher notes", href: "grammar-traps/index.html", match: "grammar-traps/" },
    { label: "Vocabulary", note: "9 worksheets, one per Check-Up area", href: "vocabulary/index.html", match: "vocabulary/" },
    { label: "Pronunciation", note: "Lessons and drills for Vietnamese speakers", href: "pronunciation/teacher-f42702.html", match: "pronunciation/" },
    { label: "Speaking Confidence", note: "4-lesson series in Google Drive", href: "https://drive.google.com/drive/folders/1IH6FfV2yImOwFIoIR-C-zsapwcYrFUGO" },
    null,
    { label: "Teacher Library", note: "Everything in one place", href: "library.html" }
  ];
  function urlOf(h) { return /^https?:/.test(h) ? h : root + h; }
  function link(it) {
    var a = document.createElement("a");
    a.href = urlOf(it.href);
    if (/^https?:/.test(it.href)) { a.target = "_blank"; a.rel = "noopener"; a.title = "Opens in a new tab"; }
    a.appendChild(document.createTextNode(it.label));
    return a;
  }
  var isOn = function (it) { return it && (it.match ? here.indexOf(root + it.match) === 0 : here === urlOf(it.href)); };

  var nav = document.createElement("nav"); nav.className = "tnav"; nav.setAttribute("aria-label", "Teacher menu");
  var ul = document.createElement("ul");
  function li(node) { var x = document.createElement("li"); x.appendChild(node); ul.appendChild(x); return x; }
  CLAUDE.forEach(function (it) { li(link(it)); });

  var d = document.createElement("details"); d.className = "tnav-drop";
  var sum = document.createElement("summary"); sum.textContent = "Resources";
  if (RES.some(isOn)) sum.setAttribute("data-current", "true");
  var panel = document.createElement("div"); panel.className = "tnav-panel";
  RES.forEach(function (it) {
    if (!it) { panel.appendChild(document.createElement("hr")); return; }
    var a = link(it);
    var sp = document.createElement("span"); sp.textContent = it.note; a.appendChild(sp);
    if (isOn(it)) a.setAttribute("aria-current", "page");
    a.addEventListener("click", function () { d.open = false; });
    panel.appendChild(a);
  });
  d.appendChild(sum); d.appendChild(panel); li(d);
  li(link({ label: "Check-Ups", href: "index.html" }));
  nav.appendChild(ul);
  document.body.insertBefore(nav, document.body.firstChild);

  document.addEventListener("click", function (e) { if (d.open && !d.contains(e.target)) d.open = false; });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && d.open) { d.open = false; sum.focus(); } });
})();
