import React, { Component, ErrorInfo, ReactNode } from 'react';
import '../styles/mmh.css';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="mmh-error-container">
          <div className="mmh-error-card">
            <div className="mmh-error-icon">⚠️</div>
            <h2 className="mmh-error-title">Something went wrong</h2>
            <p className="mmh-error-message">
              The application encountered an unexpected error. 
              {this.state.error && <span style={{display:'block', marginTop:'10px', fontSize:'12px', opacity:0.7}}>{this.state.error.message}</span>}
            </p>
            <button 
              className="mmh-btn mmh-btn-primary" 
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
