# Practice question bank: format

One file per lesson: `practice/bank/<id>.js`. Each file calls `PRACTICE.add(...)` once:

```js
PRACTICE.add("gt-4", {
  title: "Countable, Uncountable and Quantifiers",   // the lesson's title
  page: "grammar-traps/student-4.html",              // the worksheet it reviews
  items: [
    { id: "gt-4-01", type: "pick", q: "I need some ___ about my visa.", opts: ["advice", "advices"], a: "advice",
      why: "Advice is uncountable: no -s. Say some advice or a piece of advice." },
    { id: "gt-4-02", type: "type", q: "There isn't ___ milk left. (much / many)", a: ["much"],
      why: "Milk is uncountable, so use much." },
    { id: "gt-4-03", type: "order", a: "How much luggage do you have?", alt: [],
      why: "Question order: How much + uncountable noun + do you + verb?" },
    { id: "gt-4-04", type: "spot", q: "She gave me two good advices.", bad: "two good advices", fix: "some good advice",
      opts: ["some good advice", "two good advice"], why: "Advice has no plural. Use some advice." },
    { id: "gt-4-05", type: "spot", q: "We don't have much time.", bad: "", why: "Correct: time here is uncountable, so much." }
  ]
});
```

Item types (all marked instantly, no timers):

| type | fields | what the student does |
|---|---|---|
| `pick` | `q` with one `___`, `opts` (2–4), `a` (one of opts) | taps the right option |
| `type` | `q` with one `___`, `a` (array of accepted answers, lower-case ok) | types the missing word(s) |
| `order` | `a` (the sentence), optional `alt` (other correct orders) | taps the shuffled words into order (6–12 words) |
| `spot` | `q` (sentence), `bad` (exact wrong word(s) in q, or `""` if the sentence is correct), `fix`, optional `opts` | taps the mistake, then picks the fix |

Rules for writers:
- `id` = `<lesson id>-NN`, never reused or renumbered (results are stored by id).
- **New sentences only.** Do not copy items from the worksheet; test the same points in fresh contexts, so the bank supplements the worksheets and does not give them away.
- 20 items per lesson, mixing types (about 8 pick, 5 type, 4 spot incl. 1–2 correct ones, 3 order).
- Plain B1 English, adult everyday contexts (work, travel, home, Toronto/Canada is fine). Canadian/British spelling as on the site.
- `why` on every item: ≤ 200 characters, explains the rule, says the right answer.
- Only one correct answer per pick; for `type`, list every acceptable answer.

Lesson ids: `gt-1`…`gt-11` (grammar-traps/student-N), `aa` (grammar/a-or-an), `v-1`…`v-19` (vocabulary/student-N),
`sv-1`…`sv-4` (stanag/student-vocab-N), `sp-1`…`sp-7` (speaking/student-N), `en-1`…`en-5` (engineering/student-N).

## Practice link (built by My Students)

`practice/index.html?student=<code>&who=<name>&l=gt-3,gt-4,v-1&focus=gt-4&n=10&d=2026-11-10`

- `l`: lessons the student has done (only these are used). `focus`: lessons to lean on (about half the set).
- `n`: number of questions (default 10). `d`: the set's date; with `student` it seeds the choice, so the same link always shows the same questions.
- Results go to Bill with the usual "Send" (`submitWork`, item `practice-<d>`), including each item id and right/wrong first time.
