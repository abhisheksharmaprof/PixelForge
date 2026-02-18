import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { createPortal } from 'react-dom';

interface StitchModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    footer?: React.ReactNode;
}

export const StitchModal: React.FC<StitchModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    size = 'md',
    footer
}) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleEscape);
        }

        return () => {
            document.body.style.overflow = 'unset';
            window.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeClasses = {
        sm: 'max-w-md',
        md: 'max-w-xl',
        lg: 'max-w-3xl',
        xl: 'max-w-5xl'
    };

    const modalContent = (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Panel */}
            <div
                ref={modalRef}
                className={clsx(
                    "relative w-full bg-[var(--stitch-surface-primary)] rounded-lg shadow-xl border border-[var(--stitch-border)] flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200",
                    sizeClasses[size]
                )}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--stitch-border)]">
                    <h3 className="text-lg font-semibold text-[var(--stitch-text-primary)]">{title}</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md text-[var(--stitch-text-tertiary)] hover:bg-[var(--stitch-surface-hover)] hover:text-[var(--stitch-text-primary)] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-4">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="p-4 border-t border-[var(--stitch-border)] bg-[var(--stitch-surface-secondary)] rounded-b-lg">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
