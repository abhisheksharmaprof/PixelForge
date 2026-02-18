import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import '../../styles/stitch-components.css';

interface StitchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const StitchInput: React.FC<StitchInputProps> = ({
    label,
    error,
    className,
    icon,
    ...props
}) => {
    return (
        <div className="stitch-input-wrapper">
            {label && <label className="stitch-label">{label}</label>}
            <div className="relative">
                <input
                    className={twMerge(
                        'stitch-input',
                        error && 'stitch-input-error',
                        icon && 'pl-10',
                        className
                    )}
                    {...props}
                />
                {icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {icon}
                    </div>
                )}
            </div>
            {error && <span className="stitch-error-msg">{error}</span>}
        </div>
    );
};
