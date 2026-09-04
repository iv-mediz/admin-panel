import type { MouseEvent, ReactNode } from 'react'

interface ModalProps {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}

export default function Modal({ title, children, onClose, wide }: ModalProps) {
  function stop(e: MouseEvent) {
    e.stopPropagation()
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${wide ? 'modal-lg' : ''}`} onClick={stop}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
