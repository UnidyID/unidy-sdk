import { type FunctionalComponent, h } from "@stencil/core";

type ConsentCheckboxProps = {
  id: string;
  checked: boolean;
  label?: string;
  required?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  title?: string;
  componentClassName?: string;
  specificPartKey?: string;
  onChange: (checked: boolean) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  ariaDescribedBy?: string;
};

export const ConsentCheckbox: FunctionalComponent<ConsentCheckboxProps> = (props) => {
  const input = (
    <input
      id={props.id}
      type="checkbox"
      checked={props.checked}
      required={props.required}
      disabled={props.disabled}
      title={props.title}
      class={props.componentClassName}
      part={`consent-checkbox_field${props.specificPartKey ? ` consent-checkbox_field--${props.specificPartKey}` : ""}${props.disabled ? " consent-checkbox_field--disabled" : ""}`}
      onChange={(e) => props.onChange((e.target as HTMLInputElement).checked)}
      onFocus={() => props.onFocus?.()}
      onBlur={() => props.onBlur?.()}
      aria-invalid={props.invalid ? "true" : undefined}
      aria-describedby={props.ariaDescribedBy || undefined}
    />
  );

  // Without a label the integrator provides one, e.g. <label for="custom_attributes.terms">
  if (!props.label) return input;

  // Wrapping the input labels it without relying on the id, which can be shared with the u-raw-field host inside u-field
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the checkbox is nested through {input}
    <label part={`consent-checkbox_label${props.specificPartKey ? ` consent-checkbox_label--${props.specificPartKey}` : ""}`}>
      {input}{" "}
      <span part="consent-checkbox_text">
        {props.label}
        {props.required ? (
          <span part="required-indicator" aria-hidden="true">
            {" *"}
          </span>
        ) : null}
      </span>
    </label>
  );
};
