'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../../components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <DialogTitle>{title}</DialogTitle>
          </div>
          <DialogDescription className="text-left">{message}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3 pt-4">
          <Button onClick={onClose} variant="outline" disabled={isConfirming}>
            {cancelText}
          </Button>
          <Button onClick={onConfirm} variant="destructive" disabled={isConfirming}>
            {isConfirming ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Confirming...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
