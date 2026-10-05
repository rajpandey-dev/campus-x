import { motion, AnimatePresence } from 'framer-motion'
import { useApp } from '../../store/AppContext'
const ACTIONS = ['Create Hangout', 'Create Event', 'Create Study Group', 'Post Item Listing']
export default function CreateSheet() {
  const { state, dispatch, toast } = useApp()
  const close = () => dispatch({ type: 'createOpen', value: false })
  return (
    <AnimatePresence>
      {state.createOpen && (
        <motion.div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}>
          <motion.div role="dialog" aria-label="Create" className="w-full max-w-md space-y-2 rounded-t-3xl border-t border-gold/20 bg-surface p-5"
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 26, stiffness: 300 }} onClick={e => e.stopPropagation()}>
            {ACTIONS.map(a => (
              <button key={a} className="tap card w-full text-left font-semibold" onClick={() => { close(); toast(`${a} coming soon`) }}>{a}</button>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
