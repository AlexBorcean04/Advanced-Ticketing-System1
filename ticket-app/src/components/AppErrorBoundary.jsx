import { Component } from 'react';

class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    const { hasError, error } = this.state;
    const { children } = this.props;
    if (!hasError) return children;

    return (
      <div className="min-h-screen bg-hero-gradient flex items-center justify-center px-6">
        <div className="glass-panel rounded-3xl p-8 max-w-lg text-center space-y-3">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-white/70">
            The app hit an unexpected error. Please refresh the page or check the console
            for details.
          </p>
          {error?.message && (
            <p className="text-xs text-red-200 break-words">{error.message}</p>
          )}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-full bg-accent-500 hover:bg-accent-600 px-4 py-2 text-sm font-semibold"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
