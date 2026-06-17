import xss from 'xss';

const xssOptions: xss.IFilterXSSOptions = {
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
};

const xssFilter = new xss.FilterXSS(xssOptions);

export function sanitizeHtml(input: string): string {
  return xssFilter.process(input);
}

export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value);
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => {
        if (typeof item === 'string') return sanitizeHtml(item);
        if (item !== null && typeof item === 'object') return sanitizeObject(item as Record<string, unknown>);
        return item;
      });
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}

export function removeHtmlTags(input: string): string {
  return input.replace(/<[^>]*>/g, '');
}
