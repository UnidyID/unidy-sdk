import { type FunctionalComponent, h } from '@stencil/core';

type InputProps = {
    id: string;
    type: string;
    value: string | undefined;
    customStyle?: string;
    disabled?: boolean;
    required?: boolean;
    title?: string;
    placeholder?: string;
    specificPartKey?: string;
    onChange: (value: string) => void;
    onInput: (e: Event) => void;
};

export const Input: FunctionalComponent<InputProps> = (props) => (
    <input
      id={props.id}
      type={props.type}
      value={props.value}
      class={props.customStyle}
      disabled={props.disabled}
      required={props.required}
      part={`input_field ${props.specificPartKey ? `input_field--${props.specificPartKey}` : ''}`}
      title={props.title}
      placeholder={props.placeholder}
      onChange={(e) => props.onChange((e.target as HTMLInputElement).value)}
      onInput={(e) => props.onInput(e)}
    />
);
