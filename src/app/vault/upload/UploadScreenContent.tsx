"use client"
import { useMasterKey } from "../../../components/MasterKeyContext";
import { encryptFile } from "../../../lib/clientCrypto";
import { ChangeEvent, useState } from "react";
import MasterKeyGuard from "../../../components/MasterKeyGuard";
import { Check, Upload, Loader2 } from "lucide-react";

export function UploadScreenContent({ masterKeySalt, onEncrypted }: {
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
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const { masterKey } = useMasterKey()

  /**
   * Handles file selection changes from the hidden input.
   * @param {Event} e - The change event from the file input.
   */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError('');
    }
  };

  const handleEncrypt = async () => {
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
      setFile(null)
      setFileName("")
    }
  };


  // Determine the styling and content based on whether files are selected
  const dropzoneClasses = file
    ? "border-green-400 hover:border-green-600"
    : "border-indigo-300 hover:border-indigo-500";
  const iconColor = file ? "text-green-500" : "text-indigo-500";

  // --- JSX RENDER ---
  return (
    <MasterKeyGuard masterKeySalt={masterKeySalt}>
      <div className="bg-gray-50 flex items-center justify-center min-h-screen p-4 font-sans">
        <div className="w-full max-w-lg bg-white p-8 rounded-xl shadow-2xl space-y-6">
          <h1 className="text-3xl font-bold text-gray-800 text-center">
            Document Uploader
          </h1>

          <form className="space-y-4">

            <div className="flex flex-col items-start space-y-2">
              <label htmlFor="file-upload" className="text-sm font-medium text-gray-700">
                Choose File
              </label>

              {/* Custom Styled Dropzone/Input Area */}
              <div className={`relative w-full border-2 border-dashed rounded-lg p-6 transition duration-300 ease-in-out cursor-pointer ${dropzoneClasses}`}>

                {/* 1. The native input is hidden but accessible */}
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  multiple // Allow multiple files
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  disabled={inProgress}
                />

                {/* 2. The styled label content */}
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center text-center text-gray-500 w-full h-full focus:outline-none"
                  tabIndex={0}
                >
                  {file ? (
                    // Success Icon (Checkmark)
                    <Check className={`w-8 h-8 ${iconColor}`} />
                  ) : (
                    // Default Icon (Upload)
                    <Upload className={`w-8 h-8 ${iconColor}`} />
                  )}

                  <p className="mt-2 text-sm font-semibold text-gray-900">
                    {file ? `${fileName} Selected` : 'Click to upload or drag and drop'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {file ? 'Change file above' : '(Max file size: 100MB)'}
                  </p>
                </label>
              </div>

              {/* Display Area for the selected file names */}
              {file && (
                <div className="w-full pt-2">
                  <p className="text-xs font-medium text-gray-600 mb-1">Selected Files:</p>
                  {fileName}
                </div>
              )}
            </div>

            <button
              className={`w-full py-3 text-white font-semibold rounded-lg shadow-md transition duration-200 focus:outline-none focus:ring-4 focus:ring-opacity-50
                              ${file && !inProgress
                  ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500'
                  : 'bg-gray-400 cursor-not-allowed'}
                          `}
              disabled={!file || inProgress}
              onClick={handleEncrypt}
              type="button"
            >
              {inProgress ? (
                <div className="flex items-center justify-center space-x-2">
                  {/* Simple Loading Spinner */}
                  <Loader2 className="animate-spin h-5 w-5 text-white" />
                  <span>Uploading...</span>
                </div>
              ) : 'Upload'}
            </button>
          </form>
          {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
      </div>
    </MasterKeyGuard>
  );
};
