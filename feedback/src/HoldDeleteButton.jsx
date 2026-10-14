import { useEffect, useRef, useState } from 'react'

export default function HoldDeleteButton({ count, disabled, onConfirm, restore = false }) {
  const [armed, setArmed] = useState(false)
  const [progress, setProgress] = useState(0)
  const timer = useRef(null)
  const completed = useRef(false)

  const stop = () => {
    clearInterval(timer.current)
    timer.current = null
    setProgress(0)
  }
  const cancel = () => { stop(); setArmed(false) }

  useEffect(() => {
    window.addEventListener('blur', cancel)
    document.addEventListener('visibilitychange', cancel)
    return () => {
      clearInterval(timer.current)
      window.removeEventListener('blur', cancel)
      document.removeEventListener('visibilitychange', cancel)
    }
  }, [])

  const start = () => {
    if (!armed || disabled || timer.current !== null || completed.current) return
    const began = performance.now()
    timer.current = setInterval(() => {
      const elapsed = performance.now() - began
      setProgress(Math.min(elapsed / 2000, 1))
      if (elapsed >= 2000) {
        stop()
        completed.current = true
        setArmed(false)
        onConfirm()
      }
    }, 20)
  }

  return (
    <button type="button" className={`delete-button hold-delete-button${restore ? ' hold-restore-button' : ''}`} disabled={disabled}
      title={restore ? 'Hold for 2 seconds to restore working rows. Locked backup data is preserved.' : 'Hold for 2 seconds to delete working rows. Locked backup data is preserved.'}
      style={{ '--hold-progress': `${progress * 100}%` }}
      onClick={event => {
        event.stopPropagation()
        if (!completed.current) setArmed(true)
      }}
      onPointerDown={event => { if (event.button === 0) start() }}
      onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
      onBlur={cancel} onContextMenu={event => event.preventDefault()}
      onKeyDown={event => {
        if (event.key === 'Escape') cancel()
        if (armed && (event.key === ' ' || event.key === 'Enter')) {
          event.preventDefault()
          if (!event.repeat) start()
        }
      }}
      onKeyUp={event => {
        if (armed && (event.key === ' ' || event.key === 'Enter')) {
          event.preventDefault()
          stop()
        }
      }}>
      <span>{disabled ? (restore ? 'Restoring…' : 'Deleting…') : armed ? (restore ? 'Hold to confirm restore (2s)' : 'Hold to confirm deletion (2s)') : `${restore ? 'Restore to dataset' : 'Delete selected'} (${count})`}</span>
    </button>
  )
}
