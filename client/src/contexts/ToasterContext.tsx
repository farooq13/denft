import React, { createContext, useContext, useState, type ReactNode, useCallback } from 'react';


interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'loading';
  title?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  progress?: number;
  icon?: React.ReactNode;
  timestamp: number;
}

interface ToasterContextType {
  toasts: Toast[];
  showToast: (
    message: string, 
    type?: Toast['type'], 
    options?: {
      title?: string;
      duration?: number;
      persistent?: boolean;
      action?: Toast['action'];
      icon?: React.ReactNode;
    }
  ) => string;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  showLoadingToast: (message: string, title?: string) => string;
  hideLoadingToast: (id: string) => void;
}

const ToasterContext = createContext<ToasterContextType | undefined>(undefined);

interface ToasterProviderProps {
  children: ReactNode;
}

export const ToasterProvider: React.FC<ToasterProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Generate unique ID for toasts
  const generateId = () => `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Show toast with enhanced options
  const showToast = useCallback((
    message: string,
    type: Toast['type'] = 'info',
    options: {
      title?: string;
      duration?: number;
      persistent?: boolean;
      action?: Toast['action'];
      icon?: React.ReactNode;
    } = {}
  ): string => {
    const id = generateId();
    const defaultDuration = type === 'error' ? 6000 : type === 'success' ? 4000 : 3000;
    
    const toast: Toast = {
      id,
      message,
      type,
      title: options.title,
      duration: options.persistent ? undefined : (options.duration ?? defaultDuration),
      persistent: options.persistent || false,
      action: options.action,
      icon: options.icon,
      timestamp: Date.now(),
    };

    setToasts(prev => [toast, ...prev]);

    // Auto-remove non-persistent toasts
    if (!toast.persistent && toast.duration) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  }, []);

  // Update existing toast
  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts(prev => prev.map(toast => 
      toast.id === id ? { ...toast, ...updates } : toast
    ));
  }, []);

  // Remove specific toast
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Clear all toasts
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Show loading toast (persistent by default)
  const showLoadingToast = useCallback((message: string, title?: string): string => {
    return showToast(message, 'loading', {
      title,
      persistent: true,
    });
  }, [showToast]);

  // Hide loading toast
  const hideLoadingToast = useCallback((id: string) => {
    removeToast(id);
  }, [removeToast]);

  // Auto-cleanup old toasts (keep max 10)
  React.useEffect(() => {
    if (toasts.length > 10) {
      setToasts(prev => prev.slice(0, 10));
    }
  }, [toasts.length]);

  const value: ToasterContextType = {
    toasts,
    showToast,
    updateToast,
    removeToast,
    clearAllToasts,
    showLoadingToast,
    hideLoadingToast,
  };

  return (
    <ToasterContext.Provider value={value}>
      {children}
    </ToasterContext.Provider>
  );
};

export const useToaster = (): ToasterContextType => {
  const context = useContext(ToasterContext);
  if (!context) {
    throw new Error('useToaster must be used within a ToasterProvider');
  }
  return context;
};