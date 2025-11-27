"use client"
import { useMasterKey } from "../../components/MasterKeyContext";
import { encryptFile } from "../../lib/clientCrypto";
import { ChangeEvent, useState } from "react";
import { Upload } from "lucide-react";
import CircularProgress from "@/components/CircularProgress";

export function UploadButton({ masterKeySalt, onEncrypted }: {
  masterKeySalt: string,
  onEncrypted: (
    fileName: string,
    encryptedBlob: Blob,
    metadata: {
      fileIv: string;
      wrappedFileKey: string;
      keyWrapIv: string;
      fileAlgorithm: string;
      keyDerivationSalt: string;
      keyDerivationIterations: number;
      keyDerivationAlgorithm: string;
      keyDerivationHash: string;
    }
  ) => Promise<void>;
}) {
  const [error, setError] = useState<string>('');
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const { masterKey } = useMasterKey()

  const handleEncrypt = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (file) {
      setFileName(file.name);
      setError('');
    }

    if (!file || !masterKey) {
      setError('Please select a file and unlock your vault.');
      return;
    }

    setInProgress(true);
    setError('');

    try {
      const { encryptedFileBlob, metadata } = await encryptFile(file, masterKey, masterKeySalt);

      await onEncrypted(fileName, encryptedFileBlob, metadata);
    } catch (err) {
      console.error(err);
      setError(`Encryption failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setInProgress(false);
      setFileName("")
    }
  };

  return (
    <div className="space-y-6">
      <form className="space-y-4">
        <button
          className={`relative w-full p-3 text-white font-semibold rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50
              ${!inProgress
              ? 'bg-primary hover:brightness-120 hover:shadow-lg focus:ring-primary'
              : 'bg-gray-400 cursor-not-allowed'}`}
          type="button"
        >
          {/* Hidden file input that fills the button */}
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            onChange={handleEncrypt}
            disabled={inProgress}
          />

          <div className="relative z-0 pointer-events-none flex items-center justify-center space-x-2">
            {inProgress ? (
              <>
                <CircularProgress size={20} />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload</span>
              </>
            )}
          </div>
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};
