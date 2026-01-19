
import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '20px', color: 'red', background: 'white', height: '100vh', overflow: 'auto' }}>
                    <h1>💥 Something went wrong.</h1>
                    <h2 style={{ fontSize: '1.2rem', color: '#333' }}>Error: {this.state.error && this.state.error.toString()}</h2>
                    <details style={{ whiteSpace: 'pre-wrap', marginTop: '10px', color: '#666' }}>
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '20px', padding: '10px 20px', fontSize: '1.2rem' }}
                    >
                        Reload Game
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
