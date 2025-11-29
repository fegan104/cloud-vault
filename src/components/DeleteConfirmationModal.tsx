import { TextButton, TonalButton } from "./Buttons";
import { Trash2 } from "lucide-react";

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-surface rounded-[var(--radius-xl)] shadow-[--shadow-5] max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
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
          <TextButton onClick={onCancel}>
            Cancel
          </TextButton>
          <TonalButton
            onClick={onConfirm}
            variant="destructive"
          >
            Delete
          </TonalButton>
        </div>
      </div>
    </div>
  );
}