export function openDrawingStudio(onSave, options = {}) {
  if (document.querySelector('.drawing-studio')) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'drawing-studio';
  dialog.setAttribute('aria-label', 'Draw your website');
  dialog.innerHTML = `
    <header><div><small>CREATE / SKETCH</small><h2>Draw your website</h2><p>A quick sketch is all you need. Show the AI where things belong.</p></div><div class="drawing-header-actions">${options.onPhone ? '<button class="drawing-phone"><svg width="16" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:middle;margin-right:5px"><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M10 5h4M11 19h2"/></svg>Draw on phone</button>' : ''}<button class="drawing-close" aria-label="Close drawing studio">×</button></div></header>
    <div class="drawing-workspace">
      <aside>
        <span class="drawing-label">Tools</span>
        <div class="drawing-tools">
          <button data-tool="pen" aria-pressed="true">✎ <span>Pencil</span></button>
          <button data-tool="eraser" aria-pressed="false">▱ <span>Eraser</span></button>
          <button data-tool="rectangle" aria-pressed="false">▭ <span>Box</span></button>
          <button data-tool="ellipse" aria-pressed="false">○ <span>Circle</span></button>
          <button data-tool="line" aria-pressed="false">╱ <span>Line</span></button>
          <button data-tool="text" aria-pressed="false">T <span>Text box</span></button>
        </div>
        <label class="drawing-label" for="drawing-size">Stroke size <output id="drawing-size-value">4</output></label>
        <input id="drawing-size" type="range" min="1" max="24" value="4">
        <span class="drawing-label">Color</span>
        <canvas class="drawing-wheel" width="120" height="120" aria-label="Color wheel"></canvas>
        <label class="drawing-color-row"><input type="color" value="#2563eb" aria-label="Drawing color"><span>Choose any color</span></label>
        <label class="drawing-label" for="drawing-lightness">Lightness</label>
        <input id="drawing-lightness" type="range" min="5" max="95" value="50">
        <div class="drawing-swatches">${['#172033','#2563eb','#f26749','#22c55e','#facc15','#ffffff'].map(color=>`<button data-color="${color}" style="background:${color}" aria-label="Use ${color}"></button>`).join('')}</div>
      </aside>
      <section class="drawing-board"><div class="drawing-board-top"><div><button data-action="undo" disabled>Undo</button><button data-action="redo" disabled>Redo</button><button data-action="clear">Clear</button></div></div><div class="drawing-canvas-wrap"><canvas class="drawing-canvas" width="1200" height="760" aria-label="Website drawing canvas"></canvas></div></section>
    </div>
    <footer><div><span class="drawing-status" role="status">Saved sketches go to your prompt and image gallery.</span></div><button class="drawing-save">Save to prompt <span>↗</span></button></footer>`;
  document.body.append(dialog);
  const canvas = dialog.querySelector('.drawing-canvas'), ctx = canvas.getContext('2d');
  const wheel = dialog.querySelector('.drawing-wheel'), wc = wheel.getContext('2d');
  const colorInput = dialog.querySelector('[type=color]');
  const save = dialog.querySelector('.drawing-save'), status = dialog.querySelector('.drawing-status');
  let stopPhone;
  if (options.onPhone) dialog.querySelector('.drawing-phone').onclick = async () => {
    if (dialog.querySelector('.drawing-phone-panel')) return;
    const panel = document.createElement('div');
    panel.className = 'drawing-phone-panel';
    panel.innerHTML = '<button class="drawing-phone-back">← Back to canvas</button><h3>Draw on your phone</h3><div class="drawing-phone-qr"></div><p class="drawing-phone-status" role="status">Creating your secure upload code…</p>';
    dialog.append(panel);
    panel.querySelector('button').onclick = () => panel.remove();
    stopPhone?.();
    stopPhone = await options.onPhone(panel);
  };
  let tool = 'pen', color = colorInput.value, size = 4, hue = 220, saturation = 85, lightness = 50;
  let commands = [], redo = [], current = null, busy = false, textEditor = null;
  const wrap = dialog.querySelector('.drawing-canvas-wrap');
  function fitCanvas() {
    const board = dialog.querySelector('.drawing-board');
    const style = getComputedStyle(board);
    const availableWidth = board.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    const availableHeight = board.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) -
      board.querySelector('.drawing-board-top').offsetHeight - 12;
    const width = Math.max(1, Math.min(availableWidth, availableHeight * 1200 / 760));
    wrap.style.width = `${width}px`;
    if (textEditor) textEditor.input.style.fontSize = `${textEditor.command.fontSize * width / 1200}px`;
  }
  const sizing = new ResizeObserver(fitCanvas);
  sizing.observe(dialog.querySelector('.drawing-board'));
  function commitText(cancel = false) {
    if (!textEditor) return;
    const {input, command} = textEditor;
    textEditor = null;
    command.text = input.value;
    input.remove();
    if (!cancel && command.text.trim()) { commands.push(command); redo = []; }
    render();
  }
  function editText(command) {
    const a = command.points[0], b = command.points[command.points.length - 1];
    command.box = {
      x: Math.min(a.x,b.x), y: Math.min(a.y,b.y),
      width: Math.max(240,Math.abs(b.x-a.x)), height: Math.max(100,Math.abs(b.y-a.y)),
    };
    command.box.width = Math.min(command.box.width,1200-command.box.x);
    command.box.height = Math.min(command.box.height,760-command.box.y);
    command.fontSize = Math.max(24,command.size * 5);
    const input = document.createElement('textarea');
    input.className = 'drawing-text-editor';
    input.spellcheck = true;
    input.lang = 'en';
    input.setAttribute('aria-label','Text on drawing canvas');
    input.placeholder = 'Type here…';
    input.style.cssText = `left:${command.box.x/12}%;top:${command.box.y/7.6}%;width:${command.box.width/12}%;height:${command.box.height/7.6}%;color:${command.color};`;
    input.addEventListener('blur',()=>commitText());
    input.addEventListener('keydown',event=>{
      if(event.key==='Escape') {event.preventDefault();event.stopPropagation();commitText(true);}
      if(event.key==='Enter'&&(event.ctrlKey||event.metaKey)) {event.preventDefault();commitText();}
    });
    textEditor = {input,command}; wrap.append(input); fitCanvas(); input.focus();
  }
  const point = event => {
    const rect = canvas.getBoundingClientRect();
    return {x: Math.max(0, Math.min(1200, (event.clientX - rect.left) * 1200 / rect.width)), y: Math.max(0, Math.min(760, (event.clientY - rect.top) * 760 / rect.height))};
  };
  function paint(command) {
    const {points, tool, color, size, text} = command;
    if (tool === 'clear') { ctx.fillStyle='#fff'; ctx.fillRect(0,0,1200,760); return; }
    const a = points[0], b = points[points.length - 1];
    ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
    ctx.fillStyle = color; ctx.lineWidth = tool === 'eraser' ? size * 4 : size;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    if (tool === 'text') {
      if (!command.box) { ctx.strokeRect(a.x,a.y,b.x-a.x,b.y-a.y); return; }
      const box=command.box, font=command.fontSize;
      ctx.save(); ctx.beginPath(); ctx.rect(box.x,box.y,box.width,box.height); ctx.clip();
      ctx.font=`${font}px system-ui`; ctx.textBaseline='top';
      let y=box.y+6;
      for(const paragraph of text.split('\n')) {
        let line='';
        for(const character of paragraph) {
          if(line && ctx.measureText(line+character).width>box.width-12) {ctx.fillText(line,box.x+6,y); y+=font*1.4; line='';}
          line+=character;
        }
        ctx.fillText(line,box.x+6,y); y+=font*1.4;
      }
      ctx.restore(); return;
    }
    if (tool === 'rectangle') ctx.rect(a.x,a.y,b.x-a.x,b.y-a.y);
    else if (tool === 'ellipse') ctx.ellipse((a.x+b.x)/2,(a.y+b.y)/2,Math.abs(b.x-a.x)/2,Math.abs(b.y-a.y)/2,0,0,Math.PI*2);
    else {
      ctx.moveTo(a.x,a.y);
      for (const p of tool === 'line' ? [b] : points.slice(1)) ctx.lineTo(p.x,p.y);
      if (points.length === 1) ctx.lineTo(a.x+.1,a.y);
    }
    ctx.stroke();
  }
  function render() {
    ctx.fillStyle = '#fff'; ctx.fillRect(0,0,1200,760);
    commands.forEach(paint); if (current) paint(current);
    dialog.querySelector('[data-action=undo]').disabled = !commands.length;
    dialog.querySelector('[data-action=redo]').disabled = !redo.length;
  }
  canvas.addEventListener('pointerdown', event => {
    if (busy || event.button !== 0 || !event.isPrimary) return;
    commitText();
    canvas.setPointerCapture(event.pointerId);
    current = {tool,color,size,text:'',points:[point(event)]};
    render();
  });
  canvas.addEventListener('pointermove', event => {
    if (!current || !canvas.hasPointerCapture(event.pointerId)) return;
    current.points.push(point(event)); render();
  });
  canvas.addEventListener('pointerup', event => {
    if (!current) return;
    const finished = current; current = null;
    if (finished.tool !== 'text') { commands.push(finished); redo = []; }
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    render();
    if (finished.tool === 'text') editText(finished);
  });
  canvas.addEventListener('pointercancel', () => { current = null; render(); });
  dialog.querySelectorAll('[data-tool]').forEach(button => button.onclick = () => {
    tool = button.dataset.tool;
    dialog.querySelectorAll('[data-tool]').forEach(b=>b.setAttribute('aria-pressed',b===button));
    canvas.style.cursor = tool === 'text' ? 'text' : 'crosshair';
  });
  dialog.querySelector('[data-action=undo]').onclick = () => { if(commands.length) redo.push(commands.pop()); render(); };
  dialog.querySelector('[data-action=redo]').onclick = () => { if(redo.length) commands.push(redo.pop()); render(); };
  dialog.querySelector('[data-action=clear]').onclick = () => {
    if (!commands.length) return;
    commands.push({tool:'clear'}); redo = []; render();
  };
  dialog.querySelector('#drawing-size').oninput = event => {
    size = Number(event.target.value); dialog.querySelector('#drawing-size-value').value = size;
  };
  function setColor(value) { color = value; colorInput.value = value; }
  colorInput.oninput = event => setColor(event.target.value);
  dialog.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>setColor(b.dataset.color));
  function wheelColor() {
    const scratch = document.createElement('canvas').getContext('2d');
    scratch.fillStyle = `hsl(${hue} ${saturation}% ${lightness}%)`;
    scratch.fillRect(0,0,1,1);
    setColor('#'+Array.from(scratch.getImageData(0,0,1,1).data).slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join(''));
  }
  for(let angle=0;angle<360;angle++) {
    wc.beginPath(); wc.moveTo(60,60); wc.arc(60,60,59,(angle-1)*Math.PI/180,(angle+1)*Math.PI/180);
    wc.closePath(); wc.fillStyle=`hsl(${angle} 100% 50%)`; wc.fill();
  }
  const gradient=wc.createRadialGradient(60,60,0,60,60,59);
  gradient.addColorStop(0,'white'); gradient.addColorStop(1,'#ffffff00'); wc.fillStyle=gradient; wc.fillRect(0,0,120,120);
  function pick(event) {
    const rect=wheel.getBoundingClientRect(), x=(event.clientX-rect.left)*120/rect.width-60, y=(event.clientY-rect.top)*120/rect.height-60;
    hue=(Math.atan2(y,x)*180/Math.PI+360)%360; saturation=Math.min(100,Math.hypot(x,y)/59*100); wheelColor();
  }
  wheel.onpointerdown=event=>{wheel.setPointerCapture(event.pointerId);pick(event)};
  wheel.onpointermove=event=>{if(wheel.hasPointerCapture(event.pointerId))pick(event)};
  dialog.querySelector('#drawing-lightness').oninput=event=>{lightness=Number(event.target.value);wheelColor()};
  dialog.querySelector('.drawing-close').onclick=()=>{if(!busy)dialog.close()};
  dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault()});
  dialog.addEventListener('close',()=>{stopPhone?.();sizing.disconnect();dialog.remove();options.onClose?.()});
  save.onclick=async()=>{
    if(busy)return;
    commitText();
    busy=true; save.disabled=true; save.textContent='Saving…';
    status.textContent='Adding your sketch to the prompt and gallery…';
    try {
      const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));
      if(!blob)throw Error('Could not export canvas');
      await onSave(new File([blob],`website-sketch-${Date.now()}.png`,{type:'image/png'}),canvas.toDataURL('image/png'));
      dialog.close();
    } catch {
      status.textContent='Could not save your sketch. Please try again; your drawing is still here.';
      save.textContent='Try saving again'; save.disabled=false;
    } finally {busy=false}
  };
  render(); dialog.showModal(); fitCanvas();
}
