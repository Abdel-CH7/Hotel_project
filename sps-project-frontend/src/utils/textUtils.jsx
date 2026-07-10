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