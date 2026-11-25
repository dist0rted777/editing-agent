import React from "react";
import { Composition, type CalculateMetadataFunction } from "remotion";
import { BrandTokensSchema, EditBlueprintSchema } from "@editing-agent/schema";
import { MainComposition, type MainCompositionProps } from "./MainComposition";
import rawBlueprint from "./active-blueprint.json";
import rawBrand from "../../../packages/brand/brand.json";

const defaultBlueprint = EditBlueprintSchema.parse(rawBlueprint);
const defaultBrand = BrandTokensSchema.parse(rawBrand);

const calculateMetadata: CalculateMetadataFunction<MainCompositionProps> = ({
  props,
}) => {
  const { blueprint } = props;
  const maxEndSec = blueprint.scenes.reduce(
    (max, scene) => Math.max(max, scene.startSec + scene.durationSec),
    3
  );
  return {
    durationInFrames: Math.max(1, Math.ceil(maxEndSec * blueprint.fps)),
    fps: blueprint.fps,
    width: blueprint.width,
    height: blueprint.height,
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MainComposition"
      component={MainComposition}
      durationInFrames={300}
      fps={defaultBlueprint.fps}
      width={defaultBlueprint.width}
      height={defaultBlueprint.height}
      defaultProps={{
        blueprint: defaultBlueprint,
        brand: defaultBrand,
      }}
      calculateMetadata={calculateMetadata}
    />
  );
};
