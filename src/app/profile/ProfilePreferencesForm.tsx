'use client'

import { useState, useTransition } from 'react'
import { updateUserProfilePreferences } from './actions'
import { type Profile } from '@/lib/types'
import { Button } from '@/components/ui/button'
import Input from '../components/Input'
import MultiSelect from '../components/MultiSelect'
import { useToast } from '../components/ToastProvider'
import { Card, CardContent } from '../components/Card'

const styles = ['casual', 'formal', 'streetwear', 'sporty', 'business']

export default function ProfilePreferencesForm({ profile }: { profile: Profile | null }) {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { showToast } = useToast()

  const [selectedStyles, setSelectedStyles] = useState<string[]>(profile?.preferences?.styles || [])
  const [preferredColors, setPreferredColors] = useState<string>(profile?.preferences?.colors?.join(', ') || '')

  const action = async () => {
    startTransition(async () => {
      const result = await updateUserProfilePreferences({
        styles: selectedStyles,
        colors: preferredColors.split(',').map(c => c.trim()).filter(Boolean),
      })
      if (result?.error) {
        setError(result.error)
        setSuccess(false)
        showToast({ variant: 'error', title: 'Save failed', description: result.error })
      } else {
        setError(null)
        setSuccess(true)
        showToast({ variant: 'success', title: 'Preferences updated', description: 'Your style preferences were saved.' })
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="space-y-6">
          <MultiSelect
            label="Preferred Styles"
            options={styles}
            selected={selectedStyles}
            onChange={setSelectedStyles}
            placeholder="Select your preferred styles"
          />

          <div className="space-y-2">
            <Input 
              id="colors" 
              name="colors" 
              label="Preferred Colors" 
              value={preferredColors} 
              onChange={(e) => setPreferredColors(e.target.value)} 
              placeholder="e.g., black, white, navy, beige" 
            />
            <p className="text-xs text-muted-foreground">Enter comma-separated colors for personalized recommendations</p>
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={isPending} className="w-full h-12">
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                'Save Preferences'
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
