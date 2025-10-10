import { type FunctionalComponent, h } from '@stencil/core';

export type Option = { value: string; label: string; selected?: boolean };

type SelectProps = {
  id: string;
  name?: string;
  value: string | string[] | null | undefined;
  options: Option[];
  disabled?: boolean;
  title?: string;
  countryCodeDisplayOption?: string;
  attr_name?: string;
  customStyle?: string;
  emptyOption: boolean;
  specificPartKey?: string;
  onChange: (value: string) => void;
  countryIcon?: (code: string) => string;
};

export const Select: FunctionalComponent<SelectProps> = (props) => {
  const renderOptionLabel = (opt: Option) => {
    if (
      props.attr_name === "country_code" &&
      props.countryCodeDisplayOption === "icon" &&
      props.countryIcon
    ) {
      return props.countryIcon(opt.value);
    }
    return opt.label;
  };
 return (   
    <select
      id={props.id}
      name={props.name}
      class={props.customStyle}
      data-value={props.value as string | undefined}
      part={`select_field ${props.specificPartKey ? `select_field--${props.specificPartKey}` : ''}`}
      disabled={props.disabled}
      title={props.title}
      onChange={(e) => props.onChange((e.target as HTMLSelectElement).value)}
    >
      {props.emptyOption ? (
        <option value="" selected={props.value === null || props.value === ''} />
      ) : null}
      {props.options.map((opt) => (
        <option
          key={opt.value}
          value={opt.value}
          data-selected={opt.value === props.value ? 'true' : 'false'}
          selected={opt.value === props.value}
          disabled={opt.value === "--"}
        >
          {renderOptionLabel(opt)}
        </option>
      ))}
    </select>
  );
};
