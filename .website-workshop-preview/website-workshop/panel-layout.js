import { DEFAULT_ORDER, validOrder, movePanel } from './panel-order.js';

const storageKey = 'website-workshop.panel-order.v1';
const definitions = [
  ['learn', 'Learn', '.task-rail', 'h2'],
  ['create', 'Create', '.studio-workspace', '.studio-create-heading'],
  ['code', 'Code', '.workspace-code', '.workspace-code-heading'],
  ['preview', 'Live Preview', '.preview-panel', '.preview-toolbar'],
];
let order = [...DEFAULT_ORDER];
try {
  const saved = JSON.parse(localStorage.getItem(storageKey));
  if (validOrder(saved)) order = saved;
} catch { /* A blocked store must not prevent rearranging panels. */ }

let body;
let panels = [];
let separators = [];
let drag;
let suppressClickUntil = 0;
let frame = 0;
const shifts = new Map();
const help = document.createElement('div');
help.id = 'panel-layout-help';
help.className = 'panel-layout-sr-only';
help.textContent = 'Drag this heading to rearrange panels, or hold Alt and press an arrow key. Escape cancels dragging.';
const status = document.createElement('div');
status.className = 'panel-layout-sr-only';
status.setAttribute('aria-live', 'polite');
document.body.append(help, status);

function applyOrder(layout = order) {
  panels.forEach(panel => {
    const index = layout.indexOf(panel.id);
    panel.card.style.order = String(index * 2);
    panel.card.dataset.panelLast = String(index === layout.length - 1);
  });
  separators.forEach(({ element, id }) => {
    element.style.order = String(layout.indexOf(id) * 2 + 1);
  });
  if (drag?.placeholder) {
    drag.placeholder.style.order = String(layout.indexOf(drag.panel.id) * 2);
    drag.placeholder.style.marginRight = '0px';
  }
}

function commit(next) {
  order = next;
  applyOrder();
  try { localStorage.setItem(storageKey, JSON.stringify(order)); } catch {}
  status.textContent = `Panel order: ${order.map(id => definitions.find(item => item[0] === id)[1]).join(', ')}.`;
}

function initialize() {
  const nextBody = document.querySelector('.ide-body:not(.ide-body-editor)');
  if (!nextBody) {
    if (drag) finish(false);
    body = null;
    return;
  }
  if (nextBody === body) return;
  const found = definitions.map(([id, name, selector, heading]) => {
    const card = nextBody.querySelector(`:scope > ${selector}`);
    return { id, name, card, heading: card?.querySelector(heading) };
  });
  if (found.some(panel => !panel.heading)) return;
  body = nextBody;
  panels = found;
  const handles = [...body.querySelectorAll(':scope > .resize-handle')];
  separators = [
    { element: body.querySelector(':scope > .learn-divider'), id: 'learn' },
    { element: handles[0], id: 'create' },
    { element: handles[1], id: 'code' },
  ].filter(item => item.element);
  body.classList.add('panels-reorderable');
  panels.forEach(panel => {
    panel.card.dataset.panelId = panel.id;
    panel.heading.dataset.panelDrag = panel.id;
    if (!panel.heading.matches('button')) panel.heading.tabIndex = 0;
    const describedBy = panel.heading.getAttribute('aria-describedby') || '';
    panel.heading.setAttribute('aria-describedby', `${describedBy} panel-layout-help`.trim());
  });
  applyOrder();
}

function panelFromEvent(event) {
  const heading = event.target.closest?.('[data-panel-drag]');
  if (!heading || !body?.contains(heading)) return null;
  // A toolbar's action buttons keep their original actions.
  const control = event.target.closest('button, a, input, select, textarea');
  if (control && control !== heading) return null;
  return panels.find(panel => panel.heading === heading);
}

function stopShifts() {
  shifts.forEach(animation => animation.cancel());
  shifts.clear();
}

function measureSlots() {
  drag.slots = new Map(panels.filter(panel => panel !== drag.panel).map(panel => {
    const rect = panel.card.getBoundingClientRect();
    return [panel.id, {
      left: rect.left + body.scrollLeft,
      top: rect.top + body.scrollTop,
      width: rect.width,
      height: rect.height,
    }];
  }));
}

function previewOrder(next) {
  if (next.every((id, index) => id === drag.preview[index])) return;
  const others = panels.filter(panel => panel !== drag.panel);
  const before = new Map(others.map(panel => [panel.id, panel.card.getBoundingClientRect()]));
  stopShifts();
  drag.preview = next;
  applyOrder(next);
  // Measure the final layout before animating, so moving cards cannot cause
  // the insertion position to oscillate under a stationary pointer.
  measureSlots();
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  others.forEach(panel => {
    const previous = before.get(panel.id);
    const current = panel.card.getBoundingClientRect();
    const x = previous.left - current.left;
    const y = previous.top - current.top;
    if (Math.abs(x) + Math.abs(y) < 1) return;
    const animation = panel.card.animate([
      { transform: `translate(${x}px, ${y}px)` },
      { transform: 'translate(0, 0)' },
    ], { duration: 180, easing: 'cubic-bezier(.2,.8,.2,1)' });
    shifts.set(panel.id, animation);
  });
}

