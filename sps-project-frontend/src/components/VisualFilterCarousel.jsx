import { useRef } from "react";
import VisualFilterMedia from "./VisualFilterMedia";

const SCROLL_DISTANCE = 300;

const VisualFilterCarousel = ({
  title,
  items,
  value,
  onChange,
  renderIcon,
  allLabel = "Tout",
  renderAllIcon,
  ariaLabel,
  className = "",
}) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    scrollRef.current?.scrollBy({
      left: direction * SCROLL_DISTANCE,
      behavior: "smooth",
    });
  };

  const options = [{ id: "", label: allLabel, isAll: true }, ...items];

  return (
    <section className={`app-card app-visual-filter ${className}`.trim()}>
      {title && <h5 className="app-filter-title">{title}</h5>}

      <div className="app-visual-filter-layout" role="group" aria-label={ariaLabel || title}>
        <button
          type="button"
          className="app-visual-filter-arrow is-previous"
          onClick={() => scroll(-1)}
          aria-label={`Faire défiler ${ariaLabel || title} vers la gauche`}
        >
          <span aria-hidden="true">&#8249;</span>
        </button>

        <div className="app-visual-filter-scroll" ref={scrollRef}>
          {options.map((item) => {
            const selected = String(value ?? "") === String(item.id ?? "");

            return (
              <button
                type="button"
                key={item.isAll ? "all" : item.id}
                className={`app-visual-filter-card${selected ? " is-selected" : ""}`}
                onClick={() => onChange(item.id)}
                aria-pressed={selected}
                title={item.label}
              >
                <span className="app-visual-filter-icon">
                  <VisualFilterMedia
                    src={item.isAll ? "" : item.photo}
                    alt={item.label}
                    fallback={item.isAll ? renderAllIcon?.() : renderIcon?.(item)}
                  />
                </span>
                <span className="app-visual-filter-label">{item.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className="app-visual-filter-arrow is-next"
          onClick={() => scroll(1)}
          aria-label={`Faire défiler ${ariaLabel || title} vers la droite`}
        >
          <span aria-hidden="true">&#8250;</span>
        </button>
      </div>
    </section>
  );
};

export default VisualFilterCarousel;
