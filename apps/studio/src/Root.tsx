import React from "react";
import { Composition } from "remotion";
import { MainComposition } from "./MainComposition";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="MainComposition"
      component={MainComposition}
      durationInFrames={150}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
