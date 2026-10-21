// Parse module syntax instead of replacing words inside source strings/comments.
// Babel is supplied by the application, so this uses its existing compiler.
export function resolveStudentImport(specifier, currentFile, files) {
  const parts = specifier.startsWith('/') ? [] : currentFile.split('/').slice(0, -1);
  for (const part of specifier.split('/')) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (!parts.length) throw new Error(`${currentFile}: import "${specifier}" goes outside the project.`);
      parts.pop();
    } else parts.push(part);
  }
  const base = parts.join('/');
  const candidates = [base, ...['.jsx', '.js', '.tsx', '.ts'].map(ext => base + ext),
    ...['.jsx', '.js', '.tsx', '.ts'].map(ext => base + '/index' + ext)];
  // Preserve the existing .js -> .jsx compatibility for generated imports.
  if (base.endsWith('.js')) candidates.push(base.slice(0, -3) + '.jsx');
  const found = candidates.find(candidate => Object.hasOwn(files, candidate));
  if (!found) throw new Error(`${currentFile}: cannot find "${specifier}". Check the file path.`);
  return found;
}

const isLocal = value => value.startsWith('.') || value.startsWith('/');

export function rewriteStudentModule(Babel, code, currentFile, files) {
  const prepareImports = ({ types: t }) => ({
    visitor: {
      ImportDeclaration(path) {
        if (path.node.source.value.endsWith('.css')) {
          if (path.node.specifiers.length) throw path.buildCodeFrameError('CSS files can be imported for their styles, without an imported variable.');
          if (isLocal(path.node.source.value)) resolveStudentImport(path.node.source.value, currentFile, files);
          path.remove();
        }
      },
    },
  });
  const converted = Babel.transform(code, {
    filename: currentFile, sourceType: 'module',
    plugins: [prepareImports, ['transform-modules-commonjs', { importInterop: 'none', strictMode: false }]],
  }).code;

  const registryImports = ({ types: t }) => ({
    visitor: {
      CallExpression(path) {
        const { node } = path;
        const requireCall = t.isIdentifier(node.callee, { name: 'require' }) && !path.scope.getBinding('require');
        const dynamicImport = node.callee.type === 'Import';
        if (!requireCall && !dynamicImport) return;
        const source = node.arguments[0];
        if (!t.isStringLiteral(source)) {
          if (requireCall) throw path.buildCodeFrameError('Use a literal file path in require().');
          return; // Native computed external import() keeps its original behavior.
        }
        const local = isLocal(source.value);
        const target = local ? resolveStudentImport(source.value, currentFile, files) : source.value;
        const call = t.callExpression(t.identifier(local ? '__require' : '__import'), [t.stringLiteral(target)]);
        // import() must remain a promise, including inside non-async callbacks.
        path.replaceWith(requireCall ? t.awaitExpression(call) : call);
        path.skip();
      },
      ReferencedIdentifier(path) {
        if (path.node.name === 'exports' && !path.scope.getBinding('exports')) path.node.name = '__exports';
      },
      Program: {
        exit(path) {
          path.scope.crawl();
          const supported = ['React', 'useState', 'useEffect', 'useRef', 'useCallback', 'useMemo', 'useContext', 'createContext'];
          const implicit = supported.filter(name => path.scope.globals[name] && !path.scope.getBinding(name));
          if (!implicit.length) return;
          const namespace = path.scope.generateUidIdentifier('previewReact');
          const declarations = [t.variableDeclaration('const', [t.variableDeclarator(namespace,
            t.awaitExpression(t.callExpression(t.identifier('__import'), [t.stringLiteral('react')])))]),
            ...implicit.map(name => t.variableDeclaration('const', [t.variableDeclarator(t.identifier(name),
              name === 'React' ? namespace : t.memberExpression(namespace, t.identifier(name)))]))];
          path.unshiftContainer('body', declarations);
        },
      },
    },
  });
  const output = Babel.transform(converted, {
    filename: currentFile, sourceType: 'module', plugins: [registryImports],
  }).code;
  // Validate exactly the async factory shape used by Live Preview.
  Babel.transform(`async function __previewModule(__exports, __require, __import) {\n${output}\n}`, {
    filename: currentFile, sourceType: 'script', ast: false, code: false,
  });
  return output;
}
