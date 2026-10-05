import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../../store/AppContext'
export default function Splash() {
  const { dispatch } = useApp()
  useEffect(() => { const t = setTimeout(() => dispatch({ type: 'stage', value: 'onboarding' }), 1800); return () => clearTimeout(t) }, [dispatch])
  return (
    <div className="grid min-h-screen place-items-center">
      <motion.h1 initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }} className="text-5xl font-extrabold tracking-tight text-gold">CampusX</motion.h1>
    </div>
  )
}
