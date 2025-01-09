import { TranslationDict } from "./data/interfaces";

export async function loadClientStrings(
  lang: string,
): Promise<TranslationDict> {
  return (
    await import(
      /* @vite-ignore */ `${import.meta.env.BASE_URL}data/${lang}/client_strings.js`
    )
  ).default;
}
