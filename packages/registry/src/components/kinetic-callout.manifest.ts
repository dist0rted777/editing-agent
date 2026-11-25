import { z } from "zod";
import type { ComponentManifest } from "@editing-agent/schema";

export const kineticCalloutPropsSchema = z.object({
  eyebrow: z.string().default("FEATURE").describe("Short uppercase label above the headline."),
  headline: z.string().min(1).describe("Feature name or benefit, ideally 2-5 words."),
  position: z
    .enum(["top-left", "top-right", "bottom-left", "bottom-right"])
    .default("bottom-left")
    .describe("Corner of the frame the callout card sits in."),
});
export type KineticCalloutProps = z.output<typeof kineticCalloutPropsSchema>;

export const kineticCalloutManifest: ComponentManifest = {
  id: "kinetic-callout",
  name: "Kinetic Feature Callout",
  source: "custom",
  category: "feature-callout",
  description:
    "Snappy lower-third or top-corner feature badge with spring entrance synced to a spoken keyword.",
  idealDurationSec: { min: 1.5, max: 4.0 },
  gpuHeavy: false,
  tags: ["saas", "clean", "product-demo", "callout"],
  propsExample: {
    eyebrow: "NEW FEATURE",
    headline: "Instant Sync",
    position: "bottom-left",
  },
};
