import { es } from "./es";
import { en } from "./en";
import { Language, Translations } from "./types";

export const translations: Record<Language, Translations> = {
  es,
  en,
};

export * from "./types";
