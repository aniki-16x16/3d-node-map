import type { ButtonHTMLAttributes, ReactNode } from "react";
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  title: string;
  active?: boolean;
}
export default function Button({
  children,
  title,
  onClick,
  active,
  disabled,
  className = "",
}: Props) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      disabled={disabled}
      className={`${className} ${active ? "active" : ""}`}
    >
      {children}
    </button>
  );
}
