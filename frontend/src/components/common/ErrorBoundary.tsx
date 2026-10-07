import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  public handleReload = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.hash = '';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[70vh] flex items-center justify-center p-6 select-none">
          <div className="max-w-lg w-full bg-trade-surface border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-display font-bold text-white">
                Display Recovery System
              </h2>
              <p className="text-xs text-trade-muted leading-relaxed">
                The terminal encountered a display interruption. Your data streams and backend connections remain secure.
              </p>
              {this.state.error && (
                <div className="mt-3 p-3 rounded-xl bg-trade-surface2 border border-trade-border text-left font-mono text-[11px] text-red-300 overflow-x-auto">
                  {this.state.error.toString()}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-trade-primary hover:bg-trade-primaryHover text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-glow-primary transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload Terminal</span>
              </button>

              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-trade-surface2 hover:bg-trade-surface3 text-trade-text font-semibold text-xs border border-trade-border flex items-center justify-center gap-2 transition-all"
              >
                <Home className="w-4 h-4" />
                <span>Return to Gateway</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
