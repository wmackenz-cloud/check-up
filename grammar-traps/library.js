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
  var pr = document.getElementById("print");
  if (pr) pr.addEventListener("click", function () { window.print(); });
})();
