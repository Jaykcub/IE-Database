"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Program = {
  id: string;
  code: string;
  name: string;
  ships: { id: string; displayName: string; hullNumber: string }[];
};

type CanonicalTask = {
  id: string;
  code: string;
  title: string;
  scopeUnit: string | null;
};

type Instance = {
  id: string;
  phase: string;
  plannedHours: number | null;
  actualHours: number;
  scopeQuantity: number | null;
  canonicalTask: CanonicalTask;
  ship: { displayName: string; program: { id: string; code: string } };
};

type Flag = {
  id: string;
  type: string;
  severity: string;
  message: string;
  resolved: boolean;
  pctChange: number | null;
  baselineHours: number | null;
  comparedHours: number | null;
  taskInstance: Instance;
};

const TASKS_NAV = "tasks" as const;

export default function Home() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [tasks, setTasks] = useState<CanonicalTask[]>([]);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzeBusy, setAnalyzeBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Program id, or `tasks` for the task library view. Empty until programs load. */
  const [activeNav, setActiveNav] = useState<string>("");
  const [taskSearch, setTaskSearch] = useState("");
  const [taskProgramFilter, setTaskProgramFilter] = useState<string>("all");
  const [flagSeverityFilter, setFlagSeverityFilter] = useState<string>("all");
  const [flagTypeFilter, setFlagTypeFilter] = useState<string>("all");
  const [flagSearch, setFlagSearch] = useState("");
  const [flagSort, setFlagSort] = useState<string>("variance_desc");

  const [newProgram, setNewProgram] = useState({ code: "", name: "" });
  const [newShip, setNewShip] = useState({
    programId: "",
    hullNumber: "",
    displayName: "",
  });
  const [newTask, setNewTask] = useState({
    code: "",
    title: "",
    scopeUnit: "",
  });
  const [newInstance, setNewInstance] = useState({
    shipId: "",
    canonicalTaskId: "",
    phase: "construction",
    plannedHours: "",
    actualHours: "",
    scopeQuantity: "",
  });

  const refresh = useCallback(async () => {
    setError(null);
    const [p, t, i, f] = await Promise.all([
      fetch("/api/programs").then((r) => r.json()),
      fetch("/api/tasks").then((r) => r.json()),
      fetch("/api/instances").then((r) => r.json()),
      fetch("/api/flags").then((r) => r.json()),
    ]);
    setPrograms(p);
    setTasks(t);
    setInstances(i);
    setFlags(f);
  }, []);

  useEffect(() => {
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  useEffect(() => {
    if (!programs.length) return;
    setNewShip((prev) =>
      prev.programId ? prev : { ...prev, programId: programs[0].id },
    );
    const firstShip = programs.flatMap((p) => p.ships)[0];
    setNewInstance((prev) => ({
      ...prev,
      shipId: prev.shipId || firstShip?.id || "",
      canonicalTaskId: prev.canonicalTaskId || tasks[0]?.id || "",
    }));
  }, [programs, tasks]);

  useEffect(() => {
    if (!programs.length || activeNav) return;
    setActiveNav(programs[0].id);
  }, [programs, activeNav]);

  const activeProgram = useMemo(
    () => programs.find((p) => p.id === activeNav) ?? null,
    [programs, activeNav],
  );

  const allShips = programs.flatMap((p) =>
    p.ships.map((s) => ({ ...s, programId: p.id, programCode: p.code })),
  );

  const shipsForActiveProgram = useMemo(() => {
    if (!activeProgram) return allShips;
    return allShips.filter((s) => s.programId === activeProgram.id);
  }, [activeProgram, allShips]);

  const flagsForProgram = useMemo(() => {
    if (!activeProgram) return flags;
    return flags.filter(
      (f) => f.taskInstance.ship.program.id === activeProgram.id,
    );
  }, [flags, activeProgram]);

  const visibleFlagsForProgram = useMemo(() => {
    const search = flagSearch.trim().toLowerCase();
    let rows = flagsForProgram.filter((f) => {
      if (flagSeverityFilter !== "all" && f.severity !== flagSeverityFilter) {
        return false;
      }
      if (flagTypeFilter !== "all" && f.type !== flagTypeFilter) {
        return false;
      }
      if (!search) return true;
      const blob =
        `${f.message} ${f.taskInstance.canonicalTask.title} ${f.taskInstance.canonicalTask.code} ${f.taskInstance.ship.displayName}`.toLowerCase();
      return blob.includes(search);
    });

    const severityRank = (severity: string) =>
      severity === "HIGH" ? 3 : severity === "MEDIUM" ? 2 : 1;

    rows = [...rows].sort((a, b) => {
      switch (flagSort) {
        case "title_asc":
          return a.taskInstance.canonicalTask.title.localeCompare(
            b.taskInstance.canonicalTask.title,
          );
        case "title_desc":
          return b.taskInstance.canonicalTask.title.localeCompare(
            a.taskInstance.canonicalTask.title,
          );
        case "hours_desc":
          return (b.comparedHours ?? 0) - (a.comparedHours ?? 0);
        case "hours_asc":
          return (a.comparedHours ?? 0) - (b.comparedHours ?? 0);
        case "severity_desc":
          return severityRank(b.severity) - severityRank(a.severity);
        case "severity_asc":
          return severityRank(a.severity) - severityRank(b.severity);
        case "variance_asc":
          return (a.pctChange ?? 0) - (b.pctChange ?? 0);
        case "variance_desc":
        default:
          return (b.pctChange ?? 0) - (a.pctChange ?? 0);
      }
    });

    return rows;
  }, [
    flagsForProgram,
    flagSearch,
    flagSeverityFilter,
    flagSort,
    flagTypeFilter,
  ]);

  const instancesForProgram = useMemo(() => {
    if (!activeProgram) return instances;
    return instances.filter(
      (i) => i.ship.program.id === activeProgram.id,
    );
  }, [instances, activeProgram]);

  const taskSearchNorm = taskSearch.trim().toLowerCase();

  const tasksMatchingText = useMemo(() => {
    if (!taskSearchNorm) return tasks;
    return tasks.filter((t) => {
      const blob = `${t.code} ${t.title} ${t.scopeUnit ?? ""}`.toLowerCase();
      return blob.includes(taskSearchNorm);
    });
  }, [tasks, taskSearchNorm]);

  const displayTasksForLibrary = useMemo(() => {
    let list = tasksMatchingText;
    if (taskProgramFilter !== "all") {
      const taskIds = new Set(
        instances
          .filter((i) => i.ship.program.id === taskProgramFilter)
          .map((i) => i.canonicalTask.id),
      );
      list = list.filter((t) => taskIds.has(t.id));
    }
    return list;
  }, [tasksMatchingText, taskProgramFilter, instances]);

  const instancesForTaskView = useMemo(() => {
    let rows = instances;
    if (taskProgramFilter !== "all") {
      rows = rows.filter((i) => i.ship.program.id === taskProgramFilter);
    }
    if (taskSearchNorm) {
      const taskIds = new Set(tasksMatchingText.map((t) => t.id));
      rows = rows.filter((i) => taskIds.has(i.canonicalTask.id));
    }
    return rows;
  }, [instances, taskProgramFilter, taskSearchNorm, tasksMatchingText]);

  useEffect(() => {
    if (activeNav === TASKS_NAV || !activeProgram) return;
    setNewShip((prev) => ({ ...prev, programId: activeProgram.id }));
    const first = activeProgram.ships[0];
    setNewInstance((prev) => ({
      ...prev,
      shipId: first?.id ?? prev.shipId,
    }));
  }, [activeNav, activeProgram]);

  async function runAnalyze() {
    setAnalyzeBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", { method: "POST" });
      if (!res.ok) throw new Error(await res.text());
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setAnalyzeBusy(false);
    }
  }

  async function toggleResolved(id: string, resolved: boolean) {
    await fetch("/api/flags", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, resolved }),
    });
    await refresh();
  }

  async function submitProgram(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/programs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProgram),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not create program");
      return;
    }
    setNewProgram({ code: "", name: "" });
    await refresh();
  }

  async function submitShip(e: React.FormEvent) {
    e.preventDefault();
    const programId =
      activeProgram && activeNav !== TASKS_NAV
        ? activeProgram.id
        : newShip.programId;
    const res = await fetch("/api/ships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newShip, programId }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not create ship");
      return;
    }
    setNewShip((s) => ({ ...s, hullNumber: "", displayName: "" }));
    await refresh();
  }

  async function submitTask(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newTask,
        scopeUnit: newTask.scopeUnit || null,
      }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not create task");
      return;
    }
    setNewTask({ code: "", title: "", scopeUnit: "" });
    await refresh();
  }

  async function submitInstance(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/instances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipId: newInstance.shipId,
        canonicalTaskId: newInstance.canonicalTaskId,
        phase: newInstance.phase,
        plannedHours: newInstance.plannedHours
          ? parseFloat(newInstance.plannedHours)
          : null,
        actualHours: parseFloat(newInstance.actualHours),
        scopeQuantity: newInstance.scopeQuantity
          ? parseFloat(newInstance.scopeQuantity)
          : null,
      }),
    });
    if (!res.ok) {
      setError((await res.json()).error ?? "Could not save IE record");
      return;
    }
    setNewInstance((s) => ({
      ...s,
      plannedHours: "",
      actualHours: "",
      scopeQuantity: "",
    }));
    await refresh();
  }

  const tabClass = (id: string) =>
    [
      "rounded-md px-3 py-2 text-sm font-medium transition-colors",
      activeNav === id
        ? "bg-sky-500/20 text-sky-200 ring-1 ring-sky-500/40"
        : "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--text)]",
    ].join(" ");

  return (
    <div className="min-h-screen pb-16">
      <header className="border-b border-[var(--border)] bg-[var(--panel)]/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-[var(--accent)]">
                Manufacturing IE
              </p>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Shipset analytics
              </h1>
              <p className="mt-2 max-w-xl text-sm text-[var(--muted)]">
                {activeNav === TASKS_NAV
                  ? "Search canonical tasks and review IE hours across every hull."
                  : activeProgram
                    ? `${activeProgram.name} — compare hulls, review flags, and enter data for this ship type.`
                    : "Compare man-hours and scope across programs."}
              </p>
            </div>
            <button
              type="button"
              onClick={runAnalyze}
              disabled={analyzeBusy || loading}
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-sky-500 px-5 py-2.5 text-sm font-medium text-navy-950 shadow hover:bg-sky-400 disabled:opacity-50"
            >
              {analyzeBusy ? "Analyzing…" : "Run analysis"}
            </button>
          </div>

          <nav
            className="mt-8 flex flex-wrap items-center gap-2 border-t border-[var(--border)]/80 pt-4 pb-4"
            aria-label="Main"
          >
            <span className="mr-1 text-xs font-medium uppercase tracking-wide text-[var(--muted)]">
              Ship type
            </span>
            {programs.map((p) => (
              <button
                key={p.id}
                type="button"
                className={tabClass(p.id)}
                onClick={() => setActiveNav(p.id)}
              >
                {p.code}
                <span className="ml-1.5 text-xs font-normal text-[var(--muted)]">
                  ({p.ships.length})
                </span>
              </button>
            ))}
            <span
              className="mx-2 hidden h-6 w-px bg-[var(--border)] sm:inline"
              aria-hidden
            />
            <button
              type="button"
              className={tabClass(TASKS_NAV)}
              onClick={() => setActiveNav(TASKS_NAV)}
            >
              Task library
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 pt-10">
        {error && (
          <div
            className="rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-3 text-sm text-red-200"
            role="alert"
          >
            {error}
          </div>
        )}

        {activeNav === TASKS_NAV ? (
          <TasksPanel
            loading={loading}
            taskSearch={taskSearch}
            setTaskSearch={setTaskSearch}
            taskProgramFilter={taskProgramFilter}
            setTaskProgramFilter={setTaskProgramFilter}
            programs={programs}
            displayTasks={displayTasksForLibrary}
            instancesForTaskView={instancesForTaskView}
            allTaskCount={tasks.length}
          />
        ) : activeProgram ? (
          <>
            <section className="rounded-xl border border-[var(--border)] bg-[var(--panel)]/60 p-6 shadow-xl">
              <h2 className="text-lg font-semibold">
                Flags — {activeProgram.code}
              </h2>
              <p className="mt-1 text-sm text-[var(--muted)]">
                Hull-to-hull variance and scope–hours issues for this program
                only.
              </p>
              <div className="mt-4 grid gap-3 md:grid-cols-4">
                <input
                  type="search"
                  placeholder="Search task/title/ship"
                  value={flagSearch}
                  onChange={(e) => setFlagSearch(e.target.value)}
                  className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                />
                <select
                  value={flagSeverityFilter}
                  onChange={(e) => setFlagSeverityFilter(e.target.value)}
                  className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                >
                  <option value="all">All severities</option>
                  <option value="HIGH">High only</option>
                  <option value="MEDIUM">Medium only</option>
                  <option value="LOW">Low only</option>
                </select>
                <select
                  value={flagTypeFilter}
                  onChange={(e) => setFlagTypeFilter(e.target.value)}
                  className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                >
                  <option value="all">All types</option>
                  <option value="HULL_TO_HULL_VARIANCE">Hull to hull variance</option>
                  <option value="SCOPE_HOURS_MISMATCH">Scope-hours mismatch</option>
                </select>
                <select
                  value={flagSort}
                  onChange={(e) => setFlagSort(e.target.value)}
                  className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
                >
                  <option value="variance_desc">Variance: high to low</option>
                  <option value="variance_asc">Variance: low to high</option>
                  <option value="title_asc">Task title: A to Z</option>
                  <option value="title_desc">Task title: Z to A</option>
                  <option value="hours_desc">Task hours: high to low</option>
                  <option value="hours_asc">Task hours: low to high</option>
                  <option value="severity_desc">Severity: high to low</option>
                  <option value="severity_asc">Severity: low to high</option>
                </select>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                      <th className="pb-2 pr-4 font-medium">Severity</th>
                      <th className="pb-2 pr-4 font-medium">Type</th>
                      <th className="pb-2 pr-4 font-medium">Ship / task</th>
                      <th className="pb-2 font-medium">Detail</th>
                      <th className="pb-2 pl-4 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-[var(--muted)]">
                          Loading…
                        </td>
                      </tr>
                    ) : visibleFlagsForProgram.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-[var(--muted)]">
                          No matching flags for {activeProgram.code}. Adjust
                          filters or run analysis.
                        </td>
                      </tr>
                    ) : (
                      visibleFlagsForProgram.map((f) => (
                        <tr
                          key={f.id}
                          className="border-b border-[var(--border)]/60"
                        >
                          <td className="py-3 pr-4">
                            <span
                              className={
                                f.severity === "HIGH"
                                  ? "text-red-300"
                                  : f.severity === "MEDIUM"
                                    ? "text-[var(--warn)]"
                                    : "text-[var(--muted)]"
                              }
                            >
                              {f.severity}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-[var(--muted)]">
                            {f.type.replace(/_/g, " ")}
                          </td>
                          <td className="py-3 pr-4">
                            <div className="font-medium">
                              {f.taskInstance.ship.displayName}
                            </div>
                            <div className="text-xs text-[var(--muted)]">
                              {f.taskInstance.canonicalTask.code} ·{" "}
                              {f.taskInstance.phase}
                            </div>
                          </td>
                          <td className="max-w-md py-3 text-[var(--muted)]">
                            {f.message}
                            {f.pctChange != null && (
                              <span className="ml-2 text-sky-300/90">
                                ({f.pctChange > 0 ? "+" : ""}
                                {f.pctChange.toFixed(0)}%)
                              </span>
                            )}
                          </td>
                          <td className="py-3 pl-4">
                            <label className="flex cursor-pointer items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                checked={f.resolved}
                                onChange={(e) =>
                                  toggleResolved(f.id, e.target.checked)
                                }
                                className="rounded border-[var(--border)]"
                              />
                              Resolved
                            </label>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid gap-8 lg:grid-cols-2">
              <section className="rounded-xl border border-[var(--border)] bg-[var(--panel)]/40 p-6">
                <h2 className="text-lg font-semibold">
                  Hulls — {activeProgram.code}
                </h2>
                <ul className="mt-4 list-inside list-disc space-y-1 text-sm text-[var(--muted)]">
                  {activeProgram.ships.length === 0 ? (
                    <li>No hulls yet. Add one under Data entry.</li>
                  ) : (
                    activeProgram.ships.map((s) => (
                      <li key={s.id}>
                        {s.displayName}{" "}
                        <span className="text-[var(--muted)]/70">
                          (hull {s.hullNumber})
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </section>

              <section className="rounded-xl border border-[var(--border)] bg-[var(--panel)]/40 p-6">
                <h2 className="text-lg font-semibold">
                  IE records — {activeProgram.code}
                </h2>
                <div className="mt-4 max-h-72 overflow-y-auto text-sm">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                        <th className="pb-2 font-medium">Ship</th>
                        <th className="pb-2 font-medium">Task</th>
                        <th className="pb-2 font-medium">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {instancesForProgram.slice(0, 80).map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-[var(--border)]/40"
                        >
                          <td className="py-2 pr-2">
                            {row.ship.displayName}
                          </td>
                          <td className="py-2 pr-2">
                            {row.canonicalTask.title}
                            <span className="block text-xs text-[var(--muted)]">
                              {row.phase}
                            </span>
                          </td>
                          <td className="py-2">
                            {row.actualHours}
                            {row.scopeQuantity != null &&
                              row.scopeQuantity > 0 && (
                                <span className="block text-xs text-[var(--muted)]">
                                  {(
                                    row.actualHours / row.scopeQuantity
                                  ).toFixed(1)}
                                  h/{row.canonicalTask.scopeUnit ?? "unit"}
                                </span>
                              )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <DataEntrySection
              activeProgram={activeProgram}
              newProgram={newProgram}
              setNewProgram={setNewProgram}
              newShip={newShip}
              setNewShip={setNewShip}
              newTask={newTask}
              setNewTask={setNewTask}
              newInstance={newInstance}
              setNewInstance={setNewInstance}
              shipsForForm={shipsForActiveProgram}
              tasks={tasks}
              submitProgram={submitProgram}
              submitShip={submitShip}
              submitTask={submitTask}
              submitInstance={submitInstance}
            />
          </>
        ) : (
          <p className="text-[var(--muted)]">
            Add a program to get started, or open Task library.
          </p>
        )}
      </main>
    </div>
  );
}

function TasksPanel({
  loading,
  taskSearch,
  setTaskSearch,
  taskProgramFilter,
  setTaskProgramFilter,
  programs,
  displayTasks,
  instancesForTaskView,
  allTaskCount,
}: {
  loading: boolean;
  taskSearch: string;
  setTaskSearch: (v: string) => void;
  taskProgramFilter: string;
  setTaskProgramFilter: (v: string) => void;
  programs: Program[];
  displayTasks: CanonicalTask[];
  instancesForTaskView: Instance[];
  allTaskCount: number;
}) {
  const byTask = useMemo(() => {
    const m = new Map<string, Instance[]>();
    for (const row of instancesForTaskView) {
      const id = row.canonicalTask.id;
      const list = m.get(id) ?? [];
      list.push(row);
      m.set(id, list);
    }
    return m;
  }, [instancesForTaskView]);

  const filteredCount = displayTasks.length;
  const hasFilters =
    Boolean(taskSearch.trim()) || taskProgramFilter !== "all";

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-[var(--border)] bg-[var(--panel)]/60 p-6 shadow-xl">
        <h2 className="text-lg font-semibold">Review &amp; search tasks</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Filter by text (code, title, scope unit) and optionally by program.
          IE rows update as you type.
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label
              htmlFor="task-search"
              className="mb-1 block text-xs font-medium text-[var(--muted)]"
            >
              Search
            </label>
            <input
              id="task-search"
              type="search"
              placeholder="e.g. ENG-PROP, outfit, compartment…"
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:w-48">
            <label
              htmlFor="task-prog"
              className="mb-1 block text-xs font-medium text-[var(--muted)]"
            >
              Program
            </label>
            <select
              id="task-prog"
              value={taskProgramFilter}
              onChange={(e) => setTaskProgramFilter(e.target.value)}
              className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            >
              <option value="all">All programs</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--panel)]/40 p-6">
        <h3 className="text-sm font-medium text-sky-200/90">
          Canonical tasks ({filteredCount}
          {hasFilters ? ` of ${allTaskCount}` : ""})
        </h3>
        {loading ? (
          <p className="mt-4 text-sm text-[var(--muted)]">Loading…</p>
        ) : filteredCount === 0 ? (
          <p className="mt-4 text-sm text-[var(--muted)]">
            No tasks match your filters.
          </p>
        ) : (
          <ul className="mt-4 space-y-6">
            {displayTasks.map((t) => {
              const rows = byTask.get(t.id) ?? [];
              return (
                <li
                  key={t.id}
                  className="rounded-lg border border-[var(--border)]/80 bg-[var(--bg)]/40 p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div>
                      <span className="font-mono text-sm text-sky-300">
                        {t.code}
                      </span>
                      <h4 className="font-medium">{t.title}</h4>
                      {t.scopeUnit && (
                        <p className="text-xs text-[var(--muted)]">
                          Scope unit: {t.scopeUnit}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-[var(--muted)]">
                      {rows.length} IE row{rows.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  {rows.length === 0 ? (
                    <p className="mt-3 text-sm text-[var(--muted)]">
                      No IE data in current filter. Try &quot;All programs&quot;
                      or clear search.
                    </p>
                  ) : (
                    <div className="mt-3 overflow-x-auto">
                      <table className="w-full min-w-[520px] text-left text-sm">
                        <thead>
                          <tr className="border-b border-[var(--border)] text-[var(--muted)]">
                            <th className="pb-2 pr-2 font-medium">Ship</th>
                            <th className="pb-2 pr-2 font-medium">Program</th>
                            <th className="pb-2 pr-2 font-medium">Phase</th>
                            <th className="pb-2 pr-2 font-medium">Actual h</th>
                            <th className="pb-2 font-medium">Scope</th>
                          </tr>
                        </thead>
                        <tbody>
                          {rows.map((r) => (
                            <tr
                              key={r.id}
                              className="border-b border-[var(--border)]/40"
                            >
                              <td className="py-2 pr-2">
                                {r.ship.displayName}
                              </td>
                              <td className="py-2 pr-2">
                                {r.ship.program.code}
                              </td>
                              <td className="py-2 pr-2">{r.phase}</td>
                              <td className="py-2 pr-2">{r.actualHours}</td>
                              <td className="py-2 text-[var(--muted)]">
                                {r.scopeQuantity ?? "—"}
                                {r.scopeQuantity != null &&
                                  t.scopeUnit &&
                                  ` ${t.scopeUnit}`}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function DataEntrySection({
  activeProgram,
  newProgram,
  setNewProgram,
  newShip,
  setNewShip,
  newTask,
  setNewTask,
  newInstance,
  setNewInstance,
  shipsForForm,
  tasks,
  submitProgram,
  submitShip,
  submitTask,
  submitInstance,
}: {
  activeProgram: Program;
  newProgram: { code: string; name: string };
  setNewProgram: React.Dispatch<
    React.SetStateAction<{ code: string; name: string }>
  >;
  newShip: { programId: string; hullNumber: string; displayName: string };
  setNewShip: React.Dispatch<
    React.SetStateAction<{
      programId: string;
      hullNumber: string;
      displayName: string;
    }>
  >;
  newTask: { code: string; title: string; scopeUnit: string };
  setNewTask: React.Dispatch<
    React.SetStateAction<{ code: string; title: string; scopeUnit: string }>
  >;
  newInstance: {
    shipId: string;
    canonicalTaskId: string;
    phase: string;
    plannedHours: string;
    actualHours: string;
    scopeQuantity: string;
  };
  setNewInstance: React.Dispatch<
    React.SetStateAction<{
      shipId: string;
      canonicalTaskId: string;
      phase: string;
      plannedHours: string;
      actualHours: string;
      scopeQuantity: string;
    }>
  >;
  shipsForForm: {
    id: string;
    displayName: string;
    programCode: string;
  }[];
  tasks: CanonicalTask[];
  submitProgram: (e: React.FormEvent) => void;
  submitShip: (e: React.FormEvent) => void;
  submitTask: (e: React.FormEvent) => void;
  submitInstance: (e: React.FormEvent) => void;
}) {
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--panel)]/40 p-6">
      <h2 className="text-lg font-semibold">
        Data entry — {activeProgram.code}
      </h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        New hulls and IE rows default to this ship type. Add programs or
        canonical tasks here as needed.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-2">
        <form onSubmit={submitProgram} className="space-y-3">
          <h3 className="text-sm font-medium text-sky-200/90">New program</h3>
          <input
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            placeholder="Code (e.g. DDG)"
            value={newProgram.code}
            onChange={(e) =>
              setNewProgram((p) => ({ ...p, code: e.target.value }))
            }
          />
          <input
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            placeholder="Name"
            value={newProgram.name}
            onChange={(e) =>
              setNewProgram((p) => ({ ...p, name: e.target.value }))
            }
          />
          <button
            type="submit"
            className="rounded-md bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          >
            Add program
          </button>
        </form>

        <form onSubmit={submitShip} className="space-y-3">
          <h3 className="text-sm font-medium text-sky-200/90">
            New hull ({activeProgram.code})
          </h3>
          <p className="text-xs text-[var(--muted)]">
            Hull will be added to {activeProgram.code}.
          </p>
          <input
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            placeholder="Hull number"
            value={newShip.hullNumber}
            onChange={(e) =>
              setNewShip((s) => ({ ...s, hullNumber: e.target.value }))
            }
          />
          <input
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            placeholder="Display name (e.g. DDG 130)"
            value={newShip.displayName}
            onChange={(e) =>
              setNewShip((s) => ({ ...s, displayName: e.target.value }))
            }
          />
          <button
            type="submit"
            className="rounded-md bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          >
            Add hull
          </button>
        </form>

        <form onSubmit={submitTask} className="space-y-3">
          <h3 className="text-sm font-medium text-sky-200/90">
            Canonical task
          </h3>
          <input
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            placeholder="Code"
            value={newTask.code}
            onChange={(e) =>
              setNewTask((t) => ({ ...t, code: e.target.value }))
            }
          />
          <input
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            placeholder="Title"
            value={newTask.title}
            onChange={(e) =>
              setNewTask((t) => ({ ...t, title: e.target.value }))
            }
          />
          <input
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            placeholder="Scope unit (optional)"
            value={newTask.scopeUnit}
            onChange={(e) =>
              setNewTask((t) => ({ ...t, scopeUnit: e.target.value }))
            }
          />
          <button
            type="submit"
            className="rounded-md bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          >
            Add task
          </button>
        </form>

        <form onSubmit={submitInstance} className="space-y-3">
          <h3 className="text-sm font-medium text-sky-200/90">IE instance</h3>
          <select
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            value={newInstance.shipId}
            onChange={(e) =>
              setNewInstance((s) => ({ ...s, shipId: e.target.value }))
            }
          >
            {shipsForForm.length === 0 ? (
              <option value="">Add a hull first</option>
            ) : (
              shipsForForm.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName} ({s.programCode})
                </option>
              ))
            )}
          </select>
          <select
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            value={newInstance.canonicalTaskId}
            onChange={(e) =>
              setNewInstance((s) => ({
                ...s,
                canonicalTaskId: e.target.value,
              }))
            }
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.code} — {t.title}
              </option>
            ))}
          </select>
          <input
            className="w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            placeholder="Phase (construction, outfit, test…)"
            value={newInstance.phase}
            onChange={(e) =>
              setNewInstance((s) => ({ ...s, phase: e.target.value }))
            }
          />
          <div className="grid grid-cols-3 gap-2">
            <input
              className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-sm"
              placeholder="Planned h"
              value={newInstance.plannedHours}
              onChange={(e) =>
                setNewInstance((s) => ({
                  ...s,
                  plannedHours: e.target.value,
                }))
              }
            />
            <input
              className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-sm"
              placeholder="Actual h *"
              required
              value={newInstance.actualHours}
              onChange={(e) =>
                setNewInstance((s) => ({
                  ...s,
                  actualHours: e.target.value,
                }))
              }
            />
            <input
              className="rounded-md border border-[var(--border)] bg-[var(--bg)] px-2 py-2 text-sm"
              placeholder="Scope qty"
              value={newInstance.scopeQuantity}
              onChange={(e) =>
                setNewInstance((s) => ({
                  ...s,
                  scopeQuantity: e.target.value,
                }))
              }
            />
          </div>
          <button
            type="submit"
            disabled={!newInstance.shipId || !newInstance.canonicalTaskId}
            className="rounded-md bg-white/10 px-4 py-2 text-sm hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Save IE row
          </button>
        </form>
      </div>
    </section>
  );
}
