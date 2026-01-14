import { execFile } from "child_process";
import express from "express";
import cors from "cors";
import ytpl from "@distube/ytpl";
import { db } from "./db.js";
import { downloadSong } from "./downloader.js";
import fs from "fs";
import path from "path";

const DOWNLOAD_DIR = path.resolve("downloads");

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR);
}

const app = express();
app.use(cors());
app.use(express.json());

function getVideoTitle(url) {
  return new Promise((resolve, reject) => {
    execFile(
      "K:/yt-dlp/yt-dlp.exe",
      ["--get-title", "--no-playlist", url],
      (err, stdout) => {
        if (err) return reject(err);
        resolve(stdout.trim());
      }
    );
  });
}

/* ----------------------------------
   ADD PLAYLIST OR SINGLE SONG
---------------------------------- */
app.post("/api/add", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "URL required" });
  }

  try {
    let added = 0;

    // ✅ RELIABLE PLAYLIST CHECK
    const isPlaylist = ytpl.validateID(url);

    if (isPlaylist) {
      const playlist = await ytpl(url, { limit: Infinity });

      for (const item of playlist.items) {
        const result = await db.run(
          `INSERT OR IGNORE INTO songs (title, url, selected, downloaded)
           VALUES (?, ?, 0, 0)`,
          item.title,
          item.url
        );
        if (result.changes > 0) added++;
      }

      return res.json({
        message: "Playlist processed",
        added,
      });
    }

    // ✅ SINGLE VIDEO (SAFE FALLBACK)
    const title = await getVideoTitle(url);

    const result = await db.run(
      `INSERT OR IGNORE INTO songs (title, url, selected, downloaded)
       VALUES (?, ?, 0, 0)`,
      title,
      url
    );

    if (result.changes > 0) added++;

    res.json({
      message: "Song processed",
      added,
    });
  } catch (err) {
    console.error("ADD ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/file/:id", async (req, res) => {
  const song = await db.get(
    "SELECT filename FROM songs WHERE id = ?",
    req.params.id
  );

  if (!song || !song.filename) {
    return res.status(404).send("File not ready");
  }

  const filePath = path.join("downloads", song.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send("File missing");
  }

  // Send file to browser
  res.download(filePath, (err) => {
    if (err) {
      console.error("Download error:", err);
      return;
    }

    // 🔥 SAFE AUTO DELETE (DELAYED)
    setTimeout(() => {
      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, () => {
          console.log(`🧹 Auto-deleted ${song.filename}`);
        });
      }
    }, 5000); // ⏱ 5 seconds (safe window)
  });
});

/* ----------------------------------
   GET ALL SONGS
---------------------------------- */
app.get("/api/songs", async (req, res) => {
  const songs = await db.all("SELECT * FROM songs ORDER BY id ASC");
  res.json(songs);
});

/* ----------------------------------
   SELECT / UNSELECT
---------------------------------- */
app.post("/api/select", async (req, res) => {
  const { id, selected } = req.body;

  await db.run(
    "UPDATE songs SET selected = ? WHERE id = ?",
    selected ? 1 : 0,
    id
  );

  res.json({ success: true });
});

/* ----------------------------------
   DOWNLOAD SELECTED
---------------------------------- */
app.post("/api/download", async (req, res) => {
  const songs = await db.all(
    "SELECT * FROM songs WHERE selected = 1 AND downloaded = 0"
  );

  for (const song of songs) {
    await downloadSong(song);
    await db.run("UPDATE songs SET downloaded = 1 WHERE id = ?", song.id);
  }

  res.json({
    message: "Download complete",
    count: songs.length,
  });
});

/* ----------------------------------
   CLEAR DB (VERY IMPORTANT)
---------------------------------- */
app.post("/api/clear", async (req, res) => {
  const DOWNLOAD_DIR = "downloads";

  // 1️⃣ Delete all temp files
  if (fs.existsSync(DOWNLOAD_DIR)) {
    fs.readdirSync(DOWNLOAD_DIR).forEach((file) => {
      const filePath = path.join(DOWNLOAD_DIR, file);
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    });
  }

  // 2️⃣ Clear DB
  await db.exec("DELETE FROM songs");

  res.json({ message: "Database and temp files cleared" });
});

app.listen(4000, () => {
  console.log("🚀 Backend running on http://localhost:4000");
});

app.get("/api/progress", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const songs = await db.all(
    "SELECT * FROM songs WHERE selected = 1 AND downloaded = 0"
  );

  for (const song of songs) {
    const filename = await downloadSong(song, (progress) => {
      res.write(`data: ${JSON.stringify(progress)}\n\n`);
    });

    await db.run(
      "UPDATE songs SET downloaded = 1, filename = ? WHERE id = ?",
      filename,
      song.id
    );

    // 🔥 Tell frontend THIS song is ready
    res.write(
      `data: ${JSON.stringify({
        ready: true,
        id: song.id,
      })}\n\n`
    );
  }

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
});
