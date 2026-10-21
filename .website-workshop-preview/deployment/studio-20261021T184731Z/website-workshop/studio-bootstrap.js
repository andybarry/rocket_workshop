import { guardStudioStartup } from './preview-safety.js';

if (!guardStudioStartup()) {
  await import('./assets/index-e18a7712c7de11b5.js');
  await Promise.all([
    import('./panel-layout.js'),
    import('./panel-resize.js'),
    import('./editor-split.js'),
  ]);
}
