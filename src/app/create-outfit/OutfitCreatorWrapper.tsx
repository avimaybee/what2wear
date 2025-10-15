'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import OutfitCreator from './OutfitCreator'
import Button from '../components/Button'
import { saveManualOutfit } from './actions'
import { useToast } from '../components/ToastProvider'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog'
import Input from '../components/Input'
import type { ClothingItem } from '@/lib/types'

interface OutfitCreatorWrapperProps {
  items: ClothingItem[]
}

export default function OutfitCreatorWrapper({ items }: OutfitCreatorWrapperProps) {
  const [creationItems, setCreationItems] = useState<ClothingItem[]>([])
  const [_isPending, startTransition] = useTransition()
  const { showToast } = useToast()
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false)
  const [outfitName, setOutfitName] = useState('')

  const handleSave = async (name: string) => {
    startTransition(async () => {
      const itemIds = creationItems.map(item => item.id.toString());
      const result = await saveManualOutfit(name, itemIds);
      if (result.error) {
        showToast({ variant: 'error', title: 'Save failed', description: result.error })
      } else {
        showToast({ variant: 'success', title: 'Outfit saved', description: 'Your outfit was saved successfully.' })
        setCreationItems([]);
        setOutfitName('')
        setIsSaveDialogOpen(false)
      }
    });
  };

  const handleStickySave = () => {
    if (!outfitName.trim()) {
      setIsSaveDialogOpen(true)
    } else {
      handleSave(outfitName)
    }
  }

  return (
    <>
      <OutfitCreator items={items} creationItems={creationItems} onItemsChange={setCreationItems} onSave={handleSave} />
      <AnimatePresence>
        {creationItems.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8"
          >
            <div className="pointer-events-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/90 p-3 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-surface)]/75">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-[var(--color-text-muted)]">
                  {creationItems.length} item{creationItems.length !== 1 ? 's' : ''} selected
                </p>
                <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={handleStickySave}>
                      Save outfit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Save your outfit</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Input
                        label="Outfit name"
                        value={outfitName}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOutfitName(e.target.value)}
                        placeholder="Enter outfit name"
                      />
                      <div className="flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setIsSaveDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={() => handleSave(outfitName)} disabled={!outfitName.trim()}>
                          Save
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}