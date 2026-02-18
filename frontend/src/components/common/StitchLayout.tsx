import React from 'react';
import { twMerge } from 'tailwind-merge';

export const StitchContainer: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => {
    return (
        <div className={twMerge('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8', className)} {...props}>
            {children}
        </div>
    );
};

export const StitchGrid: React.FC<React.HTMLAttributes<HTMLDivElement> & { cols?: 1 | 2 | 3 | 4 }> = ({ children, className, cols = 1, ...props }) => {
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    };

    return (
        <div className={twMerge('grid gap-6', gridCols[cols], className)} {...props}>
            {children}
        </div>
    );
};

export const StitchFlex: React.FC<React.HTMLAttributes<HTMLDivElement> & { justify?: 'between' | 'center' | 'start' | 'end', align?: 'center' | 'start' | 'end' }> = ({ children, className, justify = 'start', align = 'center', ...props }) => {
    const justification = {
        between: 'justify-between',
        center: 'justify-center',
        start: 'justify-start',
        end: 'justify-end',
    };
    const alignment = {
        center: 'items-center',
        start: 'items-start',
        end: 'items-end',
    };

    return (
        <div className={twMerge('flex', justification[justify], alignment[align], className)} {...props}>
            {children}
        </div>
    );
};
