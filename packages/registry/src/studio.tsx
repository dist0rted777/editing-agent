import { defineStudioComponent, type StudioRegistryEntry } from "./types";
import { KineticHook } from "./components/kinetic-hook";
import { KineticCallout } from "./components/kinetic-callout";
import { StatHighlight } from "./components/stat-highlight";
import { BrandOutro } from "./components/brand-outro";
import { kineticHookPropsSchema } from "./components/kinetic-hook.manifest";
import { kineticCalloutPropsSchema } from "./components/kinetic-callout.manifest";
import { statHighlightPropsSchema } from "./components/stat-highlight.manifest";
import { brandOutroPropsSchema } from "./components/brand-outro.manifest";

// Maps componentId from EditBlueprint -> Remotion React Component + its props schema.
// When importing community blocks (Remocn / Remotion Elements), register them here.
export const studioRegistry: Record<string, StudioRegistryEntry> = {
  "kinetic-hook": defineStudioComponent(kineticHookPropsSchema, KineticHook),
  "kinetic-callout": defineStudioComponent(kineticCalloutPropsSchema, KineticCallout),
  "stat-highlight": defineStudioComponent(statHighlightPropsSchema, StatHighlight),
  "brand-outro": defineStudioComponent(brandOutroPropsSchema, BrandOutro),
};

export type {
  RegistryComponentProps,
  StudioRegistryComponent,
  StudioRegistryEntry,
} from "./types";
