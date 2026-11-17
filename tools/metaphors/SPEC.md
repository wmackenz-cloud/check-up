# Advanced English: Metaphors units: content spec (one JSON file per unit)

File: tools/metaphors/<n>.json (n = 1..12). Build: python3 tools/metaphors.py (add --check to validate only).
Outputs: advanced/metaphors/unit-<n>.html, advanced/metaphors/homework-<n>.html, practice/bank/am-<n>.js.

Student: a very advanced adult (C1/C2) learner. Bill is a retired Ontario educator tutoring online.
Spelling: Canadian/British (colour, realise or realize both ok but be consistent). NO em dashes anywhere. Straight apostrophes.
No unit numbers in student-facing text. No free-writing boxes. No timers.
Every "why" <= 220 characters: explain meaning/tone and the right answer.

## COPYRIGHT RULE (strict)
Never quote song lyrics, lines of poetry, or passages of prose or speeches, not even one line, not even from old public-domain works.
Allowed: the title of a work, the author/artist, the year, the name of a character, an idiom or short set phrase that the work COINED or made famous when that phrase is itself the expression being taught (e.g. Shakespeare coined "wild-goose chase" in Romeo and Juliet), and your own paraphrase/description of what happens and how the metaphor works.
Accuracy: only include attributions you are sure of (origin claims, years, who wrote what). If unsure, use WebSearch to verify or choose a different example. Prefer famous, easy-to-find works. Mix eras and include at least one Canadian artist or writer somewhere in your units if it fits naturally (e.g. Joni Mitchell, Leonard Cohen, Gordon Lightfoot, Margaret Atwood, L. M. Montgomery).

{
  "n": 1,
  "title": "Argument Is War",                     // the big conceptual metaphor, as a title
  "tagline": "debate, competition and conflict",
  "why": "html: 1-2 sentences why this matters for an advanced speaker",
  "know": ["html", ...], "understand": ["html", ...], "able": ["html", ...],     // 2-3 each
  "mistakes": [["wrong (plain)", "right (html, bold the fix) + very short reason"], ...],   // 4-5 real advanced-learner errors: wrong word in the idiom, wrong register, literal translation, mixed metaphor, overuse
  "bigidea": ["html paragraph", ...],             // 2-3 short paragraphs: the conceptual metaphor and how it shapes ordinary language
  "hidden": ["html", ...],                        // 5-8 everyday 'hidden' metaphors from the same system (e.g. "she <strong>attacked</strong> every point I made")
  "expressions": [                                // 8 expressions
    {"e": "stick to your guns", "meaning": "refuse to change your opinion under pressure", "example": "html example sentence with the expression in <strong>",
     "tone": "neutral",                         // one of: formal, neutral, casual, dismissive, humorous
     "bend": "html: how natives vary it (tense, adjectives, word swaps) or 'fixed: don't change it'",
     "note": "html: one nuance: register, region (North American/British), a near-synonym and the difference, or a trap"}
  ],
  "culture": [                                    // 4-5 cards, at least 1 literature (novel/play), 1 poetry, 1 music; optionally a famous speech or film
    {"kind": "Music", "work": "Both Sides Now", "by": "Joni Mitchell", "year": "1969",
     "how": "html paraphrase (2-3 sentences): where/how the metaphor appears and what it shows, NO quoted lines",
     "ask": "one discussion question for the student about it",
     "find": "search text for a 'Find it' button, e.g. Joni Mitchell Both Sides Now"}
  ],
  "ws": {
    "match": [ {"l": "expression", "r": "meaning (short)", "why": "..."} ],      // 8
    "sort": {"h": "instruction html", "cols": ["col 1", "col 2", "col 3"],          // 2-3 columns, e.g. tone or meaning groups
             "items": [ {"w": "expression", "c": 0, "why": "..."} ]},              // 9-12 items, each clearly belongs to one column
    "pick": [ {"q": "situation sentence with one ___", "opts": ["...", "...", "..."], "a": 0, "why": "..."} ],   // 8: choose the idiom that fits the context
    "spot": [ {"q": "sentence with one misused/garbled idiom", "bad": "exact words in q", "fix": "correct words", "opts": ["fix", "distractor"], "why": "..."} ],  // 5
    "type": [ {"q": "idiom with ONE key word missing ___ in a context sentence", "a": ["word", "variant"], "why": "..."} ],   // 6
    "bend": [ {"q": "Which version sounds natural? ___", "opts": ["natural variation", "unnatural", "unnatural"], "a": 0, "why": "..."} ],  // 4: idiom flexibility
    "talk": ["html speaking prompt", ...]          // 5 prompts; at least one about a culture card; role-plays welcome
  },
  "hw": { "match": [6], "pick": [6], "spot": [4], "type": [6] },     // all NEW sentences
  "bank": [ 20 items, practice-bank format, all NEW sentences:
     {"type": "pick", "q": "... ___ ...", "opts": [...], "a": "right opt text", "why": "..."}   // 8
     {"type": "type", "q": "... ___ ...", "a": ["answer"], "why": "..."}                       // 5
     {"type": "spot", "q": "...", "bad": "exact words", "fix": "...", "opts": [...], "why": "..."}   // 4, 1-2 of them correct sentences with "bad": ""
     {"type": "order", "a": "sentence of 6-11 words, no inner punctuation", "alt": [], "why": "..."}  // 3
  ]
}

Quality rules:
- Exactly one defensible answer per pick/bend; distractors should be real idioms used in the wrong situation, or garbled versions.
- Spot: exactly one error per sentence; "bad" appears exactly once in q.
- Type answers are compared case-insensitively; list every acceptable word.
- Sentences should sound like real adult life: work, news, family, travel, politics (balanced), sport, relationships.
- All sentences across ws, hw and bank must be different.
