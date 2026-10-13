import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light p-4">
          <div className="card shadow-sm border-0 p-4" style={{ maxWidth: '520px', borderRadius: '12px' }}>
            <div className="text-center mb-3">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
                style={{ width: '48px', height: '48px', backgroundColor: '#FEE2E2', color: '#B91C1C' }}
              >
                ⚠️
              </div>
              <h2 className="fs-5 fw-bold text-dark m-0">Something went wrong</h2>
              <p className="text-muted small mt-1">An unexpected error occurred while rendering this page.</p>
            </div>

            {this.state.error?.message && (
              <div className="alert alert-danger py-2 px-3 small font-monospace" style={{ fontSize: '12px' }}>
                {this.state.error.message}
              </div>
            )}

            <div className="d-flex gap-2 justify-content-center mt-3">
              <button
                type="button"
                className="btn btn-primary btn-sm px-3"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/teacher/dashboard';
                }}
              >
                Back to Dashboard
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm px-3"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
