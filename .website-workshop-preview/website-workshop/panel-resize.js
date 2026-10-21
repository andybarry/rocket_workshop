const names = { create: 'Create', code: 'Code', preview: 'Live Preview' };
const minimum = { create: 150, code: 240, preview: 200 };
let active;
let scheduled = false;

function cards() {
  return [...document.querySelectorAll('.ide-body > [data-panel-id]')]
    .sort((a, b) => Number(a.style.order) - Number(b.style.order));
}

function canResize(card) {
  return card.dataset.panelId !== 'learn' &&
    (card.dataset.panelId !== 'code' || card.classList.contains('is-expanded'));
}

function sync() {
  scheduled = false;
  const list = cards();
  const desktop = matchMedia('(min-width: 769px)').matches;
  list.forEach((card, index) => {
    const id = card.dataset.panelId;
    if (id === 'learn') return;
    for (const side of ['left', 'right']) {
      let tab = card.querySelector(`:scope > [data-resize-edge="${side}"]`);
      if (!tab) {
        tab = document.createElement('button');
        tab.type = 'button';
        tab.className = 'panel-edge-tab';
        tab.dataset.resizeEdge = side;
        tab.setAttribute('aria-label', `Resize ${names[id]} from ${side} edge`);
        tab.title = `Drag to resize ${names[id]}`;
        card.append(tab);
      }
      const hidden = !desktop || !canResize(card) ||
        (side === 'left' ? index === 0 : index === list.length - 1);
      if (tab.hidden !== hidden) tab.hidden = hidden;
    }
  });
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(sync);
}

function setWidth(card, width) {
  // Preview absorbs the space released by its neighbor, including when Code
  // opens or closes later. Never pin its flex size during a resize.
  if (card.dataset.panelId === 'preview') return;
  if (card.dataset.panelId === 'code') {
    window.dispatchEvent(new CustomEvent('workshop-panel-resize', { detail: { width } }));
  } else {
    card.style.width = `${width}px`;
  }
}

function resizeTo(width) {
  const total = active.width + active.partnerWidth;
  const minWidth = card => Math.max(
    minimum[card.dataset.panelId],
    parseFloat(getComputedStyle(card).minWidth) || 0,
  );
  const ownMin = minWidth(active.card);
  const otherMin = minWidth(active.partner);
  const next = Math.max(ownMin, Math.min(width, total - otherMin, 900));
  setWidth(active.card, next);
  setWidth(active.partner, total - next);
}

function finish() {
  if (!active) return;
  const previous = active;
  active = null;
  document.documentElement.classList.remove('panel-edge-resizing');
  if (previous.tab.hasPointerCapture(previous.pointerId)) {
    previous.tab.releasePointerCapture(previous.pointerId);
  }
}

document.addEventListener('pointerdown', event => {
  const tab = event.target.closest?.('.panel-edge-tab');
  if (!tab || tab.hidden || event.button !== 0 || !event.isPrimary) return;
  const card = tab.parentElement;
  if (!canResize(card)) return;
  const list = cards();
  const index = list.indexOf(card);
  const direction = tab.dataset.resizeEdge === 'left' ? -1 : 1;
  const adjacent = list[index + direction];
  const partner = adjacent && canResize(adjacent) ? adjacent :
    list.find(item => item !== card && item.dataset.panelId === 'preview') ||
    list.find(item => item !== card && canResize(item));
  if (!partner) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  active = {
    tab, card, partner, pointerId: event.pointerId, x: event.clientX, direction,
    width: card.getBoundingClientRect().width,
    partnerWidth: partner.getBoundingClientRect().width,
  };
  tab.setPointerCapture(event.pointerId);
  document.documentElement.classList.add('panel-edge-resizing');
}, true);

document.addEventListener('pointermove', event => {
  if (!active || event.pointerId !== active.pointerId) return;
  event.preventDefault();
  resizeTo(active.width + (event.clientX - active.x) * active.direction);
}, { capture: true, passive: false });
document.addEventListener('pointerup', finish, true);
document.addEventListener('pointercancel', finish, true);
document.addEventListener('lostpointercapture', finish, true);
window.addEventListener('blur', finish);
window.addEventListener('resize', () => { finish(); schedule(); });

new MutationObserver(schedule).observe(document.getElementById('root'), {
  childList: true, subtree: true, attributes: true,
  attributeFilter: ['class', 'style', 'data-panel-id'],
});
sync();
