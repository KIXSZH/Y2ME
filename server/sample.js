import ytpl from "@distube/ytpl";
import fs from "fs";
import { db } from "./db.js";
import { downloadSong } from "./downloader.js";

const PLAYLIST_ID = "PLreYBLWGqZzyuDslDBKKLwywrKaJd3Rql";

if (!fs.existsSync("downloads")) {
  fs.mkdirSync("downloads");
}

async function main() {
  console.log("📥 Fetching playlist...");

  const playlist = await ytpl(PLAYLIST_ID, { limit: Infinity });

  let count = 0;

  for (const item of playlist.items) {
    if (!item.url || !item.url.startsWith("http")) {
      console.log(`⏭️ Skipping unavailable: ${item.title}`);
      continue;
    }

    await db.run(
      "INSERT OR IGNORE INTO songs (title, url) VALUES (?, ?)",
      item.title,
      item.url
    );

    count++;
  }

  console.log(`✅ Stored ${count} songs`);

  const songs = await db.all("SELECT * FROM songs ORDER BY id");

  for (const song of songs) {
    await downloadSong(song);
  }

  console.log("\n🎉 All downloads completed");
}

main();
