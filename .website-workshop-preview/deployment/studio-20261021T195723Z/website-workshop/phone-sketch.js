import { openDrawingStudio } from './drawing-studio.js';
const token = new URLSearchParams(location.hash.slice(1)).get('token');
const message = document.querySelector('#phone-message');
const start = document.querySelector('#phone-start');
// Keep the temporary token out of page requests and referrers.
history.replaceState(null, '', location.pathname);
if (!token) {
  message.textContent = 'Scan the QR code in the drawing popup on your computer to connect.';
  start.hidden = true;
} else {
  function open() {
    openDrawingStudio(async file => {
      const body = new FormData();
      body.append('token', token);
      body.append('file', file);
      const response = await fetch('/phone-upload-asset', { method: 'POST', body });
      const result = await response.json();
      if (!response.ok || result.status !== 'ok') {
        message.textContent = result.error || 'The code may have expired. Open a new QR code on your computer.';
        throw new Error('Upload failed');
      }
      message.textContent = 'Sent! Your sketch is in the gallery on your computer and attached to the prompt.';
      start.textContent = 'Draw another sketch';
    });
  }
  start.onclick = open;
  open();
}
