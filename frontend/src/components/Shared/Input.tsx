import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    suffix?: string;
}

export const Input: React.FC<InputProps> = ({ label, suffix, className = '', ...props }) => {
    return (
        <div className={`input-wrapper ${className}`}>
            {label && <label>{label}</label>}
            <div className="input-container">
                <input className="input-field" {...props} />
                {suffix && <span className="input-suffix">{suffix}</span>}
            </div>
        </div>
    );
};
