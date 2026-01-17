import React from 'react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ error, errorInfo });

        // Auto-refresh logic (prevent infinite loop)
        const lastCrash = sessionStorage.getItem('last_crash_timestamp');
        const now = Date.now();

        // If last crash was more than 10 seconds ago, safe to auto-reload
        if (!lastCrash || (now - parseInt(lastCrash)) > 10000) {
            sessionStorage.setItem('last_crash_timestamp', now.toString());
            console.log("Auto-refreshing due to error...");
            window.location.reload();
        }
    }

    render() {
        if (this.state.hasError) {
            // User requested no error screen, just silent recovery.
            // The componentDidCatch will handle the reload.
            return <div style={{ width: '100vw', height: '100vh', background: '#87CEEB' }}></div>;
        }

        return this.props.children;
    }
}
