const frameNamePrefix = 'website-workshop-preview:';
const previewStates = new WeakMap();

// This runs before importing the studio bundle, so a nested studio cannot
// hydrate a session, autosave, or create another preview.
export function guardStudioStartup(win = window) {
  if (win.parent === win) return false;
  let frame;
  try { frame = win.frameElement; } catch { /* cross-origin parent */ }
  const namedPreview = win.name.startsWith(frameNamePrefix);
  if (!namedPreview && !frame?.matches('iframe.preview-iframe')) return false;
  const session = frame?.dataset.workshopPreviewSession ||
    (namedPreview ? win.name.slice(frameNamePrefix.length) : '');
  win.parent.postMessage({ type: 'workshop-preview-blocked', session }, '*');
  return true;
}

// Serialized into the student document. Only a real user gesture grants
// another recovery, preventing a script redirecting on mount from looping.
function reportPreviewInteraction() {
  const session = document.documentElement.dataset.workshopPreviewSession;
  const report = event => {
    if (event.isTrusted) parent.postMessage({ type: 'workshop-preview-interaction', session }, '*');
  };
  window.addEventListener('pointerdown', report, true);
  window.addEventListener('keydown', report, true);
}

export function writePreviewDocument(frame, html, onError = () => {}) {
  let state = previewStates.get(frame);
  if (!state) {
    state = {};
    previewStates.set(frame, state);
    const owner = frame.ownerDocument.defaultView;
    const handleMessage = event => {
      if (!frame.isConnected || event.source !== frame.contentWindow ||
          event.data?.session !== state.session) return;
      if (event.data.type === 'workshop-preview-interaction') {
        // A navigated editor document cannot re-arm recovery.
        try {
          if (frame.contentDocument?.documentElement.dataset.workshopPreviewSession === state.session) {
            state.canRecover = true;
          }
        } catch { /* not a student document */ }
      } else if (event.data.type === 'workshop-preview-blocked' && !state.restoring) {
        if (!state.canRecover) {
          state.onError('Preview navigation stopped because this website repeatedly tried to open the studio. Use Refresh after correcting the link.');
          return;
        }
        state.canRecover = false;
        state.restoring = true;
        frame.srcdoc = state.html;
      }
    };
    owner.addEventListener('message', handleMessage);
    frame.addEventListener('load', () => {
      try {
        if (frame.contentDocument?.documentElement.dataset.workshopPreviewSession === state.session) {
          state.restoring = false;
        }
      } catch { /* another origin */ }
    });
    // Match the frame's lifecycle without leaving global listeners behind.
    const observer = new MutationObserver(() => {
      if (!frame.isConnected) {
        owner.removeEventListener('message', handleMessage);
        observer.disconnect();
      }
    });
    observer.observe(frame.ownerDocument.documentElement, { childList: true, subtree: true });
  }
  state.session = crypto.randomUUID();
  state.canRecover = true;
  state.restoring = false;
  state.onError = onError;
  state.html = html
    .replace(/<html\b/i, `<html data-workshop-preview-session="${state.session}"`)
    .replace(/<head>/i, `<head><script>(${reportPreviewInteraction.toString()})();</script>`);
  frame.dataset.workshopPreviewSession = state.session;
  frame.name = frameNamePrefix + state.session;
  frame.srcdoc = state.html;
}
