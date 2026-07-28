import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg text-text flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-surface border border-border rounded-2xl p-6 shadow-float text-center space-y-4">
            <div className="h-14 w-14 rounded-full bg-danger/10 text-danger flex items-center justify-center mx-auto">
              <AlertTriangle className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-display font-bold text-xl text-text">Ha ocurrido un imprevisto</h2>
              <p className="text-sm text-muted mt-1">
                {this.state.error?.message || 'Error inesperado en la aplicación'}
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Button onClick={this.handleReset}>
                <RefreshCw className="h-4 w-4" /> Recargar aplicación
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
