/**
 * Saves a file to the device. This works by programmatically clicking an <a> tag or in
 * the case of FB Messenger opening the file in a new tab.
 * @param blob The file to save.
 * @param fileName The name of the file.
 */
export function saveFileToDevice(blob: Blob, fileName: string) {
  const userAgent = navigator.userAgent;
  const isMessenger = userAgent.includes('FBAN') || userAgent.includes('FBAV');
  const url = URL.createObjectURL(blob);

  if (isMessenger) {
    window.open(url, '_blank');
    return
  }

  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}