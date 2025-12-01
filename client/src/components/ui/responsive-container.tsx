import React from "react";

interface ResponsiveContainerProps {
  children: React.ReactNode;
  className?: string;
  centered?: boolean;
  width?: string; // e.g., "100%", "80%", "90%"
  withPadding?: boolean;
}

/**
 * Responsive Container Component
 * Renders content at 100% of the screen width (full-bleed) by default
 * Automatically centers horizontally and handles responsive scaling
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = "",
  centered = false,
  width = "100%",
  withPadding = false,
}) => {
  const baseStyles = `
    ${width ? `width: ${width};` : "width: 100%;"}
    ${centered ? "margin-left: auto; margin-right: auto;" : ""}
    ${withPadding ? "padding: 0 1rem;" : ""}
  `;

  return (
    <div
      className={`${className}`}
      style={{
        width: width || "100%",
        maxWidth: "100%",
      }}
    >
      {children}
    </div>
  );
};

export default ResponsiveContainer;
