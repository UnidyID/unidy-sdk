import { type FunctionalComponent, h } from "@stencil/core";

type TextareaProps = {
  id: string;
  value: string | undefined;
  disabled?: boolean;
  required?: boolean;
  title?: string;
  name?: string;
  componentClassName?: string;
  placeholder?: string;
  specificPartKey?: string;
  onInput: (value: string) => void;
  onFocus?: () => void;
  onBlur?: (e: Event) => void;
  onEnterSubmit?: () => void;
  ariaDescribedBy?: string;
};

export const Textarea: FunctionalComponent<TextareaProps> = (props) => (
  <textarea
    id={props.id}
    value={props.value}
    name={props.name}
    class={props.componentClassName}
    required={props.required}
    part={`textarea_field ${props.specificPartKey ? `textarea_field--${props.specificPartKey}` : ""}`}
    disabled={props.disabled}
    title={props.title}
    onInput={(e) => props.onInput((e.target as HTMLTextAreaElement).value)}
    onFocus={() => props.onFocus?.()}
    onBlur={props.onBlur}
    onKeyDown={(e) => {
      // Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux) to submit
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && props.onEnterSubmit) {
        e.preventDefault();
        props.onInput((e.target as HTMLTextAreaElement).value);
        props.onEnterSubmit();
      }
    }}
    aria-describedby={props.ariaDescribedBy || undefined}
  />
);
