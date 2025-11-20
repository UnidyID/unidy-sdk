import { type FunctionalComponent, h } from "@stencil/core";

export type MultiSelectOption = { value: string; label: string };

type MultiSelectProps =
  | {
      value: string[];
      options: MultiSelectOption[];
      disabled?: boolean;
      title?: string;
      type?: string;
      specificPartKey?: string;
      onToggle: (optValue: string, checked: boolean) => void;
    }
  | {
      id?: string;
      name: string;
      value: string;
      checked: boolean;
      componentClassName?: string;
      disabled?: boolean;
      title?: string;
      type?: string;
      onToggle: (optValue: string, checked: boolean) => void;
    };

export const MultiSelect: FunctionalComponent<MultiSelectProps> = (props) => {
  if (!("options" in props)) {
    return (
      <input
        id={props.id}
        type={props.type}
        name={props.name}
        value={props.value}
        checked={props.checked}
        disabled={props.disabled}
        title={props.title}
        class={props.componentClassName}
        onChange={(e) => props.onToggle(props.value, (e.target as HTMLInputElement).checked)}
      />
    );
  }

  return (
    <div
      part={`multi-select-group_field ${props.specificPartKey ? `multi-select-group_field--${props.specificPartKey}` : ""}`}
      title={props.title}
    >
      {props.options.map((opt) => (
        <label 
          key={opt.value}
          htmlFor={`${props.specificPartKey}-${opt.value}`}
          part={`multi-select-item_label ${props.specificPartKey ? `multi-select-item_label--${props.specificPartKey}` : ""}`}
        >
          <input
            id={`${props.specificPartKey}-${opt.value}`}
            type={props.type}
            checked={Array.isArray(props.value) && props.value.includes(opt.value)}
            disabled={props.disabled}
            title={props.title}
            onChange={(e) => props.onToggle(opt.value, (e.target as HTMLInputElement).checked)}
            part={`multi-select-item_checkbox ${props.specificPartKey ? `multi-select-item_checkbox--${props.specificPartKey}` : ""}`}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
};
