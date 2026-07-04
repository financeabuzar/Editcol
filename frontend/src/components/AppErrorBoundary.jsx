import { Component } from "react";
import ErrorPage from "@/pages/ErrorPage";

export default class AppErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled app error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPage
          code={500}
          title="This screen crashed."
          message="A frontend error stopped this page from rendering. Reload the page or return to a safe place."
        />
      );
    }

    return this.props.children;
  }
}
