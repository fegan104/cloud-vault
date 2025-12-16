/**
 * Saves a file to the device.
 * @param blob The file to save.
 * @param fileName The name of the file.
 */
export function saveFileToDevice(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}