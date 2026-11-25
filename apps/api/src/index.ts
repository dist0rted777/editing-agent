import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { serve } from "@hono/node-server";
import dotenv from "dotenv";
import { z } from "zod";
import { registryCatalog, validateSceneProps } from "@editing-agent/registry";
import { BrandTokensSchema, EditBlueprintSchema } from "@editing-agent/schema";
import { directEditBlueprint, transcribeAudio } from "./openrouter";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

// pnpm --filter runs this from apps/api, so load the monorepo-root .env explicitly.
dotenv.config({ path: path.join(repoRoot, ".env") });

// Media may only be read from the folders `pnpm preprocess` writes to. Anything else
// would let a caller make the API upload arbitrary local files to OpenRouter.
const MEDIA_ROOTS = [
  path.join(repoRoot, "uploads"),
  path.join(repoRoot, "apps/studio/public/uploads"),
];

function resolveMediaPath(field: string, requested: string): string {
  let real: string;
  try {
    real = fs.realpathSync(path.resolve(repoRoot, requested));
  } catch {
    throw new HTTPException(400, { message: `${field}: file not found: ${requested}` });
  }
  const allowed = MEDIA_ROOTS.some((root) => {
    const rel = path.relative(root, real);
    return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
  });
  if (!allowed) {
    throw new HTTPException(400, {
      message: `${field} must point inside uploads/ or apps/studio/public/uploads/`,
    });
  }
  return real;
}

async function readBody<S extends z.ZodType>(c: Context, schema: S): Promise<z.output<S>> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    throw new HTTPException(400, { message: "Request body must be valid JSON" });
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new HTTPException(400, { message: z.prettifyError(parsed.error) });
  }
  return parsed.data;
}

const TranscribeBodySchema = z.object({
  audioPath: z.string().min(1),
  language: z.string().optional(),
});

const DirectBodySchema = z.object({
  projectId: z.string().min(1),
  proxyVideoPath: z.string().min(1),
  sourceVideoPath: z.string().min(1),
  styleSkillId: z.string().min(1),
  audioPath: z.string().min(1),
  language: z.string().optional(),
  processingMode: z.enum(["static", "agentic"]).optional(),
});

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

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  console.error(err);
  return c.json({ error: err.message || "Internal Server Error" }, 500);
});

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
  const body = await readBody(c, z.unknown());
  const parsed = EditBlueprintSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ valid: false, errors: z.flattenError(parsed.error) }, 400);
  }
  const propErrors = parsed.data.scenes.flatMap((scene) => {
    const result = validateSceneProps(scene.componentId, scene.props);
    return result.success ? [] : [{ sceneId: scene.id, error: result.error }];
  });
  if (propErrors.length > 0) {
    return c.json({ valid: false, propErrors }, 400);
  }
  return c.json({ valid: true, blueprint: parsed.data });
});

app.post("/transcribe", async (c) => {
  const body = await readBody(c, TranscribeBodySchema);
  const audioPath = resolveMediaPath("audioPath", body.audioPath);
  const transcript = await transcribeAudio(audioPath, body.language);
  return c.json(transcript);
});

app.post("/direct", async (c) => {
  const body = await readBody(c, DirectBodySchema);
  const audioPath = resolveMediaPath("audioPath", body.audioPath);
  const proxyVideoPath = resolveMediaPath("proxyVideoPath", body.proxyVideoPath);

  const skill = loadSkills().find((s) => s.id === body.styleSkillId);
  if (!skill) {
    throw new HTTPException(400, { message: "Unknown styleSkillId: " + body.styleSkillId });
  }

  const brand = loadBrand();
  const transcript = await transcribeAudio(audioPath, body.language);
  const blueprint = await directEditBlueprint({
    projectId: body.projectId,
    proxyVideoPath,
    sourceVideoPath: body.sourceVideoPath,
    styleSkillId: skill.id,
    styleSkillMarkdown: skill.content,
    brand,
    registry: registryCatalog,
    transcript,
    processingMode: body.processingMode,
  });

  // Save directly so Remotion Studio live-reloads the directed edit
  const activeBlueprintPath = path.join(
    repoRoot,
    "apps/studio/src/active-blueprint.json"
  );
  fs.writeFileSync(
    activeBlueprintPath,
    JSON.stringify(blueprint, null, 2) + "\n",
    "utf-8"
  );

  return c.json({
    savedTo: "apps/studio/src/active-blueprint.json",
    transcript,
    blueprint,
  });
});

const port = Number(process.env.PORT ?? 4000);
// Bind to loopback only: this API reads local files and spends your OpenRouter credits.
const hostname = process.env.HOST ?? "127.0.0.1";
serve({ fetch: app.fetch, port, hostname }, () => {
  console.log(`Editing Agent API listening on http://${hostname}:${port}`);
});
