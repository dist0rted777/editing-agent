import fs from "node:fs";
import path from "node:path";
import {
  EditBlueprintSchema,
  type BrandTokens,
  type EditBlueprint,
} from "@editing-agent/schema";
import { validateSceneProps, type RegistryCatalogEntry } from "@editing-agent/registry";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

function getHeaders(): Record<string, string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY in .env");
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:4000",
    "X-OpenRouter-Title": process.env.OPENROUTER_APP_NAME ?? "editing-agent",
  };
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface TranscriptResult {
  text: string;
  duration?: number;
  language?: string;
  words: WordTimestamp[];
  segments: Array<{ start: number; end: number; text: string }>;
}

export async function transcribeAudio(
  audioFilePath: string,
  language?: string
): Promise<TranscriptResult> {
  const resolved = path.resolve(audioFilePath);
  const ext = path.extname(resolved).replace(".", "").toLowerCase() || "mp3";
  const base64Audio = fs.readFileSync(resolved).toString("base64");

  const res = await fetch(`${OPENROUTER_BASE_URL}/audio/transcriptions`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: process.env.OPENROUTER_STT_MODEL ?? "openai/whisper-large-v3-turbo",
      input_audio: {
        data: base64Audio,
        format: ext,
      },
      ...(language ? { language } : {}),
      response_format: "verbose_json",
      timestamp_granularities: ["segment", "word"],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter STT failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as {
    text: string;
    duration?: number;
    language?: string;
    words?: WordTimestamp[];
    segments?: Array<{ start: number; end: number; text: string }>;
  };

  return {
    text: data.text,
    duration: data.duration,
    language: data.language,
    words: data.words ?? [],
    segments: data.segments ?? [],
  };
}

const DIRECTOR_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["scenes"],
  properties: {
    scenes: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: [
          "id",
          "startSec",
          "durationSec",
          "componentId",
          "sourceClipStartSec",
          "playbackRate",
          "propsJson",
          "directorNote",
        ],
        properties: {
          id: { type: "string" },
          startSec: { type: "number" },
          durationSec: { type: "number" },
          componentId: { type: "string" },
          sourceClipStartSec: { type: "number" },
          playbackRate: { type: "number" },
          propsJson: {
            type: "string",
            description: "Valid JSON string matching the selected component's propsJsonSchema.",
          },
          directorNote: { type: "string" },
        },
      },
    },
  },
} as const;

export interface DirectVideoInput {
  projectId: string;
  proxyVideoPath: string;
  sourceVideoPath: string;
  styleSkillId: string;
  styleSkillMarkdown: string;
  brand: BrandTokens;
  registry: RegistryCatalogEntry[];
  transcript: TranscriptResult;
  processingMode?: "static" | "agentic";
}

export async function directEditBlueprint(
  input: DirectVideoInput
): Promise<EditBlueprint> {
  const videoB64 = fs.readFileSync(path.resolve(input.proxyVideoPath)).toString("base64");
  const validComponentIds = new Set(input.registry.map((c) => c.id));

  const systemPrompt = [
    "You are an expert motion-graphics video director.",
    "You NEVER write React or animation code. You output ONLY a JSON scene timeline using registered components.",
    `Allowed componentId values: ${JSON.stringify([...validComponentIds])}`,
    "",
    "=== STYLE SKILL ===",
    input.styleSkillMarkdown,
    "",
    "=== COMPANY BRAND TOKENS ===",
    JSON.stringify(input.brand, null, 2),
    "",
    "=== REGISTERED MOTION COMPONENTS ===",
    JSON.stringify(input.registry, null, 2),
  ].join("\n");

  const userText = [
    "Watch the attached product video proxy and review the exact word-level transcript below.",
    "Design a tight, well-paced edit blueprint synced to spoken beats and visual moments.",
    "For each scene, encode its component props as a valid JSON string inside `propsJson` that satisfies that component's `propsJsonSchema` (see `propsExample` for a sample).",
    "",
    "=== TRANSCRIPT (WORD TIMESTAMPS) ===",
    JSON.stringify({
      text: input.transcript.text,
      duration: input.transcript.duration,
      words: input.transcript.words,
    }),
  ].join("\n");

  const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      model: process.env.OPENROUTER_DIRECTOR_MODEL ?? "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userText },
            {
              type: "video_url",
              video_url: {
                url: `data:video/mp4;base64,${videoB64}`,
                processing: input.processingMode ?? "static",
              },
            },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "edit_blueprint_scenes",
          strict: true,
          schema: DIRECTOR_JSON_SCHEMA,
        },
      },
      provider: {
        require_parameters: true,
      },
      plugins: [{ id: "response-healing" }],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenRouter Director failed (${res.status}): ${await res.text()}`);
  }

  const completion = (await res.json()) as {
    choices?: Array<{
      finish_reason?: string;
      message?: { content?: string };
    }>;
  };

  const choice = completion.choices?.[0];
  if (choice?.finish_reason === "length") {
    throw new Error("Director response was truncated (finish_reason=length).");
  }

  const rawContent = choice?.message?.content;
  if (!rawContent) {
    throw new Error("OpenRouter returned an empty director response.");
  }

  const parsedRaw = JSON.parse(rawContent) as {
    scenes: Array<{
      id: string;
      startSec: number;
      durationSec: number;
      componentId: string;
      sourceClipStartSec: number;
      playbackRate: number;
      propsJson: string;
      directorNote: string;
    }>;
  };

  const hydratedScenes = parsedRaw.scenes.map((scene) => {
    if (!validComponentIds.has(scene.componentId)) {
      throw new Error(`Director selected unregistered componentId: "${scene.componentId}"`);
    }
    let rawProps: unknown;
    try {
      rawProps = JSON.parse(scene.propsJson);
    } catch {
      throw new Error(`Director returned invalid propsJson for scene "${scene.id}": ${scene.propsJson}`);
    }
    const props = validateSceneProps(scene.componentId, rawProps);
    if (!props.success) {
      throw new Error(`Director scene "${scene.id}": ${props.error}`);
    }
    return {
      id: scene.id,
      startSec: scene.startSec,
      durationSec: scene.durationSec,
      componentId: scene.componentId,
      sourceClip: {
        startInSourceSec: scene.sourceClipStartSec,
        playbackRate: scene.playbackRate || 1,
      },
      props: props.data,
      directorNote: scene.directorNote,
    };
  });

  return EditBlueprintSchema.parse({
    version: "1.0",
    projectId: input.projectId,
    styleSkillId: input.styleSkillId,
    fps: input.brand.motion.fps,
    width: 1080,
    height: 1920,
    sourceVideoPath: input.sourceVideoPath,
    scenes: hydratedScenes,
  });
}
