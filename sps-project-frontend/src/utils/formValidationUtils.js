const firstMessage = (value) => {
  if (Array.isArray(value)) return value.find(Boolean) || "";
  if (value === null || value === undefined) return "";
  return String(value);
};

export const normalizeBackendFieldErrors = (source) => {
  const errors = source?.response?.data?.errors ?? source?.errors ?? source ?? {};
  if (!errors || Array.isArray(errors) || typeof errors !== "object") return {};

  return Object.fromEntries(
    Object.entries(errors)
      .map(([field, messages]) => [field, firstMessage(messages)])
      .filter(([, message]) => Boolean(message))
  );
};

export const fieldError = (errors, name) => firstMessage(errors?.[name]);

export const firstInvalidFieldName = (errors) => (
  Object.keys(normalizeBackendFieldErrors(errors))[0] || ""
);

const visibleControl = (element) => {
  if (!element || element.disabled || element.readOnly) return false;
  const styles = window.getComputedStyle(element);
  return styles.display !== "none" && styles.visibility !== "hidden" && element.getClientRects().length > 0;
};

export const focusFirstInvalidField = (errors, formContainer = null) => {
  const invalidFields = Object.keys(normalizeBackendFieldErrors(errors));
  if (!invalidFields.length || typeof document === "undefined") return;

  window.requestAnimationFrame(() => {
    const root = formContainer?.current || formContainer || document;
    const candidates = Array.from(root.querySelectorAll("[data-field]"));
    let target = null;

    for (const field of invalidFields) {
      const holder = candidates.find((candidate) => candidate.dataset.field === field);
      if (!holder) continue;
      const control = holder.matches("input, select, textarea, button")
        ? holder
        : holder.querySelector("input, select, textarea, button");
      if (visibleControl(control)) {
        target = control;
        break;
      }
    }

    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    target.focus({ preventScroll: true });
  });
};

export const setValidationErrors = (setErrors, errors, formContainer = null) => {
  const normalized = normalizeBackendFieldErrors(errors);
  setErrors(normalized);
  focusFirstInvalidField(normalized, formContainer);
  return normalized;
};

