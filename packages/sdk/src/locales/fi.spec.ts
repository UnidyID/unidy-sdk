import en from "./en.json";
import fi from "./fi.json";

type Tree = { [key: string]: string | Tree };

const flatten = (tree: Tree, prefix = ""): [string, string][] =>
  Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string" ? [[`${prefix}${key}`, value] as [string, string]] : flatten(value, `${prefix}${key}.`),
  );

const placeholders = (value: string) => (value.match(/\{\{.*?\}\}/g) ?? []).sort();

describe("fi locale", () => {
  const enEntries = flatten(en as Tree);
  const fiEntries = new Map(flatten(fi as Tree));

  it("has every key of the English locale and nothing else", () => {
    expect([...fiEntries.keys()].sort()).toEqual(enEntries.map(([key]) => key).sort());
  });

  it("keeps the interpolation placeholders of the English text", () => {
    for (const [key, enValue] of enEntries) {
      expect({ key, placeholders: placeholders(fiEntries.get(key) ?? "") }).toEqual({ key, placeholders: placeholders(enValue) });
    }
  });

  it("translates every text except fixed placeholders", () => {
    const untranslated = enEntries.filter(([key, enValue]) => fiEntries.get(key) === enValue).map(([key]) => key);
    expect(untranslated).toEqual(["newsletter.buttons.logout"]);
  });
});
