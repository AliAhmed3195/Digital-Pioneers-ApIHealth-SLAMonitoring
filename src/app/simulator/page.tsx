"use client";

import { useEffect, useMemo, useState } from "react";
import { InlineSpinner, useToast } from "@/shared/ui/ToastProvider";

type Scenario = "LATENCY_RAMP" | "ERROR_SPIKE" | "SLOW_NO_ERROR";

type RunResponse = {
  scenario: Scenario;
  count: number;
  atRiskEndpoints: number;
  activeIncidents: number;
};

type RunHistoryItem = RunResponse & {
  id: string;
  endpoint: string;
  runAt: string;
};

const scenarioMeta: Record<Scenario, { label: string; description: string; btn: string }> = {
  LATENCY_RAMP: {
    label: "Latency Ramp",
    description: "Gradually increases latency to detect degrading endpoint health.",
    btn: "btn-primary"
  },
  ERROR_SPIKE: {
    label: "Error Spike",
    description: "Injects burst failures to trigger alerting and incident creation.",
    btn: "btn-secondary"
  },
  SLOW_NO_ERROR: {
    label: "Slow Without Errors",
    description: "High response times with low failure rate to test hidden risk signals.",
    btn: "btn-secondary"
  }
};

export default function SimulatorPage() {
  const toast = useToast();
  const [loadingScenario, setLoadingScenario] = useState<Scenario | null>(null);
  const [result, setResult] = useState<RunResponse | null>(null);
  const [endpoint, setEndpoint] = useState("/payments");
  const [runHistory, setRunHistory] = useState<RunHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [scenarioFilter, setScenarioFilter] = useState<Scenario | "ALL">("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [errorText, setErrorText] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("simulator-run-history");
      if (!raw) return;
      const parsed = JSON.parse(raw) as RunHistoryItem[];
      setRunHistory(Array.isArray(parsed) ? parsed : []);
    } catch {
      setRunHistory([]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("simulator-run-history", JSON.stringify(runHistory.slice(0, 50)));
  }, [runHistory]);

  async function runScenario(scenario: Scenario, replayEndpoint?: string) {
    const endpointValue = (replayEndpoint ?? endpoint).trim() || "/payments";
    setErrorText("");
    setLoadingScenario(scenario);
    try {
      const res = await fetch("/api/simulator/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ scenario, endpoint: endpointValue })
      });
      const data = (await res.json()) as RunResponse & { error?: string };
      if (!res.ok) {
        setErrorText(data.error ?? "Unable to execute scenario.");
        toast.error(data.error ?? "Unable to execute scenario.");
        return;
      }
      setResult(data);
      toast.success(`${scenarioMeta[scenario].label} executed successfully.`);
      setRunHistory((prev) => [
        {
          ...data,
          endpoint: endpointValue,
          runAt: new Date().toISOString(),
          id: `${Date.now()}-${scenario}-${endpointValue}`
        },
        ...prev
      ]);
    } finally {
      setLoadingScenario(null);
    }
  }

  const filteredHistory = useMemo(() => {
    return runHistory.filter((item) => {
      if (
        searchTerm &&
        !`${item.endpoint} ${item.scenario}`.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      if (scenarioFilter !== "ALL" && item.scenario !== scenarioFilter) {
        return false;
      }
      const runTime = new Date(item.runAt).getTime();
      if (fromDate) {
        const from = new Date(`${fromDate}T00:00:00`).getTime();
        if (runTime < from) return false;
      }
      if (toDate) {
        const to = new Date(`${toDate}T23:59:59`).getTime();
        if (runTime > to) return false;
      }
      return true;
    });
  }, [runHistory, searchTerm, scenarioFilter, fromDate, toDate]);

  return (
    <main className="page">
      <h1>Simulator / Replay</h1>
      <p className="muted">
        Run deterministic scenarios, inspect impact instantly, and replay previous runs for demo-ready
        validation.
      </p>

      <section className="filter-bar">
        <div className="filter-row">
          <input
            className="input input-wide"
            value={endpoint}
            onChange={(event) => setEndpoint(event.target.value)}
            placeholder="Target endpoint (example: /payments, /security/v1/refreshToken)"
          />
        </div>
      </section>

      <section className="card-grid">
        {(["LATENCY_RAMP", "ERROR_SPIKE", "SLOW_NO_ERROR"] as Scenario[]).map((scenario) => (
          <article className="card" key={scenario}>
            <h3 className="section-title">{scenarioMeta[scenario].label}</h3>
            <p className="muted">{scenarioMeta[scenario].description}</p>
            <button
              className={`btn ${scenarioMeta[scenario].btn}`}
              disabled={loadingScenario !== null}
              onClick={() => runScenario(scenario)}
            >
              {loadingScenario === scenario ? "Executing..." : `Run ${scenarioMeta[scenario].label}`}
            </button>
          </article>
        ))}
      </section>

      {loadingScenario ? <InlineSpinner label="Executing simulation and running detection cycle..." /> : null}
      {errorText ? <p className="muted">{errorText}</p> : null}

      {result ? (
        <section className="card-grid">
          <article className="card">
            <div className="muted">Last Scenario</div>
            <div className="scenario-value">{result.scenario}</div>
          </article>
          <article className="card">
            <div className="muted">Logs Generated</div>
            <div className="kpi-value">{result.count}</div>
          </article>
          <article className="card">
            <div className="muted">At-Risk Endpoints</div>
            <div className="kpi-value">{result.atRiskEndpoints}</div>
          </article>
          <article className="card">
            <div className="muted">Active Incidents</div>
            <div className="kpi-value">{result.activeIncidents}</div>
          </article>
        </section>
      ) : null}

      <section className="filter-bar">
        <div className="filter-row">
          <input
            className="input input-wide"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search replay history by scenario or endpoint..."
          />
          <select
            className="input"
            value={scenarioFilter}
            onChange={(event) => setScenarioFilter(event.target.value as Scenario | "ALL")}
          >
            <option value="ALL">All Scenarios</option>
            <option value="LATENCY_RAMP">Latency Ramp</option>
            <option value="ERROR_SPIKE">Error Spike</option>
            <option value="SLOW_NO_ERROR">Slow Without Errors</option>
          </select>
          <input className="input" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          <input className="input" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          <button
            className="btn"
            onClick={() => {
              setSearchTerm("");
              setScenarioFilter("ALL");
              setFromDate("");
              setToDate("");
            }}
          >
            Reset Filters
          </button>
        </div>
      </section>

      <section className="card">
        <div className="button-row">
          <h3 className="section-title">Replay History</h3>
          <span className="chip-soft chip-gray-soft">{filteredHistory.length} runs</span>
          <button
            className="btn btn-secondary"
            onClick={() => {
              setRunHistory([]);
            }}
          >
            Clear History
          </button>
        </div>
        {filteredHistory.length === 0 ? (
          <p className="muted">No simulator runs yet. Execute any scenario to build replay history.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Run Time</th>
                  <th>Scenario</th>
                  <th>Endpoint</th>
                  <th>Logs</th>
                  <th>Risk</th>
                  <th>Incidents</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((item) => (
                  <tr key={item.id}>
                    <td>{new Date(item.runAt).toLocaleString()}</td>
                    <td>
                      <span className="chip-soft chip-blue">{scenarioMeta[item.scenario].label}</span>
                    </td>
                    <td>
                      <span className="chip-soft chip-purple">{item.endpoint}</span>
                    </td>
                    <td>{item.count}</td>
                    <td>{item.atRiskEndpoints}</td>
                    <td>{item.activeIncidents}</td>
                    <td>
                      <button
                        className="btn"
                        disabled={loadingScenario !== null}
                        onClick={() => runScenario(item.scenario, item.endpoint)}
                      >
                        Replay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
