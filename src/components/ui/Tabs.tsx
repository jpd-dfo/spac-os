'use client';

import {
  useState,
  createContext,
  useContext,
  useId,
  useCallback,
  useRef,
  useEffect,
} from 'react';

import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// ============================================================================
// TABS CONTEXT
// ============================================================================

interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
  baseId: string;
  orientation: 'horizontal' | 'vertical';
}

const TabsContext = createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tab components must be used within a Tabs component');
  }
  return context;
};

// ============================================================================
// TABS ROOT
// ============================================================================

interface TabsProps {
  children: React.ReactNode;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function Tabs({
  children,
  defaultValue,
  value,
  onValueChange,
  orientation = 'horizontal',
  className,
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? '');
  const baseId = useId();

  const activeTab = value ?? internalValue;

  const setActiveTab = useCallback(
    (newValue: string) => {
      if (onValueChange) {
        onValueChange(newValue);
      } else {
        setInternalValue(newValue);
      }
    },
    [onValueChange]
  );

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab, baseId, orientation }}>
      <div
        className={cn(
          orientation === 'vertical' && 'flex gap-4',
          className
        )}
        data-orientation={orientation}
      >
        {children}
      </div>
    </TabsContext.Provider>
  );
}

// ============================================================================
// TABS LIST
// ============================================================================

const tabsListVariants = cva('flex', {
  variants: {
    variant: {
      default: 'border-b border-slate-200',
      pills: 'gap-2 rounded-lg bg-slate-100 p-1',
      underline: 'gap-6',
    },
    orientation: {
      horizontal: 'flex-row',
      vertical: 'flex-col border-b-0 border-r border-slate-200',
    },
  },
  defaultVariants: {
    variant: 'default',
    orientation: 'horizontal',
  },
});

interface TabsListProps extends VariantProps<typeof tabsListVariants> {
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

export function TabsList({
  children,
  className,
  variant = 'default',
  'aria-label': ariaLabel,
}: TabsListProps) {
  const { orientation, baseId, activeTab, setActiveTab } = useTabsContext();
  const listRef = useRef<HTMLDivElement>(null);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      const tabs = listRef.current?.querySelectorAll('[role="tab"]:not([disabled])');
      if (!tabs) {return;}

      const tabArray = Array.from(tabs) as HTMLButtonElement[];
      const currentIndex = tabArray.findIndex(
        (tab) => tab.getAttribute('data-value') === activeTab
      );

      let nextIndex: number;

      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          nextIndex = currentIndex + 1 >= tabArray.length ? 0 : currentIndex + 1;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          nextIndex = currentIndex - 1 < 0 ? tabArray.length - 1 : currentIndex - 1;
          break;
        case 'Home':
          event.preventDefault();
          nextIndex = 0;
          break;
        case 'End':
          event.preventDefault();
          nextIndex = tabArray.length - 1;
          break;
        default:
          return;
      }

      const nextTab = tabArray[nextIndex];
      if (!nextTab) {return;}
      const nextValue = nextTab.getAttribute('data-value');
      if (nextValue) {
        setActiveTab(nextValue);
        nextTab.focus();
      }
    },
    [activeTab, setActiveTab]
  );

  return (
    <div
      ref={listRef}
      role="tablist"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-orientation={orientation}
      onKeyDown={handleKeyDown}
      className={cn(
        tabsListVariants({ variant, orientation }),
        className
      )}
    >
      <TabsListContext.Provider value={{ variant }}>
        {children}
      </TabsListContext.Provider>
    </div>
  );
}

// ============================================================================
// TABS LIST CONTEXT (FOR VARIANT)
// ============================================================================

interface TabsListContextValue {
  variant: 'default' | 'pills' | 'underline' | null;
}

const TabsListContext = createContext<TabsListContextValue>({
  variant: 'default',
});

const useTabsListContext = () => useContext(TabsListContext);

// ============================================================================
// TAB TRIGGER
// ============================================================================

const tabTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'px-4 py-2 -mb-px border-b-2 border-transparent text-slate-600 hover:text-slate-900 data-[state=active]:border-primary-600 data-[state=active]:text-primary-600',
        pills:
          'px-3 py-1.5 rounded-md text-slate-600 hover:text-slate-900 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm',
        underline:
          'py-2 text-slate-600 hover:text-slate-900 relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-transparent data-[state=active]:text-primary-600 data-[state=active]:after:bg-primary-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface TabTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof tabTriggerVariants> {
  value: string;
  children: React.ReactNode;
}

export function TabTrigger({
  value,
  children,
  className,
  disabled,
  ...props
}: TabTriggerProps) {
  const { activeTab, setActiveTab, baseId } = useTabsContext();
  const { variant } = useTabsListContext();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-controls={`${baseId}-panel-${value}`}
      aria-selected={isActive}
      data-state={isActive ? 'active' : 'inactive'}
      data-value={value}
      tabIndex={isActive ? 0 : -1}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={cn(tabTriggerVariants({ variant }), className)}
      {...props}
    >
      {children}
    </button>
  );
}

// ============================================================================
// TAB CONTENT
// ============================================================================

interface TabContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  forceMount?: boolean;
}

export function TabContent({
  value,
  children,
  className,
  forceMount = false,
}: TabContentProps) {
  const { activeTab, baseId } = useTabsContext();
  const isActive = activeTab === value;

  if (!forceMount && !isActive) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      hidden={!isActive}
      data-state={isActive ? 'active' : 'inactive'}
      className={cn(
        'mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        !isActive && 'hidden',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// SIMPLE TABS (CONVENIENCE COMPONENT)
// ============================================================================

interface SimpleTab {
  value: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

interface SimpleTabsProps {
  tabs: SimpleTab[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
  listClassName?: string;
  contentClassName?: string;
}

export function SimpleTabs({
  tabs,
  defaultValue,
  value,
  onValueChange,
  variant = 'default',
  className,
  listClassName,
  contentClassName,
}: SimpleTabsProps) {
  const defaultTab = defaultValue ?? tabs[0]?.value;

  return (
    <Tabs
      defaultValue={defaultTab}
      value={value}
      onValueChange={onValueChange}
      className={className}
    >
      <TabsList variant={variant} className={listClassName}>
        {tabs.map((tab) => (
          <TabTrigger key={tab.value} value={tab.value} disabled={tab.disabled}>
            {tab.label}
          </TabTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabContent key={tab.value} value={tab.value} className={contentClassName}>
          {tab.content}
        </TabContent>
      ))}
    </Tabs>
  );
}
