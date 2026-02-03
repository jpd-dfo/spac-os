'use client';

import { useEffect, useRef, useCallback, useId , createContext, useContext } from 'react';

import { cva, type VariantProps } from 'class-variance-authority';
import { X } from 'lucide-react';

import { cn } from '@/lib/utils';

// ============================================================================
// MODAL VARIANTS
// ============================================================================

const modalVariants = cva(
  'relative w-full rounded-lg bg-white shadow-xl animate-in fade-in-0 zoom-in-95',
  {
    variants: {
      size: {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl',
        '4xl': 'max-w-4xl',
        full: 'max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

// ============================================================================
// MODAL COMPONENT
// ============================================================================

interface ModalProps extends VariantProps<typeof modalVariants> {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  overlayClassName?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
  overlayClassName,
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    },
    [onClose, closeOnEscape]
  );

  // Focus trap
  const handleFocusTrap = useCallback((e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !modalRef.current) {return;}

    const focusableElements = modalRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Store current active element
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Add event listeners
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleFocusTrap);

      // Lock body scroll
      document.body.style.overflow = 'hidden';

      // Focus the modal
      modalRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleFocusTrap);
      document.body.style.overflow = 'unset';

      // Restore focus
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, handleEscape, handleFocusTrap]);

  if (!isOpen) {return null;}

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4',
        'animate-in fade-in-0',
        overlayClassName
      )}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
        className={cn(modalVariants({ size }), className)}
      >
        <ModalContext.Provider
          value={{
            onClose,
            showCloseButton,
            titleId,
            descriptionId,
          }}
        >
          {children}
        </ModalContext.Provider>
      </div>
    </div>
  );
}

// ============================================================================
// MODAL CONTEXT
// ============================================================================


interface ModalContextValue {
  onClose: () => void;
  showCloseButton: boolean;
  titleId: string;
  descriptionId: string;
}

const ModalContext = createContext<ModalContextValue | null>(null);

const useModalContext = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('Modal components must be used within a Modal');
  }
  return context;
};

// ============================================================================
// MODAL HEADER
// ============================================================================

interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalHeader({ children, className }: ModalHeaderProps) {
  const { onClose, showCloseButton } = useModalContext();

  return (
    <div
      className={cn(
        'flex items-start justify-between border-b border-slate-200 px-6 py-4',
        className
      )}
    >
      <div className="flex-1">{children}</div>
      {showCloseButton && (
        <button
          type="button"
          onClick={onClose}
          className="ml-4 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}

// ============================================================================
// MODAL TITLE
// ============================================================================

interface ModalTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalTitle({ children, className }: ModalTitleProps) {
  const { titleId } = useModalContext();

  return (
    <h2
      id={titleId}
      className={cn('text-lg font-semibold text-slate-900', className)}
    >
      {children}
    </h2>
  );
}

// ============================================================================
// MODAL DESCRIPTION
// ============================================================================

interface ModalDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalDescription({ children, className }: ModalDescriptionProps) {
  const { descriptionId } = useModalContext();

  return (
    <p id={descriptionId} className={cn('mt-1 text-sm text-slate-500', className)}>
      {children}
    </p>
  );
}

// ============================================================================
// MODAL BODY
// ============================================================================

interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn('px-6 py-4', className)}>
      {children}
    </div>
  );
}

// ============================================================================
// MODAL FOOTER
// ============================================================================

interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4',
        className
      )}
    >
      {children}
    </div>
  );
}

// ============================================================================
// SIMPLE MODAL (BACKWARD COMPATIBLE)
// ============================================================================

interface SimpleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

export function SimpleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
}: SimpleModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      showCloseButton={showCloseButton}
    >
      {(title || showCloseButton) && (
        <ModalHeader>
          {title && <ModalTitle>{title}</ModalTitle>}
          {description && <ModalDescription>{description}</ModalDescription>}
        </ModalHeader>
      )}
      <ModalBody>{children}</ModalBody>
    </Modal>
  );
}
