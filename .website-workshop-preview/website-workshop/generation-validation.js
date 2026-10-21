export function validateGeneratedFiles(files, blocks, compile) {
  const candidate = { ...files };
  for (const { path, content } of blocks) candidate[path] = content;
  const result = compile(candidate);
  return { candidate, error: result.error || null };
}

// Never save an invalid response, including complete-looking blocks from Stop.
// Retries are bounded, and an unsuccessful repair preserves all current files.
export async function generateValidatedChange({ files, parse, compile, send, repair, onResponse,
  isCancelled = () => false, requireChanges = false, maxRepairs = 2 }) {
  let response = '', error = null;
  for (let attempt = 0; attempt <= maxRepairs; attempt++) {
    if (isCancelled()) throw Object.assign(new Error('Generation stopped'), { name: 'AbortError' });
    response = '';
    const onChunk = chunk => {
      if (isCancelled()) return;
      response += chunk;
      onResponse(response);
    };
    if (attempt === 0) await send(onChunk);
    else await repair(error, onChunk);
    if (isCancelled()) throw Object.assign(new Error('Generation stopped'), { name: 'AbortError' });
    const blocks = parse(response);
    if (!blocks.length && !requireChanges && attempt === 0) return { response, blocks, candidate: null };
    const checked = blocks.length ? validateGeneratedFiles(files, blocks, compile) : { error: 'No complete file changes were supplied.' };
    if (!checked.error) return { response, blocks, candidate: checked.candidate };
    error = { message: checked.error, response };
  }
  throw new Error(`The generated update could not be validated, so your current website was kept unchanged.\n\n${error.message}`);
}
