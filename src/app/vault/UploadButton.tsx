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
  const { masterKey } = useMasterKey()

  const onFileSelected = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log(file?.name || "No File name")
    setError('');
    if (!file) return;
    handleEncrypt(file)
  }

  const handleEncrypt = async (file: File) => {
    console.log(file)

    if (!masterKey) {
      setError('Please unlock your vault.');
      return;
    }

    setInProgress(true);
    setError('');

    try {
      const { encryptedFileBlob, metadata } = await encryptFile(file, masterKey, masterKeySalt);

      await onEncrypted(file.name, encryptedFileBlob, metadata);
    } catch (err) {
      console.error(err);
      setError(`Encryption failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setInProgress(false);
    }
  };

  return (
    <div className="w-full">
      <form>
        <button
          className={`relative w-full px-6 py-4 text-on-primary font-semibold rounded-[--radius-lg] 
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
                <span className="text-[--font-label-lg]">Uploading...</span>
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
        <div className="mt-3 p-3 rounded-[--radius-md] bg-error-container">
          <p className="text-[--font-body-sm] text-on-error-container">{error}</p>
        </div>
      )}
    </div>
  );
};
