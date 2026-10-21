import { guardStudioStartup } from './preview-safety.js';

if (!guardStudioStartup()) {
  await import('./assets/index-fkdtBi_i.js');
  await Promise.all([
    import('./panel-layout.js'),
    import('./panel-resize.js'),
    import('./editor-split.js'),
  ]);
}
