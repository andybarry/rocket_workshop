function mS(a) {
  let n = a.replace(/^\.\//, "");
  return /\.(jsx?|tsx?|css)$/.test(n) || (n += ".jsx"), n;
}
