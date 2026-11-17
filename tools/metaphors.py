#!/usr/bin/env python3
"""Build Advanced English (Metaphors and Similes) from tools/<section>/<n>.json (see tools/metaphors/SPEC.md, tools/similes/SPEC.md).

Writes, for each unit n:
  advanced/<section>/unit-<n>.html      the unit worksheet (data-item metaphor-<n> / simile-<n>)
  advanced/<section>/homework-<n>.html  the homework drill (data-item metaphor-h<n> / simile-h<n>)
  practice/bank/am-<n>.js / as-<n>.js   20 review questions for the Practice bank
and the section pages advanced/index.html (Advanced English) and advanced/<section>/index.html.
Run from the repo root: python3 tools/metaphors.py   (add --check to only validate)
"""
import glob, json, os, re, sys, urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import tenses as TN  # shared pieces: HEAD, TAIL, game lists

ROOT = TN.ROOT
A, T = TN.A, TN.T
SECTIONS = [
    {"key": "metaphors", "name": "Metaphors", "item": "metaphor", "pid": "am",
     "lead": ("Twelve units for very advanced (C1/C2) students. Each unit is built on one big image (argument is war, understanding is seeing, time is money...), "
              "so students learn how metaphors work as a system, not just a list. Each has expression cards, examples from literature, poetry and music, "
              "seven interactive exercises with an answer key, and a separate homework drill.")},
    {"key": "similes", "name": "Similes", "item": "simile", "pid": "as",
     "lead": ("Six units for very advanced (C1/C2) students: fixed similes with as ... as and like, ironic and humorous similes, and how to make fresh similes of your own. "
              "Each has expression cards, examples from literature, poetry and music, seven interactive exercises with an answer key, and a separate homework drill.")},
]
SEC = SECTIONS[0]

# The pages sit two folders down, so the shared files are ../../
HEAD = TN.HEAD.replace('href="../', 'href="../../')
TAIL = TN.TAIL.replace('src="../', 'src="../../')

STYLE = """<style>
/* Advanced English: metaphor units */
.big-idea { border: 2px solid var(--accent); background: var(--accent-soft); border-radius: 12px; padding: 14px 18px; margin: 14px 0; }
.big-idea p { margin: 6px 0; }
.hidden-list { columns: 2 260px; margin: 6px 0 0; padding-left: 1.2em; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap: 12px; margin: 12px 0; }
.xcard { border: 1px solid var(--rule); border-radius: 12px; background: var(--sheet); padding: 0; }
.xcard > summary { list-style: none; cursor: pointer; padding: 12px 14px; display: grid; gap: 4px; }
.xcard > summary::-webkit-details-marker { display: none; }
.xcard > summary .xe { font-family: var(--font-display); font-weight: 700; font-size: 1.12rem; color: var(--accent); }
.xcard > summary .xtap { font-size: .85rem; color: var(--ink-soft); }
.xcard[open] { border-color: var(--accent); }
.xcard[open] .xtap { display: none; }
.xbody { padding: 0 14px 12px; display: grid; gap: 6px; font-size: .97rem; }
.xbody p { margin: 0; }
.tone { display: inline-block; font-size: .72rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; border-radius: 999px; padding: 1px 9px; background: var(--accent-soft); color: var(--accent); }
.tone.casual, .tone.humorous { background: var(--ok-soft); color: var(--ok); }
.tone.dismissive { background: #fbece4; color: var(--bad); }
.tone.formal { background: var(--sheet); border: 1px solid var(--accent); }
.ccard { border: 1px solid var(--rule); border-left: 5px solid var(--accent); border-radius: 10px; background: var(--sheet); padding: 12px 14px; display: grid; gap: 6px; }
.ccard .kind { font-size: .72rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-soft); }
.ccard h3 { font-size: 1.08rem; }
.ccard .by { color: var(--ink-soft); font-size: .92rem; margin: 0; }
.ccard p { margin: 0; }
.ccard .ask { font-style: italic; }
.ccard .find { justify-self: start; font-size: .9rem; padding: 5px 12px; border-radius: 8px; border: 1px solid var(--accent); color: var(--accent); text-decoration: none; font-weight: 700; }
.ccard.k-music { border-left-color: #8a5a00; } .ccard.k-poetry { border-left-color: var(--ok); }
.guess-note { color: var(--ink-soft); font-size: .92rem; margin: 4px 0 0; }
.talk ol { display: grid; gap: 8px; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) .tone.dismissive { background: #3a2620; } }
</style>
"""

