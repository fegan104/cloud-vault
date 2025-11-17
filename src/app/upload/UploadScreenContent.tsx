"use client"
import { useMasterKey } from "@/context/MasterKeyContext";
import { base64ToUint8Array, deriveMasterKey } from "@/lib/clientCrypto";
import { ChangeEvent, useState } from "react";


export function UploadScreenContent({ masterKeySalt, onEncrypted }: {
  masterKeySalt: string,
  onEncrypted: (fileName: string, cypherText: Blob) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const { masterKey, setMasterKey } = useMasterKey()

  /**
   * Handles file selection changes from the hidden input.
   * @param {Event} event - The change event from the file input.
   */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError('');
    }
  };

  const handlePasswordChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError('');
  };

  const submitPassword = async () => {
    const masterKeySaltBytes = base64ToUint8Array(masterKeySalt)
    const newMasterKey = await deriveMasterKey(password, masterKeySaltBytes)
    setMasterKey(newMasterKey)
  }

  const handleEncrypt = async () => {
    if (!file || !password || !masterKey) {
      setError('Please select a file and enter a password.');
      return;
    }

    setInProgress(true);
    setError('');

    try {
      const fileBuffer = await file.arrayBuffer();
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));

      const encryptedContent = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        masterKey,
        fileBuffer
      );

      const encryptedFileBlob = new Blob([salt, iv, new Uint8Array(encryptedContent)], { type: 'application/octet-stream' });
      onEncrypted(fileName, encryptedFileBlob)
    } catch (err) {
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

  if (!masterKey) {
    return (
      <div style={{ margin: '20px 0' }}>
        <label htmlFor="password-input" style={{ display: 'block', marginBottom: '10px' }}>
          2. Enter Password
        </label>
        <input
          id="password-input"
          type="password"
          value={password}
          onChange={handlePasswordChange}
          placeholder="Enter your password"
          style={{ padding: '10px', width: '300px' }}
        />
        <button onClick={submitPassword}>
          Unlock
        </button>
      </div>
    )
  }

  // --- JSX RENDER ---
  return (
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
                  <svg className={`w-8 h-8 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                ) : (
                  // Default Icon (Upload)
                  <svg className={`w-8 h-8 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
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
          >
            {inProgress ? (
              <div className="flex items-center justify-center space-x-2">
                {/* Simple Loading Spinner */}
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Uploading...</span>
              </div>
            ) : 'Upload'}
          </button>
        </form>
        {error && <p style={{ color: 'red' }}>{error}</p>}
      </div>
    </div>
  );
};
