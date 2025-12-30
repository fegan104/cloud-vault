import { TextButton, TonalButton } from "./Buttons";
import { Trash2, Text, Link as LinkIcon, Check } from "lucide-react";
import { ReactNode, useState } from "react";
import { TextInput, PasswordInput } from "./TextInput";

// Base Modal component with shared backdrop and container
function Modal({
  isOpen,
  onBackdropClick,
  children,
}: {
  isOpen: boolean;
  onBackdropClick: () => void;
  children: ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onBackdropClick}
      />

      {/* Modal Container */}
      <div className="relative bg-surface rounded-[var(--radius-xl)] shadow-[--shadow-5] max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        {children}
      </div>
    </div>
  );
}

export function DeleteConfirmationModal({
  isOpen,
  fileName,
  title = "Delete File?",
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  fileName: string;
  title?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onBackdropClick={onCancel}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-error-container flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-on-error-container" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[--font-title-lg] font-semibold text-on-surface mb-2">
            {title}
          </h2>
          <p className="text-[--font-body-md] text-on-surface-variant mb-1">
            Are you sure you want to delete:
          </p>
          <p className="text-[--font-body-md] font-semibold text-on-surface break-all">
            {fileName}
          </p>
          <p className="text-[--font-body-sm] text-on-surface-variant mt-2">
            This action cannot be undone.
          </p>
        </div>
      </div>

      <div className="flex gap-3 mt-6 justify-end">
        <TextButton onClick={onCancel}>Cancel</TextButton>
        <TonalButton onClick={onConfirm} variant="destructive">
          Delete
        </TonalButton>
      </div>
    </Modal>
  );
}

export function TextInputModal({
  isOpen,
  title,
  description,
  placeholder,
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  description?: string;
  placeholder?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}) {
  const [inputValue, setInputValue] = useState("");

  const handleConfirm = () => {
    onConfirm(inputValue);
    setInputValue("");
  };

  const handleCancel = () => {
    onCancel();
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      handleConfirm();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <Modal isOpen={isOpen} onBackdropClick={handleCancel}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
          <Text className="w-6 h-6 text-on-primary-container" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-[--font-title-lg] font-semibold text-on-surface mb-2">
            {title}
          </h2>
          {description && (
            <p className="text-[--font-body-md] text-on-surface-variant mb-4">
              {description}
            </p>
          )}
          <TextInput
            value={inputValue}
            onChange={setInputValue}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
          />
        </div>
      </div>

      <div className="flex gap-3 mt-6 justify-end">
        <TextButton onClick={handleCancel}>Cancel</TextButton>
        <TonalButton
          onClick={handleConfirm}
          disabled={!inputValue.trim()}
        >
          {confirmLabel}
        </TonalButton>
      </div>
    </Modal>
  );
}

export function CreateShareModal({
  isOpen,
  fileName,
  onConfirm,
  onCancel,
  isLoading = false,
}: {
  isOpen: boolean;
  fileName: string;
  onConfirm: (shareName: string, password: string) => Promise<string | void>;
  onCancel: () => void;
  isLoading?: boolean;
}) {
  const [shareName, setShareName] = useState("");
  const [password, setPassword] = useState("");
  const [createdShareId, setCreatedShareId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const handleConfirm = async () => {
    const shareId = await onConfirm(shareName, password);
    if (shareId && typeof shareId === 'string') {
      setCreatedShareId(shareId);
    }
  };

  const handleCancel = () => {
    onCancel();
    // Reset state after a short delay to allow closing animation if needed, 
    // but here we just reset immediately as the modal unmounts/closes.
    // Ideally we should wait for the modal to be closed before resetting if we want to preserve state during close animation.
    // For now, simple reset is fine.
    setTimeout(() => {
      setShareName("");
      setPassword("");
      setCreatedShareId(null);
      setIsCopied(false);
    }, 200);
  };

  const handleCopyLink = async () => {
    if (!createdShareId) return;
    const url = `${window.location.origin}/shares/${createdShareId}`;
    try {
      await navigator.clipboard.writeText(url);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && shareName.trim() && password.trim()) {
      handleConfirm();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const isValid = shareName.trim() && password.trim();

  return (
    <Modal isOpen={isOpen} onBackdropClick={handleCancel}>
      {!createdShareId ? (
        <>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
              <Text className="w-6 h-6 text-on-primary-container" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[--font-title-lg] font-semibold text-on-surface mb-2">
                Create Share Link
              </h2>
              <p className="text-[--font-body-md] text-on-surface-variant mb-4 break-all">
                Create a password-protected share for &quot;{fileName}&quot;
              </p>
              <div className="flex flex-col gap-4">
                <TextInput
                  label="Share Name"
                  value={shareName}
                  onChange={setShareName}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter a name for this share"
                />
                <PasswordInput
                  label="Password"
                  value={password}
                  onChange={setPassword}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter a password to protect this share"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6 justify-end">
            <TextButton onClick={handleCancel} disabled={isLoading}>Cancel</TextButton>
            <TonalButton
              onClick={handleConfirm}
              disabled={!isValid || isLoading}
            >
              {isLoading ? "Creating..." : "Create Share"}
            </TonalButton>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary-container flex items-center justify-center">
              <Check className="w-6 h-6 text-on-primary-container" />
            </div>
            <div>
              <h2 className="text-[--font-title-lg] font-semibold text-on-surface mb-1">
                Share Created!
              </h2>
              <p className="text-[--font-body-md] text-on-surface-variant">
                Your secure link is ready.
              </p>
            </div>
          </div>

          <div className="p-4 bg-surface-variant rounded-lg mb-6 break-all font-mono text-sm text-on-surface-variant">
            {`${window.location.origin}/shares/${createdShareId}`}
          </div>

          <div className="flex flex-col gap-3">
            <TonalButton onClick={handleCopyLink} className="w-full justify-center">
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
            </TonalButton>
            <TextButton onClick={handleCancel} className="w-full justify-center">
              Close
            </TextButton>
          </div>
        </>
      )}
    </Modal>
  );
}