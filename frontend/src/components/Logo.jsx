import { Link } from "react-router-dom";

/**
 * EditCol logo wrapped in a dark pill container so the white wordmark reads on light pages.
 * The actual logo file is the provided EditCol asset — typography is preserved.
 */
export default function Logo({ size = "md", className = "", as = "link" }) {
  const sizeMap = { sm: "h-7", md: "h-9", lg: "h-11", xl: "h-14" };
  const cls = `logo-chip ${className}`;
  const content = (
    <img
      src="/editcol-logo.png"
      alt="EditCol"
      className={`${sizeMap[size] || sizeMap.md} w-auto block`}
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
    <img src="/editcol-icon.png" alt="EC" style={{ height: size, width: "auto" }} className={className} />
  );
}
