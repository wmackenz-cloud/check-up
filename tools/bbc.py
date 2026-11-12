#!/usr/bin/env python3
"""BBC Learning English video pages for Bill's students.

Bill keeps one Google Doc per episode in Drive (ESL > 6 Minute English Epiisodes).
Each doc starts with the episode title linked to the BBC page, then the vocabulary:
a bold word, its meaning, then "Synonyms - ..." and "Usage - ..." lines.

  python3 tools/bbc.py add DOC.json [--youtube ID]   # DOC.json: {"docId", "created", "markdown"}
  python3 tools/bbc.py build                         # writes bbc/*.html and bbc/list.json

bbc/episodes.json is the source of truth for the pages. Re-adding a doc replaces its entry
but keeps the YouTube id already found, unless --youtube gives a new one.
"""
import html, json, re, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIR = ROOT / "bbc"
DATA = DIR / "episodes.json"
SITE = "https://wmackenz-cloud.github.io/check-up/"
ST_V = "1793206303"
API_V = "1792889681"


def load():
    return json.loads(DATA.read_text()) if DATA.exists() else []


def save(eps):
    DATA.write_text(json.dumps(eps, indent=1, ensure_ascii=False) + "\n")


def slugify(t):
    s = re.sub(r"[’']", "", t.lower())
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:60].rstrip("-") or "episode"


def clean(t):
    t = t.replace("*", "")
    t = re.sub(r"[ \t ]+", " ", t)
    return t.strip(" ,;-–")


LABEL = re.compile(r"(Usage|Synonyms?|Opposites?(?: is| are)?)\s*[-:–]?\s*")


def parse(md):
    md = md.replace("\r", "")
    m = re.search(r"\[([^\]]+)\]\((https?://[^)\s]+)\)", md)
    title = clean(m.group(1)).rstrip() if m else "BBC Learning English"
    url = m.group(2) if m else ""
    yt = re.search(r"(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([A-Za-z0-9_-]{11})", md)
    series = "6 Minute English" if "6-minute-english" in url else "Real Easy English" if "real-easy-english" in url else "BBC Learning English"
    date = ""
    d = re.search(r"(\d{1,2} (?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4})", md)
    if d:
        date = d.group(1)
    # Drop the title line and the heading lines, keep the vocabulary.
    body = []
    for line in md.split("\n"):
        if m and m.group(0) in line:
            continue
        if line.lstrip().startswith("#"):
            continue
        body.append(line)
    text = "\n".join(body)
    spans = [(s.start(), s.end(), s.group(1)) for s in re.finditer(r"\*\*(.+?)\*\*", text, re.S)]
    spans = [s for s in spans if clean(s[2])]
    words = []
    for i, (a, b, inner) in enumerate(spans):
        end = spans[i + 1][0] if i + 1 < len(spans) else len(text)
        term = clean(inner.replace("\n", " "))
        words.append(word(term, text[b:end]))
    return {"title": title, "bbcUrl": url, "series": series, "date": date, "youtube": yt.group(1) if yt else "", "words": [w for w in words if w["term"]]}


def word(term, chunk):
    chunk = chunk.replace("*", "")
    parts = LABEL.split(chunk)
    head, rest = parts[0], parts[1:]
    w = {"term": term, "meaning": "", "synonyms": [], "usage": [], "opposite": ""}
    lines = [clean(x) for x in head.split("\n")]
    lines = [x for x in lines if x]
    if lines:
        w["meaning"] = lines[0]
        w["usage"] += lines[1:]
    for lab, val in zip(rest[0::2], rest[1::2]):
        vl = [clean(x) for x in val.split("\n")]
        vl = [x for x in vl if x]
        first, more = (vl[0] if vl else ""), vl[1:]
        if lab.startswith("Synonym"):
            w["synonyms"] += [clean(x) for x in re.split(r"[,;]", first) if clean(x)]
        elif lab.startswith("Opposite"):
            w["opposite"] = first
        else:
            w["usage"] += [clean(x) for x in re.split(r";|(?<=[.!?])\s+(?=[A-Z])", first) if clean(x)]
        w["usage"] += more
    return w


def cmd_add(path, yt=None):
    src = json.loads(Path(path).read_text())
    ep = parse(src["markdown"])
    ep["docId"] = src["docId"]
    ep["added"] = src.get("created", "")
    eps = load()
    old = next((e for e in eps if e["docId"] == ep["docId"]), None)
    ep["slug"] = old["slug"] if old else unique_slug(slugify(ep["title"]), eps)
    if yt is not None:
        ep["youtube"] = yt
    elif not ep["youtube"] and old:
        ep["youtube"] = old.get("youtube", "")
    eps = [e for e in eps if e["docId"] != ep["docId"]] + [ep]
    eps.sort(key=lambda e: e.get("added", ""), reverse=True)
    save(eps)
    print(f"{ep['slug']}: {len(ep['words'])} words, youtube={ep['youtube'] or '-'}")


def unique_slug(s, eps):
    taken = {e["slug"] for e in eps}
    n, out = 2, s
    while out in taken:
        out = f"{s}-{n}"; n += 1
    return out


E = html.escape


