import React, { useEffect, useState } from "react";
import { Trash2, AlertTriangle, CheckCircle2, Info, X, Loader2 } from "lucide-react";

export type ConfirmVariant = "danger" | "warning" | "success" | "info";

export interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  itemName?: string;
  isLoading?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Delete",
  cancelText = "Cancel",
  variant = "danger",
  itemName,
  isLoading = false,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading && !internalLoading) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isLoading, internalLoading, onClose]);

  if (!isOpen) return null;

  const handleConfirmClick = async () => {
    try {
      setInternalLoading(true);
      await onConfirm();
    } finally {
      setInternalLoading(false);
      onClose();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          icon: <Trash2 className="h-6 w-6 text-red-600" />,
          iconBg: "bg-red-50 border-red-100 ring-4 ring-red-50/80",
          btnClass:
            "bg-red-600 hover:bg-red-700 active:scale-98 text-white shadow-[0_4px_16px_rgba(220,38,38,0.25)] focus:ring-red-500",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="h-6 w-6 text-amber-600" />,
          iconBg: "bg-amber-50 border-amber-100 ring-4 ring-amber-50/80",
          btnClass:
            "bg-amber-600 hover:bg-amber-700 active:scale-98 text-white shadow-[0_4px_16px_rgba(217,119,6,0.25)] focus:ring-amber-500",
        };
      case "success":
        return {
          icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
          iconBg: "bg-emerald-50 border-emerald-100 ring-4 ring-emerald-50/80",
          btnClass:
            "bg-[#1eb863] hover:bg-[#199d54] active:scale-98 text-white shadow-[0_4px_16px_rgba(30,184,99,0.25)] focus:ring-emerald-500",
        };
      case "info":
      default:
        return {
          icon: <Info className="h-6 w-6 text-blue-600" />,
          iconBg: "bg-blue-50 border-blue-100 ring-4 ring-blue-50/80",
          btnClass:
            "bg-blue-600 hover:bg-blue-700 active:scale-98 text-white shadow-[0_4px_16px_rgba(37,99,235,0.25)] focus:ring-blue-500",
        };
    }
  };

  const currentStyles = getVariantStyles();
  const activeLoading = isLoading || internalLoading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
        onClick={() => !activeLoading && onClose()}
      />

      {/* Modal Card */}
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100/80 z-10 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={activeLoading}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-40 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top Icon */}
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl border ${currentStyles.iconBg} transition-transform`}
        >
          {currentStyles.icon}
        </div>

        {/* Title & Message */}
        <div className="space-y-1.5 w-full">
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            {title}
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
            {message}
          </p>
        </div>

        {/* Highlighted Item Badge (Optional) */}
        {itemName && (
          <div className="w-full max-w-xs px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200/70 text-xs font-semibold text-slate-700 truncate shadow-2xs">
            {itemName}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={activeLoading}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            disabled={activeLoading}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all disabled:opacity-50 cursor-pointer ${currentStyles.btnClass}`}
          >
            {activeLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
