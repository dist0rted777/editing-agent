import type { ComponentManifest } from "@editing-agent/schema";

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
