"use client"
import { ChangeEvent, useState } from "react";

export function UploadScreenContent({ onEncrypted }: {
  onEncrypted: (fileName: string, cypherText: Blob) => Promise<void>;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [inProgress, setInProgress] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError('');
    }
  };

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError('');
  };

  const getDerivedKey = async (password: string, salt: BufferSource) => {
    const importedKey = await window.crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const params : Pbkdf2Params = {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100_000,
        hash: 'SHA-256',
      }
    return window.crypto.subtle.deriveKey( 
      params,
      importedKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  };

  const handleEncrypt = async () => {
    if (!file || !password) {
      setError('Please select a file and enter a password.');
      return;
    }

    setInProgress(true);
    setError('');

    try {
      const fileBuffer = await file.arrayBuffer();
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const key = await getDerivedKey(password, salt);

      const encryptedContent = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        fileBuffer
      );

      const encryptedFileBlob = new Blob([salt, iv, new Uint8Array(encryptedContent)], { type: 'application/octet-stream' });
      onEncrypted(fileName, encryptedFileBlob)
    } catch (err) {
      setError(`Encryption failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setInProgress(false);
    }
  };

  return (
    <div className="card">
      <h1>File Encryptor/Decryptor</h1>
      <p>Select a file and a password to encrypt or decrypt it using AES-GCM.</p>
      
      <div style={{ margin: '20px 0' }}>
        <label htmlFor="file-upload" style={{ display: 'block', marginBottom: '10px' }}>
          {fileName ? `Selected File: ${fileName}` : '1. Select a file'}
        </label>
        <input 
          id="file-upload"
          type="file" 
          onChange={handleFileChange} 
        />
      </div>

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
      </div>

      <div style={{ margin: '20px 0' }}>
        <button onClick={handleEncrypt} disabled={inProgress || !file || !password}>
          {inProgress ? 'Encrypting...' : 'Encrypt File'}
        </button>
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}