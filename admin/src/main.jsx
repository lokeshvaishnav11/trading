
import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const API = import.meta.env.VITE_API_URL || "/api";

const ENTITIES = [
  "users",
  "deposits",
  "withdrawals",
  "trades",
  "pairs",
  "bonuses",
  "tickets",
  "notices",
  "settings",
  "audit"
];

const FIELDS = {
  users: ["name", "country", "currency", "status"],
  deposits: ["note"],
  withdrawals: ["status"],
  pairs: [
    "symbol",
    "category",
    "enabled",
    "payout1",
    "payout5",
    "source"
  ],
  bonuses: ["code", "percent", "minUSD", "enabled"],
  tickets: ["status", "reply"],
  notices: ["title", "message", "enabled"],
  settings: ["key", "value"]
};

const CREATABLE = [
  "pairs",
  "bonuses",
  "notices",
  "settings"
];

async function api(path, method = "GET", body) {
  const token = sessionStorage.getItem("qx_admin") || "";

  const response = await fetch(API + path, {
    method,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    ...(body !== undefined
      ? { body: JSON.stringify(body) }
      : {})
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      result.error || `HTTP ${response.status}`
    );
  }

  return result;
}

function formatValue(value) {
  if (value == null) return "";
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function istDate() {
  return new Date(Date.now() + 330 * 60000)
    .toISOString()
    .slice(0, 10);
}

function tomorrowIST() {
  const date = new Date(`${istDate()}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function clock(minute) {
  if (minute === 1440) return "24:00";

  return (
    String(Math.floor(minute / 60)).padStart(2, "0") +
    ":" +
    String(minute % 60).padStart(2, "0")
  );
}

function pointSizeFor(symbol) {
  return symbol === "BTC/USD" ? 1 : 0.00001;
}

function decimalsFor(symbol) {
  return symbol === "BTC/USD" ? 2 : 5;
}

function roundPrice(value, symbol) {
  return Number(
    value.toFixed(decimalsFor(symbol))
  );
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomDirection() {
  return Math.random() < 0.5 ? -1 : 1;
}

/*
 * Generates exactly 102 ten-minute slots:
 * 07:00 IST through 24:00 IST.
 *
 * Each slot has an independent entry and exit.
 * The previous exit does not have to equal
 * the next entry.
 *
 * Randomization happens only when the admin
 * clicks Generate, never during price requests.
 */
function generateRandomSlots(symbol, existingSlots = []) {
  const isBTC = symbol === "BTC/USD";

  const defaultBase = isBTC
    ? 65000
    : symbol === "GBP/USD"
      ? 1.27000
      : 1.08500;

  const firstExisting = Number(
    existingSlots?.[0]?.entryPrice
  );

  const basePrice =
    Number.isFinite(firstExisting) &&
    firstExisting > 0
      ? firstExisting
      : defaultBase;

  const minPrice = isBTC ? 1 : 0.00001;

  const gapMin = isBTC ? -100 : -0.003;
  const gapMax = isBTC ? 100 : 0.003;

  const movementMin = isBTC ? 20 : 0.0005;
  const movementMax = isBTC ? 200 : 0.005;

  const result = [];

  let previousExit = basePrice;

  for (let index = 0; index < 102; index++) {
    const startMinute = 420 + index * 10;
    const endMinute = startMinute + 10;

    const gap = index === 0
      ? 0
      : randomBetween(gapMin, gapMax);

    const entryPrice = roundPrice(
      Math.max(minPrice, previousExit + gap),
      symbol
    );

    const direction = randomDirection();

    const movement = randomBetween(
      movementMin,
      movementMax
    );

    const exitPrice = roundPrice(
      Math.max(
        minPrice,
        entryPrice + direction * movement
      ),
      symbol
    );

    result.push({
      startMinute,
      endMinute,
      entryPrice,
      exitPrice
    });

    previousExit = exitPrice;
  }

  return result;
}

function validateSlots(slots) {
  if (!Array.isArray(slots) || slots.length !== 102) {
    throw new Error(
      "Exactly 102 schedule slots are required"
    );
  }

  return slots.map((slot, index) => {
    const startMinute = Number(slot.startMinute);
    const endMinute = Number(slot.endMinute);
    const entryPrice = Number(slot.entryPrice);
    const exitPrice = Number(slot.exitPrice);

    const expectedStart = 420 + index * 10;

    if (
      startMinute !== expectedStart ||
      endMinute !== expectedStart + 10
    ) {
      throw new Error(
        `Invalid time in slot ${index + 1}`
      );
    }

    if (
      !Number.isFinite(entryPrice) ||
      !Number.isFinite(exitPrice) ||
      entryPrice <= 0 ||
      exitPrice <= 0
    ) {
      throw new Error(
        `Invalid entry/exit price in slot ${index + 1}`
      );
    }

    return {
      startMinute,
      endMinute,
      entryPrice,
      exitPrice
    };
  });
}

function ScheduleEditor() {
  const [date, setDate] = useState(tomorrowIST);
  const [symbol, setSymbol] = useState("EUR/USD");

  const [slots, setSlots] = useState([]);
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState("new");

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [dirty, setDirty] = useState(false);

  const path =
    `/admin/schedules/${date}/` +
    encodeURIComponent(symbol);

  const locked = busy || status === "published";
  const pointSize = pointSizeFor(symbol);

  async function reload() {
    setBusy(true);
    setNotice("");

    try {
      const result = await api(path);

      setSlots(result.slots || []);
      setVersion(result.version || 0);
      setStatus(result.status || "new");
      setDirty(false);
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    reload();
  }, [date, symbol]);

  function updateSlot(index, key, rawValue) {
    if (locked) return;

    setSlots(previous =>
      previous.map((slot, i) =>
        i === index
          ? { ...slot, [key]: rawValue }
          : slot
      )
    );

    setDirty(true);
  }

  function randomizeSlots() {
    if (locked) return;

    const confirmed = window.confirm(
      "Generate 102 random slots? " +
      "Unsaved slot changes will be replaced."
    );

    if (!confirmed) return;

    setSlots(previous =>
      generateRandomSlots(symbol, previous)
    );

    setDirty(true);
    setNotice(
      "102 random slots generated. " +
      "Review and save the draft."
    );
  }

  async function saveDraft() {
    if (locked) return;

    setBusy(true);
    setNotice("");

    try {
      const normalized = validateSlots(slots);

      const result = await api(
        path,
        "PUT",
        {
          version,
          slots: normalized
        }
      );

      setVersion(result.version);
      setStatus(result.status);
      setDirty(false);

      setNotice("Draft saved successfully");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (status !== "draft" || dirty || busy) {
      setNotice(
        "Save the draft before publishing"
      );
      return;
    }

    if (
      !window.confirm(
        "Publish and permanently lock this " +
        "simulated market schedule?"
      )
    ) {
      return;
    }

    setBusy(true);
    setNotice("");

    try {
      const result = await api(
        path + "/publish",
        "POST",
        { version }
      );

      setVersion(result.version);
      setStatus(result.status);

      setNotice(
        "Schedule published and locked"
      );
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      style={{
        background: "#111d2b",
        color: "#f0f5ff",
        borderRadius: 12,
        padding: 18
      }}
    >
      <h2>Scheduled Simulated Market</h2>

      <p>
        Admin-defined simulated prices, not live
        market data. Session: 07:00–24:00 IST.
        Published schedules cannot be edited.
      </p>

      <div
        style={{
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 18
        }}
      >
        <input
          type="date"
          min={tomorrowIST()}
          value={date}
          onChange={event =>
            setDate(event.target.value)
          }
        />

        <select
          value={symbol}
          onChange={event =>
            setSymbol(event.target.value)
          }
        >
          <option value="EUR/USD">EUR/USD</option>
          <option value="GBP/USD">GBP/USD</option>
          <option value="BTC/USD">BTC/USD</option>
        </select>

        <button
          type="button"
          disabled={locked}
          onClick={randomizeSlots}
          style={{
            background: "#2563eb",
            color: "white",
            padding: "9px 14px",
            borderRadius: 8
          }}
        >
          🎲 Generate Random 102 Slots
        </button>

        <button
          type="button"
          disabled={locked}
          onClick={saveDraft}
        >
          Save Draft
        </button>

        <button
          type="button"
          disabled={
            busy ||
            status !== "draft" ||
            dirty
          }
          onClick={publish}
        >
          Publish & Lock
        </button>

        <button
          type="button"
          disabled={busy}
          onClick={reload}
        >
          Reload
        </button>
      </div>

      <p>
        Status: <strong>{status}</strong>
        {" · "}Version: {version}
        {" · "}Slots: {slots.length}/102
        {dirty ? " · Unsaved changes" : ""}
      </p>

      {notice && (
        <p
          role="status"
          style={{ color: "#ffca60" }}
        >
          {notice}
        </p>
      )}

      <div
        style={{
          maxHeight: "65vh",
          overflow: "auto"
        }}
      >
        <table style={{ width: "100%" }}>
          <thead>
            <tr>
              <th>#</th>
              <th>Time (IST)</th>
              <th>Entry</th>
              <th>Exit</th>
              <th>Direction</th>
              <th>Points</th>
              <th>Demo score</th>
            </tr>
          </thead>

          <tbody>
            {slots.map((slot, index) => {
              const entry = Number(
                slot.entryPrice
              );

              const exit = Number(
                slot.exitPrice
              );

              const points =
                (exit - entry) / pointSize;

              const score =
                Math.abs(points) / 100;

              return (
                <tr key={index}>
                  <td>{index + 1}</td>

                  <td>
                    {clock(slot.startMinute)}
                    {"–"}
                    {clock(slot.endMinute)}
                  </td>

                  {[
                    "entryPrice",
                    "exitPrice"
                  ].map(key => (
                    <td key={key}>
                      <input
                        type="number"
                        step="any"
                        min="0.000001"
                        disabled={locked}
                        value={slot[key]}
                        onChange={event =>
                          updateSlot(
                            index,
                            key,
                            event.target.value
                          )
                        }
                        style={{
                          maxWidth: 135
                        }}
                      />
                    </td>
                  ))}

                  <td>
                    {points > 0
                      ? "UP"
                      : points < 0
                        ? "DOWN"
                        : "FLAT"}
                  </td>

                  <td>
                    {Number.isFinite(points)
                      ? points.toFixed(2)
                      : "—"}
                  </td>

                  <td>
                    {Number.isFinite(score)
                      ? `${score.toFixed(2)}x`
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function App() {
  const [logged, setLogged] = useState(false);

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");

  const [tab, setTab] = useState("overview");

  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState({});

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [edit, setEdit] = useState(null);
  const [draft, setDraft] = useState({});

  async function load(selectedTab = tab) {
    try {
      setError("");

      if (selectedTab === "schedules") {
        return;
      }

      if (selectedTab === "overview") {
        const result = await api(
          "/admin/overview"
        );

        setStats(result);
      } else {
        const result = await api(
          `/admin/${selectedTab}`
        );

        setRows(result.rows || []);
      }
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    const token = sessionStorage.getItem(
      "qx_admin"
    );

    if (!token) return;

    api("/auth/me")
      .then(result => {
        if (result.user.role === "admin") {
          setLogged(true);
        } else {
          sessionStorage.removeItem(
            "qx_admin"
          );
        }
      })
      .catch(() => {
        sessionStorage.removeItem(
          "qx_admin"
        );
      });
  }, []);

  useEffect(() => {
    if (logged) {
      load(tab);
    }
  }, [logged, tab]);

  async function login(event) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await api(
        "/auth/login",
        "POST",
        {
          email,
          password: pass
        }
      );

      if (result.user.role !== "admin") {
        throw new Error(
          "Admin role required"
        );
      }

      sessionStorage.setItem(
        "qx_admin",
        result.token
      );

      setLogged(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem("qx_admin");

    setLogged(false);
    setTab("overview");
    setRows([]);
    setStats({});
    setEdit(null);
  }

  async function save(event) {
    event.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const data = { ...draft };

      for (const key of [
        "payout1",
        "payout5",
        "percent",
        "minUSD"
      ]) {
        if (key in data) {
          data[key] = Number(data[key]);
        }
      }

      if ("enabled" in data) {
        data.enabled =
          data.enabled === true ||
          data.enabled === "true";
      }

      const isNew = edit === "new";

      const endpoint = isNew
        ? `/admin/${tab}`
        : `/admin/${tab}/${edit}`;

      await api(
        endpoint,
        isNew ? "POST" : "PATCH",
        data
      );

      setEdit(null);
      setDraft({});
      setMessage("Record saved successfully");

      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function approveDeposit(deposit) {
    const confirmed = window.confirm(
      `Confirm payment of $${deposit.amountUSD} ` +
      "has been independently verified?"
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setLoading(true);

    try {
      const result = await api(
        `/admin/deposits/${deposit._id}/approve`,
        "PATCH",
        {
          note: "Payment manually verified"
        }
      );

      setMessage(
        `Deposit approved: $${result.creditedAmount}. ` +
        `New balance: $${result.newBalance}`
      );

      await load("deposits");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(id) {
    if (
      !window.confirm(
        "Delete this configuration record?"
      )
    ) {
      return;
    }

    setError("");
    setLoading(true);

    try {
      await api(
        `/admin/${tab}/${id}`,
        "DELETE"
      );

      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function openEdit(record) {
    setEdit(record._id);

    const values = Object.fromEntries(
      (FIELDS[tab] || []).map(key => [
        key,
        record[key] ?? ""
      ])
    );

    setDraft(values);
  }

  function openCreate() {
    setEdit("new");
    setDraft({});
  }

  const tableColumns = [
    ...new Set(
      rows.flatMap(record =>
        Object.keys(record).filter(key =>
          ![
            "__v",
            "passwordHash",
            "_id"
          ].includes(key)
        )
      )
    )
  ].slice(0, 11);

  if (!logged) {
    return (
      <main className="login">
        <form onSubmit={login}>
          <h1>◈ Quotexx Admin</h1>

          <p>
            Authorized administrators only
          </p>

          <input
            type="email"
            placeholder="Admin email"
            value={email}
            onChange={event =>
              setEmail(event.target.value)
            }
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={pass}
            onChange={event =>
              setPass(event.target.value)
            }
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Signing in..."
              : "Sign in"}
          </button>

          {error && (
            <p className="error">
              {error}
            </p>
          )}
        </form>
      </main>
    );
  }

  return (
    <div className="layout">
      <aside>
        <h2>◈ Quotexx</h2>
        <small>ADMIN CONSOLE</small>

        {[
          "overview",
          "schedules",
          ...ENTITIES
        ].map(item => (
          <button
            key={item}
            className={
              tab === item ? "selected" : ""
            }
            onClick={() => {
              setTab(item);
              setEdit(null);
              setMessage("");
            }}
          >
            {item[0].toUpperCase() +
              item.slice(1)}
          </button>
        ))}

        <button onClick={logout}>
          Log out
        </button>
      </aside>

      <main>
        <div className="top">
          <h1>
            {tab[0].toUpperCase() +
              tab.slice(1)}
          </h1>

          {tab !== "schedules" && (
            <button
              disabled={loading}
              onClick={() => load()}
            >
              Refresh
            </button>
          )}
        </div>

        {error && (
          <p className="error">
            {error}
          </p>
        )}

        {message && (
          <p style={{ color: "#16a34a" }}>
            {message}
          </p>
        )}

        {tab === "schedules" ? (
          <ScheduleEditor />
        ) : tab === "overview" ? (
          <div className="cards">
            {Object.entries(stats).map(
              ([key, value]) => (
                <section key={key}>
                  <small>{key}</small>

                  <strong>
                    {formatValue(value)}
                  </strong>
                </section>
              )
            )}
          </div>
        ) : (
          <>
            <div className="tools">
              <span>
                {rows.length} records on this page
              </span>

              {CREATABLE.includes(tab) && (
                <button onClick={openCreate}>
                  + Add record
                </button>
              )}
            </div>

            <div className="scroll">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>

                    {tableColumns.map(column => (
                      <th key={column}>
                        {column}
                      </th>
                    ))}

                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {rows.map(record => (
                    <tr key={record._id}>
                      <td>
                        {String(
                          record._id
                        ).slice(-7)}
                      </td>

                      {tableColumns.map(column => (
                        <td key={column}>
                          {formatValue(
                            record[column]
                          )}
                        </td>
                      ))}

                      <td>
                        {tab === "deposits" &&
                          record.status ===
                            "pending" && (
                            <button
                              type="button"
                              disabled={loading}
                              onClick={() =>
                                approveDeposit(record)
                              }
                            >
                              Approve + Credit
                            </button>
                          )}

                        {(FIELDS[tab] || []).length >
                          0 && (
                          <button
                            type="button"
                            disabled={loading}
                            onClick={() =>
                              openEdit(record)
                            }
                          >
                            Edit
                          </button>
                        )}

                        {CREATABLE.includes(tab) && (
                          <button
                            type="button"
                            className="danger"
                            disabled={loading}
                            onClick={() =>
                              remove(record._id)
                            }
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {edit && (
          <div className="shade">
            <form
              className="modal"
              onSubmit={save}
            >
              <h2>
                {edit === "new"
                  ? "New"
                  : "Edit"}{" "}
                {tab}
              </h2>

              {(FIELDS[tab] || []).map(key => (
                <label key={key}>
                  {key}

                  {key === "enabled" ? (
                    <select
                      value={String(
                        draft[key] ?? "true"
                      )}
                      onChange={event =>
                        setDraft({
                          ...draft,
                          [key]:
                            event.target.value
                        })
                      }
                    >
                      <option value="true">
                        Enabled
                      </option>

                      <option value="false">
                        Disabled
                      </option>
                    </select>
                  ) : (
                    <input
                      value={String(
                        draft[key] ?? ""
                      )}
                      onChange={event =>
                        setDraft({
                          ...draft,
                          [key]:
                            event.target.value
                        })
                      }
                    />
                  )}
                </label>
              ))}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : "Save"}
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setEdit(null)
                  }
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

createRoot(
  document.getElementById("root")
).render(<App />);
