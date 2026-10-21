function EUt(a, n) {
  const r = (p) => p.replace(/(\w+)\s+as\s+(\w+)/g, "$1: $2");
  let u = a;
  u = u.replace(/(?:import\s+["'][^"']*\.css["'];?)/g, "/* css import handled */"), u = u.replace(/import\s+(\w+)\s+from\s+["']\.\/([^"']+)["'];?/g, (p, y, m) => {
    const _ = mS(m);
    return `const __imp_${y} = await __require("${_}"); const ${y} = __imp_${y}.default || __imp_${y};`;
  }), u = u.replace(/import\s+\{([^}]+)\}\s+from\s+["']\.\/([^"']+)["'];?/g, (p, y, m) => {
    const _ = mS(m);
    return `const {${r(y)}} = await __require("${_}");`;
  }), u = u.replace(/import\s+(\w+)\s*,\s*\{([^}]+)\}\s+from\s+["']\.\/([^"']+)["'];?/g, (p, y, m, _) => {
    const w = mS(_);
    return `const __imp_${y} = await __require("${w}"); const ${y} = __imp_${y}.default || __imp_${y}; const {${r(m)}} = __imp_${y};`;
  }), u = u.replace(/import\s+\*\s+as\s+(\w+)\s+from\s+["']\.\/([^"']+)["'];?/g, (p, y, m) => {
    const _ = mS(m);
    return `const ${y} = await __require("${_}");`;
  });
  let c = 0;
  const f = (p) => {
    const y = [], m = [];
    for (const _ of p.split(",").map((w) => w.trim()).filter(Boolean)) {
      const w = _.match(/^(\w+)(?:\s+as\s+(\w+))?$/), R = w == null ? void 0 : w[1], h = w == null ? void 0 : w[2];
      R === "MemoryRouter" || R === "BrowserRouter" || R === "HashRouter" ? m.push(h || R) : R === "createBrowserRouter" || R === "createHashRouter" ? y.push(`createMemoryRouter as ${h || R}`) : y.push(_);
    }
    return { kept: y, aliases: m };
  }, d = (p, y) => {
    const { kept: m, aliases: _ } = f(p), w = `__rrd${c++}`, R = [`const ${w} = await import("react-router-dom");`, `window.__ensureIdeRouter(${w});`];
    y && R.push(`const ${y} = ${w}.default || ${w};`), m.length && R.push(`const {${r(m.join(", "))}} = ${w};`);
    for (const h of _) R.push(`const ${h} = window.__IdeRouter;`);
    return R.join(" ");
  };
  return u = u.replace(/import\s+(\w+)\s*,\s*\{([^}]+)\}\s+from\s+["']([^."'][^"']*)["'];?/g, (p, y, m, _) => {
    if (_ === "react" || _ === "react-dom") return `/* ${_} provided */`;
    if (_ === "react-router-dom") return d(m, y);
    const w = r(m);
    return `const __mod_${y} = await import("${_}"); const ${y} = __mod_${y}.default || __mod_${y}; const {${w}} = __mod_${y};`;
  }), u = u.replace(/import\s+(\w+)\s+from\s+["']([^."'][^"']*)["'];?/g, (p, y, m) => m === "react" || m === "react-dom" ? `/* ${m} provided */` : `const ${y} = (await import("${m}")).default || (await import("${m}"));`), u = u.replace(/import\s+\{([^}]+)\}\s+from\s+["']([^."'][^"']*)["'];?/g, (p, y, m) => m === "react" || m === "react-dom" ? `/* ${m} provided */` : m === "react-router-dom" ? d(y, null) : `const {${r(y)}} = await import("${m}");`), u = u.replace(/import\s+\*\s+as\s+(\w+)\s+from\s+["']([^."'][^"']*)["'];?/g, (p, y, m) => m === "react" || m === "react-dom" ? `/* ${m} provided */` : `const ${y} = await import("${m}");`), u = u.replace(/import\s+["']([^."'][^"']*)["'];?/g, (p, y) => `await import("${y}");`), u = u.replace(/export\s+default\s+function\s+(\w+)/g, "function $1"), u = u.replace(/export\s+default\s+class\s+(\w+)/g, "class $1"), u = u.replace(/export\s+default\s+/g, "__exports.default = "), u = u.replace(/export\s+function\s+(\w+)/g, "function $1"), u = u.replace(/export\s+const\s+/g, "const "), u = u.replace(/export\s+let\s+/g, "let "), u = u.replace(/export\s+\{([^}]+)\};?/g, (p, y) => y.split(",").map((m) => {
    const _ = m.trim();
    if (_.includes(" as ")) {
      const [w, R] = _.split(/\s+as\s+/);
      return `__exports["${R.trim()}"] = ${w.trim()};`;
    }
    return `__exports["${_}"] = ${_};`;
  }).join(`
`)), u;
}
