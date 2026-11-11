// Play buttons for homework sheets: <button class="say" data-say="thick">Play</button> speaks the text with the device's English voice.
// If the device has no voice, the buttons hide and a note asks the student to do that part with Bill.
(function () {
  var ok = "speechSynthesis" in window && "SpeechSynthesisUtterance" in window, voice = null;
  function pick() {
    var vs = speechSynthesis.getVoices().filter(function (v) { return /^en[-_]/i.test(v.lang); });
    var pref = ["en-CA", "en-US", "en-GB"];
    for (var i = 0; i < pref.length && !voice; i++) voice = vs.filter(function (v) { return v.lang.replace("_", "-") === pref[i]; })[0] || null;
    if (!voice) voice = vs[0] || null;
  }
  if (ok) { pick(); speechSynthesis.onvoiceschanged = pick; }
  function say(text, slow) {
    speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.lang = voice ? voice.lang : "en-US"; if (voice) u.voice = voice;
    u.rate = slow ? 0.6 : 0.85;
    speechSynthesis.speak(u);
  }
  document.querySelectorAll("button.say").forEach(function (b) {
    b.type = "button";
    if (!ok) { b.hidden = true; return; }
    var n = 0;
    b.addEventListener("click", function (e) { e.preventDefault(); e.stopPropagation(); n++; say(b.dataset.say, n % 3 === 0); });
  });
  if (!ok) document.querySelectorAll(".say-note").forEach(function (p) { p.textContent = "This device can't play the words. Do the listening parts with Bill in our next lesson, and do the rest now."; });
})();
