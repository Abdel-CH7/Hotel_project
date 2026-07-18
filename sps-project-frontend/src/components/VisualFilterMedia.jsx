import { useEffect, useMemo, useState } from "react";
import { getStorageImageUrl } from "../utils/mediaUtils";

const VisualFilterMedia = ({ src, alt, fallback }) => {
  const normalizedSrc = useMemo(() => getStorageImageUrl(src), [src]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [normalizedSrc]);

  if (!normalizedSrc || failed) {
    return <span className="app-visual-filter-fallback" aria-hidden="true">{fallback}</span>;
  }

  return (
    <img
      src={normalizedSrc}
      alt={alt}
      className="app-visual-filter-media"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
};

export default VisualFilterMedia;
