// Menu bar across the top of Bill's teacher pages. Edit the list below to change it on every page.
(function () {
  var me = document.currentScript;
  var root = new URL("./", me.src).href; // the site's home folder
  var ITEMS = [
    { label: "Library", href: "library.html" },
    { label: "Grammar Traps", href: "grammar-traps/index.html", match: "grammar-traps/" },
    { label: "Vocabulary", href: "vocabulary/index.html", match: "vocabulary/" },
    { label: "Pronunciation", href: "pronunciation/teacher-f42702.html", match: "pronunciation/" },
    { label: "Speaking Confidence", href: "https://drive.google.com/drive/folders/1IH6FfV2yImOwFIoIR-C-zsapwcYrFUGO", ext: true },
    { label: "Check-Ups", href: "index.html", ext: true },
    { label: "My Students", href: "https://claude.ai/artifact/QFsUBGJkqCArmVdZji3y4X", ext: true }
  ];
  var here = location.href.split(/[?#]/)[0];
  var nav = document.createElement("nav");
  nav.className = "tnav";
  nav.setAttribute("aria-label", "Teacher menu");
  var ul = document.createElement("ul");
  ITEMS.forEach(function (it) {
    var url = /^https?:/.test(it.href) ? it.href : root + it.href;
    var li = document.createElement("li");
    var a = document.createElement("a");
    a.href = url; a.textContent = it.label;
    if (it.ext) { a.target = "_blank"; a.rel = "noopener"; a.title = "Opens in a new tab"; }
    var current = it.match ? here.indexOf(root + it.match) === 0 : here === url;
    if (current) a.setAttribute("aria-current", "page");
    li.appendChild(a); ul.appendChild(li);
  });
  nav.appendChild(ul);
  document.body.insertBefore(nav, document.body.firstChild);
  var cur = ul.querySelector("[aria-current]");
  if (cur && cur.scrollIntoView) { try { ul.scrollLeft = cur.offsetLeft - 16; } catch (e) {} }
})();
