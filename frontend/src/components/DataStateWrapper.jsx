import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

const DataStateWrapper = ({
  isLoading,
  error,
  isEmpty,
  onRetry,
  loadingSkeleton: SkeletonComponent,
  emptyMessage = "No data found",
  children
}) => {
  if (isLoading) {
    if (SkeletonComponent) {
      return <SkeletonComponent />;
    }
    // Default sleek skeleton
    return (
      <div className="w-full space-y-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 w-full bg-white/5 rounded-2xl border border-white/10"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full p-6 md:p-8 rounded-3xl bg-red-500/5 border border-red-500/20 flex flex-col items-center justify-center text-center space-y-4 shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
          <AlertCircle size={32} />
        </div>
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-red-400">Connection Failed</h3>
          <p className="text-red-300/80 text-sm md:text-base max-w-md mx-auto">
            {typeof error === 'string' ? error : 'Cannot reach the server. Please check your internet connection or try again in a moment.'}
          </p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 px-6 py-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium flex items-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw size={18} />
            <span>Try Again</span>
          </button>
        )}
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 mb-4 opacity-50 filter grayscale">
          {/* Placeholder for an empty state image, generic styling below */}
          <div className="w-full h-full rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-white/20 text-4xl">📭</span>
          </div>
        </div>
        <p className="text-gray-400 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return children;
};

export default DataStateWrapper;
