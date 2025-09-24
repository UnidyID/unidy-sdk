import { FunctionalComponent, h } from '@stencil/core';

type InputProps = {
    id: string;
    type: string;
    value: string | undefined;
    class: string;
    disabled?: boolean;
    required?: boolean;
    title?: string;
    onChange: (value: string) => void;
};

export const Input: FunctionalComponent<InputProps> = (props) => (
    <input
      id={props.id}
      type={props.type}
      value={props.value}
      class={props.class}
      disabled={props.disabled}
      required={props.required}
      part="input"
      title={props.title}
      onChange={(e) => props.onChange((e.target as HTMLInputElement).value)}
    />
);
