function M$e() {
  const a = za(), n = Object.entries(a).map(([c, f]) => `--- ${c} ---
${f}`).join(`

`), r = zc();
  let u = "No assets uploaded.";
  return r.length > 0 && (u = `Available assets:
` + r.map((f) => {
    const d = (f.size / 1024).toFixed(1);
    return `- ${f.name} (${f.type}, ${d} KB)  \u2192  window.__assets["${f.name}"]`;
  }).join(`
`)), [{ role: "system", content: RUt }, { role: "system", content: `Current project files:

${n}

Uploaded assets:
${u}` }];
}
