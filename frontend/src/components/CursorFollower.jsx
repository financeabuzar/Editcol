import { useEffect, useState } from "react";

export default function CursorFollower() {
  const [position, setPosition] = useState({ x: -1000, y: -1000 });
  const [visible, setVisible] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (!visible) setVisible(true);

      // Check if mouse is hovering over an interactive element
      const target = e.target;
      if (target) {
        const isHovered = target.closest("button, a, [role='button'], .card, input, select, textarea");
        setIsInteractive(!!isHovered);
      }
    };

    const handleMouseLeave = () => {
      setVisible(false);
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [visible]);

  return (
    <div
      className={`cursor-follower ${visible ? "visible" : ""} ${isInteractive ? "cursor-active" : ""}`}
      style={{
        transform: `translate3d(${position.x}px, ${position.y}px, 0) translate3d(-50%, -50%, 0)`,
      }}
    />
  );
}
