"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLocalizedText = getLocalizedText;
/**
 * Resolves localized text from a JSON translation object.
 * Returns text in the requested language, or falls back to defaultLang or the first available language key.
 */
function getLocalizedText(value, requestedLang, defaultLang = "ar") {
    if (!value)
        return "";
    if (typeof value === "string")
        return value;
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
