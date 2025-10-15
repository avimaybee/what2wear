'use client'

import React from 'react'
import ToastProvider from './ToastProvider'
import { MotionConfig } from 'framer-motion'

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig transition={{ type: 'spring', stiffness: 320, damping: 28 }}>
      {children}
      <ToastProvider />
    </MotionConfig>
  )
}
