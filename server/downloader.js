import { spawn } from "child_process";
import fs from "fs";
import path from "path";

export function downloadSong(song, onProgress) {
  return new Promise(resolve => {
    const DOWNLOAD_DIR = path.resolve("downloads");
    let finalFilename = null;

    const proc = spawn("K:/yt-dlp/yt-dlp.exe", [
      "--no-playlist",
      "--newline",
      "--extract-audio",
      "--audio-format", "mp3",
      "-o", "downloads/%(title)s.%(ext)s",
      song.url
    ]);

    proc.stdout.on("data", data => {
      const line = data.toString();

      // Progress parsing (unchanged)
      const match = line.match(
        /\[download\]\s+(\d+(\.\d+)?)%.*?at\s+([\d.]+)(\w+\/s)/
      );

      if (match && onProgress) {
        onProgress({
          id: song.id,
          percent: Number(match[1]),
          speed: `${match[3]}${match[4]}`
        });
      }
    });

    proc.on("close", () => {
      // 🔥 Find the REAL file on disk
      const files = fs.readdirSync(DOWNLOAD_DIR)
        .filter(f => f.toLowerCase().endsWith(".mp3"));

      // Pick newest mp3
      files.sort((a, b) =>
        fs.statSync(path.join(DOWNLOAD_DIR, b)).mtimeMs -
        fs.statSync(path.join(DOWNLOAD_DIR, a)).mtimeMs
      );

      finalFilename = files[0]; // most recent

      resolve(finalFilename);
    });
  });
}
