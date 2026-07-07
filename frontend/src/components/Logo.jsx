import { Link } from "react-router-dom";

/**
 * EditCol logo wrapped in a theme-aware container.
 * Switches between editcol-logo-lighttheme.png (light theme) and editcol-logo.png (dark theme).
 */
export default function Logo({ size = "md", className = "", as = "link" }) {
  const sizeMap = { sm: "h-7", md: "h-9", lg: "h-11", xl: "h-14" };
  const cls = `logo-chip max-w-full shrink-0 ${className}`;
  const content = (
    <>
      {/* Light theme logo: visible by default, hidden when HTML has .dark class */}
      <img
        src="/editcol-logo-lighttheme.png"
        alt="EditCol"
        width="640"
        height="180"
        decoding="async"
        className={`${sizeMap[size] || sizeMap.md} w-auto max-w-[9.5rem] sm:max-w-none block dark:hidden`}
        draggable={false}
      />
      {/* Dark theme logo: hidden by default, visible when HTML has .dark class */}
      <img
        src="/editcol-logo.png"
        alt="EditCol"
        width="640"
        height="180"
        decoding="async"
        className={`${sizeMap[size] || sizeMap.md} w-auto max-w-[9.5rem] sm:max-w-none hidden dark:block`}
        draggable={false}
      />
    </>
  );
  if (as === "div") return <div data-testid="editcol-logo" className={cls}>{content}</div>;
  return (
    <Link to="/" data-testid="editcol-logo-link" className={cls}>
      {content}
    </Link>
  );
}

export function LogoMark({ size = 32, className = "" }) {
  return (
    <img
      src="/editcol-icon.png"
      alt="EditCol icon"
      width="512"
      height="512"
      decoding="async"
      style={{ height: size, width: "auto" }}
      className={className}
    />
  );
}
