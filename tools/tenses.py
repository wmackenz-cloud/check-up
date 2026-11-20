#!/usr/bin/env python3
"""Build the Verb Tenses sheets from tools/tenses/<n>.json (see tools/tenses/SPEC.md).

Writes, for each tense n:
  grammar/tense-<n>.html           the worksheet (data-item tense-<n>)
  grammar/tense-homework-<n>.html  the homework drill (data-item tense-h<n>)
  practice/bank/vt-<n>.js          20 review questions for the Practice bank
Run from the repo root: python3 tools/tenses.py   (add --check to only validate)
"""
import glob, html, json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = lambda s: html.escape(str(s), quote=True)
T = lambda s: html.escape(str(s), quote=False)

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
<link rel="stylesheet" href="../grammar-traps/traps.css?v=1795100000">
<link rel="stylesheet" href="../games.css?v=1794300000">
</head>
<body class="student" data-item="{item}">
<header class="top">
  <p class="eyebrow">{eyebrow}</p>
  <h1>{h1}</h1>
  <p class="namedate">Name: <span class="line"></span> Date: <span class="line"></span></p>
  <div class="tools">
    <button type="button" id="print">Print or save as PDF</button>
    <button type="button" class="ghost" id="clear">Clear my answers</button>
    <span class="hint">Tap or type your answers. Green dot = right first time. Get a gold star for each perfect exercise. Your progress stays on this device.</span>
  </div>
</header>
<main class="sheet">
"""

TAIL = """</main>
<footer class="foot"><p>From Bill's English lessons. Questions? Ask me in our next lesson.</p></footer>
<script>
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
<script src="../games.js?v=1794300000"></script>
<script src="../api.js?v=1792889681"></script>
<script src="../work.js?v=1793900000"></script>
</body>
</html>
"""

def gap_split(q):
    i = q.index("___")
    return q[:i].rstrip(), q[i + 3:].lstrip()

def pick_list(g, items):
    out = []
    for i, x in enumerate(items):
        b, a = gap_split(x["q"])
        right = x["opts"][x["a"]]
        opts = "".join("<button>%s</button>" % T(o) for o in x["opts"])
        sp = " " if a and not re.match(r"^[.,?!]", a) else ""
        out.append('<li data-why="%s" data-a="%d" data-form="%s" data-q="%s">%s <span class="gap game-ui"></span><input class="blank" type="hidden" data-k="%s-%d">%s%s <span class="opts game-ui">%s</span></li>'
                   % (A(x["why"]), x["a"], A(right), A(x["q"]), T(b), g, i + 1, sp, T(a), opts))
    return '<ol class="g-pick" data-g="%s">\n%s\n</ol>' % (g, "\n".join(out))

def type_list(g, items):
    out = []
    for i, x in enumerate(items):
        b, a = gap_split(x["q"])
        size = "long" if max(len(s) for s in x["a"]) > 14 else "mid"
        sp = " " if a and not re.match(r"^[.,?!]", a) else ""
        out.append('<li data-why="%s" data-q="%s">%s <input class="blank %s" type="text" aria-label="Answer" autocomplete="off" spellcheck="false" data-k="%s-%d" data-ok="%s">%s%s</li>'
                   % (A(x["why"]), A(x["q"]), T(b), size, g, i + 1, A("|".join(x["a"])), sp, T(a)))
    return '<ol class="g-type" data-g="%s">\n%s\n</ol>' % (g, "\n".join(out))

def spot_list(g, items):
    out = []
    for i, x in enumerate(items):
        out.append('<li data-why="%s" data-bad="%s" data-fix="%s" data-opts="%s" data-q="%s"><span class="sent">%s</span><input class="blank" type="hidden" data-k="%s-%d"></li>'
                   % (A(x["why"]), A(x["bad"]), A(x["fix"]), A(",".join(x["opts"])), A(x["q"]), T(x["q"]), g, i + 1))
    return '<ol class="g-spot" data-g="%s">\n%s\n</ol>' % (g, "\n".join(out))

def order_list(g, items):
    out = []
    for i, x in enumerate(items):
        alt = ' data-alt="%s"' % A("|".join(x["alt"])) if x.get("alt") else ""
        out.append('<li data-why="%s" data-answer="%s"%s data-q="%s"><input class="blank" type="hidden" data-k="%s-%d"></li>'
                   % (A(x["why"]), A(x["a"]), alt, A("Put the words in order: " + x["a"]), g, i + 1))
    return '<ol class="g-order" data-g="%s">\n%s\n</ol>' % (g, "\n".join(out))

def exercises(ex):
    parts = [
        ('<h2 id="ex1" class="ex">Exercise 1: Choose the right form</h2>\n<p>Tap the right words for each gap.</p>', pick_list("ex1", ex["pick"])),
        ('<h2 id="ex2" class="ex">Exercise 2: Put the verb in the right form</h2>\n<p>Type the verb in brackets in the right form, then press <strong>Check</strong> (or Enter). Stuck? Tap <strong>Hint</strong>, but then it won\'t count as right first time.</p>', type_list("ex2", ex["type"])),
        ('<h2 id="ex3" class="ex">Exercise 3: Find the mistake</h2>\n<p>Each sentence has one mistake. Tap the wrong word (or words), then choose the right words.</p>', spot_list("ex3", ex["spot"])),
        ('<h2 id="ex4" class="ex">Exercise 4: Put the words in order</h2>\n<p>Tap the words to build the sentence.</p>', order_list("ex4o", ex["order"])),
    ]
    return "\n".join(h + "\n" + body for h, body in parts) + "\n"

def fill(q, ans):
    b, a = gap_split(q)
    sp = " " if a and not re.match(r"^[.,?!]", a) else ""
    a = re.sub(r"\s*\([^)]*\)", "", a, count=1) if re.match(r"\s*\(", a) else a
    sp = " " if a and not re.match(r"^[.,?!]", a) else ""
    return "%s <strong>%s</strong>%s%s" % (T(b), T(ans), sp, T(a))

def fix_sentence(x):
    return T(x["q"]).replace(T(x["bad"]), "<strong>%s</strong>" % T(x["fix"]), 1)

def answers(ex):
    p1 = " ".join("%d %s" % (i + 1, T(x["opts"][x["a"]])) for i, x in enumerate(ex["pick"]))
    p2 = " ".join("%d %s." % (i + 1, fill(x["q"], x["a"][0])) if False else "%d %s" % (i + 1, T(x["a"][0])) for i, x in enumerate(ex["type"]))
    p3 = " ".join("%d %s" % (i + 1, fix_sentence(x)) for i, x in enumerate(ex["spot"]))
    p4 = " ".join("%d %s" % (i + 1, T(x["a"])) for i, x in enumerate(ex["order"]))
    return """<details class="answers">
  <summary>Check your answers</summary>
  <div class="answers-body">
