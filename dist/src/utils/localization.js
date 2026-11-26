"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJsonIfNeeded = parseJsonIfNeeded;
exports.getLocalizedText = getLocalizedText;
/**
 * Resolves localized text from a JSON translation object.
 * Returns text in the requested language, or falls back to defaultLang or the first available language key.
 */
/**
 * Safely parses JSON strings (e.g. '{"ar":"...","en":"..."}' or '["..."]') into JS object/array.
 */
function parseJsonIfNeeded(value) {
    if (typeof value === "string") {
        const trimmed = value.trim();
        if ((trimmed.startsWith("{") && trimmed.endsWith("}")) ||
            (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
            try {
                return JSON.parse(trimmed);
            }
            catch {
                return value;
            }
        }
    }
    return value;
}
function getLocalizedText(value, requestedLang, defaultLang = "ar") {
    if (!value)
        return "";
    const parsed = parseJsonIfNeeded(value);
    if (typeof parsed === "string")
        return parsed;
    value = parsed;
    if (Array.isArray(value)) {
        return value.join(", ");
    }
    if (typeof value === "object") {
        if (requestedLang && value[requestedLang]) {
            return value[requestedLang];
        }
        if (value[defaultLang]) {
            return value[defaultLang];
        }
        const values = Object.values(value);
        if (values.length > 0 && typeof values[0] === "string") {
            return values[0];
        }
    }
    return "";
}
