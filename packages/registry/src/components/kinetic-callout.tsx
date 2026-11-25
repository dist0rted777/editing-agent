import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { RegistryComponentProps } from "../types";
import type { KineticCalloutProps } from "./kinetic-callout.manifest";

export const KineticCallout: React.FC<RegistryComponentProps<KineticCalloutProps>> = ({
  brand,
  props,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { eyebrow, headline, position } = props;

  const enter = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 210 },
  });

  const exit = interpolate(
    frame,
    [Math.max(0, durationInFrames - 8), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const slideY = interpolate(enter, [0, 1], [36, 0]);
  const isTop = position.startsWith("top");
  const isRight = position.endsWith("right");

  return (
    <AbsoluteFill
      style={{
        justifyContent: isTop ? "flex-start" : "flex-end",
        alignItems: isRight ? "flex-end" : "flex-start",
        padding: isTop ? "140px 64px" : "200px 64px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          backgroundColor: brand.colors.surface,
          borderLeft: "8px solid " + brand.colors.primary,
          borderRadius: 20,
          padding: "28px 40px",
          maxWidth: 820,
          opacity: enter * exit,
          transform: "translateY(" + slideY + "px)",
        }}
      >
        <div
          style={{
            fontFamily: brand.typography.monoFont ?? brand.typography.bodyFont,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: brand.colors.secondary,
            marginBottom: 8,
          }}
        >
          {eyebrow}
        </div>
        <div
          style={{
            fontFamily: brand.typography.headingFont,
            fontSize: 52,
            fontWeight: 700,
            lineHeight: 1.15,
            color: brand.colors.textPrimary,
          }}
        >
          {headline}
        </div>
      </div>
    </AbsoluteFill>
  );
};
