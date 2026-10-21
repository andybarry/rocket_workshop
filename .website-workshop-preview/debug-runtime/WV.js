function WV({ syncRouteToHash: a = false, allowFix: n = true, showAddPage: r = true, inspectable: u = false, developmentMode: c = false, onInspect: f, onInspectorStop: d }) {
  const p = Je.useRef(null), y = Je.useRef(null), m = Je.useRef({ developmentMode: c, onInspect: f, onInspectorStop: d });
  m.current = { developmentMode: c, onInspect: f, onInspectorStop: d };
  function _() {
    var z, G;
    y.current && ((G = (z = p.current) == null ? void 0 : z.contentWindow) == null || G.postMessage({ type: "workshop-inspector-mode", session: y.current.session, enabled: m.current.developmentMode }, "*"));
  }
  Je.useEffect(() => {
    _();
  }, [c]);
  const [w, R] = Je.useState(null), [h, F] = Je.useState(null), v = Je.useRef(null), C = Je.useRef(a && window.location.hash.slice(1) || "/"), S = Je.useRef(false), j = () => {
    var De, se, xe, V;
    const z = za();
    if (Object.keys(z).length === 0) return;
    const G = _$e(), { html: oe, error: Ce, inspection: Z } = m_(z, G, { initialRoute: C.current, inspectorSession: u ? crypto.randomUUID() : void 0 });
    (se = (De = m.current).onInspect) == null || se.call(De, null), Ce ? (y.current && ((V = (xe = p.current) == null ? void 0 : xe.contentWindow) == null || V.postMessage({ type: "workshop-inspector-mode", session: y.current.session, enabled: false }, "*")), y.current = null, R(Ce)) : (y.current = Z, R(null), F(null), p.current && writePreviewDocument(p.current, oe, F));
  }, I = () => {
    clearTimeout(v.current), v.current = setTimeout(j, 400);
  };
  Je.useEffect(() => {
    j();
    const z = Ay(I), G = j$e(I);
    return () => {
      z(), G(), clearTimeout(v.current);
    };
  }, []), Je.useEffect(() => {
    function z(G) {
      var oe, Ce, Z, De, se, xe, V, _e;
      if (!(!p.current || G.source !== p.current.contentWindow)) {
        if (((oe = G.data) == null ? void 0 : oe.session) === ((Ce = y.current) == null ? void 0 : Ce.session) && y.current && (G.data.type === "workshop-inspector-ready" && _(), G.data.type === "workshop-inspector-stop" && ((De = (Z = m.current).onInspectorStop) == null || De.call(Z)), G.data.type === "workshop-inspect" && m.current.developmentMode)) {
          const ut = yUt(G.data, y.current);
          ut && ((xe = (se = m.current).onInspect) == null || xe.call(se, ut));
        }
        ((V = G.data) == null ? void 0 : V.type) === "preview-error" ? F(String(G.data.message || "Unknown error")) : ((_e = G.data) == null ? void 0 : _e.type) === "preview-route" && typeof G.data.path == "string" && (C.current = G.data.path, a && window.location.hash.slice(1) !== G.data.path && (S.current = true, window.location.hash = G.data.path));
      }
    }
    return window.addEventListener("message", z), () => window.removeEventListener("message", z);
  }, [a]), Je.useEffect(() => {
    if (!a) return;
    function z() {
      var oe, Ce;
      if (S.current) {
        S.current = false;
        return;
      }
      const G = window.location.hash.slice(1) || "/";
      C.current = G;
      try {
        (Ce = (oe = p.current) == null ? void 0 : oe.contentWindow) == null || Ce.postMessage({ type: "navigate-route", path: G }, "*");
      } catch {
      }
    }
    return window.addEventListener("hashchange", z), () => window.removeEventListener("hashchange", z);
  }, [a]);
  const U = w || h;
  function O() {
    $Ut((w ? `Compile error:
` : `Runtime error:
`) + U);
  }
  return Q.jsxs("div", { className: "preview-panel", children: [Q.jsxs("div", { className: "preview-toolbar", children: [Q.jsx("span", { className: "preview-title", children: "Live Preview" }), c && Q.jsx("span", { className: "preview-inspector-hint", title: "Hover to explore \xB7 Click to select \xB7 Esc to release", children: "Hover to explore \xB7 Click to select \xB7 Esc to release" }), Q.jsxs("div", { className: "preview-toolbar-actions", children: [!a && r && Q.jsxs("button", { className: "preview-refresh", onClick: () => {
    z$e() === "convert" && U$e(q$e);
  }, title: "Add a new page to your website", children: [Q.jsx("span", { className: "add-page-plus", "aria-hidden": "true", children: "+" }), " Add Page"] }), Q.jsx("button", { className: "preview-refresh", onClick: j, title: "Refresh preview", children: "Refresh" })] })] }), U && Q.jsxs("div", { className: "preview-error", children: [Q.jsxs("div", { className: "preview-error-head", children: [Q.jsx("strong", { children: w ? "Compile Error" : "Runtime Error" }), n && Q.jsx("button", { className: "preview-fix-btn", onClick: O, title: "Send this error to the AI to fix", children: "Fix error" })] }), Q.jsx("pre", { children: U })] }), Q.jsx("iframe", { ref: p, onLoad: _, className: "preview-iframe", title: "Live Preview", sandbox: "allow-scripts allow-modals allow-same-origin allow-popups" })] });
}
