"use client";

import dynamic from "next/dynamic";
import React from "react";

const PresentationApp = dynamic(() => import("./editor"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F5F1EA",
        color: "#6B6256",
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontStyle: "italic",
        fontSize: 14,
      }}
    >
      Loading editor…
    </div>
  ),
});

export default function FeatureEntry() {
  return <PresentationApp />;
}
