import React, { SVGProps } from "react";

// 1. Define the props interface for type safety.
// We extend React.SVGProps<SVGSVGElement> to automatically include
// all standard SVG attributes (like 'role', 'aria-label', etc.) without
// having to list them manually. This is a best practice.
export interface LogoIconProps extends SVGProps<SVGSVGElement> {
  /**
   * Optional CSS class name for the wrapper SVG.
   */
  className?: string;

  /**
   * Color for the primary elements. Defaults to 'currentColor' for easy inheritance.
   */
  fill?: string;

  /**
   * The width and height of the icon.
   */
  size?: number | string;

  /**
   * Optional inline style object for the wrapper SVG.
   */
  style?: React.CSSProperties;
}

/**
 * A reusable, type-safe React component for the provided SVG logo icon.
 * It is designed to be highly customizable while preserving the original SVG structure.
 * * @param {LogoIconProps} props - The component props, including standard SVG attributes.
 * @returns {React.ReactElement} The rendered SVG icon.
 */
export const LogoIcon = ({
  className,
  fill = "currentColor",
  size = 48,
  style,
  ...rest
}: LogoIconProps): React.ReactElement => {
  // The original SVG had hardcoded width/height and used fill="#fff".
  // The component ensures size is set via props and allows fill color to be customized.

  const finalStyle: React.CSSProperties = {
    // We explicitly type the style object for safety
    ...style,
  };

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      style={finalStyle}
      // Spread the 'rest' properties (from SVGProps) onto the root element
      {...rest}
    >
      <g fill={fill}>
        {/* Main shape: original fill was #fff */}
        <path d="m35.8177 36.8043c-.5005 1.0368-1.5503 1.6957-2.7016 1.6957h-16.3076c-2.2193 0-3.6703-2.3261-2.6944-4.3193l11.2624-23c.5037-1.0286 1.5491-1.6807 2.6944-1.6807h16.1486c2.212 0 3.6633 2.3122 2.7017 4.3042z" />

        {/* Secondary shape: original fill was #fff with opacity .5 */}
        <path
          d="m6.87054 26.7399c1.05114 2.3025 4.30556 2.3487 5.42166.077l6.3838-12.9941c.9793-1.9934-.4716-4.3228-2.6926-4.3228h-12.31585c-2.18399 0-3.6360556 2.2591-2.729061 4.2459z"
          opacity=".5"
        />
      </g>
    </svg>
  );
};

/**
 * Props for the LogoWithText component.
 */
export interface LogoWithTextProps {
  /**
   * Optional CSS class name for the wrapper div.
   */
  className?: string;

  /**
   * Size of the logo icon. Defaults to 40.
   */
  iconSize?: number | string;

  /**
   * Color for the logo icon. Defaults to 'currentColor'.
   */
  iconFill?: string;

  /**
   * Font size for the text. Defaults to '1.5rem'.
   */
  textSize?: string;

  /**
   * Optional inline style object for the wrapper div.
   */
  style?: React.CSSProperties;
}

/**
 * A logo component that displays the LogoIcon alongside the "Vibe" text.
 * Perfect for headers, navigation bars, and branding.
 * @param {LogoWithTextProps} props - The component props.
 * @returns {React.ReactElement} The rendered logo with text.
 */
export const Logo = ({
  className = "",
  iconSize = 30,
  iconFill = "currentColor",
  textSize = "1.3rem",
  style,
}: LogoWithTextProps): React.ReactElement => {
  return (
    <div className={`flex items-center gap-3 ${className}`} style={style}>
      <LogoIcon size={iconSize} fill={iconFill} />
      <span
        style={{
          fontSize: textSize,
          fontWeight: 700,
          letterSpacing: "-0.02em",
        }}
      >
        Vibe
      </span>
    </div>
  );
};
