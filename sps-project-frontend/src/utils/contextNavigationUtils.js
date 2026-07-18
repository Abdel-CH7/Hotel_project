export const readPositiveIntegerParam = (searchParams, key) => {
  const raw = searchParams.get(key);
  if (raw === null) return { raw: null, value: null, valid: true };

  const value = Number(raw);
  const valid = Number.isInteger(value) && value > 0;

  return { raw, value: valid ? value : null, valid };
};

export const removeSearchParam = (searchParams, key) => {
  const next = new URLSearchParams(searchParams);
  next.delete(key);
  return next;
};

export const setSearchParam = (searchParams, key, value) => {
  const next = new URLSearchParams(searchParams);
  next.set(key, String(value));
  return next;
};