<p><strong>Exercise 1:</strong> %s</p>
<p><strong>Exercise 2:</strong> %s</p>
<p><strong>Exercise 3:</strong> %s</p>
<p><strong>Exercise 4:</strong> %s</p>
  </div>
</details>
""" % (p1, p2, p3, p4)

def lis(xs):
    return "".join("<li>%s</li>" % x for xs_ in [xs] for x in xs_)

def rule_block(d, heading=True):
    rows = "\n".join("<tr><td><strong>%s</strong></td><td>%s</td></tr>" % (T(a), b) for a, b in d["form"])
    return """<h2>How we use it</h2>
<div class="rule">
<ul>%s</ul>
</div>
<h2>How to make it</h2>
<table>
<tbody>
%s
</tbody>
</table>
<div class="rule">
<p><strong>Words that often go with it:</strong> %s</p>
<p><strong>Tip:</strong> %s</p>
</div>
""" % (lis(d["use"]), rows, d["signals"], d["tip"])

def worksheet(d):
    n = d["n"]
    head = HEAD.format(title=T(d["title"]), item="tense-%d" % n, eyebrow="English grammar practice &middot; Verb tenses &middot; " + T(d["tagline"]), h1=T(d["title"]))
    aims = """<section class="aims" aria-labelledby="aims-h">
<h2 id="aims-h">What this lesson is for</h2>
<div class="aims-grid">
<div><h3>You will be able to</h3><ul>%s</ul></div>
<div><h3>You will know</h3><ul>%s</ul></div>
<div><h3>You will understand</h3><ul>%s</ul></div>
</div>
</section>
""" % (lis(d["able"]), lis(d["know"]), lis(d["understand"]))
    mis = """<section class="mistakes" aria-labelledby="mis-h">
