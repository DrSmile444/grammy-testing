import { Composer, InlineKeyboard } from 'grammy';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'de', label: 'German' },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code'];

/**
 * Creates a Composer with a /language command and inline language picker.
 * @returns A configured Composer instance.
 */
export function createLanguagePickerComposer() {
  const composer = new Composer();

  composer.command('language', async (ctx) => {
    const keyboard = new InlineKeyboard();

    for (const lang of SUPPORTED_LANGUAGES) {
      keyboard.text(lang.label, `lang:${lang.code}`);
    }

    await ctx.reply('Select your language:', { reply_markup: keyboard });
  });

  composer.callbackQuery(/^lang:(.+)$/, async (ctx) => {
    const code = ctx.match[1] as LanguageCode;
    const langEntry = SUPPORTED_LANGUAGES.find((entry) => entry.code === code);

    if (!langEntry) {
      await ctx.answerCallbackQuery('Unknown language');

      return;
    }

    await ctx.editMessageText(`Language set to: ${langEntry.label}`);
    await ctx.answerCallbackQuery();
  });

  return composer;
}
