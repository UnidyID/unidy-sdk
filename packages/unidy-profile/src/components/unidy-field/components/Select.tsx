import { FunctionalComponent, h } from '@stencil/core';

export type Option = { value: string; label: string; selected?: boolean };

type SelectProps = {
  id: string;
  value: string | string[] | null | undefined;
  options: Option[];
  disabled?: boolean;
  title?: string;
  onChange: (value: string) => void;
};

export const Select: FunctionalComponent<SelectProps> = (props) => (
  <select
    id={props.id}
    data-value={props.value as any}
    part="select"
    disabled={props.disabled}
    title={props.title}
    onChange={(e) => props.onChange((e.target as HTMLSelectElement).value)}
  >
    <option value="" selected={props.value === null || props.value === ''} />
    {props.options.map((opt) => (
      <option
        key={opt.value}
        value={opt.value}
        data-selected={opt.value === props.value ? 'true' : 'false'}
        selected={opt.value === props.value}
        part="option"
      >
        {opt.label}
      </option>
    ))}
  </select>
);
