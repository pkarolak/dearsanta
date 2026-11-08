import { describe, expect, it } from "vitest";
import { IntlMessageFormat } from "intl-messageformat";
import { allMessages } from "./i18n-server";

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") acc[path] = value;
    else Object.assign(acc, flatten(value, path));
    return acc;
  }, {});
}

const reference = flatten(allMessages.en as Tree);

describe("translations", () => {
  for (const [locale, messages] of Object.entries(allMessages)) {
    const flat = flatten(messages as Tree);

    it(`${locale} has exactly the same keys as English`, () => {
      expect(Object.keys(flat).sort()).toEqual(Object.keys(reference).sort());
    });

    it(`${locale} messages are valid ICU and use the same placeholders`, () => {
      for (const [key, text] of Object.entries(flat)) {
        expect(() => new IntlMessageFormat(text, locale), `${locale}:${key}`).not.toThrow();
        const vars = (s: string) => [...s.matchAll(/\{(\w+)[,}]/g)].map((m) => m[1]).sort();
        expect(new Set(vars(text)), `${locale}:${key}`).toEqual(new Set(vars(reference[key])));
      }
    });
  }
});
