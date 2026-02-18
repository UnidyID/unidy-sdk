import { type FunctionalComponent, h } from "@stencil/core";

type InputProps = {
  id: string;
  type: string;
  value: string | undefined;
  componentClassName?: string;
  disabled?: boolean;
  required?: boolean;
  title?: string;
  placeholder?: string;
  specificPartKey?: string;
  onInput: (value: string) => void;
  onFocus?: () => void;
  onBlur?: (e: Event) => void;
  onEnterSubmit?: () => void;
  ariaDescribedBy?: string;
};

export const Input: FunctionalComponent<InputProps> = (props) => (
  <input
    id={props.id}
    type={props.type}
    value={props.value}
    class={props.componentClassName}
    disabled={props.disabled}
    required={props.required}
    part={`input_field ${props.specificPartKey ? `input_field--${props.specificPartKey}` : ""}`}
    title={props.title}
    placeholder={props.placeholder}
    onInput={(e) => props.onInput((e.target as HTMLInputElement).value)}
    onFocus={() => props.onFocus?.()}
    onBlur={(e) => props.onBlur?.(e)}
    onKeyDown={(e) => {
      if (e.key === "Enter" && props.onEnterSubmit) {
        e.preventDefault();
        props.onInput((e.target as HTMLInputElement).value);
        props.onEnterSubmit();
      }
    }}
    aria-describedby={props.ariaDescribedBy || undefined}
  />
);