function updateTarget() {
  if (!drag?.active) return;
  const bounds = body.getBoundingClientRect();
  const vertical = getComputedStyle(body).flexDirection === 'column';
  drag.vertical = vertical;
  // Move the actual card, including its live iframe and scroll position.
  drag.panel.card.style.setProperty('--panel-drag-x', `${drag.x - drag.offsetX}px`);
  drag.panel.card.style.setProperty('--panel-drag-y', `${drag.y - drag.offsetY}px`);
  drag.next = null;
  if (drag.x < bounds.left || drag.x > bounds.right ||
      drag.y < bounds.top || drag.y > bounds.bottom) return;
  const remaining = order.filter(id => id !== drag.panel.id);
  const position = vertical ? drag.y : drag.x;
  let index = remaining.findIndex(id => {
    const rect = drag.slots.get(id);
    return position < (vertical
      ? rect.top - body.scrollTop + rect.height / 2
      : rect.left - body.scrollLeft + rect.width / 2);
  });
  if (index < 0) index = remaining.length;
  drag.next = movePanel(order, drag.panel.id, index);
  previewOrder(drag.next);
}

function autoScroll() {
  if (!drag?.active) return;
  const bounds = body.getBoundingClientRect();
  if (drag.x >= bounds.left && drag.x <= bounds.right &&
      drag.y >= bounds.top && drag.y <= bounds.bottom) {
    if (drag.y < bounds.top + 36) body.scrollTop -= 12;
    else if (drag.y > bounds.bottom - 36) body.scrollTop += 12;
    if (drag.x < bounds.left + 36) body.scrollLeft -= 12;
    else if (drag.x > bounds.right - 36) body.scrollLeft += 12;
    updateTarget();
  }
  frame = requestAnimationFrame(autoScroll);
}

function finish(accept) {
  if (!drag) return;
  const current = drag;
  drag = null;
  cancelAnimationFrame(frame);
  stopShifts();
  document.documentElement.classList.remove('panel-drag-active');
  current.panel.card.classList.remove('panel-is-dragging');
  for (const name of ['x', 'y', 'width', 'height', 'origin']) {
    current.panel.card.style.removeProperty(`--panel-drag-${name}`);
  }
  current.placeholder?.remove();
  if (current.panel.heading.hasPointerCapture(current.pointerId)) {
    current.panel.heading.releasePointerCapture(current.pointerId);
  }
  if (current.active) {
    suppressClickUntil = performance.now() + 400;
    if (accept && current.next) commit(current.next);
    else {
      applyOrder();
      status.textContent = 'Panel move cancelled.';
    }
    current.panel.heading.focus({ preventScroll: true });
  }
}

document.addEventListener('pointerdown', event => {
  if (event.button !== 0 || !event.isPrimary || drag) return;
  suppressClickUntil = 0;
  const panel = panelFromEvent(event);
  if (!panel) return;
  drag = {
    panel, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
    x: event.clientX, y: event.clientY, active: false,
  };
}, true);

document.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.pointerId) return;
  drag.x = event.clientX;
  drag.y = event.clientY;
  if (!drag.active && Math.hypot(drag.x - drag.startX, drag.y - drag.startY) < 6) return;
  if (!drag.active) {
    drag.active = true;
    const rect = drag.panel.card.getBoundingClientRect();
    const vertical = getComputedStyle(body).flexDirection === 'column';
    drag.vertical = vertical;
    drag.preview = [...order];
    drag.offsetX = drag.startX - rect.left;
    drag.offsetY = drag.startY - rect.top;
    // Reserve the card's exact space without cloning or remounting its content.
    drag.placeholder = document.createElement('div');
    drag.placeholder.className = 'panel-drag-placeholder';
    drag.placeholder.setAttribute('aria-hidden', 'true');
    Object.assign(drag.placeholder.style, {
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      flex: `0 0 ${vertical ? rect.height : rect.width}px`,
      order: drag.panel.card.style.order,
      marginRight: getComputedStyle(drag.panel.card).marginRight,
    });
    drag.panel.card.before(drag.placeholder);
    drag.panel.card.style.setProperty('--panel-drag-width', `${rect.width}px`);
    drag.panel.card.style.setProperty('--panel-drag-height', `${rect.height}px`);
    drag.panel.card.style.setProperty('--panel-drag-origin', `${drag.offsetX}px ${drag.offsetY}px`);
    drag.panel.card.style.setProperty('--panel-drag-x', `${rect.left}px`);
    drag.panel.card.style.setProperty('--panel-drag-y', `${rect.top}px`);
    drag.panel.heading.setPointerCapture(event.pointerId);
    drag.panel.card.classList.add('panel-is-dragging');
    document.documentElement.classList.add('panel-drag-active');
    measureSlots();
    status.textContent = `Moving ${drag.panel.name}. Release to place it, or press Escape to cancel.`;
    frame = requestAnimationFrame(autoScroll);
  }
  event.preventDefault();
  updateTarget();
}, { capture: true, passive: false });

document.addEventListener('pointerup', event => {
  if (!drag || event.pointerId !== drag.pointerId) return;
  if (drag.active) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  finish(true);
}, true);
document.addEventListener('pointercancel', () => finish(false), true);
document.addEventListener('lostpointercapture', () => finish(false), true);
window.addEventListener('blur', () => finish(false));
window.addEventListener('resize', () => finish(false));
document.addEventListener('click', event => {
  if (performance.now() < suppressClickUntil) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && drag) {
    event.preventDefault();
    finish(false);
    return;
  }
  if (!event.altKey || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
  const panel = panelFromEvent(event);
  if (!panel) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const direction = ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 1;
  commit(movePanel(order, panel.id, order.indexOf(panel.id) + direction));
}, true);

new MutationObserver(initialize).observe(document.getElementById('root'), { childList: true, subtree: true });
initialize();
