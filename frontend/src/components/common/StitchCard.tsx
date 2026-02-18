import React from 'react';
import { twMerge } from 'tailwind-merge';
import '../../styles/stitch-components.css';

interface StitchCardProps extends React.HTMLAttributes<HTMLDivElement> {
    hoverEffect?: boolean;
}

export const StitchCard: React.FC<StitchCardProps> = ({
    children,
    className,
    hoverEffect = false,
    ...props
}) => {
    return (
        <div
            className={twMerge(
                'stitch-card',
                hoverEffect && 'stitch-card-hover',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};
