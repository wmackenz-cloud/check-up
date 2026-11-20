#!/usr/bin/env python3
"""Build a lesson series from tools/<series>/<n>.json (format: tools/farm/SPEC.md).

Series: farm (Farm English, bank ids fa-N) and tourism (Tourism English, bank ids to-N). For each lesson n it writes:
  <dir>/student-<n>.html        the student worksheet (data-item <dir>-<n>)
  <dir>/teacher-<n>.html        teacher notes with a 50-minute plan and the answers
  practice/bank/<bank>-<n>.js   20 review questions for the Practice bank
  <dir>/index.html              the list of lessons for Bill
Run from anywhere: python3 tools/series.py farm   (or tourism; add --check to only validate)
"""
import glob, html, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERIESES = {
    "farm": {"name": "Farm English", "bank": "fa",
             "lead": "%d lessons on farm life and farm words for any curious learner: animals, buildings and land, machines, crops and the farming year, looking after animals, food from farm to table, weather and problems, and farm idioms."},
    "tourism": {"name": "Tourism English", "bank": "to",
                "lead": "%d lessons for meeting tourists and for being one: welcoming visitors and helping them, then asking for directions, tickets and information on holiday. Both practise asking questions: closed (yes/no and either/or) and open (where, what, how)."},
}
KEY = next((a for a in sys.argv[1:] if a in SERIESES), "farm")
CFG = SERIESES[KEY]
SRC = os.path.join(ROOT, "tools", KEY)
OUT = os.path.join(ROOT, KEY)
SERIES = CFG["name"]
BK = CFG["bank"]
A = lambda s: html.escape(str(s), quote=True)
T = lambda s: html.escape(str(s), quote=False)
CSS_V, GAMES_V, NAV_V, API_V, WORK_V = "1795100000", "1794400000", "1794900000", "1792889681", "1793900000"

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{title}</title>
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,500;7..72,700&family=Atkinson+Hyperlegible:wght@400;700&display=swap">
<link rel="stylesheet" href="../grammar-traps/traps.css?v={css}">
{extra}</head>
"""

STUDENT_JS = """<script>
(function () {
  var key = "traps-" + location.pathname;
  var saved = {};
  try { saved = JSON.parse(localStorage.getItem(key) || "{}") || {}; } catch (e) {}
  var fields = document.querySelectorAll(".blank");
  fields.forEach(function (f) {
    if (saved[f.dataset.k]) f.value = saved[f.dataset.k];
    f.addEventListener("input", function () {
      saved[f.dataset.k] = f.value;
      try { localStorage.setItem(key, JSON.stringify(saved)); } catch (e) {}
    });
  });
  var clear = document.getElementById("clear");
  if (clear) clear.addEventListener("click", function () {
    if (!confirm("Clear all your answers on this page?")) return;
    fields.forEach(function (f) { f.value = ""; });
    saved = {}; try { localStorage.removeItem(key); } catch (e) {}
    if (window.lessonGames) window.lessonGames.reset();
    location.reload();
  });
  var pr = document.getElementById("print");
  if (pr) pr.addEventListener("click", function () { window.print(); });
  // Print the answer key on its own last page, even when it's closed on screen.
  var ans = document.querySelector("details.answers"), wasOpen = false;
  window.addEventListener("beforeprint", function () { if (ans) { wasOpen = ans.open; ans.open = true; } });
  window.addEventListener("afterprint", function () { if (ans) ans.open = wasOpen; });
})();
</script>
"""

COPY_JS = """<script>
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
</script>
"""

errors = []


def err(n, msg):
    errors.append("lesson %s: %s" % (n, msg))


def plain(s):
    return re.sub(r"<[^>]+>", "", str(s))


def blank(k, kind="hidden"):
    if kind == "hidden":
        return '<input class="blank" type="hidden" data-k="%s">' % k
    return '<input class="blank mid" type="text" aria-label="Answer" autocomplete="off" spellcheck="false" data-k="%s" data-ok="%s">' % (k, A(kind))


def gapq(it):
    return plain(it.get("ask", "") + (" " if it.get("ask") else "") + it.get("pre", "") + "___" + it.get("post", "")).strip()


# ---------- exercise parts: each returns (html, answer text, web summary) ----------

def part_match(n, k, p):
    lis = []
    for i, it in enumerate(p["items"], 1):
        lis.append('<li data-why="%s" data-l="%s" data-r="%s" data-q="Match: %s">%s = %s%s</li>' % (
            A(it["why"]), A(it["l"]), A(it["r"]), A(it["l"]), T(it["l"]), T(it["r"]), blank("%s-%d" % (k, i))))
    intro = p.get("intro", "Tap a word, then tap its partner.")
    h = '<p>%s</p>\n<div class="g-match" data-g="%s">\n<ul>\n%s\n</ul>\n</div>' % (intro, k, "\n".join(lis))
    ans = "; ".join("%s = %s" % (T(it["l"]), T(it["r"])) for it in p["items"]) + "."
    return h, ans, "tap to match, %d pairs" % len(p["items"])


def part_pick(n, k, p):
    lis = []
    for i, it in enumerate(p["items"], 1):
        if not 0 <= it["a"] < len(it["opts"]):
            err(n, "%s item %d: a out of range" % (k, i))
        opts = "".join("<button>%s</button>" % T(o) for o in it["opts"])
        lis.append('<li data-why="%s" data-a="%d" data-form="%s" data-q="%s">%s<span class="gap game-ui"></span>%s%s <span class="opts game-ui">%s</span></li>' % (
            A(it["why"]), it["a"], A(it["opts"][it["a"]]), A(gapq(it)), it.get("pre", ""), blank("%s-%d" % (k, i)), it.get("post", ""), opts))
    intro = p.get("intro", "Tap the right word or phrase.")
    h = '<p>%s</p>\n<ol class="g-pick" data-g="%s">\n%s\n</ol>' % (intro, k, "\n".join(lis))
    ans = ", ".join("%d %s" % (i, T(it["opts"][it["a"]])) for i, it in enumerate(p["items"], 1)) + "."
    return h, ans, "tap the right word, %d items" % len(p["items"])


def part_type(n, k, p):
    lis = []
    for i, it in enumerate(p["items"], 1):
        ok = it["ok"] if isinstance(it["ok"], list) else [it["ok"]]
        ask = (it["ask"] + "<br>") if it.get("ask") else ""
        lis.append('<li data-why="%s" data-q="%s">%s%s%s%s</li>' % (
            A(it["why"]), A(gapq(it)), ask, it.get("pre", ""), blank("%s-%d" % (k, i), "|".join(ok)), it.get("post", "")))
    out = []
    if p.get("bank"):
        out.append("<p>Word bank: <em>%s</em></p>" % T(", ".join(p["bank"])))
    out.append("<p>%s Type it in the gap, then press <strong>Check</strong> (or Enter). Stuck? Tap <strong>Hint</strong>, but then it won't count as right first time.</p>" % p.get("intro", "Use each word once." if p.get("bank") else "Write the missing word."))
    out.append('<ol class="g-type" data-g="%s">\n%s\n</ol>' % (k, "\n".join(lis)))
    ans = ", ".join("%d %s" % (i, T((it["ok"] if isinstance(it["ok"], list) else [it["ok"]])[0])) for i, it in enumerate(p["items"], 1)) + "."
    return "\n".join(out), ans, "type the word, %d items" % len(p["items"])


def part_order(n, k, p):
    lis = []
    for i, it in enumerate(p["items"], 1):
        alt = (' data-alt="%s"' % A("|".join(it["alt"]))) if it.get("alt") else ""
        names = (' data-names="%s"' % A(it["names"])) if it.get("names") else ""
        w = len(it["answer"].split())
        if not 4 <= w <= 13:
            err(n, "%s item %d: %d words (4 to 13)" % (k, i, w))
        lis.append('<li data-why="%s" data-answer="%s"%s%s data-q="Put the words in order: %s">%s</li>' % (
            A(it["why"]), A(it["answer"]), alt, names, A(it["answer"]), blank("%s-%d" % (k, i))))
    h = '<p>%s</p>\n<ol class="g-order" data-g="%s">\n%s\n</ol>' % (
        p.get("intro", "Tap the words in the right order to make a sentence. Tap a word in your sentence to send it back."), k, "\n".join(lis))
    ans = " ".join("%d %s" % (i, T(it["answer"])) for i, it in enumerate(p["items"], 1))
    return h, ans, "word order, %d sentences" % len(p["items"])


def part_sort(n, k, p):
    cols = p["cols"]
    chips = []
    for i, c in enumerate(p["chips"]):
        if not 0 <= c["col"] < len(cols):
            err(n, "%s chip %d: col out of range" % (k, i))
        chips.append('<button type="button" class="chip" draggable="true" data-why="%s" data-i="%d" data-a="%d">%s</button>' % (A(c["why"]), i, c["col"], T(c["t"])))
    colh = "".join('<div class="col" data-col="%d"><p class="col-h">%s</p><div class="drop" data-col="%d"></div></div>' % (j, T(c), j) for j, c in enumerate(cols))
    out = []
    if p.get("rule"):
        out.append('<div class="rule">\n%s\n</div>' % p["rule"])
    out.append("<p>%s</p>" % p.get("intro", "Sort them."))
    out.append('<div class="sorter g-sort" data-k="%s"><p class="hint sort-how">Tap a word, then tap the column it belongs in. On a computer you can also drag the words. Right answers stay; wrong ones jump back.</p><div class="bank drop" data-col="">%s</div><div class="cols" style="--n:%d">%s</div><div class="sort-acts"><button type="button" class="ghost sort-reset">Start again</button></div></div>' % (
        k, "".join(chips), len(cols), colh))
    ans = " ".join("<em>%s</em>: %s." % (T(c), ", ".join(T(ch["t"]) for ch in p["chips"] if ch["col"] == j)) for j, c in enumerate(cols))
    return "\n".join(out), ans, "sort into %s (%d chips)" % (" / ".join(cols), len(p["chips"]))


def part_spot(n, k, p):
    lis, fixed = [], []
    for i, it in enumerate(p["items"], 1):
        bad = it.get("bad", "")
        if bad and bad not in it["q"]:
            err(n, "%s item %d: bad not in q" % (k, i))
        opts = it.get("opts", [])
        if bad and it["fix"] not in opts:
            opts = [it["fix"]] + opts
        lis.append('<li data-why="%s" data-bad="%s" data-fix="%s" data-opts="%s" data-q="%s"><span class="sent">%s</span>%s</li>' % (
            A(it["why"]), A(bad), A(it.get("fix", "") if bad else ""), A(",".join(opts) if bad else ""), A(it["q"]), T(it["q"]), blank("%s-%d" % (k, i))))
        fixed.append("%d %s" % (i, T(it["q"].replace(bad, it["fix"], 1)) if bad else "No mistake."))
    oks = sum(1 for it in p["items"] if not it.get("bad"))
    h = '<p>%s</p>\n<ol class="g-spot" data-g="%s" data-allow-ok>\n%s\n</ol>' % (
        p.get("intro", "Some sentences have one mistake. Tap the wrong word, then choose the correct words. If the sentence is correct, tap <strong>No mistake</strong>."), k, "\n".join(lis))
    return h, " ".join(fixed), "find the mistake, %d sentences (%d correct)" % (len(p["items"]), oks)


def part_reading(n, k, p):
    h1 = '<div class="rule">\n%s\n</div>' % p["text"]
    h2, ans, _ = part_type(n, k, {"items": p["items"], "intro": p.get("intro", "Read the text. Then type the missing word from the text.")})
    return h1 + "\n" + h2, ans, "reading with %d typed answers" % len(p["items"])


def part_speaking(n, k, p):
    lis = "\n".join("<li>%s</li>" % q for q in p["items"])
    return '<p>%s</p>\n<ol>\n%s\n</ol>' % (p.get("intro", "Think about each question. We will talk about them in our lesson."), lis), "", "speaking questions to talk about in the lesson (nothing to type)"


PARTS = {"match": part_match, "pick": part_pick, "type": part_type, "order": part_order, "sort": part_sort,
         "spot": part_spot, "reading": part_reading, "speaking": part_speaking}


def build_exercises(n, L):
    body, answers, web = [], [], []
    for e, ex in enumerate(L["exercises"], 1):
        body.append('<h2 id="ex%d" class="ex">Exercise %d: %s</h2>' % (e, e, T(ex["title"])))
        parts = ex.get("parts") or [ex]
        a_bits, w_bits = [], []
        for j, p in enumerate(parts):
            if p["kind"] not in PARTS:
                err(n, "exercise %d: unknown kind %s" % (e, p["kind"]))
                continue
            k = "e%d" % e + ("abcdef"[j] if len(parts) > 1 else "")
            if len(parts) > 1:
                body.append("<h3>Part %s: %s</h3>" % ("ABCDEF"[j], T(p.get("h", ""))))
            h, a, w = PARTS[p["kind"]](n, k, p)
            body.append(h)
            if a:
                a_bits.append(("Part %s: " % "ABCDEF"[j] if len(parts) > 1 else "") + a)
            w_bits.append(("Part %s: " % "ABCDEF"[j] if len(parts) > 1 else "") + w)
        if a_bits:
            answers.append((e, " ".join(a_bits)))
        web.append((e, ex["title"], "; ".join(w_bits)))
    return "\n".join(body), answers, web


def vocab_html(L):
    out = []
    for t in L["vocab"]:
        out.append("<h3>%s</h3>" % T(t["h"]))
        if t.get("note"):
            out.append("<p>%s</p>" % t["note"])
        out.append("<table>\n<thead><tr>%s</tr></thead>\n<tbody>" % "".join("<th>%s</th>" % T(c) for c in t["cols"]))
        for r in t["rows"]:
            if len(r) != len(t["cols"]):
                err(L["n"], "vocab table %s: row has %d cells" % (t["h"], len(r)))
            out.append("<tr>%s</tr>" % "".join(("<td><strong>%s</strong></td>" % c) if i == 0 else ("<td>%s</td>" % c) for i, c in enumerate(r)))
        out.append("</tbody>\n</table>")
    if L.get("say"):
        out.append('<p class="hint">Say it right: %s</p>' % L["say"])
    return "\n".join(out)


def student(L):
    n = L["n"]
    ex, answers, _ = build_exercises(n, L)
    li = lambda xs: "".join("<li>%s</li>" % x for x in xs)
    page = [HEAD.format(title=A("%s %d: %s" % (SERIES, n, L["title"])), css=CSS_V, extra='<link rel="stylesheet" href="../games.css?v=%s">\n' % GAMES_V)]
    page.append('<body class="student" data-item="%s-%d">' % (KEY, n))
    page.append("""<header class="top">
  <p class="eyebrow">%s &middot; Lesson %d</p>
  <h1>%s</h1>
  <p class="namedate">Name: <span class="line"></span> Date: <span class="line"></span></p>
  <div class="tools">
    <button type="button" id="print">Print or save as PDF</button>
    <button type="button" class="ghost" id="clear">Clear my answers</button>
    <span class="hint">Tap or type your answers. Green dot = right first time. Get a gold star for each perfect exercise. Your progress stays on this device.</span>
  </div>
