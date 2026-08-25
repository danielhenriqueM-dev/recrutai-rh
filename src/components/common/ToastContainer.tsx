import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />,
          error: <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />,
          warning: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />,
          info: <Info className="w-4 h-4 text-blue-600 shrink-0" />,
        };

        const bgColors = {
          success: 'bg-white border-emerald-300 text-gray-900',
          error: 'bg-white border-red-300 text-gray-900',
          warning: 'bg-white border-amber-300 text-gray-900',
          info: 'bg-white border-blue-300 text-gray-900',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-lg border shadow-md flex items-start gap-3 transition-all transform animate-in slide-in-from-right-4 duration-150 ${bgColors[toast.type]}`}
          >
            {icons[toast.type]}
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold leading-tight text-gray-900">{toast.title}</h4>
              <p className="text-xs text-gray-600 mt-0.5 leading-normal">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-700 p-0.5 rounded transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
