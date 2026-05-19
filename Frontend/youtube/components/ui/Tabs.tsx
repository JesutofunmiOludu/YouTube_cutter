// ============================================================
// VidMind AI — Tabs Component
// src/components/ui/Tabs.tsx
//
// Accessible tabs following the ARIA tablist pattern.
// Used in: VideoWorkspace (Cuts | Transcript | Related),
//          Settings sidebar navigation.
//
// Variants: underline (default) | pill
// ============================================================

import React, {
  createContext,
  useContext,
  useId,
  useState,
  useRef,
  useCallback,
} from 'react'
import { cn } from '@/utils/cn'

// ------------------------------------------------------------
// CONTEXT
// ------------------------------------------------------------

interface TabsContextValue {
  activeTab:    string
  setActiveTab: (id: string) => void
  variant:      TabsVariant
  baseId:       string
}

const TabsContext = createContext<TabsContextValue | null>(null)

const useTabsContext = () => {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs sub-components must be used inside <Tabs>')
  return ctx
}

// ------------------------------------------------------------
// TYPES
// ------------------------------------------------------------

export type TabsVariant = 'underline' | 'pill'

export interface TabsProps {
  /** The value of the initially active tab */
  defaultTab?:    string
  /** Controlled active tab */
  activeTab?:     string
  /** Called when the active tab changes */
  onTabChange?:   (tabId: string) => void
  variant?:       TabsVariant
  children:       React.ReactNode
  className?:     string
}

export interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Allow the tab list to scroll horizontally on overflow */
  scrollable?: boolean
}

export interface TabProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'id'> {
  /** Unique identifier — must match the value prop on TabPanel */
  value:       string
  /** Icon displayed before the label */
  icon?:       React.ReactNode
  /** Badge or count displayed after the label */
  suffix?:     React.ReactNode
  disabled?:   boolean
}

export interface TabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Must match the value prop on the corresponding Tab */
  value: string
}

// ------------------------------------------------------------
// ROOT
// ------------------------------------------------------------

const Tabs: React.FC<TabsProps> & {
  List:  React.FC<TabListProps>
  Tab:   React.FC<TabProps>
  Panel: React.FC<TabPanelProps>
} = ({
  defaultTab,
  activeTab:     controlledTab,
  onTabChange,
  variant       = 'underline',
  children,
  className,
}) => {
  const baseId                    = useId()
  const [internalTab, setInternal] = useState(defaultTab ?? '')

  const activeTab    = controlledTab ?? internalTab
  const setActiveTab = useCallback(
    (id: string) => {
      if (!controlledTab) setInternal(id)
      onTabChange?.(id)
    },
    [controlledTab, onTabChange]
  )

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, variant, baseId }}>
      <div className={cn('flex flex-col', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

// ------------------------------------------------------------
// TAB LIST
// ------------------------------------------------------------

const TabList: React.FC<TabListProps> = ({
  scrollable = false,
  className,
  children,
  ...rest
}) => {
  const { variant } = useTabsContext()
  const listRef     = useRef<HTMLDivElement>(null)

  // Arrow key navigation between tabs
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const tabs = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]:not([disabled])') ?? []
    )
    const current = tabs.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      tabs[(current + 1) % tabs.length]?.focus()
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      tabs[(current - 1 + tabs.length) % tabs.length]?.focus()
    }
    if (e.key === 'Home') { e.preventDefault(); tabs[0]?.focus() }
    if (e.key === 'End')  { e.preventDefault(); tabs[tabs.length - 1]?.focus() }
  }

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn(
        'flex items-center',
        // Underline variant
        variant === 'underline' && [
          'border-b border-[var(--color-border-tertiary)]',
          'gap-0',
        ],
        // Pill variant
        variant === 'pill' && [
          'gap-1 p-1',
          'bg-[var(--color-bg-secondary)]',
          'rounded-lg',
          'w-fit',
        ],
        scrollable && 'overflow-x-auto scroll-x',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

TabList.displayName = 'Tabs.List'

// ------------------------------------------------------------
// TAB (trigger)
// ------------------------------------------------------------

const Tab: React.FC<TabProps> = ({
  value,
  icon,
  suffix,
  disabled   = false,
  className,
  children,
  onClick,
  ...rest
}) => {
  const { activeTab, setActiveTab, variant, baseId } = useTabsContext()
  const isActive = activeTab === value

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) setActiveTab(value)
    onClick?.(e)
  }

  return (
    <button
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-selected={isActive}
      aria-controls={`${baseId}-panel-${value}`}
      aria-disabled={disabled}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1.5',
        'font-medium font-sans text-body-sm',
        'transition-all duration-fast',
        'outline-none focus-visible:ring-2 focus-visible:ring-primary-200 focus-visible:ring-offset-1',
        'whitespace-nowrap cursor-pointer select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed',

        // Underline variant
        variant === 'underline' && [
          'px-4 py-2.5',
          'border-b-2 -mb-px',
          isActive
            ? 'border-primary-600 text-primary-600'
            : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-secondary)]',
        ],

        // Pill variant
        variant === 'pill' && [
          'px-3 py-1.5',
          'rounded-md text-caption',
          isActive
            ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border border-[var(--color-border-tertiary)]'
            : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
        ],

        className,
      )}
      {...rest}
    >
      {icon && (
        <span className="w-4 h-4 shrink-0" aria-hidden="true">{icon}</span>
      )}
      {children}
      {suffix && (
        <span className="shrink-0">{suffix}</span>
      )}
    </button>
  )
}

Tab.displayName = 'Tabs.Tab'

// ------------------------------------------------------------
// TAB PANEL (content)
// ------------------------------------------------------------

const TabPanel: React.FC<TabPanelProps> = ({
  value,
  className,
  children,
  ...rest
}) => {
  const { activeTab, baseId } = useTabsContext()
  const isActive = activeTab === value

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      hidden={!isActive}
      tabIndex={0}
      className={cn(
        'outline-none focus-visible:ring-2 focus-visible:ring-primary-200',
        isActive && 'animate-fade-in',
        className,
      )}
      {...rest}
    >
      {isActive && children}
    </div>
  )
}

TabPanel.displayName = 'Tabs.Panel'

// Attach sub-components
Tabs.List  = TabList
Tabs.Tab   = Tab
Tabs.Panel = TabPanel
Tabs.displayName = 'Tabs'

export default Tabs
