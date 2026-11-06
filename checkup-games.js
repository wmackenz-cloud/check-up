// Check-up games (vocab.html, grammar.html): the same look as the lesson games (games.js), without its lesson code.
//   CheckupGame.dots(n)                  a row of n dots: set(i, "ok" | "bad" | "unsure" | "later" | "") and now(i) for the current one.
//   CheckupGame.streak(host, n)          shows "n in a row!" on host at 3, 5, 10, 15, 20...
//   CheckupGame.flash(node, "pop"|"shake")  a short movement (none if the student prefers less motion).
//   CheckupGame.celebrate(near, text, big)  a badge and confetti, like games.js (no confetti if the student prefers less motion).
// Nothing here is timed, saved or sent: it only draws.
(function () {
  var calm = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function flash(n, cls) { if (!n) return; n.classList.remove(cls); void n.offsetWidth; n.classList.add(cls); setTimeout(function () { n.classList.remove(cls); }, 700); }

  function dots(total) {
    var row = el("div", "cg-dots"); row.setAttribute("aria-hidden", "true");
    for (var i = 0; i < total; i++) row.append(el("span", "cg-dot"));
    return { el: row,
      set: function (i, kind) { var d = row.children[i]; if (!d) return; var now = d.classList.contains("now"); d.className = "cg-dot" + (kind ? " " + kind : "") + (now ? " now" : ""); },
      now: function (i) { Array.prototype.forEach.call(row.children, function (d, k) { d.classList.toggle("now", k === i); }); }
    };
  }

  function streak(host, n) {
    if (!(n >= 3 && (n === 3 || n === 5 || n % 5 === 0))) return;
    var t = el("span", "cg-streak", n + " in a row!"); t.setAttribute("aria-hidden", "true");
    host.append(t); setTimeout(function () { t.remove(); }, 1600);
  }

  // Copied from games.js so the check-ups celebrate exactly like the lessons.
  function celebrate(near, text, big) {
    var badge = el("div", "cg-perfect" + (big ? " big" : ""), text || "Perfect!");
    badge.setAttribute("aria-hidden", "true");
    badge.prepend(el("span", "cg-star", "★"));
    (big ? document.body : near).append(badge);
    setTimeout(function () { badge.remove(); }, big ? 3600 : (calm ? 2200 : 2600));
    if (calm) return;
    var cv = el("canvas", "cg-confetti"); document.body.append(cv);
    var ctx = cv.getContext("2d"), dpr = window.devicePixelRatio || 1;
    var W = innerWidth, H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.scale(dpr, dpr);
    var colors = ["#1f5f73", "#2e7a50", "#e0a526", "#d65a3a", "#7fc0d1", "#9b6bd1"], bits = [];
    var origins = big ? [[W * .2, H * .45], [W * .5, H * .35], [W * .8, H * .45]] : (function () {
      var r = near.getBoundingClientRect(); return [[r.left + r.width / 2, Math.min(Math.max(r.top, 60), H - 60)]];
    })();
    origins.forEach(function (o) {
      for (var i = 0; i < 140; i++) {
        var a = Math.random() * Math.PI * 2, v = 4 + Math.random() * (big ? 12 : 9);
        bits.push({ x: o[0], y: o[1], vx: Math.cos(a) * v, vy: Math.sin(a) * v - 6, w: 6 + Math.random() * 6, h: 4 + Math.random() * 6,
          rot: Math.random() * 6, vr: (Math.random() - .5) * .4, c: colors[i % colors.length] });
      }
    });
    var t0 = performance.now(), dur = big ? 3200 : 2400;
    (function frame(t) {
      var life = (t - t0) / dur;
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = Math.max(0, 1 - Math.max(0, life - .6) / .4);
      bits.forEach(function (b) {
        b.vy += .28; b.vx *= .985; b.x += b.vx; b.y += b.vy; b.rot += b.vr;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot); ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore();
      });
      if (life < 1) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  }

  window.CheckupGame = { dots: dots, streak: streak, flash: flash, celebrate: celebrate, calm: calm };
})();
