import { useId } from "react";
interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}
interface Props {
  label: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  className?: string;
}
export default function RadioGroup({
  label,
  value,
  options,
  onChange,
  className = "",
}: Props) {
  const name = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={`radio-group ${className}`}
    >
      {options.map((option) => (
        <label className="radio-button" key={option.value}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            disabled={option.disabled}
            onChange={() => onChange(option.value)}
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}
