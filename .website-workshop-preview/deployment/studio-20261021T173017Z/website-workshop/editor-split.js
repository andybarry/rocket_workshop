let ratio = 0.5;
let active;

function setSplit(layout, value) {
  const available = layout.clientHeight - 12;
  const limit = available > 0 ? Math.min(80 / available, 0.4) : 0.4;
  ratio = Math.max(limit, Math.min(1 - limit, value));
  layout.style.setProperty('--jsx-share', ratio);
  layout.style.setProperty('--css-share', 1 - ratio);
  const tab = layout.querySelector('.editor-height-tab');
  tab.setAttribute('aria-valuenow', Math.round(ratio * 100));
  tab.setAttribute('aria-valuetext', `JSX ${Math.round(ratio * 100)}%, CSS ${Math.round((1 - ratio) * 100)}%`);
}

function initialize() {
  for (const layout of document.querySelectorAll('.workspace-code.is-expanded .editor-source-layout')) {
    const bottom = layout.querySelector('.editor-css-pane');
    if (!bottom || layout.querySelector('.editor-height-tab')) continue;
    const tab = document.createElement('div');
    tab.className = 'editor-height-tab';
    tab.tabIndex = 0;
    tab.setAttribute('role', 'separator');
    tab.setAttribute('aria-orientation', 'horizontal');
    tab.setAttribute('aria-label', 'Resize JSX and CSS editor heights');
    tab.setAttribute('aria-valuemin', '0');
    tab.setAttribute('aria-valuemax', '100');
    tab.title = 'Drag to resize JSX and CSS. Use arrow keys, or double-click to reset.';
    layout.insertBefore(tab, bottom);
    setSplit(layout, ratio);
    tab.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !event.isPrimary) return;
      event.preventDefault();
      active = {
        tab, layout, pointer: event.pointerId,
        startY: event.clientY, startRatio: ratio,
      };
      tab.setPointerCapture(event.pointerId);
      document.documentElement.classList.add('editor-height-resizing');
    });
    tab.addEventListener('pointermove', event => {
      if (!active || active.tab !== tab || event.pointerId !== active.pointer) return;
      const rect = layout.getBoundingClientRect();
      setSplit(layout, active.startRatio + (event.clientY - active.startY) / (rect.height - 12));
    });
    tab.addEventListener('pointerup', finish);
    tab.addEventListener('pointercancel', finish);
    tab.addEventListener('lostpointercapture', finish);
    tab.addEventListener('dblclick', () => setSplit(layout, 0.5));
    tab.addEventListener('keydown', event => {
      if (!['ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
      event.preventDefault();
      setSplit(layout, event.key === 'Home' ? 0.5 : ratio + (event.key === 'ArrowUp' ? -0.05 : 0.05));
    });
  }
}

function finish() {
  if (!active) return;
  const { tab, pointer } = active;
  active = null;
  document.documentElement.classList.remove('editor-height-resizing');
  if (tab.hasPointerCapture(pointer)) tab.releasePointerCapture(pointer);
}

window.addEventListener('blur', finish);
window.addEventListener('resize', finish);
new MutationObserver(initialize).observe(document.getElementById('root'), { childList: true, subtree: true });
initialize();
