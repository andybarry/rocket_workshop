function m_(a, n = {}, r = {}) {
  try {
    const u = r.inspectorSession ? { session: r.inspectorSession, sources: {}, rules: {}, css: {} } : null, c = {}, f = {};
    for (const [h, F] of Object.entries(a)) h.endsWith(".css") ? c[h] = F : (h.endsWith(".jsx") || h.endsWith(".js") || h.endsWith(".tsx") || h.endsWith(".ts")) && (f[h] = F);
    const d = {};
    for (const [h, F] of Object.entries(f)) {
      const v = pUt.transform(F, { presets: ["react"], plugins: u ? [DUt(h, u.sources)] : [], filename: h, sourceType: "module" }).code, C = EUt(v, h);
      d[h] = C;
    }
    const p = Object.values(c).join(`

`), y = u ? Object.entries(c).map(([h, F], v) => {
      const C = `sheet-${v}`, S = hUt(h, F).map((j, I) => ({ ...j, id: `${C}-${I}` }));
      u.css[C] = S;
      for (const j of S) u.rules[j.id] = j;
      return `<style data-workshop-css="${C}">${F}</style>`;
    }).join(`
`) : `<style>${p}</style>`, m = "App.jsx" in f ? "App.jsx" : "App.js" in f ? "App.js" : Object.keys(f)[0], _ = vUt(d, m), w = Object.keys(n).length > 0 ? `<script>window.__assets = ${JSON.stringify(n)};<\/script>` : "<script>window.__assets = {};<\/script>";
    return { html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; }
  </style>
  ${y}
  <script>
  (${installPreviewHashNavigation.toString()})();
  // IDE bridge: error reporting, initial route, and link interception.
  (function () {
    window.__initialRoute = ${JSON.stringify(r.initialRoute || "/")};
    function report(msg) {
      try {
        parent.postMessage({ type: "preview-error", message: String(msg).slice(0, 2000) }, "*");
      } catch (e) { /* detached */ }
    }
    window.__reportPreviewError = report;
    window.onerror = function (message, source, lineno, colno, error) {
      report(error && error.stack ? error.stack : message + " (line " + lineno + ")");
    };
    window.addEventListener("unhandledrejection", function (e) {
      report(e.reason && e.reason.stack ? e.reason.stack : e.reason);
    });
    // Plain <a href="/page"> links (the AI writes them sometimes) would
    // navigate the iframe away and blank the preview. Route internal paths
    // through the router; open real external URLs in a new tab.
    document.addEventListener("click", function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
      if (!a) return;
      var href = a.getAttribute("href");
      if (!href || href[0] === "#") return;
      if (/^[a-z][a-z0-9+.-]*:/i.test(href)) {
        e.preventDefault();
        try { window.open(href, "_blank"); } catch (err) {}
        return;
      }
      e.preventDefault();
      if (window.__ideNavigate) {
        try { window.__ideNavigate(href); } catch (err) {}
      }
    }, true);
  })();
  <\/script>
</head>
<body>
  <div id="root"></div>
  ${u ? mUt({ session: u.session, css: u.css }) : ""}
  ${w}
  <script type="importmap">
  ${JSON.stringify({ imports: P$e }, null, 2)}
  <\/script>
  <script type="module">
${_}
  <\/script>
</body>
</html>`, error: null, inspection: u };
  } catch (u) {
    return { html: null, error: u.message };
  }
}