</header>
<main class="sheet">""" % (SERIES, n, T(L["title"])))
    page.append("""<section class="aims" aria-labelledby="aims-h">
<h2 id="aims-h">What this lesson is for</h2>
<p class="why"><strong>Why this matters:</strong> %s</p>
<div class="aims-grid">
<div><h3>You will know</h3><ul>%s</ul></div>
<div><h3>You will understand</h3><ul>%s</ul></div>
<div><h3>You will be able to</h3><ul>%s</ul></div>
</div>
</section>
<section class="mistakes" aria-labelledby="mis-h">
<h2 id="mis-h">Common mistakes to watch for</h2>
<ul>
%s
</ul>
</section>""" % (L["why"], li(L["know"]), li(L["understand"]), li(L["able"]),
                 "\n".join("<li><del>%s</del> %s</li>" % (T(w), r) for w, r in L["mistakes"])))
    page.append("<h2>Warm-up</h2>\n<ul>\n%s\n</ul>" % "\n".join("<li>%s</li>" % w for w in L["warmup"]))
    page.append("<h2>Key vocabulary</h2>\n" + vocab_html(L))
    page.append("")
    page.append(ex)
    page.append("""<details class="answers">
  <summary>Check your answers</summary>
  <div class="answers-body">
%s
  </div>
