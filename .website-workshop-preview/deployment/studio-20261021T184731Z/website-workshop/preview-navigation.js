// Serialized into the compiled student document; keep this function self-contained.
export function installPreviewHashNavigation() {
  document.addEventListener('click', event => {
    if (event.defaultPrevented) return;
    const link = event.target?.closest?.('a[href]');
    const href = link?.getAttribute('href')?.trim();
    if (!href?.startsWith('#')) return;

    // A srcdoc frame inherits the editor's base URL. Letting a fragment link
    // navigate normally can therefore load the editor, rather than this page.
    event.preventDefault();
    let id;
    try { id = decodeURIComponent(href.slice(1)); } catch { return; }
    // Run after the student's own click handlers (e.g. closing a mobile menu).
    requestAnimationFrame(() => {
      if (!id) { window.scrollTo({ top: 0 }); return; }
      const target = document.getElementById(id) ||
        Array.from(document.getElementsByName(id)).find(element => element.tagName === 'A');
      if (target) target.scrollIntoView({ block: 'start' });
      else if (id.toLowerCase() === 'top') window.scrollTo({ top: 0 });
    });
  // Bubble after React's handlers so links whose handlers prevent navigation
  // keep their custom behavior. The inspector still intercepts at window capture.
  });
}