def page(ep):
    t = E(ep["title"])
    if ep.get("youtube"):
        video = f'''<div class="video"><iframe src="https://www.youtube-nocookie.com/embed/{E(ep["youtube"])}?rel=0" title="{t}" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen loading="lazy"></iframe></div>
<p class="hint">Problems with the video? <a href="{E(ep["bbcUrl"])}" target="_blank" rel="noopener">Watch it on the BBC Learning English website</a>, where you can also read the transcript.</p>'''
    else:
        video = f'''<div class="rule"><p><strong>Watch the video on the BBC Learning English website.</strong> It opens in a new tab. Come back here for the vocabulary.</p>
<p><a class="btn" href="{E(ep["bbcUrl"])}" target="_blank" rel="noopener">Watch on BBC Learning English</a></p></div>'''
    cards, k = [], 0
    for w in ep["words"]:
        k += 1
        bits = [f'<h3>{E(w["term"])}</h3>']
        if w["meaning"]:
            bits.append(f'<p class="meaning">{E(w["meaning"])}</p>')
        if w["synonyms"]:
            bits.append('<p><strong>Synonyms:</strong> ' + ", ".join(E(x) for x in w["synonyms"]) + "</p>")
        if w.get("opposite"):
            bits.append(f'<p><strong>Opposite:</strong> {E(w["opposite"])}</p>')
        if w["usage"]:
            bits.append("<p><strong>How to use it:</strong></p><ul>" + "".join(f"<li><em>{E(u)}</em></li>" for u in w["usage"]) + "</ul>")
        cards.append('<section class="word">' + "".join(bits) + "</section>")
    when = f' &middot; {E(ep["date"])}' if ep.get("date") else ""
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>{t}</title>
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,500;7..72,700&family=Atkinson+Hyperlegible:wght@400;700&display=swap">
<link rel="stylesheet" href="../grammar-traps/traps.css?v={ST_V}">
<link rel="stylesheet" href="bbc.css?v={ST_V}">
</head>
<body class="student" data-item="bbc-{E(ep["slug"])}">
<header class="top">
  <p class="eyebrow">BBC {E(ep["series"])}{when}</p>
  <h1>{t}</h1>
  <div class="tools"><button type="button" id="print">Print or save as PDF</button><span class="hint">Watch the video, then study the words below.</span></div>
</header>
<main class="sheet">
<h2>1. Watch</h2>
{video}
<h2>2. The vocabulary</h2>
<p>Read each word, its meaning and the examples. Then make your own sentence with each word and say it out loud.</p>
{"".join(cards)}
</main>
<footer class="foot"><p>From Bill's English lessons. Video and vocabulary from <a href="{E(ep["bbcUrl"])}" target="_blank" rel="noopener">BBC Learning English</a>.</p></footer>
<script>
(function () {{
  var key = "bbc-" + location.pathname, saved = {{}};
  try {{ saved = JSON.parse(localStorage.getItem(key) || "{{}}") || {{}}; }} catch (e) {{}}
  document.querySelectorAll(".blank").forEach(function (f) {{
    if (saved[f.dataset.k]) f.value = saved[f.dataset.k];
    f.addEventListener("input", function () {{ saved[f.dataset.k] = f.value; try {{ localStorage.setItem(key, JSON.stringify(saved)); }} catch (e) {{}} }});
  }});
  var pr = document.getElementById("print"); if (pr) pr.addEventListener("click", function () {{ window.print(); }});
}})();
</script>
<script src="../api.js?v={API_V}"></script>
<script src="../work.js?v={API_V}"></script>
</body>
</html>
'''


def index(eps):
    rows = []
    for ep in eps:
        when = E(ep.get("date") or ep.get("added", ""))
        vid = "Video on the page" if ep.get("youtube") else "Links to BBC for the video"
        rows.append(f'''  <li class="lesson">
    <span class="num">{len(ep["words"])}</span>
    <div class="info"><strong>{E(ep["title"])}</strong><div class="hint">{E(ep["series"])} &middot; {when} &middot; {len(ep["words"])} words &middot; {vid}</div></div>
    <div class="acts">
      <a class="btn" href="{E(ep["slug"])}.html" target="_blank" rel="noopener">Student page</a>
      <button type="button" class="ghost" data-copy="{E(ep["slug"])}.html">Copy student link</button>
      <a class="btn ghost" href="https://docs.google.com/document/d/{E(ep["docId"])}/edit" target="_blank" rel="noopener">Your doc</a>
    </div>
  </li>''')
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>BBC Video Lessons</title>
<link rel="icon" href="../favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Literata:opsz,wght@7..72,500;7..72,700&family=Atkinson+Hyperlegible:wght@400;700&display=swap">
<link rel="stylesheet" href="../grammar-traps/traps.css?v={ST_V}">
</head>
<body class="library">
<script src="../teacher-nav.js?v={ST_V}"></script>
<header class="top">
  <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="../library.html">Teacher library</a></li><li><span aria-current="page">BBC videos</span></li></ol></nav>
  <h1>BBC Video Lessons</h1>
  <p class="lead">6 Minute English and Real Easy English episodes, newest first. Each student page has the video and your vocabulary notes. Made from your docs in the 6 Minute English folder in Google Drive.</p>
</header>
<main>
<ol class="lessons">
{chr(10).join(rows)}
</ol>
<p class="hint" id="copied" aria-live="polite"></p>
</main>
<script src="../grammar-traps/library.js"></script>
</body>
</html>
'''


def cmd_build():
    eps = load()
    for ep in eps:
        (DIR / f'{ep["slug"]}.html').write_text(page(ep))
    (DIR / "index.html").write_text(index(eps))
    lst = [{"id": ep["slug"], "title": ep["title"], "series": ep["series"], "date": ep.get("date", ""), "added": ep.get("added", ""),
            "path": f'bbc/{ep["slug"]}.html', "docId": ep["docId"], "words": len(ep["words"])} for ep in eps]
    (DIR / "list.json").write_text(json.dumps(lst, indent=1, ensure_ascii=False) + "\n")
    print(f"built {len(eps)} pages")


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[:1] == ["add"]:
        yt = a[a.index("--youtube") + 1] if "--youtube" in a else None
        cmd_add(a[1], yt)
    elif a[:1] == ["build"]:
        cmd_build()
    else:
        print(__doc__)