</details>
</main>
<footer class="foot"><p>From Bill's English lessons. Questions? Ask me in our next lesson.</p></footer>""" % "\n".join("<p><strong>Exercise %d:</strong> %s</p>" % a for a in answers))
    page.append(STUDENT_JS + '<script src="../games.js?v=%s"></script>\n<script src="../api.js?v=%s"></script>\n<script src="../work.js?v=%s"></script>\n</body>\n</html>\n' % (GAMES_V, API_V, WORK_V))
    return "\n".join(page)


def teacher(L, last):
    n, t = L["n"], L["teacher"]
    _, answers, web = build_exercises(n, L)
    li = lambda xs: "\n".join("<li>%s</li>" % x for x in xs)
    page = [HEAD.format(title=A("Teacher Notes %d: %s" % (n, L["title"])), css=CSS_V, extra="")]
    page.append('<body class="teacher">\n<script src="../teacher-nav.js?v=%s"></script>' % NAV_V)
    page.append("""<header class="top">
  <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="../library.html">Teacher library</a></li><li><a href="../work/index.html">English for Work</a></li><li><a href="index.html">%s</a></li><li><span aria-current="page">Teacher notes %d</span></li></ol></nav>
  <h1>Teacher Notes %d: %s</h1>
  <div class="tools">
    <a class="btn" href="student-%d.html" target="_blank" rel="noopener">Open the student page</a>
    <button type="button" class="ghost" data-copy="student-%d.html">Copy student link</button>
    <button type="button" class="ghost" id="print">Print</button>
    <span class="hint" aria-live="polite" id="copied"></span>
  </div>
</header>
<main class="sheet notes">""" % (SERIES, n, n, T(L["title"]), n, n))
    page.append("<p><strong>Purpose:</strong> %s</p>" % t["purpose"])
    page.append("<p><strong>Lesson time:</strong> 50 minutes, plus a few exercises to finish at home.</p>")
    page.append("<p><strong>Level:</strong> B1 to B2. <strong>Before the lesson:</strong> %s</p>" % t["before"])
    page.append("\n<h2>Lesson plan (50 minutes)</h2>\n<ol>\n%s\n</ol>" % "\n".join("<li><strong>%s</strong> %s</li>" % (T(a), b) for a, b in t["plan"]))
    page.append("\n<h2>Key vocabulary: notes</h2>\n<h3>Pronunciation</h3>\n<ul>\n%s\n</ul>" % li(t["pron"]))
    page.append("<h3>%s</h3>\n<ul>\n%s\n</ul>" % (T(t.get("mistakes_h", "False friends and common mistakes")), li(t["mistakes"])))
    if t.get("uk_us"):
        page.append("<h3>British, Canadian and American words</h3>\n<table>\n<thead><tr><th>UK</th><th>US / Canada</th><th>Note</th></tr></thead>\n<tbody>\n%s\n</tbody>\n</table>" % "\n".join("<tr><td>%s</td><td>%s</td><td>%s</td></tr>" % tuple(r) for r in t["uk_us"]))
    page.append("\n<h2>Adapting the lesson</h2>\n<table>\n<thead><tr><th>Element</th><th>B1</th><th>B2</th></tr></thead>\n<tbody>\n%s\n</tbody>\n</table>" % "\n".join("<tr><td>%s</td><td>%s</td><td>%s</td></tr>" % tuple(r) for r in t["adapt"]))
    if t.get("extra"):
        page.append(t["extra"])
    page.append("\n<h2>Speaking prompts and follow-ups</h2>\n<ul>\n%s\n</ul>" % li(t["prompts"]))
    page.append("\n<h2>Answers</h2>\n<ul>\n%s\n</ul>" % "\n".join("<li><strong>Exercise %d:</strong> %s</li>" % a for a in answers))
    page.append("\n<h2>On the web page</h2>\n<p>Nothing on the page is timed. Every auto-marked item has a short explanation that opens after a wrong answer.</p>\n<ul>\n%s\n</ul>" % "\n".join("<li><strong>Exercise %d</strong> (%s): %s.</li>" % (e, T(ti), w) for e, ti, w in web))
    page.append("<p>The practice bank (<code>%s-%d</code>) has 20 more review questions on the same points, in new sentences.</p>\n</main>" % (BK, n))
    prev = '<a href="teacher-%d.html">&larr; Notes %d</a>' % (n - 1, n - 1) if n > 1 else "<span></span>"
    nxt = '<a href="teacher-%d.html">Notes %d &rarr;</a>' % (n + 1, n + 1) if n < last else "<span></span>"
    page.append('<nav class="pager">%s<a href="index.html">All lessons</a>%s</nav>' % (prev, nxt))
    page.append(COPY_JS + "</body>\n</html>\n")
    return "\n".join(page)


