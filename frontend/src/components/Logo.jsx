import { Link } from "react-router-dom";

/**
 * EditCol logo wrapped in a dark pill container so the white wordmark reads on light pages.
 * The actual logo file is the provided EditCol asset — typography is preserved.
 */
export default function Logo({ size = "md", className = "", as = "link" }) {
  const sizeMap = { sm: "h-7", md: "h-9", lg: "h-11", xl: "h-14" };
  const cls = `logo-chip max-w-full shrink-0 ${className}`;
  const content = (
    <img
      src="/editcol-logo.png"
      alt="EditCol"
      width="640"
      height="180"
      decoding="async"
      className={`${sizeMap[size] || sizeMap.md} w-auto max-w-[9.5rem] sm:max-w-none block`}
      draggable={false}
    />
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
