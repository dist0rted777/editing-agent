import React from "react";
import { AbsoluteFill } from "remotion";

export const MainComposition: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#09090B",
        color: "#FAFAFA",
        justifyContent: "center",
        alignItems: "center",
        fontSize: 56,
        fontFamily: "Inter, sans-serif",
      }}
    >
      Editing Agent Ready
    </AbsoluteFill>
  );
};