def bank(L):
    n = L["n"]
    items = L["bank"]
    if len(items) != 20:
        err(n, "bank has %d items (need 20)" % len(items))
    lines = []
    for i, it in enumerate(items, 1):
        it = dict(it)
        it["id"] = "%s-%d-%02d" % (BK, n, i)
        if len(it.get("why", "")) > 200:
            err(n, "bank %d: why over 200 chars" % i)
        if it["type"] == "pick" and it.get("a") not in it.get("opts", []):
            err(n, "bank %d: a not in opts" % i)
        if it["type"] in ("pick", "type") and it["q"].count("___") != 1:
            err(n, "bank %d: q needs one ___" % i)
        if it["type"] == "spot" and it.get("bad") and it["bad"] not in it["q"]:
            err(n, "bank %d: bad not in q" % i)
        if it["type"] == "order" and not 6 <= len(it["a"].split()) <= 12:
            err(n, "bank %d: order needs 6 to 12 words" % i)
        order = ["id", "type", "q", "opts", "a", "alt", "bad", "fix", "why"]
        it = {k: it[k] for k in order if k in it}
        lines.append("    " + json.dumps(it, ensure_ascii=False))
    return 'PRACTICE.add("%s-%d", {\n  title: %s,\n  page: "%s/student-%d.html",\n  items: [\n%s\n  ]\n});\n' % (
        BK, n, json.dumps("%s %d: %s" % (SERIES, n, L["title"]), ensure_ascii=False), KEY, n, ",\n".join(lines))


