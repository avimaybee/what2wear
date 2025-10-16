'use client'

import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../../components/ui/sheet'
import { Button } from '@/components/ui/button'
import Chip from './Chip'

interface MultiSelectProps {
  label: string
  options: string[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
}

export default function MultiSelect({ label, options, selected, onChange, placeholder = 'Select options' }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggle = (option: string) => {
    const newSelected = selected.includes(option)
      ? selected.filter(s => s !== option)
      : [...selected, option]
    onChange(newSelected)
  }

  const handleRemove = (option: string) => {
    onChange(selected.filter(s => s !== option))
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-[var(--color-text)]">{label}</label>
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full justify-start">
            {selected.length > 0 ? `${selected.length} selected` : placeholder}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>{label}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {options.map(option => (
                <label key={option} className={`flex cursor-pointer items-center space-x-3 rounded-md border px-3 py-2 text-sm font-medium capitalize transition-all ${selected.includes(option) ? 'border-transparent bg-[var(--color-primary)] text-[var(--color-primary-foreground)]' : 'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text)] hover:brightness-110'}`}>
                  <input
                    type="checkbox"
                    checked={selected.includes(option)}
                    onChange={() => handleToggle(option)}
                    className="hidden"
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => setIsOpen(false)}>Done</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map(option => (
            <Chip key={option} onRemove={() => handleRemove(option)}>
              {option}
            </Chip>
          ))}
        </div>
      )}
    </div>
  )
}