<h2 id="mis-h">Common mistakes to watch for</h2>
<ul>
%s
</ul>
</section>
""" % "\n".join("<li><del>%s</del> %s</li>" % (T(w), r) for w, r in d["mistakes"])
    return head + aims + mis + rule_block(d) + exercises(d["ws"]) + answers(d["ws"]) + TAIL

def homework(d):
    n = d["n"]
    head = HEAD.format(title="Homework: " + T(d["title"]), item="tense-h%d" % n, eyebrow="Homework &middot; Verb tenses", h1="Homework: " + T(d["title"]))
    rows = "\n".join("<tr><td><strong>%s</strong></td><td>%s</td></tr>" % (T(a), b) for a, b in d["form"])
    remind = """<section class="aims" aria-labelledby="rem-h">
<h2 id="rem-h">Quick reminder</h2>
<ul>%s</ul>
<table>
<tbody>
%s
</tbody>
</table>
</section>
<section class="mistakes" aria-labelledby="mis-h">
<h2 id="mis-h">Watch out for</h2>
<ul>
%s
</ul>
</section>
""" % (lis(d["use"]), rows, "\n".join("<li><del>%s</del> %s</li>" % (T(w), r) for w, r in d["mistakes"][:3]))
    return head + remind + exercises(d["hw"]) + answers(d["hw"]) + TAIL

def bank(d):
    n = d["n"]
    items = []
    for i, x in enumerate(d["bank"]):
        o = {"id": "vt-%d-%02d" % (n, i + 1)}
        o.update(x)
        items.append("    " + json.dumps(o, ensure_ascii=False))
    return 'PRACTICE.add("vt-%d", {\n  title: %s,\n  page: "grammar/tense-%d.html",\n  items: [\n%s\n  ]\n});\n' % (
        n, json.dumps(d["title"]), n, ",\n".join(items))

def check(d):
    errs, n = [], d["n"]
    want = {"ws": dict(pick=8, type=8, spot=5, order=4), "hw": dict(pick=6, type=8, spot=4, order=3)}
    sents = []
    for part, counts in want.items():
        for k, c in counts.items():
            xs = d[part][k]
            if len(xs) != c: errs.append("%s.%s has %d, want %d" % (part, k, len(xs), c))
            for j, x in enumerate(xs):
                tag = "%s.%s[%d]" % (part, k, j)
                if len(x.get("why", "")) > 200: errs.append(tag + " why too long")
                if k in ("pick", "type") and x["q"].count("___") != 1: errs.append(tag + " needs one ___")
                if k == "pick" and not 0 <= x["a"] < len(x["opts"]): errs.append(tag + " bad a")
                if k == "type" and not (isinstance(x["a"], list) and x["a"]): errs.append(tag + " a must be a list")
                if k == "spot" and (not x["bad"] or x["q"].count(x["bad"]) != 1 or x["fix"] not in x["opts"]): errs.append(tag + " spot bad/fix")
                if k == "order" and re.search(r"[,;:]", x["a"][:-1]): errs.append(tag + " inner punctuation")
                sents.append(x.get("q") or x.get("a"))
    b = d["bank"]
    if len(b) != 20: errs.append("bank has %d" % len(b))
    for j, x in enumerate(b):
        tag = "bank[%d]" % j
        if len(x.get("why", "")) > 200: errs.append(tag + " why too long")
        if x["type"] == "pick" and x["a"] not in x["opts"]: errs.append(tag + " a not in opts")
        if x["type"] == "spot" and x["bad"] and x["q"].count(x["bad"]) != 1: errs.append(tag + " spot bad")
        sents.append(x.get("q") or x.get("a"))
    if len(set(sents)) != len(sents): errs.append("repeated sentences")
    if "—" in json.dumps(d, ensure_ascii=False): errs.append("em dash")
    return errs

def main():
    only_check = "--check" in sys.argv
    files = sorted(glob.glob(os.path.join(ROOT, "tools", "tenses", "*.json")), key=lambda p: int(os.path.basename(p)[:-5]))
    bad = False
    for f in files:
        d = json.load(open(f, encoding="utf-8"))
        errs = check(d)
        if errs:
            bad = True; print(os.path.basename(f), errs)
        if only_check or errs: continue
        n = d["n"]
        open(os.path.join(ROOT, "grammar", "tense-%d.html" % n), "w", encoding="utf-8").write(worksheet(d))
        open(os.path.join(ROOT, "grammar", "tense-homework-%d.html" % n), "w", encoding="utf-8").write(homework(d))
        open(os.path.join(ROOT, "practice", "bank", "vt-%d.js" % n), "w", encoding="utf-8").write(bank(d))
    print("built" if not only_check else "checked", len(files), "tenses", "WITH ERRORS" if bad else "")

if __name__ == "__main__":
    main()
