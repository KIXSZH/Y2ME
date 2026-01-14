import { useEffect, useState, useMemo } from "react";

const API = "http://localhost:4000/api";

export default function App() {
  const [songs, setSongs] = useState([]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState({});

  // ---------- API HELPERS ----------

  const songRows = useMemo(() => {
    return songs.map((song) => {
      const p = progress[song.id];

      return (
        <tr key={song.id}>
          <td>
            <input
              type="checkbox"
              checked={song.selected === 1}
              disabled={!!p || song.downloaded}
              onChange={(e) => toggleSelect(song.id, e.target.checked)}
            />
          </td>
          <td>{song.title}</td>
          <td className="status">
            {song.downloaded
              ? "✅ EXTRACTED"
              : p
              ? `⬇ ${p.percent}% · ${p.speed} · ${speedComment(p.speed)}`
              : song.selected
              ? "🟢 ARMED"
              : "⚪ UNSELECTED"}
          </td>
        </tr>
      );
    });
  }, [songs, progress]);

  async function fetchSongs() {
    const res = await fetch(`${API}/songs`);
    const data = await res.json();
    setSongs(data);
  }

  async function addUrl() {
    if (!url.trim()) return;

    setLoading(true);

    await fetch(`${API}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    setUrl("");
    await fetchSongs();
    setLoading(false);
  }

  function toggleSelect(id, selected) {
    // Optimistic UI (no refresh, no flicker)
    setSongs((prev) =>
      prev.map((s) => (s.id === id ? { ...s, selected: selected ? 1 : 0 } : s))
    );

    fetch(`${API}/select`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, selected }),
    });
  }

  async function clearAll() {
    await fetch(`${API}/clear`, { method: "POST" });
    setSongs([]);
    setProgress({});
  }

  function downloadSelected() {
    setDownloading(true);

    // Immediately mark selected songs as active
    const initialProgress = {};
    songs.forEach((song) => {
      if (song.selected && !song.downloaded) {
        initialProgress[song.id] = {
          percent: 0,
          speed: "0.0MiB/s",
        };
      }
    });
    setProgress(initialProgress);

    const evt = new EventSource(`${API}/progress`);

    evt.onmessage = (e) => {
      const data = JSON.parse(e.data);

      if (data.ready) {
        // 🔥 Browser download for THIS song
        const a = document.createElement("a");
        a.href = `${API}/file/${data.id}`;
        a.download = "";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      if (data.done) {
        evt.close();
        setDownloading(false);
        setProgress({});
        fetchSongs();
        return;
      }

      setProgress((prev) => ({
        ...prev,
        [data.id]: {
          percent: data.percent,
          speed: data.speed,
        },
      }));
    };
  }

  // ---------- INITIAL LOAD ----------
  useEffect(() => {
    fetch(`${API}/clear`, { method: "POST" }).then(fetchSongs);
  }, []);

  // ---------- RENDER ----------
  return (
    <div className="app">
      <h1>Y2ME :: Media Extraction Console</h1>
      <div className="subtitle">select · arm · extract</div>

      {/* INPUT */}
      <div className="input-bar">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addUrl()}
          placeholder="Paste playlist or song URL"
        />
        <button onClick={addUrl}>ADD</button>
      </div>

      {/* ACTIONS */}
      <div className="action-bar">
        <button
          onClick={downloadSelected}
          disabled={downloading || songs.length === 0}
        >
          ⬇ DOWNLOAD
        </button>
        <button onClick={clearAll}>🗑 CLEAR</button>
      </div>

      {/* LOADER (TEXT ONLY, NO LAYOUT CHANGE) */}
      {loading && <div className="loader-text">⌛ parsing input vectors…</div>}

      {/* TABLE — ONLY RENDERS WHEN DATA EXISTS */}
      {songs.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Select</th>
              <th>Song</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>{songRows}</tbody>
        </table>
      )}
    </div>
  );
}

// ---------- HELPERS ----------

function speedComment(speed) {
  const n = parseFloat(speed);
  if (n < 0.8) return "link unstable";
  if (n < 2) return "packet crawl";
  if (n < 5) return "pipe stable";
  if (n < 10) return "fast lane open";
  return "overclocked transfer";
}
