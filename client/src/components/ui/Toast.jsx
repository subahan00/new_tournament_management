import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

export const triggerToast = (message, type = 'success') => {
  window.dispatchEvent(new CustomEvent('add-toast', { detail: { message, type } }));
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handleAddToast = (e) => {
      const { message, type } = e.detail;
      const id = Date.now() + Math.random().toString(36).substring(2, 9);
      
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000); // 3 seconds visible
    };

    window.addEventListener('add-toast', handleAddToast);
    return () => window.removeEventListener('add-toast', handleAddToast);
  }, []);

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-zinc-900/90 backdrop-blur-xl border border-white/10 shadow-2xl text-sm font-medium text-white min-w-max"
          >
            {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
            {toast.type === 'error' && <XCircle size={16} className="text-rose-400" />}
            {toast.type === 'info' && <Info size={16} className="text-indigo-400" />}
            {toast.type === 'warning' && <AlertCircle size={16} className="text-amber-400" />}
            {toast.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ToastContainer;
