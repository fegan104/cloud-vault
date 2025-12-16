"use client"
import { useMasterKey } from "../../components/MasterKeyContext";
import { encryptFile } from "../../lib/util/clientCrypto";
import { ChangeEvent, useState } from "react";
import { Upload } from "lucide-react";
import CircularProgress from "@/components/CircularProgress";
import { getUploadUrl } from "./actions";

export function UploadButton({ masterKeySalt, onEncrypted }: {
  masterKeySalt: string,
  onEncrypted: (
    fileName: string,
    storagePath: string,
    fileSize: number,
    metadata: {
      fileIv: string;
      wrappedFileKey: string;
      keyWrapIv: string;
      fileAlgorithm: string;
      keyDerivationSalt: string;
      argon2MemorySize: number;
      argon2Iterations: number;
      argon2Parallelism: number;
      argon2HashLength: number;
    }
  ) => Promise<void>;
}) {
  const [error, setError] = useState<string>('');
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const { masterKey } = useMasterKey()

  const onFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError('');
    if (!file) return;
    handleEncrypt(file)
  }

  const handleEncrypt = async (file: File) => {
    if (!masterKey) {
      setError('Please unlock your vault.');
      return;
    }

    setInProgress(true);
    setError('');

    try {
      // 1. Encrypt the file locally
      const { encryptedFileBlob, metadata } = await encryptFile(file, masterKey, masterKeySalt);

      // 2. Request a signed upload URL from the server
      const { uploadUrl, storagePath } = await getUploadUrl();

      // 3. Upload the encrypted file directly to Firebase Storage
      await uploadFileWithProgress(uploadUrl, encryptedFileBlob, setUploadProgress);

      // 4. Notify the server that the upload is complete
      await onEncrypted(file.name, storagePath, encryptedFileBlob.size, metadata);
    } catch (err) {
      console.error(err);
      setError(`Encryption failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setInProgress(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="w-full">
      <form>
        <button
          className={`relative w-full px-6 py-4 text-on-primary font-semibold rounded-full 
                     shadow-[--shadow-2] transition-all duration-200 focus:outline-none focus:ring-2 
                     focus:ring-primary focus:ring-offset-2
                     ${!inProgress
              ? 'bg-primary hover:shadow-[--shadow-3] hover:brightness-110 active:shadow-[--shadow-1]'
              : 'bg-surface-variant text-on-surface-variant cursor-not-allowed'}`}
          type="button"
          disabled={inProgress}
        >
          {/* Hidden file input that fills the button */}
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={onFileSelected}
            disabled={inProgress}
          />

          <div className="relative z-0 pointer-events-none flex items-center justify-center gap-2.5">
            {inProgress ? (
              <>
                <CircularProgress size={20} />
                <span className="text-[--font-label-lg]">Uploading... {uploadProgress}%</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span className="text-[--font-label-lg]">Upload Encrypted File</span>
              </>
            )}
          </div>
        </button>
      </form>

      {error && (
        <div className="mt-3 p-3 rounded-[var(--radius-md)] bg-error-container">
          <p className="text-[--font-body-sm] text-on-error-container">{error}</p>
        </div>
      )}
    </div>
  );
};

/**
 * Uploads a file to cloud storage with progress tracking.
 * @param uploadUrl The signed upload URL to send the file to.
 * @param fileBlob The file to upload.
 * @param onProgress A callback function to track upload progress with a percentage.
 * @returns A promise that resolves when the upload is complete.
 */
function uploadFileWithProgress(
  uploadUrl: string,
  fileBlob: Blob,
  onProgress: (progress: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    // the fetch api doesn't support progress events, so we use XMLHttpRequest
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(fileBlob);
  });
}
