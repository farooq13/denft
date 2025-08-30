import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Loader2,
  X,
  ExternalLink,
} from 'lucide-react';
import { useToaster } from '../../contexts/ToasterContext';

// Toast type icons mapping
const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  loading: Loader2,
};

// Toast type colors mapping
const toastColors = {
  success: {
    bg: 'bg-gradient-to-r from-green-600/90 to-emerald-600/90',
    border: 'border-green-500/50',
    icon: 'text-green-300',
    text: 'text-green-50',
  },
  error: {
    bg: 'bg-gradient-to-r from-red-600/90 to-rose-600/90',
    border: 'border-red-500/50',
    icon: 'text-red-300',
    text: 'text-red-50',
  },
  warning: {
    bg: 'bg-gradient-to-r from-yellow-600/90 to-orange-600/90',
    border: 'border-yellow-500/50',
    icon: 'text-yellow-300',
    text: 'text-yellow-50',
  },
  info: {
    bg: 'bg-gradient-to-r from-blue-600/90 to-cyan-600/90',
    border: 'border-blue-500/50',
    icon: 'text-blue-300',
    text: 'text-blue-50',
  },
  loading: {
    bg: 'bg-gradient-to-r from-slate-600/90 to-slate-700/90',
    border: 'border-slate-500/50',
    icon: 'text-slate-300',
    text: 'text-slate-50',
  },
};

// Individual toast component
const ToastItem: React.FC<{
  id: string;
  message: string;
  type: keyof typeof toastIcons;
  title?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  progress?: number;
  onRemove: (id: string) => void;
}> = ({ id, message, type, title, action, progress, onRemove }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(100);

  const Icon = toastIcons[type];
  const colors = toastColors[type];

  // Auto-hide timer for non-persistent toasts
  useEffect(() => {
    if (type === 'loading') return; // Don't auto-hide loading toasts

    const duration = type === 'error' ? 6000 : type === 'success' ? 4000 : 3000;
    let startTime = Date.now();

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        setIsVisible(false);
        setTimeout(() => onRemove(id), 300);
        clearInterval(timer);
      }
    }, 50);

    return () => clearInterval(timer);
  }, [id, type, onRemove]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(id), 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ 
        opacity: isVisible ? 1 : 0, 
        y: isVisible ? 0 : -20, 
        scale: isVisible ? 1 : 0.95 
      }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`relative overflow-hidden rounded-lg shadow-2xl backdrop-blur-xl border ${colors.bg} ${colors.border} max-w-sm w-full`}
    >
      {/* Progress bar for auto-hiding toasts */}
      {type !== 'loading' && (
        <div className="absolute top-0 left-0 h-1 bg-white/20 transition-all duration-75 ease-linear"
             style={{ width: `${timeLeft}%` }} />
      )}

      {/* Progress bar for loading toasts with custom progress */}
      {type === 'loading' && progress !== undefined && (
        <div className="absolute top-0 left-0 h-1 bg-white/30 transition-all duration-300"
             style={{ width: `${progress}%` }} />
      )}

      <div className="p-4">
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${colors.icon}`}>
            {type === 'loading' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Icon className="w-5 h-5" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className={`font-semibold mb-1 ${colors.text}`}>
                {title}
              </h4>
            )}
            <p className={`text-sm ${colors.text} ${title ? 'opacity-90' : ''}`}>
              {message}
            </p>

            {/* Action button */}
            {action && (
              <button
                onClick={action.onClick}
                className={`mt-2 text-xs font-medium ${colors.text} hover:underline flex items-center space-x-1`}
              >
                <span>{action.label}</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Close button */}
          {type !== 'loading' && (
            <button
              onClick={handleClose}
              className={`flex-shrink-0 ${colors.icon} hover:opacity-80 transition-opacity`}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Animated border effect */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
};

// Main toaster container
export const Toaster: React.FC = () => {
  const { toasts, removeToast } = useToaster();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-h-screen overflow-hidden">
      <AnimatePresence mode="popLayout">
        {toasts.slice(0, 5).map((toast) => ( // Limit to 5 visible toasts
          <ToastItem
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            title={toast.title}
            action={toast.action}
            progress={toast.progress}
            onRemove={removeToast}
          />
        ))}
      </AnimatePresence>
      
      {/* Show count if more toasts are queued */}
      {toasts.length > 5 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-slate-800/90 backdrop-blur-xl border border-slate-600 rounded-lg p-3 text-center"
        >
          <p className="text-sm text-slate-300">
            +{toasts.length - 5} more notifications
          </p>
        </motion.div>
      )}
    </div>
  );
};