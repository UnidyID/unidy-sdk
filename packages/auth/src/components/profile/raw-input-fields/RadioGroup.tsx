import { type FunctionalComponent, h } from '@stencil/core';

export type RadioOption = { value: string; label: string; checked: boolean };

type RadioGroupProps =
  | {
      options: RadioOption[];
      disabled?: boolean;
      type?: string;
      name?: string;
      title?: string;
      onChange: (value: string) => void;
    }
  | {
      value: string;
      checked: boolean;
      disabled?: boolean;
      type?: string;
      name: string;
      title?: string;
      customStyle?: string;
      onChange: (value: string) => void;
    };

export const RadioGroup: FunctionalComponent<RadioGroupProps> = (props) => {
  if (!('options' in props)) {
    return (
      <input
        type={props.type}
        name={props.name}
        value={String(props.value)}
        checked={props.checked}
        disabled={props.disabled}
        title={props.title}
        class={props.customStyle}
        onChange={() => props.onChange(String(props.value))}
      />
    );
  }

  return (
    <div part="radio-group" title={props.title}>
      {props.options.map((opt) => (
        <label
          key={String(opt.value)}
          part={`radio-label ${opt.checked ? 'radio-checked' : ''}`}
          data-checked={opt.checked ? 'true' : 'false'}
        >
          <input
            type={props.type}
            name={props.name}
            value={String(opt.value)}
            checked={opt.checked}
            disabled={props.disabled}
            onChange={() => props.onChange(String(opt.value))}
            part="radio"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
};
