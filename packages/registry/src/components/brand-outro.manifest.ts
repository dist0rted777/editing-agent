import { z } from "zod";
import type { ComponentManifest } from "@editing-agent/schema";

export const brandOutroPropsSchema = z.object({
  tagline: z.string().default("").describe("Closing tagline under the company name; empty to hide."),
  cta: z.string().default("").describe("Call-to-action pill text; empty to hide."),
});
export type BrandOutroProps = z.output<typeof brandOutroPropsSchema>;

export const brandOutroManifest: ComponentManifest = {
  id: "brand-outro",
  name: "Clean Brand Outro",
  source: "custom",
  category: "outro",
  description:
    "Full-frame closing brand lockup with tagline and call-to-action pill for the final 2-3 seconds.",
  idealDurationSec: { min: 2.0, max: 3.5 },
  gpuHeavy: false,
  tags: ["outro", "cta", "brand", "ending"],
  propsExample: {
    tagline: "Build Smarter. Ship Faster.",
    cta: "Try it today",
  },
};
