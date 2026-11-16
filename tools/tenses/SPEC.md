# Verb tense sheets: content spec (one JSON file per tense)

File: tools/tenses/<n>.json  (n = 1..14). Build with: python3 tools/tenses.py
Outputs: grammar/tense-<n>.html (worksheet), grammar/tense-homework-<n>.html (homework drill), practice/bank/vt-<n>.js (20 review questions).

Audience: adult online ESL learners, B1 (some A2), everyday adult contexts (work, home, travel, Toronto/Canada fine).
Canadian/British spelling as on the site (colour, practise as verb, travelled). No em dashes anywhere. Plain short sentences.
No lesson numbers in any student-facing text. No free-writing tasks. No timers.
Every "why" <= 200 characters: says the rule and the right answer, kindly.
Fields with "html" may use <em>, <strong>; everything else is plain text. Use straight apostrophes (').

{
  "n": 7,
  "title": "Past Perfect",                       // shown as the page title
  "tagline": "the earlier past: had + past participle",   // short eyebrow text
  "why": "html, 1-2 sentences: why this tense matters for the student",
  "know": ["html", "html"],                      // 2-3 items: "You will know"
  "understand": ["html", "html"],                // 2 items
  "able": ["html", "html", "html"],              // 2-3 items
  "mistakes": [["wrong sentence (plain)", "right sentence (html, bold the fix)"], ...],   // 5 pairs, the most common real learner errors
  "use": ["html", ...],                          // 2-4 short points: when we use it, each with an example in <em>
  "form": [["Positive", "html example(s)"], ["Negative", "..."], ["Question", "..."], ["Short answers", "..."]],  // 3-5 rows
  "signals": "html: time words / signal words that go with this tense",
  "tip": "html: one memorable rule-of-thumb or contrast with a nearby tense (e.g. past perfect vs past simple)",
  "ws": {                                         // the WORKSHEET exercises
    "pick":  [ {"q": "When I arrived, the film ___ .", "opts": ["had started", "started"], "a": 0, "why": "..."} ],   // 8 items, q has exactly one ___, 2-3 opts, a = index of the right opt
    "type":  [ {"q": "She ___ (never / see) snow before she moved to Canada.", "a": ["had never seen", "'d never seen"], "why": "..."} ],  // 8 items, verb in brackets after the gap, list EVERY acceptable answer incl. contractions
    "spot":  [ {"q": "By the time we got there, the shop closed.", "bad": "closed", "fix": "had closed", "opts": ["had closed", "has closed"], "why": "..."} ],  // 5 items: bad = exact words in q; opts = 2-3 choices incl. fix
    "order": [ {"a": "Had you ever flown before that trip?", "alt": [], "why": "..."} ]   // 4 items, 6-11 words, alt = other correct word orders
  },
  "hw": { "pick": [6 items], "type": [8 items], "spot": [4 items], "order": [3 items] },   // HOMEWORK drill: same formats, ALL NEW sentences (none from ws)
  "bank": [ 20 items in practice-bank format, ALL NEW sentences (none from ws or hw):
     {"type": "pick", "q": "... ___ ...", "opts": [...], "a": "the right opt text", "why": "..."}       // 8
     {"type": "type", "q": "... ___ (verb) ...", "a": ["answer", "contraction"], "why": "..."}         // 5
     {"type": "spot", "q": "...", "bad": "exact words", "fix": "...", "opts": [...], "why": "..."}     // 4, one or two of them correct sentences with "bad": "" and no fix/opts
     {"type": "order", "a": "sentence", "alt": [], "why": "..."}                                      // 3
  ]
}

Quality rules:
- Exactly one correct answer for every pick (the other options must be clearly wrong in context, not just less natural).
- For type items, give enough context so only the target form fits; list all acceptable answers (full and contracted forms).
- Spot: the sentence must contain exactly one error, and "bad" must appear exactly once in q (case-sensitive).
- Order: no commas or other punctuation inside the sentence except the final . or ?; avoid names that could start a sentence ambiguously; give alt orders when adverbs can move.
- Contrast with neighbouring tenses where learners actually confuse them (e.g. present perfect vs past simple), but keep the focus on the target tense.