def search_url(kind, q):
    if kind.lower() == "music":
        return "https://www.youtube.com/results?search_query=" + urllib.parse.quote_plus(q)
    return "https://www.google.com/search?q=" + urllib.parse.quote_plus(q)

def head(title, item, eyebrow, h1):
    h = HEAD.format(title=T(title), item=item, eyebrow=eyebrow, h1=T(h1))
    return h.replace("</head>", STYLE + "</head>", 1)

def match_list(g, items):
    out = []
    for i, x in enumerate(items):
        out.append('<li data-why="%s" data-l="%s" data-r="%s" data-q="%s">%s = %s<input class="blank" type="hidden" data-k="%s-%d"></li>'
                   % (A(x["why"]), A(x["l"]), A(x["r"]), A("Match: " + x["l"]), T(x["l"]), T(x["r"]), g, i + 1))
    return '<div class="g-match" data-g="%s">\n<ul>\n%s\n</ul>\n</div>' % (g, "\n".join(out))

def sort_box(k, s):
    chips = "".join('<button type="button" class="chip" draggable="true" data-why="%s" data-i="%d" data-a="%d">%s</button>'
                    % (A(x["why"]), i, x["c"], T(x["w"])) for i, x in enumerate(s["items"]))
    cols = "".join('<div class="col" data-col="%d"><p class="col-h">%s</p><div class="drop" data-col="%d"></div></div>' % (i, T(c), i)
                   for i, c in enumerate(s["cols"]))
    return ('<div class="sorter g-sort" data-k="%s"><p class="hint sort-how">Tap an expression, then tap the column it belongs in. On a computer you can also drag. Right answers stay; wrong ones jump back.</p>'
            '<div class="bank drop" data-col="">%s</div><div class="cols" style="--n:%d">%s</div><div class="sort-acts"><button type="button" class="ghost sort-reset">Start again</button></div></div>'
            % (k, chips, len(s["cols"]), cols))

def expr_cards(d):
    out = []
    for x in d["expressions"]:
        out.append("""<details class="xcard">
<summary><span class="xe">%s</span><span>%s</span><span class="xtap">What do you think it means? Tap to check.</span></summary>
<div class="xbody">
<p><strong>Meaning:</strong> %s <span class="tone %s">%s</span></p>
<p><strong>Bend it:</strong> %s</p>
<p><strong>Note:</strong> %s</p>
</div>
</details>""" % (T(x["e"]), x["example"], T(x["meaning"]), A(x["tone"]), T(x["tone"]), x["bend"], x["note"]))
    return '<div class="cards">\n%s\n</div>\n' % "\n".join(out)

def culture_cards(d):
    out = []
    for c in d["culture"]:
        k = c["kind"]
        out.append("""<article class="ccard k-%s">
<span class="kind">%s</span>
<h3>%s</h3>
<p class="by">%s, %s</p>
<p>%s</p>
<p class="ask">%s</p>
<a class="find" href="%s" target="_blank" rel="noopener">%s</a>
</article>""" % (A(k.lower()), T(k), T(c["work"]), T(c["by"]), T(c["year"]), c["how"], T(c["ask"]),
                 A(search_url(k, c["find"])), "Listen to it" if k.lower() == "music" else "Find it"))
    return '<div class="cards">\n%s\n</div>\n' % "\n".join(out)

def lis(xs):
    return "".join("<li>%s</li>" % x for x in xs)

def aims(d):
    return """<section class="aims" aria-labelledby="aims-h">
<h2 id="aims-h">What this lesson is for</h2>
<p class="why"><strong>Why this matters:</strong> %s</p>
<div class="aims-grid">
<div><h3>You will know</h3><ul>%s</ul></div>
<div><h3>You will understand</h3><ul>%s</ul></div>
<div><h3>You will be able to</h3><ul>%s</ul></div>
</div>
</section>
""" % (d["why"], lis(d["know"]), lis(d["understand"]), lis(d["able"]))

