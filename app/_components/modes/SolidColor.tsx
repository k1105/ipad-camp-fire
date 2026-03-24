"use client";

interface SolidColorProps {
  color: string;
}

export function SolidColor({ color }: SolidColorProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: color,
      }}
    />
  );
}
