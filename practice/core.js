// Practice question bank: the list of lessons, the registry that bank/<id>.js files call, and the item checks.
// Used by the student page (index.html, with practice.js) and Bill's review page (teacher.html). See SCHEMA.md.
(function () {
  var IDS = [];
  var i;
  for (i = 1; i <= 11; i++) IDS.push("gt-" + i);
  IDS.push("aa");
  for (i = 1; i <= 18; i++) IDS.push("v-" + i);
  for (i = 1; i <= 4; i++) IDS.push("sv-" + i);
  for (i = 1; i <= 7; i++) IDS.push("sp-" + i);

  // The worksheet each lesson reviews (used when a bank file doesn't say, or isn't there yet).
  function pageFor(id) {
    var m = /^([a-z]+)-?(\d*)$/.exec(id) || [];
    if (id === "aa") return "grammar/a-or-an.html";
    if (m[1] === "gt") return "grammar-traps/student-" + m[2] + ".html";
    if (m[1] === "v") return "vocabulary/student-" + m[2] + ".html";
    if (m[1] === "sv") return "stanag/student-vocab-" + m[2] + ".html";
    if (m[1] === "sp") return "speaking/student-" + m[2] + ".html";
    return "";
  }
  function groupFor(id) {
    if (id === "aa" || /^gt-/.test(id)) return "Grammar";
    if (/^v-/.test(id)) return "Vocabulary";
    if (/^sv-/.test(id)) return "STANAG vocabulary";
    if (/^sp-/.test(id)) return "Speaking Confidence";
    return "";
  }

  // The same rule games.js uses to match a tapped word against data-bad.
  function bare(w) { return w.replace(/^[^\w']+|[^\w']+$/g, "").toLowerCase(); }
  function gaps(q) { return (String(q || "").match(/___/g) || []).length; }
  function words(s) { return String(s || "").trim().replace(/[.?!]$/, "").trim().split(/\s+/).filter(Boolean); }

  // Returns "" for a usable item, or a short description of what is wrong (the item is then left out of practice sets).
  function problem(it) {
    if (!it || typeof it !== "object") return "not an item";
    if (!it.id) return "no id";
    if (!it.why) return "no why";
    if (it.type === "pick") {
      if (gaps(it.q) !== 1) return "q needs exactly one ___";
      if (!Array.isArray(it.opts) || it.opts.length < 2 || it.opts.length > 4) return "needs 2 to 4 opts";
      if (it.opts.indexOf(it.a) < 0) return "a is not one of the opts";
      return "";
    }
    if (it.type === "type") {
      if (gaps(it.q) !== 1) return "q needs exactly one ___";
      var a = Array.isArray(it.a) ? it.a : [it.a];
      if (!a.filter(function (x) { return x && String(x).trim(); }).length) return "no accepted answers";
      if (a.some(function (x) { return String(x).indexOf("|") > -1; })) return "an answer contains |";
      return "";
    }
    if (it.type === "order") {
      var n = words(it.a).length;
      if (!/[.?!]$/.test(String(it.a || "").trim())) return "a should end with . ? or !";
      if (n < 3) return "sentence too short";
      if (n > 14) return "sentence too long (" + n + " words)";
      return "";
    }
    if (it.type === "spot") {
      if (!it.q) return "no sentence";
      var bad = String(it.bad || "").trim();
      if (!bad) return "";
      if (!it.fix) return "no fix";
      var toks = String(it.q).trim().split(/\s+/).map(function (w) { return bare(w.replace(/[.,?!]*$/, "")); });
      var bw = bad.toLowerCase().split(/\s+/), found = false;
      for (var j = 0; j + bw.length <= toks.length && !found; j++) {
        found = bw.every(function (w, k) { return toks[j + k] === w; });
      }
      if (!found) return "bad words not found in the sentence";
      var opts = spotOpts(it);
      if (opts.some(function (o) { return o.indexOf(",") > -1; })) return "an option contains a comma";
      return "";
    }
    return "unknown type “" + it.type + "”";
  }
  // The fix choices for a spot item: its opts, always including the fix and (if none given) the wrong words.
  function spotOpts(it) {
    var o = Array.isArray(it.opts) && it.opts.length ? it.opts.slice() : [it.bad];
    if (o.indexOf(it.fix) < 0) o.unshift(it.fix);
    return o.filter(function (x, k) { return x && o.indexOf(x) === k; });
  }

  var lessons = {};
  window.PRACTICE = {
    IDS: IDS, pageFor: pageFor, groupFor: groupFor, problem: problem, spotOpts: spotOpts, lessons: lessons,
    add: function (id, data) {
      if (IDS.indexOf(id) < 0 || !data || !Array.isArray(data.items)) return;
      lessons[id] = { id: id, title: data.title || id, page: data.page || pageFor(id), items: data.items };
    },
    // Loads bank/<id>.js for each id, in order. Missing files are skipped. done() runs once all have loaded or failed.
    load: function (ids, base, done) {
      var left = ids.length;
      if (!left) { done(); return; }
      ids.forEach(function (id) {
        var s = document.createElement("script");
        s.async = false;
        s.src = base + "bank/" + id + ".js";
        s.onload = s.onerror = function () { if (--left === 0) done(); };
        document.head.appendChild(s);
      });
    }
  };
})();
