import { FunctionalComponent, h } from '@stencil/core';

export type Option = { value: string; label: string; selected?: boolean };

type SelectProps = {
  id: string;
  value: string | string[] | null | undefined;
  options: Option[];
  disabled?: boolean;
  title?: string;
  countryCodeDisplayOption?: string;
  attr_name?: string;
  onChange: (value: string) => void;
  countryIcon?: (code: string) => any;
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
          disabled={opt.value === "--"}
          part="option"
        >
          {renderOptionLabel(opt)}
        </option>
      ))}
    </select>
  );
};
