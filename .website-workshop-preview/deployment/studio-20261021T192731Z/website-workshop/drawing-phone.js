export async function connectDrawingPhone(panel, { credentials, renderQR, receive }) {
  const status = panel.querySelector('.drawing-phone-status');
  let stopped = false, timer, unmount;
  const stop = () => { stopped = true; clearTimeout(timer); unmount?.(); };
  try {
    const local = ['localhost', '127.0.0.1'].includes(location.hostname);
    const origin = local ? (await (await fetch('/drawing-phone-origin')).json()).origin : location.origin;
    if (!origin) throw new Error('Connect your computer to Wi-Fi, then try again.');
    const post = async (path, extra = {}) => {
      const response = await fetch(path, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...credentials,...extra})});
      const data = await response.json();
      if (!response.ok || data.status !== 'ok') throw new Error(data.error || 'Could not connect. Try again.');
      return data;
    };
    // Establish a baseline before showing the code so no fast upload is missed.
    const baseline = await post('/list-phone-uploads', {since:0});
    const seen = new Set((baseline.uploads || []).map(asset=>asset.url));
    let since = Math.max(0,...(baseline.uploads || []).map(asset=>asset.ts || 0));
    const result = await post('/create-phone-upload-token');
    if (!panel.isConnected) return stop;
    const url = `${origin}/website-workshop/phone-sketch.html#token=${encodeURIComponent(result.token)}`;
    unmount = renderQR(panel.querySelector('.drawing-phone-qr'), url);
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'Open drawing link';
    panel.append(link);
    status.textContent = 'Scan with your phone camera. Use the same Wi-Fi. This code works for 10 minutes. Keep this drawing popup open.';
    const expires = Date.now()+10*60*1000;
    async function poll() {
      if (stopped || !panel.isConnected) { stop(); return; }
      try {
        const data = await post('/list-phone-uploads',{since});
        if (stopped) return;
        for (const asset of data.uploads || []) {
          since = Math.max(since,asset.ts || 0);
          if (!seen.has(asset.url)) {
            await receive(asset);
            seen.add(asset.url);
            status.textContent = 'Sketch received! It is saved in your gallery and attached to your prompt.';
          }
        }
      } catch { status.textContent = 'Connection interrupted. Trying again…'; }
      if (Date.now() < expires && !stopped) timer=setTimeout(poll,2000);
      else if (!stopped) status.textContent = 'This code has expired. Go back to the canvas and choose Draw on phone for a new code.';
    }
    poll();
  } catch (error) { status.textContent = error.message; }
  return stop;
}
