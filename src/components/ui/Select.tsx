import {
  Children,
  Fragment,
  isValidElement,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
interface Option {
  value: string;
  label: ReactNode;
  group?: string;
  disabled?: boolean;
}
interface Props {
  value: string | number;
  onChange: (event: { target: { value: string } }) => void;
  children: ReactNode;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  "aria-label"?: string;
  displayValue?: ReactNode;
  textOnly?: boolean;
  align?: "left" | "right";
}
function optionsFrom(children: ReactNode, group?: string): Option[] {
  return Children.toArray(children).flatMap((child): Option[] => {
    if (
      !isValidElement<{
        value?: string | number;
        children?: ReactNode;
        label?: string;
        disabled?: boolean;
      }>(child)
    )
      return [];
    if (child.type === "optgroup")
      return optionsFrom(child.props.children, child.props.label);
    if (child.type === Fragment)
      return optionsFrom(child.props.children, group);
    if (child.type !== "option") return [];
    return [
      {
        value: String(child.props.value ?? ""),
        label: child.props.children,
        group,
        disabled: child.props.disabled,
      },
    ];
  });
}
export default function Select({
  value,
  onChange,
  children,
  disabled,
  size = "md",
  className = "",
  "aria-label": label,
  displayValue,
  textOnly,
  align = "left",
}: Props) {
  const options = optionsFrom(children);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState({
    left: 0,
    top: 0,
    width: 180,
    maxHeight: 300,
  });
  const trigger = useRef<HTMLButtonElement>(null),
    menu = useRef<HTMLDivElement>(null);
  const id = useId();
  const selected = options.findIndex(
    (option) => option.value === String(value),
  );
  const close = (focus = true) => {
    setOpen(false);
    if (focus) trigger.current?.focus({ preventScroll: true });
  };
  const choose = (index: number) => {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange({ target: { value: option.value } });
    close();
  };
  const show = () => {
    if (trigger.current?.matches(":disabled")) return;
    setActive(Math.max(0, selected));
    setOpen(true);
  };
  useLayoutEffect(() => {
    if (!open) return;
    const rect = trigger.current!.getBoundingClientRect();
    const width = Math.min(
      window.innerWidth - 16,
      Math.max(rect.width, size === "lg" ? 220 : 180),
    );
    const below = window.innerHeight - rect.bottom - 12;
    const above = rect.top - 12;
    const desired = Math.min(
      360,
      options.length * (size === "lg" ? 48 : 36) + 16,
    );
    const upwards = below < Math.min(desired, 180) && above > below;
    const maxHeight = Math.max(50, Math.min(360, upwards ? above : below));
    setPosition({
      left: Math.max(
        8,
        Math.min(
          align === "right" ? rect.right - width : rect.left,
          window.innerWidth - width - 8,
        ),
      ),
      top: upwards
        ? rect.top - Math.min(desired, maxHeight) - 6
        : rect.bottom + 6,
      width,
      maxHeight,
    });
    menu.current?.focus({ preventScroll: true });
    const outside = (e: PointerEvent) => {
      if (
        !trigger.current?.contains(e.target as Node) &&
        !menu.current?.contains(e.target as Node)
      )
        close(false);
    };
    const reposition = () => close(false);
    window.addEventListener("pointerdown", outside, true);
    window.addEventListener("resize", reposition);
    const scroll = (e: Event) => {
      if (!menu.current?.contains(e.target as Node)) close(false);
    };
    window.addEventListener("scroll", scroll, true);
    return () => {
      window.removeEventListener("pointerdown", outside, true);
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", scroll, true);
    };
  }, [open]);
  useLayoutEffect(() => {
    if (open)
      menu.current
        ?.querySelector(`[data-option-index="${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);
  return (
    <>
      <button
        ref={trigger}
        type="button"
        className={`select-trigger canvas-ui select-${size} ${textOnly ? "select-text" : ""} ${className}`}
        disabled={disabled}
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? id : undefined}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => (open ? close() : show())}
        onKeyDown={(e) => {
          if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
            e.preventDefault();
            e.stopPropagation();
            show();
          }
        }}
      >
        <span>{displayValue ?? options[selected]?.label ?? "请选择"}</span>
        {!textOnly && <ChevronDown size={14} />}
      </button>
      {open &&
        createPortal(
          <div
            ref={menu}
            id={id}
            role="listbox"
            aria-label={label}
            aria-activedescendant={
              options[active] ? `${id}-${active}` : undefined
            }
            tabIndex={-1}
            className={`select-menu canvas-ui select-${size}`}
            style={position}
            onPointerDown={(e) => e.stopPropagation()}
            onWheel={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Escape") {
                e.preventDefault();
                close();
              } else if (e.key === "Tab") close();
              else if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                choose(active);
              } else if (
                [
                  "ArrowDown",
                  "ArrowUp",
                  "Home",
                  "End",
                  "PageDown",
                  "PageUp",
                ].includes(e.key)
              ) {
                e.preventDefault();
                const enabled = options
                  .map((o, i) => (o.disabled ? -1 : i))
                  .filter((i) => i >= 0);
                if (!enabled.length) return;
                const current = enabled.indexOf(active);
                const next =
                  e.key === "Home"
                    ? 0
                    : e.key === "End"
                      ? enabled.length - 1
                      : Math.max(
                        0,
                        Math.min(
                          enabled.length - 1,
                          current +
                          (e.key === "ArrowUp" || e.key === "PageUp"
                            ? -1
                            : 1),
                        ),
                      );
                setActive(enabled[next]);
              }
            }}
          >
            {!options.length && (
              <div className="select-empty">暂无数据</div>
            )}
            {options.map((option, index) => (
              <Fragment key={`${option.value}-${index}`}>
                {option.group && option.group !== options[index - 1]?.group && (
                  <div className="select-group">{option.group}</div>
                )}
                <div
                  id={`${id}-${index}`}
                  role="option"
                  aria-selected={option.value === String(value)}
                  aria-disabled={option.disabled}
                  data-option-index={index}
                  className={`select-option ${index === active ? "active" : ""}`}
                  onPointerMove={() => setActive(index)}
                  onClick={() => choose(index)}
                >
                  <span>{option.label}</span>
                  {option.value === String(value) && <Check size={16} />}
                </div>
              </Fragment>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}
