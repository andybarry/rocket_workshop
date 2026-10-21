import { guardStudioStartup } from './preview-safety.js';

if (!guardStudioStartup()) {
  await import('./assets/index-955849c745d06d89.js');
  await Promise.all([
    import('./panel-layout.js'),
    import('./panel-resize.js'),
    import('./editor-split.js'),
  ]);
}
