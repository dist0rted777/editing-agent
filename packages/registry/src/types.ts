import type React from "react";
import type { z } from "zod";
import type { BrandTokens } from "@editing-agent/schema";

export type RegistryComponentProps<P = Record<string, unknown>> = {
  brand: BrandTokens;
  props: P;
  durationInFrames: number;
};

export type StudioRegistryComponent<P = Record<string, unknown>> = React.FC<
  RegistryComponentProps<P>
>;

export type StudioRegistryEntry = {
  propsSchema: z.ZodType;
  // Props are validated against propsSchema before render, so the component
  // receives exactly the schema's output type (see defineStudioComponent).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component: StudioRegistryComponent<any>;
};

/** Pairs a component with its props schema; the compiler checks they agree. */
export function defineStudioComponent<S extends z.ZodType>(
  propsSchema: S,
  component: StudioRegistryComponent<z.output<S>>
): StudioRegistryEntry {
  return { propsSchema, component };
}
