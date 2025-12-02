import { TextButton, TonalButton } from "./Buttons";
import { Trash2, Text } from "lucide-react";
import { ReactNode, useState } from "react";
import { TextInput } from "./TextInput";

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
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  fileName: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal isOpen={isOpen} onBackdropClick={onCancel}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-error-container flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-on-error-container" />
        </div>
        <div className="flex-1">
          <h2 className="text-[--font-title-lg] font-semibold text-on-surface mb-2">
            Delete File?
          </h2>
          <p className="text-[--font-body-md] text-on-surface-variant mb-1">
            Are you sure you want to delete:
          </p>
          <p className="text-[--font-body-md] font-semibold text-on-surface break-words">
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
        <div className="flex-1">
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