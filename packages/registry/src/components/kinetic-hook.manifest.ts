import { z } from "zod";
import type { ComponentManifest } from "@editing-agent/schema";

export const kineticHookPropsSchema = z.object({
  kicker: z.string().default("").describe("Small uppercase line above the headline; empty to hide."),
  headline: z.string().min(1).describe("Main hook headline, ideally 3-7 words."),
  overlay: z
    .boolean()
    .default(true)
    .describe("true = translucent scrim over the source video; false = solid brand background."),
});
export type KineticHookProps = z.output<typeof kineticHookPropsSchema>;

export const kineticHookManifest: ComponentManifest = {
  id: "kinetic-hook",
  name: "Kinetic Opening Hook",
  source: "custom",
  category: "hook",
  description:
    "High-impact staggered headline with brand accent bar for opening 2-4 seconds or major section pivots.",
  idealDurationSec: { min: 1.8, max: 4.0 },
  gpuHeavy: false,
  tags: ["hook", "intro", "headline", "saas", "kinetic"],
  propsExample: {
    kicker: "MEET THE NEW WORKFLOW",
    headline: "Ship Product Demos 10x Faster",
    overlay: true,
  },
};
