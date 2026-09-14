import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import Button from "./Button";

interface Props {
  open: boolean;
  title: ReactNode;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}
export default function Modal({
  open,
  title,
  children,
  onClose,
  className = "",
}: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current!;
    if (open) {
      if (!dialog.open) dialog.showModal();
      return;
    }
    if (!dialog.open) return;
    const timer = window.setTimeout(() => dialog.close(), 180);
    return () => window.clearTimeout(timer);
  }, [open]);
  return (
    <dialog
      ref={ref}
      role="dialog"
      aria-modal="true"
      className={`modal-backdrop ${open ? "is-open" : "is-closing"}`}
      aria-labelledby={titleId}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className={`modal ${className}`}>
        <div className="modal-title">
          <h2 id={titleId}>{title}</h2>
          <Button title="关闭" onClick={onClose}>
            <X size={19} />
          </Button>
        </div>
        {children}
      </section>
    </dialog>
  );
}
