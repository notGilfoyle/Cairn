import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}
interface State {
  error: Error | null;
}

/** Keeps a render error in one view from blanking the entire app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error("Cairn render error:", error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-md p-6 text-center">
          <p className="text-lg font-semibold">Something went wrong.</p>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your data is safe on this device. Try reloading.
          </p>
          <button
            onClick={() => location.reload()}
            className="mt-4 rounded-xl bg-accent-600 px-4 py-2 font-medium text-white"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
