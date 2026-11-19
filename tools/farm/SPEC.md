# Farm English: content spec (one JSON file per lesson)

File: tools/farm/<n>.json (n = 1..8). Build with: python3 tools/farm.py (or --check to validate only).
Outputs: farm/student-<n>.html, farm/teacher-<n>.html, practice/bank/fa-<n>.js, farm/index.html.
See tools/farm/1.json for a complete example.

Audience: adult online ESL learners, B1 to B2, general interest (not farmers). Everyday contexts: visiting a farm,
food, the countryside, family farms, news stories. Canadian/British spelling (colour, plough, practise as a verb),
with US/Canada words noted where they differ (corn/maize, plow, pigpen). No em dashes. Straight apostrophes.
No free-writing tasks. No timers. Every "why" <= 200 characters: says the rule and the right answer, kindly.
HTML (<em>, <strong>, <br>) is allowed in: why (top), know/understand/able, mistakes[][1], warmup, vocab cells and notes,
say, pick/type pre/post/ask, reading text, speaking items, sort rule, all teacher fields.
Plain text only in: every "why" on items and chips, match l/r, pick opts, type ok, order answer/alt, spot q/bad/fix/opts, chip t.

Top level: n, title, hint (one line for the index), why, know[2-3], understand[2], able[2-3],
mistakes[[wrong, right-html] x5-6], warmup[3], vocab[{h, note?, cols[], rows[[...]]}], say (pronunciation hint html),
exercises[...], teacher{...}, bank[20].

Exercises (7, in this order unless the topic needs otherwise):
 1 match (8 pairs): {"title","kind":"match","intro"?, "items":[{"l","r","why"}]}
 2 pick (8): {"kind":"pick","items":[{"pre","post","opts":[3],"a":index,"why"}]}   (the gap goes between pre and post)
 3 type with word bank (8): {"kind":"type","bank":[8 words],"items":[{"pre","post","ok":["answer", "alt"],"why"}]}
 4 order (5, 5-12 words): {"kind":"order","items":[{"answer","alt"?:[...],"why"}]}
 5 reading: {"kind":"reading","text":"<p>..</p> html, 150-220 words, an email/blog/article","items":[5 x {"ask","pre","post","ok","why"}]}
 6 speaking (4): {"kind":"speaking","items":["html question", ...]}
 7 two parts: {"title","parts":[{"h":"Part A heading","kind":"sort","rule"?:"html","intro","cols":[2-3],"chips":[{"t","col":index,"why"} x10]},
                               {"h":"Find the mistake","kind":"spot","items":[{"q","bad","fix","opts":[2 wrong options],"why"} x5, one with "bad":""]}]}
 A "type" answer list holds every acceptable answer (lower case is fine; matching ignores case).

teacher: purpose (html), before (html: what to prepare), plan [[label "Warm-up (5 min).", html] x7, totalling 50 min],
pron [html x5-6 with IPA], mistakes_h? (heading), mistakes [html x5-7: false friends, confusions, L1 notes],
uk_us? [[uk, us/canada, note] ...], adapt [["Vocabulary", b1, b2], ["Speaking", b1, b2]], extra? (html block with its own <h2>),
prompts [html x4: each speaking question with follow-ups].

bank: 20 items in the Practice bank format (practice/SCHEMA.md) without ids (the build adds fa-<n>-NN):
about 8 pick, 5 type, 4 spot (1-2 correct, "bad": ""), 3 order (6-12 words). New sentences only, not copied from the worksheet.
