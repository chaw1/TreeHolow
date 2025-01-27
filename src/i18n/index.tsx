// src/i18n/index.ts
import { en } from './locales/en';
import { zh } from './locales/zh';
import { ja } from './locales/ja';

export const locales = {
  en,
  zh,
  ja
};

export type Locale = keyof typeof locales;
export type Translation = typeof en;