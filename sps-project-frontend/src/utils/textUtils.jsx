export const highlightText = (text = "", searchTerm = "") => {
  const safeText = text === null || text === undefined ? "" : String(text);
  const safeSearchTerm =
    searchTerm === null || searchTerm === undefined ? "" : String(searchTerm);

  if (!safeSearchTerm.trim()) {
    return safeText;
  }

  const escapedSearchTerm = safeSearchTerm.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const regex = new RegExp(`(${escapedSearchTerm})`, "gi");
  const parts = safeText.split(regex);

  return parts.map((part, index) =>
    part.toLowerCase() === safeSearchTerm.toLowerCase() ? (
      <span key={index} style={{ backgroundColor: "yellow" }}>
        {part}
      </span>
    ) : (
      part
    )
  );
};

export const normalizeSearchValue = (value) => {
  if (value === null || value === undefined) return "";

  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .trim();
};

export const formatFrenchDate = (value, fallback = "—") => {
  if (value === null || value === undefined || value === "") return fallback;

  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : fallback;
};

export const formatFrenchNumber = (value, suffix = "", fallback = "—") => {
  if (value === null || value === undefined || value === "") return fallback;

  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;

  const formatted = number.toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return suffix ? `${formatted} ${suffix}` : formatted;
};

export const getNumberSearchVariants = (value, suffix = "") => {
  if (value === null || value === undefined || value === "") return [];

  const number = Number(value);
  if (!Number.isFinite(number)) return [value];

  return [
    value,
    number.toFixed(2),
    formatFrenchNumber(number),
    suffix ? formatFrenchNumber(number, suffix) : "",
  ];
};

export const getDateSearchVariants = (value) => {
  if (value === null || value === undefined || value === "") return [];

  const rawValue = String(value);
  const isoDate = rawValue.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || "";
  return [rawValue, isoDate, formatFrenchDate(value, "")];
};

export const matchesNormalizedSearch = (searchTerm, values) => {
  const normalizedTerm = normalizeSearchValue(searchTerm);
  if (!normalizedTerm) return true;

  return values
    .flat(Infinity)
    .some((value) => normalizeSearchValue(value).includes(normalizedTerm));
};
