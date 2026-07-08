import { pageDictionaries, sharedRules } from "../dicts";
import type { TranslationRule } from "../types";

export function resolveRules(pathname: string): TranslationRule[] {
  const matchedDictionary = pageDictionaries.find((candidate) =>
    candidate.route.test(pathname),
  );

  return matchedDictionary
    ? [...sharedRules, ...matchedDictionary.rules]
    : sharedRules;
}
