import { Card } from "../components/ui/Card";
import { StatusRing } from "../components/today/StatusRing";
import { JournalCard } from "../components/today/JournalCard";
import { Intentions } from "../components/today/Intentions";
import { HabitCheckList } from "../components/today/HabitCheckList";
import { TodoList } from "../components/today/TodoList";
import { TrackSection } from "../components/today/TrackSection";
import { prettyDate } from "../lib/dates";
import { useStore } from "../store/useStore";

export default function Today() {
  const date = useStore((s) => s.date);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Today</h1>
        <p className="text-slate-500 dark:text-slate-400">{prettyDate(date)}</p>
      </header>

      <Card>
        <StatusRing />
      </Card>

      {/* key by date so the journal's local text state resets on a new day */}
      <JournalCard key={`am-${date}`} slot="am" />
      <Intentions key={`int-${date}`} />
      <TodoList />
      <HabitCheckList />
      <TrackSection />
      <JournalCard key={`pm-${date}`} slot="pm" />
    </div>
  );
}
