import React, { useState } from 'react';
import './Accordion.css';

interface AccordionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    icon?: React.ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false, icon }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className={`accordion ${isOpen ? 'open' : ''}`}>
            <button className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {icon && <span className="accordion-title-icon">{icon}</span>}
                    <span className="accordion-title">{title}</span>
                </div>
                <span className="accordion-icon">{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && <div className="accordion-content">{children}</div>}
        </div>
    );
};
