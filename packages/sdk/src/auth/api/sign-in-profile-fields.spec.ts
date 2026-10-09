import { RequiredFieldsResponseSchema } from "./schemas";

describe("RequiredFieldsResponseSchema", () => {
  it("parses the radio fields into options without the checked flag, and _NOT_SET_ into null", () => {
    const parsed = RequiredFieldsResponseSchema.parse({
      error_identifier: "missing_required_fields",
      meta: {
        sid: "sid-1",
        fields: {
          salutation: {
            value: "mr",
            type: "radio",
            required: true,
            label: "Salutation",
            attr_name: "salutation",
            radio_options: [
              { value: "mr", label: "Mr", checked: true },
              { value: "mrs", label: "Mrs", checked: false },
            ],
          },
          first_name: { value: null, type: "text", required: true, label: "First name", attr_name: "first_name" },
          custom_attributes: {
            newsletter_ok: {
              value: null,
              type: "radio",
              required: true,
              label: "Newsletter",
              attr_name: "newsletter_ok",
              readonly: false,
              radio_options: [
                { value: true, label: "Yes", checked: false },
                { value: false, label: "No", checked: false },
                { value: "_NOT_SET_", label: "N/A", checked: true },
              ],
            },
          },
        },
      },
    });

    expect(parsed.sid).toBe("sid-1");
    expect(parsed.fields.salutation).toEqual({
      value: "mr",
      type: "radio",
      required: true,
      label: "Salutation",
      attr_name: "salutation",
      options: [
        { value: "mr", label: "Mr" },
        { value: "mrs", label: "Mrs" },
      ],
    });
    expect(parsed.fields.first_name).toMatchObject({ value: null, type: "text" });
    expect(parsed.fields.custom_attributes?.newsletter_ok).toMatchObject({
      value: null,
      options: [
        { value: true, label: "Yes" },
        { value: false, label: "No" },
        { value: null, label: "N/A" },
      ],
    });
    expect(parsed.fields.custom_attributes?.newsletter_ok).not.toHaveProperty("radio_options");
  });
});
