// The AI service cannot fetch images from a student's localhost or LAN.
// Resolve them in the browser and include the image bytes in the request.
export async function preparePromptImage(source) {
  if (source.startsWith('data:image/')) return source;
  const response = await fetch(source);
  if (!response.ok) throw new Error('Could not load your sketch. Select it from the gallery and try again.');
  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) {
    throw new Error('The sketch link did not return an image. Please upload the sketch again.');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read your sketch. Please try again.'));
    reader.readAsDataURL(blob);
  });
}
