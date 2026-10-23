// Connects the check-ups to Bill's Google spreadsheets (results are saved there and emailed to him).
(function () {
  const API = "https://script.google.com/macros/s/AKfycbwX7y0T0VIsKK0kUDr8UT0wE2p1vIgfHzHXTmfa50P--IGkhga4ouxABmAr0j4dQlus/exec";
  const Q = new URLSearchParams(location.search);
  window.Q = Q;
  window.SITE = new URL("./", location.href).href;
  window.STUDENT_CODE = String(Q.get("student") || "").toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 40);

  function call(action, args) {
    return fetch(API, { method: "POST", body: JSON.stringify({ action: action, args: args }) })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (j) { if (!j.ok) throw new Error(j.error || "Request failed"); return j.data; });
  }
  // Same shape the pages used on Google (google.script.run.withSuccessHandler(...).fn(...)).
  function runner(ok, fail) {
    return new Proxy({}, {
      get: function (_, prop) {
        if (prop === "withSuccessHandler") return function (f) { return runner(f, fail); };
        if (prop === "withFailureHandler") return function (f) { return runner(ok, f); };
        return function () {
          const args = Array.prototype.slice.call(arguments);
          call(String(prop), args).then(function (d) { if (ok) ok(d); }, function (e) { if (fail) fail(e); });
        };
      }
    });
  }
  window.google = { script: { run: runner(null, null) } };

  // The student's name and the date Bill sent their link (saved on the first visit).
  window.loadInfo = function () {
    if (!window.STUDENT_CODE) return Promise.resolve({ name: "", sent: "" });
    const p = new URLSearchParams({ api: "info", student: window.STUDENT_CODE, who: Q.get("who") || "", sent: Q.get("sent") || "" });
    const ctrl = new AbortController(); const t = setTimeout(function () { ctrl.abort(); }, 12000);
    return fetch(API + "?" + p.toString(), { signal: ctrl.signal })
      .then(function (r) { return r.json(); })
      .then(function (j) { clearTimeout(t); return j && j.ok ? { name: j.data.name || "", sent: j.data.sent || "" } : { name: "", sent: "" }; })
      .catch(function () { clearTimeout(t); return { name: "", sent: "" }; });
  };
})();
