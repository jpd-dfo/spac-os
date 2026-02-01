'use client';

import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

// ============================================================================
// DROPDOWN CONTAINER
// ============================================================================

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
  disabled?: boolean;
}

export function Dropdown({
  trigger,
  children,
  align = 'right',
  className,
  disabled = false,
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled) return;

      switch (event.key) {
        case 'Enter':
        case ' ':
          event.preventDefault();
          setIsOpen((prev) => !prev);
          break;
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          if (!isOpen) {
            setIsOpen(true);
          } else {
            // Focus first menu item
            const firstItem = menuRef.current?.querySelector(
              '[role="menuitem"]:not([disabled])'
            ) as HTMLElement;
            firstItem?.focus();
          }
          break;
        case 'ArrowUp':
          event.preventDefault();
          if (isOpen) {
            // Focus last menu item
            const items = menuRef.current?.querySelectorAll(
              '[role="menuitem"]:not([disabled])'
            );
            const lastItem = items?.[items.length - 1] as HTMLElement;
            lastItem?.focus();
          }
          break;
        case 'Tab':
          setIsOpen(false);
          break;
      }
    },
    [disabled, isOpen]
  );

  const handleTriggerClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={isOpen ? menuId : undefined}
        disabled={disabled}
        className={cn(
          'inline-flex items-center',
          disabled && 'cursor-not-allowed opacity-50'
        )}
      >
        {trigger}
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-orientation="vertical"
          className={cn(
            'absolute z-50 mt-2 min-w-[200px] rounded-lg border border-slate-200 bg-white py-1 shadow-dropdown',
            'animate-in fade-in-0 zoom-in-95',
            align === 'left' ? 'left-0' : 'right-0',
            className
          )}
        >
          <DropdownContext.Provider value={{ closeMenu: () => setIsOpen(false) }}>
            {children}
          </DropdownContext.Provider>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// DROPDOWN CONTEXT
// ============================================================================

import { createContext, useContext } from 'react';

interface DropdownContextValue {
  closeMenu: () => void;
}

const DropdownContext = createContext<DropdownContextValue>({
  closeMenu: () => {},
});

const useDropdownContext = () => useContext(DropdownContext);

// ============================================================================
// DROPDOWN ITEM
// ============================================================================

const dropdownItemVariants = cva(
  'flex w-full items-center gap-2 px-4 py-2 text-sm transition-colors focus:outline-none',
  {
    variants: {
      variant: {
        default: 'text-slate-700 hover:bg-slate-50 focus:bg-slate-50',
        danger: 'text-danger-600 hover:bg-danger-50 focus:bg-danger-50',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface DropdownItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof dropdownItemVariants> {
  children: React.ReactNode;
  icon?: React.ReactNode;
  closeOnClick?: boolean;
}

export function DropdownItem({
  children,
  onClick,
  icon,
  variant,
  disabled = false,
  closeOnClick = true,
  className,
  ...props
}: DropdownItemProps) {
  const { closeMenu } = useDropdownContext();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    onClick?.(event);
    if (closeOnClick) {
      closeMenu();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event as unknown as React.MouseEvent<HTMLButtonElement>);
    }
  };

  return (
    <button
      type="button"
      role="menuitem"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={cn(
        dropdownItemVariants({ variant }),
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </button>
  );
}

// ============================================================================
// DROPDOWN DIVIDER
// ============================================================================

export function DropdownDivider() {
  return <div role="separator" className="my-1 h-px bg-slate-200" />;
}

// ============================================================================
// DROPDOWN LABEL
// ============================================================================

interface DropdownLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function DropdownLabel({ children, className }: DropdownLabelProps) {
  return (
    <div
      role="presentation"
      className={cn(
        'px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// DROPDOWN GROUP
// ============================================================================

interface DropdownGroupProps {
  children: React.ReactNode;
  label?: string;
  className?: string;
}

export function DropdownGroup({ children, label, className }: DropdownGroupProps) {
  return (
    <div role="group" aria-label={label} className={className}>
      {label && <DropdownLabel>{label}</DropdownLabel>}
      {children}
    </div>
  );
}
