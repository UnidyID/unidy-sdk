import { type FunctionalComponent, h } from "@stencil/core";

export type RadioOption = { value: string; label: string; checked: boolean };

type RadioGroupProps =
  | {
      options: RadioOption[];
      disabled?: boolean;
      type?: string;
      name?: string;
      title?: string;
      specificPartKey?: string;
      onChange: (value: string) => void;
      ariaDescribedBy?: string;
      required?: boolean;
    }
  | {
      value: string;
      checked: boolean;
      disabled?: boolean;
      type?: string;
      name: string;
      title?: string;
      componentClassName?: string;
      onChange: (value: string) => void;
      ariaDescribedBy?: string;
      required?: boolean;
    };

export const RadioGroup: FunctionalComponent<RadioGroupProps> = (props) => {
  if (!("options" in props)) {
    return (
      <input
        type={props.type}
        name={props.name}
        required={props.required}
        value={String(props.value)}
        checked={props.checked}
        disabled={props.disabled}
        title={props.title}
        class={props.componentClassName}
        onChange={() => props.onChange(String(props.value))}
        aria-describedby={props.ariaDescribedBy || undefined}
      />
    );
  }

  return (
    <div
      part={`radio-group_field ${props.specificPartKey ? `radio-group_field--${props.specificPartKey}` : ""}`}
      title={props.title}
      aria-describedby={props.ariaDescribedBy || undefined}
    >
      {props.options.map((opt) => (
        <label
          htmlFor={`${props.name}-${opt.value}`}
          key={String(opt.value)}
          part={`radio-group-item_label ${props.specificPartKey ? `radio-group-item_label--${props.specificPartKey}` : ""} ${opt.checked ? "radio_checked" : ""}`}
          data-checked={opt.checked ? "true" : "false"}
        >
          <input
            id={`${props.name}-${opt.value}`}
            type={props.type}
            name={props.name}
            required={props.required}
            value={String(opt.value)}
            checked={opt.checked}
            disabled={props.disabled}
            onChange={() => props.onChange(String(opt.value))}
            part={`radio-group-item_radio ${props.specificPartKey ? `radio-group-item_radio--${props.specificPartKey}` : ""}`}
          />
          {opt.label}
        </label>
      ))}
    </div>
  );
};
