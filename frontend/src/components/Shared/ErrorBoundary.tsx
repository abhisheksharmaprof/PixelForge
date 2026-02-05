import React, { Component, ErrorInfo, ReactNode } from 'react';
import { FaExclamationTriangle, FaRedo, FaCopy } from 'react-icons/fa';
import './ErrorBoundary.css';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({ error, errorInfo });
    }

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
        window.location.reload();
    };

    handleCopyError = () => {
        const errorText = `Error: ${this.state.error}\n\nStack: ${this.state.errorInfo?.componentStack}`;
        navigator.clipboard.writeText(errorText).then(() => {
            alert('Error details copied to clipboard');
        });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="error-boundary">
                    <div className="error-content">
                        <FaExclamationTriangle size={64} className="error-icon" />
                        <h1>Oops! Something went wrong</h1>
                        <p className="error-description">
                            We're sorry for the inconvenience. The application encountered an unexpected error.
                        </p>

                        {this.state.error && (
                            <div className="error-details">
                                <h3>Error Details:</h3>
                                <pre className="error-message">{this.state.error.toString()}</pre>
                                {this.state.errorInfo && (
                                    <details className="error-stack">
                                        <summary>Component Stack</summary>
                                        <pre>{this.state.errorInfo.componentStack}</pre>
                                    </details>
                                )}
                            </div>
                        )}

                        <div className="error-actions">
                            <button className="btn-primary" onClick={this.handleReset}>
                                <FaRedo /> Reload Application
                            </button>
                            <button className="btn-outline" onClick={this.handleCopyError}>
                                <FaCopy /> Copy Error Details
                            </button>
                        </div>

                        <p className="error-help">
                            If this problem persists, please contact support with the error details.
                        </p>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
