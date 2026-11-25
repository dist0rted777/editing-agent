import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { RegistryComponentProps } from "../types";
import type { KineticHookProps } from "./kinetic-hook.manifest";

export const KineticHook: React.FC<RegistryComponentProps<KineticHookProps>> = ({
  brand,
  props,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { kicker, headline, overlay } = props;
  const words = headline.split(" ");

  const exitOpacity = interpolate(
    frame,
    [Math.max(0, durationInFrames - 10), durationInFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const barScale = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 200 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: overlay ? "rgba(9, 9, 11, 0.58)" : brand.colors.background,
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "0 84px",
        opacity: exitOpacity,
      }}
    >
      <div
        style={{
          width: 96,
          height: 8,
          borderRadius: 999,
          backgroundColor: brand.colors.primary,
          transform: "scaleX(" + barScale + ")",
          transformOrigin: "left center",
          marginBottom: 28,
        }}
      />

      {kicker ? (
        <div
          style={{
            fontFamily: brand.typography.monoFont ?? brand.typography.bodyFont,
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: brand.colors.secondary,
            marginBottom: 20,
            opacity: interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          {kicker}
        </div>
      ) : null}

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "12px 22px",
          fontFamily: brand.typography.headingFont,
          fontSize: 84,
          fontWeight: 800,
          lineHeight: 1.08,
          color: brand.colors.textPrimary,
        }}
      >
        {words.map((word, index) => {
          const progress = spring({
            frame: Math.max(0, frame - index * 3),
            fps,
            config: { damping: 15, stiffness: 180 },
          });
          const translateY = interpolate(progress, [0, 1], [42, 0]);
          return (
            <span
              key={index}
              style={{
                display: "inline-block",
                opacity: progress,
                transform: "translateY(" + translateY + "px)",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