def mistakes(d, n=None, h="Common mistakes to watch for"):
    xs = d["mistakes"][:n] if n else d["mistakes"]
    return """<section class="mistakes" aria-labelledby="mis-h">
<h2 id="mis-h">%s</h2>
<ul>
%s
</ul>
</section>
""" % (h, "\n".join("<li><del>%s</del> %s</li>" % (T(w), r) for w, r in xs))

def key_pick(xs):
    return " ".join("%d %s" % (i + 1, T(x["opts"][x["a"]])) for i, x in enumerate(xs))

def key_spot(xs):
    return " ".join("%d %s" % (i + 1, T(x["q"]).replace(T(x["bad"]), "<strong>%s</strong>" % T(x["fix"]), 1)) for i, x in enumerate(xs))

def key_type(xs):
    return " ".join("%d %s" % (i + 1, T(x["a"][0])) for i, x in enumerate(xs))

def key_match(xs):
    return " ".join("<em>%s</em> = %s." % (T(x["l"]), T(x["r"])) for x in xs)

def key_sort(s):
    return " ".join("<strong>%s:</strong> %s." % (T(c), ", ".join(T(x["w"]) for x in s["items"] if x["c"] == i)) for i, c in enumerate(s["cols"]))

def answers(rows):
    return """<details class="answers">
  <summary>Check your answers</summary>
  <div class="answers-body">
%s
  </div>
</details>
""" % "\n".join("<p><strong>Exercise %d:</strong> %s</p>" % (i + 1, r) for i, r in enumerate(rows))

def unit(d):
    n, ws = d["n"], d["ws"]
    body = head(d["title"], "%s-%d" % (SEC["item"], n), "Advanced English &middot; %s &middot; " % SEC["name"] + T(d["tagline"]), d["title"])
    body += aims(d) + mistakes(d)
    body += '<h2>The big idea</h2>\n<div class="big-idea">\n%s\n<p><strong>You already use it:</strong></p>\n<ul class="hidden-list">%s</ul>\n</div>\n' % (
        "\n".join("<p>%s</p>" % p for p in d["bigidea"]), lis(d["hidden"]))
    body += '<h2>The expressions</h2>\n<p>Read each example and guess the meaning first. Then tap the card to check the meaning, the tone, and how native speakers bend it.</p>\n' + expr_cards(d)
    body += '<h2>In literature, poetry and music</h2>\n<p>Writers and songwriters use the same big idea. Read about each one, then find it and read or listen together in the lesson.</p>\n' + culture_cards(d)
    ex = [
        ("Match the expression to its meaning", "Tap an expression, then tap its meaning.", match_list("ex1m", ws["match"])),
        ("Sort them", ws["sort"]["h"], sort_box("sort1", ws["sort"])),
        ("Which expression fits?", "Choose the expression that fits the situation best.", TN.pick_list("ex3", ws["pick"])),
        ("Find the mistake", "Each sentence has one mistake in an expression. Tap the wrong word (or words), then choose the right words.", TN.spot_list("ex4", ws["spot"])),
        ("Complete the expression", "Type the missing word, then press <strong>Check</strong> (or Enter).", TN.type_list("ex5", ws["type"])),
        ("Bend it", "Native speakers change tense, add words and play with expressions, but only in some ways. Which version sounds natural?", TN.pick_list("ex6", ws["bend"])),
    ]
    for i, (h, p, g) in enumerate(ex):
        body += '<h2 id="ex%d" class="ex">Exercise %d: %s</h2>\n<p>%s</p>\n%s\n' % (i + 1, i + 1, h, p, g)
    body += '<h2 id="ex7">Exercise 7: Talk about it</h2>\n<div class="rule talk"><ol>%s</ol></div>\n' % lis(ws["talk"])
    body += answers([key_match(ws["match"]), key_sort(ws["sort"]), key_pick(ws["pick"]), key_spot(ws["spot"]), key_type(ws["type"]), key_pick(ws["bend"])])
    return body + TAIL

