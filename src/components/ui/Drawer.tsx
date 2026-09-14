import { useEffect, useId, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import Button from "./Button";

interface Props {
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  onClose: () => void;
  closeLabel?: string;
  className?: string;
}
export default function Drawer({
  open,
  title,
  children,
  onClose,
  closeLabel = "关闭抽屉",
  className = "",
}: Props) {
  const titleId = useId();
  const [retained, setRetained] = useState<{
    title: ReactNode;
    children: ReactNode;
  } | null>(null);
  // Keep the last visible contents during exit, including when selection is cleared.
  useEffect(() => {
    if (open) setRetained({ title, children });
  }, [open, title, children]);
  useEffect(() => {
    if (open) return;
    const timer = window.setTimeout(() => setRetained(null), 180);
    return () => window.clearTimeout(timer);
  }, [open]);
  if (!open && !retained) return null;
  return (
    <aside
      className={`drawer ${open ? "is-open" : "is-closing"} ${className}`}
      aria-labelledby={titleId}
      inert={!open}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="drawer-header">
        <span id={titleId}>{open ? title : retained?.title}</span>
        <Button title={closeLabel} onClick={onClose}>
          <X size={17} />
        </Button>
      </div>
      {open ? children : retained?.children}
    </aside>
  );
}