def index(lessons):
    rows = []
    for L in lessons:
        n = L["n"]
        rows.append("""  <li class="lesson">
    <span class="num">%d</span>
    <div class="info"><strong>%s</strong><div class="hint">%s</div></div>
    <div class="acts">
      <a class="btn" href="student-%d.html" target="_blank" rel="noopener">Student worksheet</a>
      <button type="button" class="ghost" data-copy="student-%d.html">Copy student link</button>
      <a class="btn ghost" href="teacher-%d.html">Teacher notes</a>
    </div>
  </li>""" % (n, T(L["title"]), T(L["hint"]), n, n, n))
    head = HEAD.format(title=SERIES, css=CSS_V, extra="<style>.group-h { max-width: 820px; margin: 28px auto 10px; font-family: var(--font-display); font-size: 1.2rem; color: var(--accent); }</style>\n")
    return head + """<body class="library">
<script src="../teacher-nav.js?v=%s"></script>
<header class="top">
  <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="../library.html">Teacher library</a></li><li><a href="../work/index.html">English for Work</a></li><li><span aria-current="page">%s</span></li></ol></nav>
  <h1>%s</h1>
  <p class="lead">%s Each has an interactive student page (games, a reading and an answer key), teacher notes with a 50-minute plan, and 20 practice questions.</p>
  <p class="hint">This page is for you. Send students the <strong>student worksheet</strong> link for the lesson you're teaching. <span aria-live="polite" id="copied"></span></p>
</header>
<main>
<ol class="lessons">
%s
</ol>
<p class="hint" id="copied" aria-live="polite"></p>
</main>
<script src="../grammar-traps/library.js"></script>
</body>
</html>
""" % (NAV_V, SERIES, SERIES, CFG["lead"] % len(lessons), "\n".join(rows))


