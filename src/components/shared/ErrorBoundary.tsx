import React from "react";

type Props = {
  children: React.ReactNode;
  fallbackTitle?: string;
};

type State = {
  hasError: boolean;
};

class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("Portal error boundary caught:", error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container mx-auto px-4 py-20">
          <div className="rounded border border-destructive/40 bg-destructive/5 p-6">
            <h2 className="text-xl font-semibold">
              {this.props.fallbackTitle || "Something went wrong"}
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Please refresh and try again.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