def homework(d):
    n, hw = d["n"], d["hw"]
    body = head("Homework: " + d["title"], "%s-h%d" % (SEC["item"], n), "Homework &middot; Advanced English &middot; " + SEC["name"], "Homework: " + d["title"])
    body += '<section class="aims" aria-labelledby="rem-h">\n<h2 id="rem-h">Quick reminder</h2>\n%s\n<ul>%s</ul>\n</section>\n' % (
        "<p>%s</p>" % d["bigidea"][0], "".join("<li><strong>%s</strong>: %s</li>" % (T(x["e"]), T(x["meaning"])) for x in d["expressions"]))
    body += mistakes(d, 3, "Watch out for")
    ex = [
        ("Match the expression to its meaning", "Tap an expression, then tap its meaning.", match_list("ex1m", hw["match"])),
        ("Which expression fits?", "Choose the expression that fits the situation best.", TN.pick_list("ex2", hw["pick"])),
        ("Find the mistake", "Each sentence has one mistake in an expression. Tap the wrong word (or words), then choose the right words.", TN.spot_list("ex3", hw["spot"])),
        ("Complete the expression", "Type the missing word, then press <strong>Check</strong> (or Enter).", TN.type_list("ex4", hw["type"])),
    ]
    for i, (h, p, g) in enumerate(ex):
        body += '<h2 id="ex%d" class="ex">Exercise %d: %s</h2>\n<p>%s</p>\n%s\n' % (i + 1, i + 1, h, p, g)
    body += answers([key_match(hw["match"]), key_pick(hw["pick"]), key_spot(hw["spot"]), key_type(hw["type"])])
    return body + TAIL

def bank(d):
    n = d["n"]
    items = []
    for i, x in enumerate(d["bank"]):
        o = {"id": "%s-%d-%02d" % (SEC["pid"], n, i + 1)}
        o.update(x)
        items.append("    " + json.dumps(o, ensure_ascii=False))
    return 'PRACTICE.add("%s-%d", {\n  title: %s,\n  page: "advanced/%s/unit-%d.html",\n  items: [\n%s\n  ]\n});\n' % (
        SEC["pid"], n, json.dumps(SEC["name"] + ": " + d["title"]), SEC["key"], n, ",\n".join(items))

def check(d):
    errs = []
    want = {"ws": dict(match=8, pick=8, spot=5, type=6, bend=4), "hw": dict(match=6, pick=6, spot=4, type=6)}
    for part, counts in want.items():
        for k, c in counts.items():
            xs = d[part][k]
            if len(xs) != c: errs.append("%s.%s has %d, want %d" % (part, k, len(xs), c))
            for j, x in enumerate(xs):
                tag = "%s.%s[%d]" % (part, k, j)
                if len(x.get("why", "")) > 230: errs.append(tag + " why too long")
                if k in ("pick", "type", "bend") and x["q"].count("___") != 1: errs.append(tag + " needs one ___")
                if k in ("pick", "bend") and not 0 <= x["a"] < len(x["opts"]): errs.append(tag + " bad a")
                if k == "spot" and (not x["bad"] or x["q"].count(x["bad"]) != 1 or x["fix"] not in x["opts"]): errs.append(tag + " spot")
    s = d["ws"]["sort"]
    if not 9 <= len(s["items"]) <= 12 or any(not 0 <= x["c"] < len(s["cols"]) for x in s["items"]): errs.append("sort")
    if len(d["expressions"]) != 8: errs.append("expressions")
    if not 4 <= len(d["culture"]) <= 5: errs.append("culture")
    if len(d["bank"]) != 20: errs.append("bank")
    for j, x in enumerate(d["bank"]):
        if x["type"] == "pick" and x["a"] not in x["opts"]: errs.append("bank[%d] pick" % j)
        if x["type"] == "spot" and x["bad"] and x["q"].count(x["bad"]) != 1: errs.append("bank[%d] spot" % j)
    if "—" in json.dumps(d, ensure_ascii=False): errs.append("em dash")
    return errs

