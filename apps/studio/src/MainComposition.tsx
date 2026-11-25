import React from "react";
import { AbsoluteFill, Sequence, staticFile } from "remotion";
import { Video } from "@remotion/media";
import { z } from "zod";
import type { BrandTokens, EditBlueprint } from "@editing-agent/schema";
import { studioRegistry } from "@editing-agent/registry/studio";

export type MainCompositionProps = {
  blueprint: EditBlueprint;
  brand: BrandTokens;
};

// Shown in place of a scene whose props fail validation, so bad director
// output is visible in the preview instead of rendering blank or "[object Object]".
const SceneError: React.FC<{ message: string }> = ({ message }) => (
  <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", padding: 60 }}>
    <pre
      style={{
        backgroundColor: "#7F1D1D",
        color: "#FEE2E2",
        fontSize: 28,
        padding: 32,
        borderRadius: 16,
        whiteSpace: "pre-wrap",
        maxWidth: "100%",
      }}
    >
      {message}
    </pre>
  </AbsoluteFill>
);

function resolveMediaSrc(videoPath: string): string {
  if (videoPath.startsWith("http://") || videoPath.startsWith("https://")) {
    return videoPath;
  }
  return staticFile(videoPath.replace(/^\/+/, ""));
}

export const MainComposition: React.FC<MainCompositionProps> = ({
  blueprint,
  brand,
}) => {
  const fps = blueprint.fps;
  const hasVideo = Boolean(blueprint.sourceVideoPath && blueprint.sourceVideoPath.trim());

  return (
    <AbsoluteFill style={{ backgroundColor: brand.colors.background }}>
      {blueprint.scenes.map((scene) => {
        const fromFrame = Math.round(scene.startSec * fps);
        const durationInFrames = Math.max(1, Math.round(scene.durationSec * fps));
        const entry = studioRegistry[scene.componentId];
        const parsedProps = entry?.propsSchema.safeParse(scene.props);
        const trimBeforeFrames = scene.sourceClip
          ? Math.round(scene.sourceClip.startInSourceSec * fps)
          : fromFrame;
        const playbackRate = scene.sourceClip?.playbackRate ?? 1;

        return (
          <Sequence
            key={scene.id}
            name={scene.id + " (" + scene.componentId + ")"}
            from={fromFrame}
            durationInFrames={durationInFrames}
          >
            {hasVideo && scene.componentId !== "brand-outro" ? (
              <AbsoluteFill>
                <Video
                  src={resolveMediaSrc(blueprint.sourceVideoPath)}
                  trimBefore={trimBeforeFrames}
                  playbackRate={playbackRate}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </AbsoluteFill>
            ) : null}

            {entry && parsedProps?.success ? (
              <entry.component
                brand={brand}
                props={parsedProps.data}
                durationInFrames={durationInFrames}
              />
            ) : (
              <SceneError
                message={
                  entry
                    ? `Invalid props for "${scene.componentId}" in ${scene.id}:\n` +
                      (parsedProps?.error ? z.prettifyError(parsedProps.error) : "")
                    : `Unregistered componentId "${scene.componentId}" in ${scene.id}`
                }
              />
            )}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
