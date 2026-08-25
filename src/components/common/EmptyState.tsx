import React from 'react';
import { FolderSearch, Plus, RefreshCw } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center bg-white border border-gray-200 rounded-lg my-4">
      <div className="w-12 h-12 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 mb-3 shadow-2xs">
        {icon || <FolderSearch className="w-6 h-6 text-gray-400" />}
      </div>
      <h3 className="text-sm font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-xs text-gray-500 max-w-md mb-5 leading-relaxed">{description}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-md transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            {actionLabel}
          </button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <button
            type="button"
            onClick={onSecondaryAction}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 text-xs font-medium rounded-md transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
