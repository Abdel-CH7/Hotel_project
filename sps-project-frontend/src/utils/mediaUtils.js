const DEFAULT_STORAGE_URL = "http://127.0.0.1:8000/storage";

export const getStorageImageUrl = (
  source,
  fallbackSource = "",
  storageUrl = DEFAULT_STORAGE_URL
) => {
  const selectedSource = source || fallbackSource;
  if (!selectedSource) return "";

  const path = String(selectedSource);

  if (
    path.startsWith("http://") ||
    path.startsWith("https://") ||
    path.startsWith("data:") ||
    path.startsWith("blob:")
  ) {
    return path;
  }

  const cleanPath = path.replace(/^\/+/, "").replace(/^storage\//, "");
  return `${storageUrl}/${cleanPath}`;
};
