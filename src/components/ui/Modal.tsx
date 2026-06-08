import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Prevent closing by clicking backdrop */
  persistent?: boolean;
}

const widths: Record<'sm' | 'md' | 'lg', number> = { sm: 400, md: 560, lg: 720 };

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  persistent = false,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !persistent) onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, onClose, persistent]);

  if (!open) return null;

  return createPortal(
    <>
      <style>{`
        /* Backdrop */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: rgba(28,16,8,0.55);
          backdrop-filter: blur(3px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: fadeIn 0.2s ease;
        }

        /* Card */
        .modal-card {
          background: var(--bg-card);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg);
          width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          animation: fadeUp 0.25s ease;
          overflow: hidden;
        }

        /* Header */
        .modal-header {
          padding: 24px 28px 20px;
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-shrink: 0;
        }
        .modal-title {
          font-family: var(--font-display);
          font-size: 1.4rem;
          font-weight: 600;
          color: var(--espresso);
        }
        .modal-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          background: var(--cream-mid);
          border-radius: var(--radius-md);
          cursor: pointer;
          color: var(--text-secondary);
          font-size: 18px;
          line-height: 1;
          transition: all var(--transition);
        }
        .modal-close:hover {
          background: var(--cream-dark);
          color: var(--espresso);
        }

        /* Body */
        .modal-body {
          padding: 24px 28px;
          overflow-y: auto;
          flex: 1;
        }

        /* Footer */
        .modal-footer {
          padding: 16px 28px 24px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          flex-shrink: 0;
        }
      `}</style>

      <div
        className="modal-backdrop"
        onClick={(e) => {
          if (!persistent && e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="modal-card"
          ref={dialogRef}
          style={{ maxWidth: widths[size] }}
        >
          {title && (
            <div className="modal-header">
              <span className="modal-title">{title}</span>
              <button
                className="modal-close"
                onClick={onClose}
                aria-label="Close"
              >
                ×
              </button>
            </div>
          )}
          <div className="modal-body">{children}</div>
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </>,
    document.body,
  );
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
        {message}
      </p>
    </Modal>
  );
}
