import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import "dotenv/config";
import { registryCatalog } from "@editing-agent/registry";
import { BrandTokensSchema, EditBlueprintSchema } from "@editing-agent/schema";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");

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

app.get("/health", (c) => c.json({ ok: true, service: "editing-agent-api" }));

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

// Endpoint where the AI Director will validate & return a JSON EditBlueprint
app.post("/blueprint/validate", async (c) => {
  const body = await c.req.json();
  const parsed = EditBlueprintSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ valid: false, errors: parsed.error.flatten() }, 400);
  }
  return c.json({ valid: true, blueprint: parsed.data });
});

const port = Number(process.env.PORT ?? 4000);
console.log(`Editing Agent API listening on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
