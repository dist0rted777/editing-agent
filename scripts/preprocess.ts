import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: pnpm preprocess <path-to-raw-video>");
  process.exit(1);
}

const resolvedInput = path.resolve(inputPath);
const baseName = path.basename(resolvedInput, path.extname(resolvedInput));
const outDir = path.resolve("uploads", baseName);
fs.mkdirSync(outDir, { recursive: true });

const proxyPath = path.join(outDir, "proxy-720p.mp4");
const audioPath = path.join(outDir, "audio-16k.mp3");

console.log("1/2 Generating lightweight 720p editing proxy...");
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-i",
    resolvedInput,
    "-vf",
    "scale=-2:720",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "26",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    proxyPath,
  ],
  { stdio: "inherit" }
);

console.log("2/2 Extracting compact 16kHz mono MP3 for OpenRouter transcription...");
execFileSync(
  "ffmpeg",
  [
    "-y",
    "-i",
    resolvedInput,
    "-vn",
    "-acodec",
    "libmp3lame",
    "-ar",
    "16000",
    "-ac",
    "1",
    "-b:a",
    "64k",
    audioPath,
  ],
  { stdio: "inherit" }
);

console.log("Done:", { proxyPath, audioPath });
