'use client'

import { motion, AnimatePresence } from 'framer-motion'

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isConfirming?: boolean;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
}

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isConfirming = false,
}: ConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className="fixed inset-0 bg-background bg-opacity-75 z-50 flex justify-center items-center backdrop-blur-sm"
        >
          <motion.div 
            variants={modalVariants}
            className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-md m-4"
          >
            <h2 className="text-xl font-bold text-text mb-4">{title}</h2>
            <p className="text-text-light mb-6">{message}</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={onClose}
                disabled={isConfirming}
                className="px-4 py-2 rounded-md text-text bg-transparent hover:bg-background disabled:opacity-50 transition-colors"
              >
                {cancelText}
              </button>
              <motion.button
                onClick={onConfirm}
                disabled={isConfirming}
                whileHover={{ scale: isConfirming ? 1 : 1.05 }}
                whileTap={{ scale: isConfirming ? 1 : 0.95 }}
                className="px-4 py-2 rounded-md text-background bg-error hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConfirming ? 'Confirming...' : confirmText}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}