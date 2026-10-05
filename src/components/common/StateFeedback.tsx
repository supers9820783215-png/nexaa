import React from 'react';
import { Loader2, AlertCircle, CheckCircle2, SearchX, Sparkles } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading verified network data...',
  className = ''
}) => (
  <div className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7]/70 ${className}`}>
    <div className="w-10 h-10 rounded-xl bg-[#EBF2EA] flex items-center justify-center text-[#5A7458] mb-3 animate-spin">
      <Loader2 className="w-5 h-5" />
    </div>
    <p className="text-sm font-medium text-[#1F242D]">{message}</p>
    <p className="text-xs text-[#7E8696] mt-1">Connecting academic & professional nodes</p>
  </div>
);

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'Try adjusting your search criteria, filter options, or keyword parameters.',
  actionLabel,
  onAction,
  icon,
  className = ''
}) => (
  <div className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[#FCFBF8] border border-[#E6E1D7] shadow-xs ${className}`}>
    <div className="w-12 h-12 rounded-2xl bg-[#F7F5F0] border border-[#E6E1D7] flex items-center justify-center text-[#565D6D] mb-4">
      {icon || <SearchX className="w-6 h-6 text-[#7E8696]" />}
    </div>
    <h3 className="text-base font-bold text-[#1F242D] tracking-tight">{title}</h3>
    <p className="text-xs text-[#565D6D] max-w-md mt-1.5 leading-relaxed">{description}</p>
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="mt-5 px-4 py-2 text-xs font-semibold text-[#1F242D] bg-[#F7F5F0] hover:bg-[#EFEBE3] border border-[#E6E1D7] rounded-xl transition-colors cursor-pointer"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

interface ErrorStateProps {
  title?: string;
  error?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to complete request',
  error = 'A network synchronization error occurred. Please verify your connection or retry.',
  onRetry,
  className = ''
}) => (
  <div className={`flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-[#FDF8F7] border border-[#F4DCD9] ${className}`}>
    <div className="w-12 h-12 rounded-2xl bg-[#FBEAEA] border border-[#F4C5C5] flex items-center justify-center text-[#932F2F] mb-4">
      <AlertCircle className="w-6 h-6" />
    </div>
    <h3 className="text-base font-bold text-[#1F242D]">{title}</h3>
    <p className="text-xs text-[#565D6D] max-w-md mt-1.5 leading-relaxed">{error}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-5 px-4 py-2 text-xs font-semibold text-white bg-[#932F2F] hover:bg-[#7D2424] rounded-xl transition-colors cursor-pointer"
      >
        Retry Action
      </button>
    )}
  </div>
);
