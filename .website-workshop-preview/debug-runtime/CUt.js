function CUt(a, n) {
  const r = n.match(/function\s+([A-Z]\w*)\s*\(/);
  if (r) return `__exports.default = ${r[1]};`;
  const u = n.match(/(?:const|let|var)\s+([A-Z]\w*)\s*=/);
  return u ? `__exports.default = ${u[1]};` : "";
}
