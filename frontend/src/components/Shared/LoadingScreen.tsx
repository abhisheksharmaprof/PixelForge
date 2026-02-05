import React from 'react';
import { FaSpinner } from 'react-icons/fa';
import './LoadingScreen.css';

interface LoadingScreenProps {
    message?: string;
    progress?: number;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
    message = 'Loading...',
    progress,
}) => {
    return (
        <div className="loading-screen">
            <div className="loading-content">
                <div className="loading-logo">
                    <FaSpinner className="spinner" size={48} />
                </div>
                <h2 className="loading-message">{message}</h2>
                {progress !== undefined && (
                    <div className="loading-progress">
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                        <p className="progress-text">{Math.round(progress)}%</p>
                    </div>
                )}
            </div>
        </div>
    );
};
