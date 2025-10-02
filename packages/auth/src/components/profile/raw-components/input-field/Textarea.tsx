import { FunctionalComponent, h } from '@stencil/core';

type TextareaProps = {
    id: string;
    value: string | undefined;
    disabled?: boolean;
    required?: boolean;
    title?: string;
    name?: string;
    className?: string;
    placeholder?: string;
    onChange: (value: string) => void;
};

export const Textarea: FunctionalComponent<TextareaProps> = (props) => (
  <textarea
    id={props.id}
    value={props.value}
    name={props.name}
    class={props.className}
    required={props.required}
    part="textarea"
    disabled={props.disabled}
    title={props.title}
    onChange={(e) => props.onChange((e.target as HTMLTextAreaElement).value)}
  />
);