def lint(L):
    n = L["n"]
    blob = json.dumps(L, ensure_ascii=False)
    if "—" in blob:
        err(n, "em dash found")
    for ex in L["exercises"]:
        for p in ex.get("parts") or [ex]:
            for it in p.get("items", []) + p.get("chips", []):
                if isinstance(it, dict) and len(it.get("why", "")) > 200:
                    err(n, "why over 200 chars: %s" % it["why"][:40])


def main():
    check = "--check" in sys.argv
    lessons = []
    for f in sorted(glob.glob(os.path.join(SRC, "*.json")), key=lambda p: int(re.sub(r"\D", "", os.path.basename(p)) or 0)):
        try:
            lessons.append(json.load(open(f, encoding="utf-8")))
        except Exception as e:
            errors.append("%s: %s" % (os.path.basename(f), e))
    for L in lessons:
        lint(L)
    last = max([L["n"] for L in lessons] or [0])
    outs = {}
    for L in lessons:
        try:
            outs["%s/student-%d.html" % (KEY, L["n"])] = student(L)
            outs["%s/teacher-%d.html" % (KEY, L["n"])] = teacher(L, last)
            outs["practice/bank/%s-%d.js" % (BK, L["n"])] = bank(L)
        except (KeyError, TypeError, IndexError) as e:
            err(L.get("n"), "missing or bad field: %r" % (e,))
    outs["%s/index.html" % KEY] = index(lessons)
    if errors:
        print("\n".join(errors))
        sys.exit(1)
    if not check:
        os.makedirs(OUT, exist_ok=True)
        for p, s in outs.items():
            open(os.path.join(ROOT, p), "w", encoding="utf-8").write(s)
    print("%s %s: %d lessons" % ("checked" if check else "built", SERIES, len(lessons)))


if __name__ == "__main__":
    main()
