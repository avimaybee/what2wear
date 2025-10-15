'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(!!mql.matches)
    update()
    mql.addEventListener?.('change', update)
    return () => mql.removeEventListener?.('change', update)
  }, [])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
        transition={reducedMotion ? { duration: 0.18 } : { type: 'spring', stiffness: 320, damping: 28 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
