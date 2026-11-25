import { z } from "zod";
import type { ComponentManifest } from "@editing-agent/schema";

export const statHighlightPropsSchema = z.object({
  value: z.string().min(1).describe('The metric itself, e.g. "3.4x", "99%", "$0".'),
  label: z.string().min(1).describe("What the metric measures."),
  sublabel: z.string().default("").describe("Optional supporting line; empty to hide."),
});
export type StatHighlightProps = z.output<typeof statHighlightPropsSchema>;

export const statHighlightManifest: ComponentManifest = {
  id: "stat-highlight",
  name: "Stat Proof Card",
  source: "custom",
  category: "stat-counter",
  description:
    "Centered spring-animated proof metric card for percentages, speed gains, or pricing highlights.",
  idealDurationSec: { min: 1.5, max: 3.5 },
  gpuHeavy: false,
  tags: ["stat", "metric", "proof", "saas", "number"],
  propsExample: {
    value: "3.4x",
    label: "Faster Render Turnaround",
    sublabel: "Benchmarked locally",
  },
};
