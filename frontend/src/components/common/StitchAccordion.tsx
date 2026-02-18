import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import clsx from 'clsx';

interface StitchAccordionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    icon?: React.ReactNode;
    className?: string;
}

export const StitchAccordion: React.FC<StitchAccordionProps> = ({
    title,
    children,
    defaultOpen = false,
    icon,
    className
}) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={clsx("border-b border-[var(--stitch-border)] last:border-b-0", className)}>
            <button
                className="w-full flex items-center justify-between p-4 bg-[var(--stitch-surface)] hover:bg-[var(--stitch-surface-hover)] transition-colors duration-200"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 text-sm font-semibold text-[var(--stitch-text-primary)]">
                    {icon && <span className="text-[var(--stitch-primary)]">{icon}</span>}
                    <span>{title}</span>
                </div>
                <div className="text-[var(--stitch-text-secondary)]">
                    {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </div>
            </button>

            {isOpen && (
                <div className="p-4 bg-[var(--stitch-surface)] space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {children}
                </div>
            )}
        </div>
    );
};
