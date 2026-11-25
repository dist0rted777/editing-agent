import { z } from "zod";
import { ComponentManifestSchema, type ComponentManifest } from "@editing-agent/schema";
import { kineticHookManifest, kineticHookPropsSchema } from "./components/kinetic-hook.manifest";
import {
  kineticCalloutManifest,
  kineticCalloutPropsSchema,
} from "./components/kinetic-callout.manifest";
import {
  statHighlightManifest,
  statHighlightPropsSchema,
} from "./components/stat-highlight.manifest";
import { brandOutroManifest, brandOutroPropsSchema } from "./components/brand-outro.manifest";

// Pure TypeScript manifests only (zero React imports).
// Add imported Remocn / Remotion Elements / custom manifests here, each with its props schema.
const rawEntries: Array<{ manifest: ComponentManifest; propsSchema: z.ZodType }> = [
  { manifest: kineticHookManifest, propsSchema: kineticHookPropsSchema },
  { manifest: kineticCalloutManifest, propsSchema: kineticCalloutPropsSchema },
  { manifest: statHighlightManifest, propsSchema: statHighlightPropsSchema },
  { manifest: brandOutroManifest, propsSchema: brandOutroPropsSchema },
];

const propsSchemas = new Map<string, z.ZodType>();
for (const { manifest, propsSchema } of rawEntries) {
  if (propsSchemas.has(manifest.id)) {
    throw new Error(`Duplicate registry componentId: "${manifest.id}"`);
  }
  const example = propsSchema.safeParse(manifest.propsExample);
  if (!example.success) {
    throw new Error(
      `propsExample for "${manifest.id}" does not match its propsSchema:\n` +
        z.prettifyError(example.error)
    );
  }
  propsSchemas.set(manifest.id, propsSchema);
}

export type RegistryCatalogEntry = ComponentManifest & {
  /** JSON Schema of the props the director may send for this component. */
  propsJsonSchema: Record<string, unknown>;
};

export const registryCatalog: RegistryCatalogEntry[] = rawEntries.map(
  ({ manifest, propsSchema }) => ({
    ...ComponentManifestSchema.parse(manifest),
    propsJsonSchema: z.toJSONSchema(propsSchema, { io: "input" }) as Record<string, unknown>,
  })
);

export function getComponentManifest(id: string): RegistryCatalogEntry | undefined {
  return registryCatalog.find((c) => c.id === id);
}

export type ScenePropsResult =
  | { success: true; data: Record<string, unknown> }
  | { success: false; error: string };

/** Validates raw scene props against the component's schema and fills in defaults. */
export function validateSceneProps(componentId: string, rawProps: unknown): ScenePropsResult {
  const schema = propsSchemas.get(componentId);
  if (!schema) {
    return { success: false, error: `Unregistered componentId: "${componentId}"` };
  }
  const parsed = schema.safeParse(rawProps);
  if (!parsed.success) {
    return {
      success: false,
      error: `Invalid props for "${componentId}":\n` + z.prettifyError(parsed.error),
    };
  }
  return { success: true, data: parsed.data as Record<string, unknown> };
}