def index_pages(built):
    page = lambda title, crumbs, lead, main, up="../": ("""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>%s</title>
<link rel="icon" href="%sfavicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,500;7..72,700&family=Atkinson+Hyperlegible:wght@400;700&display=swap">
<link rel="stylesheet" href="%sgrammar-traps/traps.css?v=1795100000">
<style>.group-h { max-width: 820px; margin: 28px auto 10px; font-family: var(--font-display); font-size: 1.2rem; color: var(--accent); }</style>
</head>
<body class="library">
<script src="%steacher-nav.js?v=1794900000"></script>
<header class="top">
  <nav class="crumbs" aria-label="Breadcrumb"><ol>%s</ol></nav>
  <h1>%s</h1>
  <p class="lead">%s</p>
  <p class="hint">This page is for you. Send students the <strong>unit</strong> link for the lesson, and the <strong>homework</strong> link after it. <span aria-live="polite" id="copied"></span></p>
</header>
<main>
%s
</main>
<script>
document.querySelectorAll("[data-copy]").forEach(function (b) {
  b.addEventListener("click", function () {
    var url = new URL(b.dataset.copy, location.href).href, st = document.getElementById("copied");
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { st.textContent = "Copied: " + url; }, function () { st.textContent = url; });
  });
});
</script>
</body>
</html>
""" % (title, up, up, up, crumbs, title, lead, main))
    def rows(units, prefix):
        return "\n".join("""  <li class="lesson">
    <span class="num">%d</span>
    <div class="info"><strong>%s</strong><div class="hint">%s</div></div>
    <div class="acts">
      <a class="btn" href="%sunit-%d.html" target="_blank" rel="noopener">Unit</a>
      <button type="button" class="ghost" data-copy="%sunit-%d.html">Copy unit link</button>
      <a class="btn ghost" href="%shomework-%d.html" target="_blank" rel="noopener">Homework</a>
      <button type="button" class="ghost" data-copy="%shomework-%d.html">Copy homework link</button>
    </div>
  </li>""" % (d["n"], T(d["title"]), T(d["tagline"]), prefix, d["n"], prefix, d["n"], prefix, d["n"], prefix, d["n"]) for d in units)
    groups = ""
    for sec, units in built:
        groups += '<h2 class="group-h" id="%s">%s</h2>\n<p class="hint" style="max-width:820px;margin:0 auto 10px">%s <a href="%s/index.html">Open %s on its own page</a>.</p>\n<ol class="lessons">\n%s\n</ol>\n' % (
            sec["key"], sec["name"], sec["lead"], sec["key"], sec["name"], rows(units, sec["key"] + "/"))
        sub = page(sec["name"], '<li><a href="../../library.html">Teacher library</a></li><li><a href="../index.html">Advanced English</a></li><li><span aria-current="page">%s</span></li>' % sec["name"],
                   sec["lead"], '<ol class="lessons">\n%s\n</ol>' % rows(units, ""), up="../../")
        open(os.path.join(ROOT, "advanced", sec["key"], "index.html"), "w", encoding="utf-8").write(sub)
    adv = page("Advanced English", '<li><a href="../library.html">Teacher library</a></li><li><span aria-current="page">Advanced English</span></li>',
               "Lessons for very advanced (C1/C2) students who already speak well and want to sound natural, precise and expressive. "
               + " &middot; ".join('<a href="#%s">%s</a>' % (sec["key"], sec["name"]) for sec, _ in built), groups)
    open(os.path.join(ROOT, "advanced", "index.html"), "w", encoding="utf-8").write(adv)

def main():
    global SEC
    only_check = "--check" in sys.argv
    built, bad, total = [], False, 0
    for sec in SECTIONS:
        SEC = sec
        out = os.path.join(ROOT, "advanced", sec["key"])
        os.makedirs(out, exist_ok=True)
        files = sorted(glob.glob(os.path.join(ROOT, "tools", sec["key"], "*.json")), key=lambda p: int(os.path.basename(p)[:-5]))
        units = []
        for f in files:
            d = json.load(open(f, encoding="utf-8"))
            errs = check(d)
            if errs:
                bad = True; print(sec["key"], os.path.basename(f), errs); continue
            units.append(d)
            if only_check: continue
            n = d["n"]
            open(os.path.join(out, "unit-%d.html" % n), "w", encoding="utf-8").write(unit(d))
            open(os.path.join(out, "homework-%d.html" % n), "w", encoding="utf-8").write(homework(d))
            open(os.path.join(ROOT, "practice", "bank", "%s-%d.js" % (sec["pid"], n)), "w", encoding="utf-8").write(bank(d))
        built.append((sec, units)); total += len(files)
    if not only_check and not bad:
        index_pages(built)
    print("built" if not only_check else "checked", total, "units", "WITH ERRORS" if bad else "")

if __name__ == "__main__":
    main()
