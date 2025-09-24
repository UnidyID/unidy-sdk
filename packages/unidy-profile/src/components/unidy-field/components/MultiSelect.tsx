import { FunctionalComponent, h } from '@stencil/core';

export type Option = { value: string; label: string };

type MultiSelectProps = {
  value: string[];
  options: Option[];
  disabled?: boolean;
  title?: string;
  type?: string;
  onToggle: (optValue: string, checked: boolean) => void;
};

export const MultiSelect: FunctionalComponent<MultiSelectProps> = (props) => (
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
