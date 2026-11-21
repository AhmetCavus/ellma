/**
 * Who runs this installation. The details are build-time settings (`VITE_LEGAL_*`), so no
 * operator data lives in the code. Until they are set, the imprint says so openly.
 */
const env = import.meta.env;
const clean = (value: string | undefined) => value?.trim() ?? "";

export const operator = {
  name: clean(env.VITE_LEGAL_NAME),
  /** Address lines, written as `Street 1; 12345 City; Country`. */
  address: clean(env.VITE_LEGAL_ADDRESS)
    .split(";")
    .map((line) => line.trim())
    .filter(Boolean),
  representative: clean(env.VITE_LEGAL_REPRESENTATIVE),
  email: clean(env.VITE_LEGAL_EMAIL),
  phone: clean(env.VITE_LEGAL_PHONE),
  register: clean(env.VITE_LEGAL_REGISTER),
  vatId: clean(env.VITE_LEGAL_VAT_ID),
};

export const operatorConfigured = Boolean(
  operator.name && operator.address.length > 0 && operator.email,
);

export const YAPPAI_URL = "https://yappai.de";
/** The sister app, linked from the full footer as assma links back to ellma. */
export const ASSMA_URL = "https://assma.yappai.de/";
export const REPOSITORY_URL = "https://github.com/AhmetCavus/ellma";

export const LEGAL_PAGES = ["privacy", "terms", "imprint"] as const;
export type LegalPageName = (typeof LEGAL_PAGES)[number];
export const legalPath = (page: LegalPageName) => `/${page}`;
