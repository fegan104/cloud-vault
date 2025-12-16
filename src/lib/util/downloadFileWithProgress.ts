/**
 * Downloads a file from a URL with progress tracking.
 * @param url The URL to download the file from.
 * @param onProgress A callback function to track download progress with a percentage.
 * @returns A promise that resolves with the file blob when the download is complete.
 */
export function downloadFileWithProgress(
  url: string,
  onProgress: (progress: number) => void
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.responseType = 'blob';

    xhr.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(xhr.response);
      } else {
        reject(new Error(`Download failed: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during download'));
    xhr.send();
  });
}
