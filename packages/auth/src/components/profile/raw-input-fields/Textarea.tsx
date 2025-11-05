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
  onChange: (value: string) => void;
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
    onChange={(e) => props.onChange((e.target as HTMLTextAreaElement).value)}
  />
);
