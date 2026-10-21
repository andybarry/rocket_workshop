async function O$e(a, n) {
  var d, p, y;
  const r = I$e();
  dy = new AbortController();
  const { signal: u } = dy, c = await r.chat.completions.create({ model: D2, messages: a, ...bUt(16384), stream: true });
  let f = "";
  try {
    for await (const m of c) {
      if (u.aborted) {
        (d = c.controller) == null || d.abort();
        const w = new Error("Stream aborted");
        throw w.name = "AbortError", w;
      }
      const _ = ((y = (p = m.choices[0]) == null ? void 0 : p.delta) == null ? void 0 : y.content) || "";
      f += _, n(_);
    }
  } finally {
    dy = null;
  }
  return f;
}
