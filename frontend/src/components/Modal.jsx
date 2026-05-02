import { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, onSubmit, submitLabel = 'Save', submitting = false, wide = false }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Panel */}
      <div className={`relative bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] w-full ${wide ? 'max-w-2xl' : 'max-w-lg'}`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>
        {/* Body */}
        <div className="overflow-y-auto px-6 py-5 flex-1">
          {children}
        </div>
        {/* Footer */}
        {onSubmit && (
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <button onClick={onClose} className="btn-secondary" disabled={submitting}>
              Cancel
            </button>
            <button onClick={onSubmit} className="btn-primary min-w-24" disabled={submitting}>
              {submitting ? 'Saving…' : submitLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
