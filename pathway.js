// Bill's lesson pathway: which worksheet to teach next. Used by pathways.html (and copied into My Students).
// Each lesson: track, title, page, and "next": the best next steps, first = the main one, each with a reason.
window.PATHWAY = {
  tracks: [
    { id: "grammar", name: "Grammar accuracy", note: "The core grammar route, from nouns and articles to tenses and complex sentences.",
      order: ["aa", "gt-4", "gt-3", "gt-2", "gt-1", "gt-5", "gt-11", "gt-7", "gt-6", "gt-8", "gt-9", "gt-10"] },
    { id: "words", name: "Choosing the right word", note: "Collocations, confusing words, prepositions and register.",
      order: ["v-1", "v-2", "v-15", "v-3", "v-5", "v-18", "v-19", "v-4", "v-8", "v-16", "v-17", "v-6", "v-7"] },
    { id: "describe", name: "Describing things well", note: "Adjectives and adverbs, from so/too/very to richer stories.",
      order: ["v-9", "v-10", "v-11", "v-12", "v-13", "v-14"] },
    { id: "speaking", name: "Speaking confidence", note: "For students who freeze. Runs alongside any other route.",
      order: ["sp-1", "sp-2", "sp-3", "sp-4", "sp-5", "sp-6", "sp-7"] },
    { id: "stanag", name: "STANAG / military", note: "For military students; links into the grammar route.",
      order: ["sv-1", "sv-2", "sv-3", "sv-4"] },
    { id: "engineering", name: "Engineering English", note: "For mechanical and structural engineers; links into the grammar route.",
      order: ["en-1", "en-2", "en-3", "en-4", "en-5"] },
    { id: "business", name: "Business English", note: "For adult professionals in any workplace; links into the grammar, words and speaking routes.",
      order: ["bu-1", "bu-2", "bu-3", "bu-4", "bu-5"] }
  ],
  lessons: {
    "aa":    { t: "A or An?", p: "grammar/a-or-an.html", next: [["gt-4", "Countable or uncountable decides a/an or some: the natural next step."], ["gt-3", "Then the other article choices: the, or no article."]] },
    "gt-4":  { t: "Countable, Uncountable and Quantifiers", p: "grammar-traps/student-4.html", next: [["gt-3", "Articles depend on countable and uncountable, so this follows directly."], ["v-9", "Uses too much / too many and enough in a new, lighter context."]] },
    "gt-3":  { t: "Articles: a, an, the, or nothing", p: "grammar-traps/student-3.html", next: [["gt-2", "Nouns are solid; move on to the first tense choice."], ["v-1", "A vocabulary break: make, do and take collocations."]] },
    "gt-2":  { t: "Present Simple or Present Continuous?", p: "grammar-traps/student-2.html", next: [["gt-1", "The next tense pair: present perfect or past simple."], ["sp-2", "If they hesitate when speaking, rescue phrases help right away."]] },
    "gt-1":  { t: "Present Perfect or Past Simple?", p: "grammar-traps/student-1.html", next: [["gt-5", "Next core grammar point: -ing or to + verb."], ["sp-6", "STAR stories put the past simple to work in real speaking."]] },
    "gt-5":  { t: "Gerund (-ing) or Infinitive (to + verb)?", p: "grammar-traps/student-5.html", next: [["gt-11", "Short and direct follow-on: not to + verb."], ["v-5", "Preposition + -ing (good at cooking) from the vocabulary side."]] },
    "gt-11": { t: "Negative Infinitives: not to + verb", p: "grammar-traps/student-11.html", next: [["gt-7", "Next core point: must, might and can't for guesses."], ["gt-10", "Reported commands use it: She told me not to wait."]] },
    "gt-7":  { t: "Must, Might, Can't: How Sure Are You?", p: "grammar-traps/student-7.html", next: [["gt-6", "Next core point: conditionals and wish."], ["v-11", "Describe the Picture practises must / might / can't with photos."]] },
    "gt-6":  { t: "Conditionals and Wish", p: "grammar-traps/student-6.html", next: [["gt-8", "Next core point: the passive."], ["sp-4", "Opinions with A.R.E. often use if: If I were the boss, I would..."]] },
    "gt-8":  { t: "The Passive", p: "grammar-traps/student-8.html", next: [["gt-9", "Next core point: relative clauses."], ["v-6", "The passive is common in formal English; Formal and Informal Words fits well."]] },
    "gt-9":  { t: "Relative Clauses", p: "grammar-traps/student-9.html", next: [["gt-10", "The last core grammar point: reported speech."], ["v-14", "Use longer, richer sentences in a story."]] },
    "gt-10": { t: "Reported Speech", p: "grammar-traps/student-10.html", next: [["v-6", "Reporting at work is often formal: Formal and Informal Words."], ["sp-7", "Bring it all together in a real-world role-play."]] },

    "v-1":  { t: "Make, Do or Take?", p: "vocabulary/student-1.html", next: [["v-2", "More everyday words that are easy to mix up."], ["v-17", "More fixed expressions: fixed pairs."]] },
    "v-2":  { t: "Confusing Word Pairs", p: "vocabulary/student-2.html", next: [["v-15", "Tricky Twins: more commonly confused words."], ["v-3", "Phrasal verbs, the next big vocabulary area."]] },
    "v-15": { t: "Tricky Twins", p: "vocabulary/student-15.html", next: [["v-3", "Phrasal verbs, the next big vocabulary area."], ["v-13", "hard / hardly leads into adjective or adverb."]] },
    "v-3":  { t: "Phrasal Verbs", p: "vocabulary/student-3.html", next: [["v-5", "From verb + particle to word + preposition."], ["gt-5", "Many phrasal verbs take -ing (give up smoking): gerund or infinitive."]] },
    "v-5":  { t: "Words and Prepositions", p: "vocabulary/student-5.html", next: [["v-18", "The next step up: prepositional phrases (on purpose, a reason for, depend on)."], ["gt-5", "Builds on preposition + -ing: when to use -ing and when to use to."], ["v-4", "Word formation: interested / interesting, and other word families."], ["v-3", "Phrasal verbs, if not done yet: more verb + small word combinations."]] },
    "v-4":  { t: "Word Formation", p: "vocabulary/student-4.html", next: [["v-8", "From word families to choosing between similar words."], ["v-13", "The -ly ending: adjective or adverb."]] },
    "v-8":  { t: "Word Meaning and Synonyms", p: "vocabulary/student-8.html", next: [["v-16", "Say It Twice: use synonyms in speech, not just know them."], ["v-6", "Formal and informal versions of the same idea."]] },
    "v-16": { t: "Say It Twice", p: "vocabulary/student-16.html", next: [["v-17", "Fixed pairs: more natural, ready-made phrases."], ["sp-5", "PREP ends by saying your point again in new words."]] },
    "v-17": { t: "Fixed Pairs", p: "vocabulary/student-17.html", next: [["v-6", "Formal and informal words: knowing which phrase fits where."], ["v-7", "Linking words to join ideas."]] },
    "v-18": { t: "Prepositional Phrases 1: Fixed Phrases", p: "vocabulary/student-18.html", next: [["v-19", "Part 2: nouns and verbs with prepositions (a reason for, depend on)."], ["v-15", "Tricky Twins: more look-alike words."]] },
    "v-19": { t: "Prepositional Phrases 2: Nouns and Verbs", p: "vocabulary/student-19.html", next: [["gt-5", "Verb + preposition + -ing (insist on paying): gerund or infinitive."], ["v-4", "Word formation: more word families."], ["v-6", "Formal and informal words: knowing which phrase fits where."]] },
    "v-6":  { t: "Formal and Informal Words", p: "vocabulary/student-6.html", next: [["v-7", "Linking words, for clear formal and spoken English."], ["gt-8", "The passive, common in formal English."]] },
    "v-7":  { t: "Linking Words", p: "vocabulary/student-7.html", next: [["sp-4", "Use because and for example to give opinions: A.R.E."], ["sp-5", "PREP: a full opinion with a strong ending."]] },

    "v-9":  { t: "So, Too or Very?", p: "vocabulary/student-9.html", next: [["v-10", "Describe the Music: mood adjectives and strong adjectives."], ["gt-4", "Much / many and countable nouns, if not done."]] },
    "v-10": { t: "Describe the Music", p: "vocabulary/student-10.html", next: [["v-11", "Describe the Picture: adjectives with photos."], ["v-12", "Adverbs: how something is done."]] },
    "v-11": { t: "Describe the Picture", p: "vocabulary/student-11.html", next: [["v-12", "Adverbs: how something is done."], ["gt-7", "Must, might and can't in full."]] },
    "v-12": { t: "How Is It Played? (Adverbs)", p: "vocabulary/student-12.html", next: [["v-13", "Adjective or adverb: choosing between them."], ["v-15", "Tricky Twins includes hard / hardly and late / lately."]] },
    "v-13": { t: "Adjective or Adverb?", p: "vocabulary/student-13.html", next: [["v-14", "Use both in a story: Tell a Richer Story."], ["v-15", "Tricky Twins: more look-alike words."]] },
    "v-14": { t: "Tell a Richer Story", p: "vocabulary/student-14.html", next: [["sp-6", "STAR gives the story a clear shape when speaking."], ["v-16", "Say It Twice: more variety in words."]] },

    "sp-1": { t: "Naming the Freeze", p: "speaking/student-1.html", next: [["sp-2", "Rescue phrases: what to say when you freeze."]] },
    "sp-2": { t: "Rescue Phrases", p: "speaking/student-2.html", next: [["sp-3", "Thinking time: fillers and easy starts."]] },
    "sp-3": { t: "Thinking Time", p: "speaking/student-3.html", next: [["sp-4", "Giving an opinion with A.R.E."], ["v-7", "Linking words make short sentences flow."]] },
    "sp-4": { t: "Giving Your Opinion (A.R.E.)", p: "speaking/student-4.html", next: [["sp-5", "PREP adds a strong ending."], ["v-7", "Linking words: because, for example, however."]] },
    "sp-5": { t: "Ending Strong (PREP)", p: "speaking/student-5.html", next: [["sp-6", "STAR: telling a story."], ["v-16", "Say It Twice helps with the final Point in new words."]] },
    "sp-6": { t: "Telling a Story (STAR)", p: "speaking/student-6.html", next: [["sp-7", "Real-world rehearsal."], ["gt-1", "Past simple and present perfect for stories."]] },
    "sp-7": { t: "Real-World Rehearsal", p: "speaking/student-7.html", next: [["v-14", "Tell a Richer Story: add colour to their speaking."], ["gt-6", "Conditionals for polite requests and imagined situations."]] },

    "sv-1": { t: "Ranks, Units and Chain of Command", p: "stanag/student-vocab-1.html", next: [["sv-2", "Daily duties and life on base."], ["gt-3", "Articles, which the STANAG sheets practise in Exercise 7."]] },
    "sv-2": { t: "Daily Duties and Life on Base", p: "stanag/student-vocab-2.html", next: [["sv-3", "Training and exercises."], ["gt-2", "Routines vs this week: present simple or continuous."]] },
    "sv-3": { t: "Training and Exercises", p: "stanag/student-vocab-3.html", next: [["sv-4", "Operations and peacekeeping missions."], ["gt-1", "Reporting on past exercises: present perfect or past simple."]] },
    "sv-4": { t: "Operations and Peacekeeping Missions", p: "stanag/student-vocab-4.html", next: [["gt-8", "The passive in full (What was done?)."], ["v-6", "Formal and everyday words for reports."]] },
    "en-1": { t: "What Is It and What Does It Do?", p: "engineering/student-1.html", next: [["en-2", "Materials and properties."], ["v-18", "Fixed phrases with prepositions (in charge of, out of order)."]] },
    "en-2": { t: "Materials and Properties", p: "engineering/student-2.html", next: [["en-3", "Measurements, numbers and data."], ["v-4", "Word formation: strength, strong, strengthen."]] },
    "en-3": { t: "Measurements, Numbers and Data", p: "engineering/student-3.html", next: [["en-4", "Processes, procedures and safety."], ["v-19", "A rise in, a fall in, an effect on: nouns with prepositions."]] },
    "en-4": { t: "Processes, Procedures and Safety", p: "engineering/student-4.html", next: [["en-5", "Problems and solutions."], ["gt-8", "The passive in full."]] },
    "en-5": { t: "Problems and Solutions", p: "engineering/student-5.html", next: [["gt-7", "Must, might and can't for diagnosing problems."], ["sp-5", "PREP: recommend a solution clearly in a meeting."]] },
    "bu-1": { t: "Your Company and Your Job", p: "business/student-1.html", next: [["bu-2", "Meetings: agendas, minutes and polite disagreement."], ["gt-2", "Routines vs current projects: present simple or continuous."], ["gt-1", "I have worked here since ...: present perfect or past simple."]] },
    "bu-2": { t: "Meetings", p: "business/student-2.html", next: [["bu-3", "Emails and phone calls."], ["sp-4", "Give your opinion with a reason and an example (A.R.E.)."], ["v-1", "Make, do or take: reach a decision, make a point."]] },
    "bu-3": { t: "Emails and Phone Calls", p: "business/student-3.html", next: [["bu-4", "Numbers, sales and trends."], ["v-6", "Formal and informal words for emails."], ["v-3", "More phrasal verbs."]] },
    "bu-4": { t: "Numbers, Sales and Trends", p: "business/student-4.html", next: [["bu-5", "Negotiating and making decisions."], ["v-19", "A rise in, an increase of: nouns with prepositions."], ["gt-8", "The passive for reports (Sales were affected by ...)."]] },
    "bu-5": { t: "Negotiating and Making Decisions", p: "business/student-5.html", next: [["gt-6", "Conditionals in full: If you order ..., we can ..."], ["v-1", "Make, do or take: more collocations."], ["sp-5", "PREP: make your case clearly."]] }
  }
};
// Suggest next worksheets: last = the student's last worksheet id, done = ids they have had.
window.PATHWAY.suggest = function (last, done, max) {
  var P = window.PATHWAY, have = {}, out = [], seen = {};
  (done || []).forEach(function (d) { have[d] = 1; });
  max = max || 3;
  function add(id, why) { if (!id || have[id] || seen[id] || !P.lessons[id]) return; seen[id] = 1; out.push({ id: id, title: P.lessons[id].t, page: P.lessons[id].p, why: why }); }
  var L = P.lessons[last];
  if (L) L.next.forEach(function (n) { add(n[0], n[1]); });
  // Then the next lesson not yet done on the same route.
  P.tracks.forEach(function (tr) {
    var i = tr.order.indexOf(last); if (i < 0) return;
    for (var j = i + 1; j < tr.order.length; j++) if (!have[tr.order[j]]) { add(tr.order[j], "Next on the " + tr.name + " route."); break; }
  });
  return out.slice(0, max);
};
