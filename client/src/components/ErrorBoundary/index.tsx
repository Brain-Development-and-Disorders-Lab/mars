// React
import React, { Component, ErrorInfo, ReactNode } from "react";

// Existing and custom components
import Error from "@components/Error";

// Utilities
import consola from "consola";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to console
    consola.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render the Error component while preserving layout
      return <Error error={this.state.error} />;
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
