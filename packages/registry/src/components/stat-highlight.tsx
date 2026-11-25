import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { RegistryComponentProps } from "../types";
import type { StatHighlightProps } from "./stat-highlight.manifest";

export const StatHighlight: React.FC<RegistryComponentProps<StatHighlightProps>> = ({
  brand,
  props,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { value, label, sublabel } = props;

  const pop = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 190 },
  });

  const exit = interpolate(
    frame,
    [Math.max(0, durationInFrames - 8), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const scale = interpolate(pop, [0, 1], [0.88, 1]);

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        padding: 72,
      }}
    >
      <div
        style={{
          backgroundColor: brand.colors.surface,
          border: "2px solid " + brand.colors.primary,
          borderRadius: 32,
          padding: "56px 72px",
          textAlign: "center",
          opacity: pop * exit,
          transform: "scale(" + scale + ")",
        }}
      >
        <div
          style={{
            fontFamily: brand.typography.headingFont,
            fontSize: 132,
            fontWeight: 900,
            lineHeight: 1,
            color: brand.colors.primary,
            marginBottom: 20,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontFamily: brand.typography.headingFont,
            fontSize: 44,
            fontWeight: 700,
            color: brand.colors.textPrimary,
          }}
        >
          {label}
        </div>
        {sublabel ? (
          <div
            style={{
              fontFamily: brand.typography.bodyFont,
              fontSize: 28,
              color: brand.colors.textMuted,
              marginTop: 12,
            }}
          >
            {sublabel}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
