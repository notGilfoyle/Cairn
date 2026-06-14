import { useEffect } from "react";
import { useStore, type View } from "./store/useStore";
import Today from "./routes/Today";
import Dashboard from "./routes/Dashboard";
import Manage from "./routes/Manage";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";
import { cx } from "./components/ui/cx";

const TABS: { id: View; label: string; icon: string }[] = [
  { id: "today", label: "Today", icon: "◎" },
  { id: "dashboard", label: "Dashboard", icon: "▤" },
  { id: "manage", label: "Manage", icon: "⚙" },
];

export default function App() {
  const ready = useStore((s) => s.ready);
  const view = useStore((s) => s.view);
  const setView = useStore((s) => s.setView);
  const hydrate = useStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-slate-400">
        <span className="animate-pulse">Loading Cairn…</span>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      {/* Main scrollable content */}
      <main className="flex-1 px-4 pb-28 pt-6">
        <ErrorBoundary>
          {view === "today" && <Today />}
          {view === "dashboard" && <Dashboard />}
          {view === "manage" && <Manage />}
        </ErrorBoundary>
      </main>

      {/* Bottom tab bar (mobile-first, comfortable on desktop) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="mx-auto flex max-w-2xl">
          {TABS.map((tab) => {
            const active = view === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setView(tab.id)}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex flex-1 flex-col items-center gap-0.5 py-3 text-xs font-medium transition-colors",
                  active
                    ? "text-accent-600 dark:text-accent-400"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200",
                )}
              >
                <span className="text-lg leading-none">{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
