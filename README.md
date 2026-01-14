# 🟢 Y2ME — Media Extraction Console

> **select · arm · extract**

Y2ME is a **local‑first YouTube media extraction console** built for power users.  
It runs entirely on your machine or local network and provides **real‑time download telemetry** with a terminal‑style UI.

No cloud. No trackers. Full control.

---

## ⚡ Features

- 🎧 Download **single videos, audio, or full playlists**
- 📡 **Real‑time progress updates** (speed, percentage, status)
- 🧠 Smart **playlist & single‑link detection**
- 🟢 Clear **Select → Arm → Extract** workflow
- 🗑 Automatic **temporary file cleanup**
- 📱 Accessible on **mobile & LAN**
- 🖥 Minimal **hacker‑style terminal UI**
- 🔒 Fully local — your data never leaves your machine

---

## 🧰 Tech Stack

- **Frontend:** React (Vite)
- **Backend:** Node.js + Express
- **Media Engine:** yt‑dlp + ffmpeg
- **Database:** SQLite
- **Transport:** Server‑Sent Events (SSE)

---

## 📦 Prerequisites

Ensure the following are installed:

- **Node.js** (v18+ recommended)
- **ffmpeg**
- **yt‑dlp**

> **Windows users:**  
> Make sure `ffmpeg` and `yt‑dlp` are available in your system PATH  
> or configure their absolute paths in `server/downloader.js`.

---

## 🚀 Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/KIXSZH/Y2ME-SERVER.git
cd Y2ME-SERVER
```

### 2️⃣ Install backend dependencies

```bash
npm install
```

### 3️⃣ Start the backend server

```bash
node server.js
```

The backend will run at:

```
http://localhost:4000
```

---

## 🖥 Frontend Setup

If the frontend is located in a separate folder or repository:

```bash
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

Update the API base URL if accessing over LAN:

```js
const API = "http://<YOUR-IP>:4000/api";
```

---

## 🧠 How It Works

1. Paste a YouTube video or playlist URL
2. Click **ADD**
3. Select tracks (**🟢 ARMED**)
4. Click **DOWNLOAD**
5. Files download directly via the browser
6. Temporary server files are auto‑cleaned

Simple. Controlled. Fast.

---

## 🌐 LAN / Mobile Access

Run the server and open the frontend using your local IP address:

```
http://<your-local-ip>:5173
```

Works seamlessly on phones, tablets, and other devices on the same network.

---

## ⚠️ Notes

- Not designed for **cloud hosting**
- Intended for **local or intranet use**
- Free‑tier platforms often block `ffmpeg` and long‑running jobs
- Best suited as a **personal or internal utility**

---

## 🧑‍💻 Author

**Built by KISHOREKUMAR A ⚡**

A local tool for people who prefer **control over convenience**.
