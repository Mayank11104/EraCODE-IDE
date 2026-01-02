import { useEffect, useRef } from 'react'

interface ContextMenuItem {
  label?: string
  icon?: React.ReactNode
  onClick?: () => void
  danger?: boolean
  separator?: boolean
  show?: boolean
}

interface ContextMenuProps {
  position: { x: number; y: number }
  onClose: () => void
  items: ContextMenuItem[]
}

export default function ContextMenu({ position, onClose, items }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const visibleItems = items.filter((item) => item.show !== false)

  return (
    <div
      ref={menuRef}
      className="fixed bg-dark-base border border-dark-border rounded-md shadow-2xl py-1 min-w-[200px] z-[9999] backdrop-blur-sm"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {visibleItems.map((item, index) => {
        if (item.separator) {
          return <div key={index} className="h-[1px] bg-dark-border my-1 mx-2" />
        }

        return (
          <button
            key={index}
            onClick={() => {
              item.onClick?.()
              onClose()
            }}
            className={`
              w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-left transition-all
              ${item.danger
                ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300'
                : 'text-text-primary hover:bg-dark-hover hover:text-white'
              }
            `}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span className="font-medium">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
