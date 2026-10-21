function vUt(a, n) {
  return `
// === Module Registry ===
const __modules = {};
const __moduleCache = {};

function __register(name, factory) {
  __modules[name] = factory;
}

async function __require(name) {
  if (__moduleCache[name]) return __moduleCache[name];
  if (!__modules[name]) {
    // Try with .jsx extension
    const altName = name.replace(/\\.js$/, '.jsx');
    if (__modules[altName]) return __require(altName);
    console.warn("Module not found:", name);
    return {};
  }
  const exports = {};
  __moduleCache[name] = exports;
  await __modules[name](exports, __require);
  __moduleCache[name] = exports;
  return exports;
}

${Object.entries(a).map(([u, c]) => `__register("${u}", async function(__exports, __require) {
  const React = await import("react");
  const { useState, useEffect, useRef, useCallback, useMemo, useContext, createContext } = React;
${c}
  // Auto-export named functions/classes if default not set
  if (!__exports.default) {
    ${CUt(u, c)}
  }
});`).join(`

`)}

// === Boot ===
(async () => {
  try {
    const { createRoot } = await import("react-dom/client");
    const React = await import("react");

    // MemoryRouter wrapper used for every top-level router: restores the
    // route the IDE last saw (survives recompiles / enables deep links),
    // reports navigation via postMessage, and accepts navigate commands.
    window.__ensureIdeRouter = function (rrd) {
      if (window.__IdeRouter) return;
      function IdeRouteBridge() {
        const loc = rrd.useLocation();
        const nav = rrd.useNavigate();
        React.useEffect(() => {
          window.__ideNavigate = nav;
        }, [nav]);
        React.useEffect(() => {
          try {
            parent.postMessage(
              { type: "preview-route", path: loc.pathname + loc.search + loc.hash },
              "*"
            );
          } catch (e) {}
        }, [loc]);
        React.useEffect(() => {
          function onMessage(e) {
            if (e.data && e.data.type === "navigate-route" && typeof e.data.path === "string") {
              nav(e.data.path);
            }
          }
          window.addEventListener("message", onMessage);
          return () => window.removeEventListener("message", onMessage);
        }, [nav]);
        return null;
      }
      window.__IdeRouter = function IdeRouter(props) {
        const entries = [window.__initialRoute || "/"];
        return React.createElement(
          rrd.MemoryRouter,
          Object.assign({}, props, { initialEntries: entries }),
          React.createElement(IdeRouteBridge, null),
          props.children
        );
      };
    };

    const App = await __require("${n}");
    const AppComponent = App.default || App;
    const root = createRoot(document.getElementById("root"));
    root.render(React.createElement(AppComponent));
    // Tell the IDE the site booted (used by the showcase snapshotter)
    try { parent.postMessage({ type: "preview-ready" }, "*"); } catch (e) {}
  } catch (err) {
    document.getElementById("root").innerHTML =
      '<div style="color:red;padding:20px;font-family:monospace;white-space:pre-wrap;">' +
      '<h3>Runtime Error</h3>' + err.message + '\\n\\n' + (err.stack || '') + '</div>';
    if (window.__reportPreviewError) {
      window.__reportPreviewError(err.stack || err.message || err);
    }
    console.error(err);
  }
})();
`;
}
