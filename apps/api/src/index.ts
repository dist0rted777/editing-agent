import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import { registryCatalog } from "@editing-agent/registry";
import { BrandTokensSchema, EditBlueprintSchema } from "@editing-agent/schema";
import { directEditBlueprint, transcribeAudio } from "./openrouter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

// pnpm --filter runs this from apps/api, so load the monorepo-root .env explicitly.
dotenv.config({ path: path.join(repoRoot, ".env") });

function loadBrand() {
  const brandPath = path.join(repoRoot, "packages/brand/brand.json");
  const raw = JSON.parse(fs.readFileSync(brandPath, "utf-8"));
  return BrandTokensSchema.parse(raw);
}

function loadSkills() {
  const skillsDir = path.join(repoRoot, "packages/skills");
  return fs
    .readdirSync(skillsDir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => ({
      id: file.replace(/\.md$/, ""),
      filename: file,
      content: fs.readFileSync(path.join(skillsDir, file), "utf-8"),
    }));
}

const app = new Hono();

app.get("/health", (c) =>
  c.json({
    ok: true,
    service: "editing-agent-api",
    openrouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
  })
);

app.get("/registry", (c) =>
  c.json({ count: registryCatalog.length, components: registryCatalog })
);

app.get("/skills", (c) => {
  const skills = loadSkills();
  return c.json({
    count: skills.length,
    skills: skills.map(({ id, filename }) => ({ id, filename })),
  });
});

app.get("/brand", (c) => c.json(loadBrand()));

app.post("/blueprint/validate", async (c) => {
  const body = await c.req.json();
  const parsed = EditBlueprintSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ valid: false, errors: parsed.error.flatten() }, 400);
  }
  return c.json({ valid: true, blueprint: parsed.data });
});

app.post("/transcribe", async (c) => {
  const { audioPath, language } = await c.req.json<{
    audioPath: string;
    language?: string;
  }>();
  const transcript = await transcribeAudio(audioPath, language);
  return c.json(transcript);
});

app.post("/direct", async (c) => {
  const body = await c.req.json<{
    projectId: string;
    proxyVideoPath: string;
    sourceVideoPath: string;
    styleSkillId: string;
    audioPath: string;
    language?: string;
    processingMode?: "static" | "agentic";
  }>();

  const skill = loadSkills().find((s) => s.id === body.styleSkillId);
  if (!skill) {
    return c.json({ error: `Unknown styleSkillId: ${body.styleSkillId}` }, 400);
  }

  const brand = loadBrand();
  const transcript = await transcribeAudio(body.audioPath, body.language);
  const blueprint = await directEditBlueprint({
    projectId: body.projectId,
    proxyVideoPath: body.proxyVideoPath,
    sourceVideoPath: body.sourceVideoPath,
    styleSkillId: skill.id,
    styleSkillMarkdown: skill.content,
    brand,
    registry: registryCatalog,
    transcript,
    processingMode: body.processingMode,
  });

  return c.json({ transcript, blueprint });
});

const port = Number(process.env.PORT ?? 4000);
console.log(`Editing Agent API listening on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
