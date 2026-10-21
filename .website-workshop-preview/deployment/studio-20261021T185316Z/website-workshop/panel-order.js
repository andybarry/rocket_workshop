export const DEFAULT_ORDER = ['learn', 'create', 'code', 'preview'];

export function validOrder(value) {
  return Array.isArray(value) && value.length === DEFAULT_ORDER.length &&
    new Set(value).size === DEFAULT_ORDER.length &&
    value.every(id => DEFAULT_ORDER.includes(id));
}

export function movePanel(order, id, index) {
  if (!validOrder(order) || !order.includes(id)) return [...DEFAULT_ORDER];
  const next = order.filter(item => item !== id);
  next.splice(Math.max(0, Math.min(next.length, index)), 0, id);
  return next;
}
