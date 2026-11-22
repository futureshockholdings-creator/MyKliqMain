import { useTranslation } from 'react-i18next';
import i18n from './config';

export type InterfaceValues = Record<string, unknown>;

const templates = new Map<string, { expression: RegExp; names: string[]; message: string }[]>();
function messageTemplates() {
  // English keys are stable app-owned templates, never patterns learned from
  // member messages. Cache once for each loaded English resource bundle.
  const catalog = i18n.getResourceBundle('en', 'interface') as Record<string, string> | undefined;
  if (!catalog) return [];
  const signature = Object.keys(catalog).length.toString();
  if (!templates.has(signature)) {
    templates.clear();
    const entries = Object.keys(catalog).filter(key => key.includes('{{')).map(message => {
      const names: string[] = [];
      const parts = message.split(/(\{\{\s*[\w]+\s*\}\})/g);
      const pattern = parts.map(part => {
        const match = /^\{\{\s*(\w+)\s*\}\}$/.exec(part);
        if (match) {
          names.push(match[1]);
          return '([\\s\\S]*?)';
        }
        return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }).join('');
      return { expression: new RegExp(`^${pattern}$`), names, message };
    }).filter(entry => entry.names.length > 0 && entry.message.replace(/\{\{.*?\}\}/g, '').trim().length >= 4)
      .sort((a, b) => b.message.length - a.message.length);
    templates.set(signature, entries);
  }
  return templates.get(signature)!;
}

/** Translate app-owned copy only. Never pass member-authored content here. */
export function uiText(message: string, values: InterfaceValues = {}): string {
  const interpolation = { ...values };
  // Older call sites preformat counts. Recover a numeric plural selector
  // without changing stored form values or other interpolation text.
  if (typeof interpolation.count === 'string') {
    const language = i18n.resolvedLanguage || i18n.language || 'en';
    const parts = new Intl.NumberFormat(language).formatToParts(12345.6);
    const group = parts.find(part => part.type === 'group')?.value;
    const decimal = parts.find(part => part.type === 'decimal')?.value;
    let numeric = interpolation.count.replace(/[\u0660-\u0669\u06f0-\u06f9]/g, digit =>
      String(digit.charCodeAt(0) - (digit.charCodeAt(0) >= 0x06f0 ? 0x06f0 : 0x0660)),
    );
    if (group) numeric = numeric.split(group).join('');
    if (decimal) numeric = numeric.split(decimal).join('.');
    if (/^\d+(?:\.\d+)?$/.test(numeric)) interpolation.count = Number(numeric);
  }
  return String(i18n.t(message, {
    ns: 'interface',
    keySeparator: false,
    nsSeparator: false,
    defaultValue: message,
    ...interpolation,
  }));
}

/** App-generated toasts/errors may arrive as an already-interpolated string. */
export function localizeInterfaceMessage(message: string): string {
  if (i18n.exists(message, { ns: 'interface', keySeparator: false, nsSeparator: false })) return uiText(message);
  for (const template of messageTemplates()) {
    const match = template.expression.exec(message);
    if (match) {
      return uiText(template.message, Object.fromEntries(template.names.map((name, index) => [name, match[index + 1]])));
    }
  }
  return message;
}

/** Do not show raw SQL, stack traces, transport bodies or other diagnostics. */
export function localizeInterfaceError(message: string, fallbackMessage = 'Something went wrong. Please try again.'): string {
  let safeMessage = message.replace(/^\d{3}:\s*/, '');
  if (/^\s*\{/.test(safeMessage)) {
    try {
      const parsed = JSON.parse(safeMessage);
      safeMessage = typeof parsed.message === 'string' ? parsed.message : typeof parsed.error === 'string' ? parsed.error : '';
    } catch {
      return uiText(fallbackMessage);
    }
  }
  if (/\b(?:SQLSTATE|PostgresError|stack trace|SELECT .+ FROM|INSERT INTO|UPDATE \S+ SET)\b/i.test(safeMessage)
    || /\bat \S+ \([^)]*:\d+:\d+\)/.test(safeMessage)) return uiText(fallbackMessage);
  // Some callers already translate at the source; don't replace a valid
  // translated explanation with a generic error during toast rendering.
  const currentCatalog = i18n.getResourceBundle(
    (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0], 'interface',
  ) as Record<string, string> | undefined;
  if (currentCatalog && Object.values(currentCatalog).some(value => {
    if (value === safeMessage) return true;
    if (!value.includes('{{') || value.replace(/\{\{.*?\}\}/g, '').trim().length < 4) return false;
    const pattern = value.split(/(\{\{\s*\w+\s*\}\})/g).map(part =>
      /^\{\{/.test(part) ? '[\\s\\S]*?' : part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    ).join('');
    return new RegExp(`^${pattern}$`).test(safeMessage);
  })) return safeMessage;
  const translated = localizeInterfaceMessage(safeMessage);
  if (translated !== safeMessage || i18n.exists(safeMessage, { ns: 'interface', keySeparator: false, nsSeparator: false })) return translated;
  // Unknown server text is not an approved user-facing message.
  return uiText(fallbackMessage);
}

/** Subscribe without remounting the page or discarding unfinished form data. */
export function useUiLanguage(): string {
  const { i18n: instance } = useTranslation('interface');
  return (instance.resolvedLanguage || instance.language || 'en').split('-')[0];
}
