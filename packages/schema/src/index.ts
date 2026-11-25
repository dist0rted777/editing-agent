import { z } from "zod";

export const RenderModeSchema = z.enum(["draft_proxy", "final_master"]);
export type RenderMode = z.infer<typeof RenderModeSchema>;

export const BrandTokensSchema = z.object({
  companyName: z.string(),
  colors: z.object({
    primary: z.string(),
    secondary: z.string(),
    background: z.string(),
    surface: z.string(),
    textPrimary: z.string(),
    textMuted: z.string(),
  }),
  typography: z.object({
    headingFont: z.string(),
    bodyFont: z.string(),
    monoFont: z.string().optional(),
  }),
  motion: z.object({
    defaultEasing: z.enum(["snappy", "smooth", "bouncy", "minimal"]),
    fps: z.number().int().default(30),
  }),
  assets: z.object({
    logoPath: z.string(),
  }),
});
export type BrandTokens = z.infer<typeof BrandTokensSchema>;

export const ComponentManifestSchema = z.object({
  id: z.string().min(1),
  name: z.string(),
  source: z.enum(["custom", "remocn", "remotion-elements", "community"]),
  category: z.enum([
    "hook",
    "kinetic-text",
    "feature-callout",
    "stat-counter",
    "device-frame",
    "transition",
    "outro",
  ]),
  description: z.string(),
  idealDurationSec: z.object({
    min: z.number().positive(),
    max: z.number().positive(),
  }),
  gpuHeavy: z.boolean().default(false),
  tags: z.array(z.string()),
  propsExample: z.record(z.unknown()),
});
export type ComponentManifest = z.infer<typeof ComponentManifestSchema>;

export const SceneSchema = z.object({
  id: z.string(),
  startSec: z.number().nonnegative(),
  durationSec: z.number().positive(),
  componentId: z.string(),
  sourceClip: z
    .object({
      startInSourceSec: z.number().nonnegative(),
      playbackRate: z.number().positive().default(1),
    })
    .optional(),
  props: z.record(z.unknown()),
  directorNote: z.string().optional(),
});
export type Scene = z.infer<typeof SceneSchema>;

export const EditBlueprintSchema = z.object({
  version: z.literal("1.0"),
  projectId: z.string(),
  styleSkillId: z.string(),
  fps: z.number().int().default(30),
  width: z.number().int().default(1080),
  height: z.number().int().default(1920),
  sourceVideoPath: z.string(),
  scenes: z.array(SceneSchema).min(1),
});
export type EditBlueprint = z.infer<typeof EditBlueprintSchema>;
