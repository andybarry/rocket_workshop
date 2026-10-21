import { guardStudioStartup } from './preview-safety.js';

if (!guardStudioStartup()) {
  await import('./assets/index-0494dc7e34cf7df4.js');
  await Promise.all([
    import('./panel-layout.js'),
    import('./panel-resize.js'),
    import('./editor-split.js'),
  ]);
}
