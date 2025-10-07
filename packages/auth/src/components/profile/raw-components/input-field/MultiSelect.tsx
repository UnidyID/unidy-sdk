import { type FunctionalComponent, h } from '@stencil/core';

export type Option = { value: string; label: string };

type MultiSelectProps =
| {
    value: string[];
    options: Option[];
    disabled?: boolean;
    title?: string;
    type?: string;
    onToggle: (optValue: string, checked: boolean) => void;
  }
| {
    id?: string;
    name: string;
    value: string;
    checked: boolean;
    customStyle?: string;
    disabled?: boolean;
    title?: string;
    type?: string;
    onToggle: (optValue: string, checked: boolean) => void;
  };

export const MultiSelect: FunctionalComponent<MultiSelectProps> = (props) => {
  if (!('options' in props)) {
    return (
      <input
        id={props.id}
        type={props.type}
        name={props.name}
        value={props.value}
        checked={props.checked}
        disabled={props.disabled}
        title={props.title}
        class={props.customStyle}
        onChange={(e) => props.onToggle(props.value, (e.target as HTMLInputElement).checked)}
      />
    );
  }

  return (
    <div part="checkbox-group" title={props.title}>
      {props.options.map((opt) => (
        <label key={opt.value} part="checkbox-label">
          <input
            id={opt.value}
            type={props.type}
            checked={Array.isArray(props.value) && props.value.includes(opt.value)}
            disabled={props.disabled}
            title={props.title}
            onChange={(e) => props.onToggle(opt.value, (e.target as HTMLInputElement).checked)}
            part="checkbox"
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
};
