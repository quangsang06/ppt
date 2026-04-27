"use client";

import React from "react";
import { COLORS } from "@/app/constants/constants";

export const toolbarBtn: React.CSSProperties = {
  padding: "8px 14px",
  border: `1px solid ${COLORS.border}`,
  background: "#fff",
  cursor: "pointer",
  borderRadius: 4,
  fontSize: 12,
  fontFamily: "Georgia, serif",
  color: COLORS.ink,
  letterSpacing: 0.3,
  transition: "all 0.15s",
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 4,
  fontSize: 13,
  fontFamily: "Georgia, serif",
  color: COLORS.ink,
  background: "#fff",
  outline: "none",
  boxSizing: "border-box",
  resize: "vertical",
};

export const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontSize: 10,
      letterSpacing: 1.5,
      textTransform: "uppercase",
      color: COLORS.muted,
      marginBottom: 6,
    }}
  >
    {children}
  </div>
);

type PropRowProps = {
  label: string;
  value: string | number;
  type?: "text" | "number";
  readonly?: boolean;
  onChange?: (v: string | number) => void;
};

export const PropRow: React.FC<PropRowProps> = ({
  label,
  value,
  type = "text",
  readonly,
  onChange,
}) => (
  <div style={{ marginBottom: 12 }}>
    <Label>{label}</Label>
    {readonly ? (
      <div
        style={{
          fontSize: 13,
          color: COLORS.ink,
          padding: "8px 10px",
          background: COLORS.bg,
          borderRadius: 4,
          textTransform: "capitalize",
        }}
      >
        {value}
      </div>
    ) : (
      <input
        type={type}
        value={value}
        onChange={(e) => {
          const v = type === "number" ? Number(e.target.value) : e.target.value;
          onChange?.(v);
        }}
        style={inputStyle}
      />
    )}
  </div>
);

type ActionButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  small?: boolean;
};

export const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  onClick,
  danger,
  small,
}) => (
  <button
    onClick={onClick}
    style={{
      padding: small ? "6px 8px" : "10px 12px",
      flex: small ? 1 : "none",
      width: small ? "auto" : "100%",
      border: `1px solid ${danger ? "#A85751" : COLORS.border}`,
      background: "#fff",
      color: danger ? "#A85751" : COLORS.ink,
      cursor: "pointer",
      borderRadius: 4,
      fontSize: 12,
      fontFamily: "Georgia, serif",
      letterSpacing: 0.5,
      transition: "all 0.15s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = danger ? "#A85751" : COLORS.ink;
      e.currentTarget.style.color = "#fff";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "#fff";
      e.currentTarget.style.color = danger ? "#A85751" : COLORS.ink;
    }}
  >
    {children}
  </button>
);
