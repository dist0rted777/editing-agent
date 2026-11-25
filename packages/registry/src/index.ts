import { ComponentManifestSchema, type ComponentManifest } from "@editing-agent/schema";
import { kineticCalloutManifest } from "./components/kinetic-callout.manifest";

// Drop imported Remocn / Remotion Elements / custom manifests here.
// The backend AI Director discovers them automatically on startup.
const rawCatalog: ComponentManifest[] = [
  kineticCalloutManifest,
];

export const registryCatalog: ComponentManifest[] = rawCatalog.map((entry) =>
  ComponentManifestSchema.parse(entry)
);

export function getComponentManifest(id: string): ComponentManifest | undefined {
  return registryCatalog.find((c) => c.id === id);
}
