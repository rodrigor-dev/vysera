import DOMPurify from "isomorphic-dompurify";

export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty);
}

export function sanitizeInput(value: string): string {
  return value.replace(/[<>&"']/g, (char) => {
    const map: Record<string, string> = {
      "<": "&lt;",
      ">": "&gt;",
      "&": "&amp;",
      '"': "&quot;",
      "'": "&#x27;",
    };
    return map[char] ?? char;
  });
}

export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
): T {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeInput(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}
