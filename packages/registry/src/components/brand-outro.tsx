import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import type { RegistryComponentProps } from "../types";
import type { BrandOutroProps } from "./brand-outro.manifest";

export const BrandOutro: React.FC<RegistryComponentProps<BrandOutroProps>> = ({ brand, props }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const { tagline, cta } = props;

  const reveal = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 170 },
  });

  const ctaReveal = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 15, stiffness: 190 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: brand.colors.background,
        justifyContent: "center",
        alignItems: "center",
        padding: 80,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: brand.typography.headingFont,
          fontSize: 92,
          fontWeight: 900,
          letterSpacing: "-0.02em",
          color: brand.colors.textPrimary,
          opacity: reveal,
          transform: "translateY(" + interpolate(reveal, [0, 1], [30, 0]) + "px)",
        }}
      >
        {brand.companyName}
      </div>

      {tagline ? (
        <div
          style={{
            fontFamily: brand.typography.bodyFont,
            fontSize: 38,
            color: brand.colors.textMuted,
            marginTop: 20,
            opacity: reveal,
          }}
        >
          {tagline}
        </div>
      ) : null}

      {cta ? (
        <div
          style={{
            marginTop: 48,
            backgroundColor: brand.colors.primary,
            color: brand.colors.textPrimary,
            fontFamily: brand.typography.headingFont,
            fontSize: 34,
            fontWeight: 700,
            padding: "22px 52px",
            borderRadius: 999,
            opacity: ctaReveal,
            transform: "scale(" + interpolate(ctaReveal, [0, 1], [0.9, 1]) + ")",
          }}
        >
          {cta}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
