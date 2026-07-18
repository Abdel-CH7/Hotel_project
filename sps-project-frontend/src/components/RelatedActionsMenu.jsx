import { useCallback, useEffect, useRef } from "react";
import { Overlay } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEllipsisVertical } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

const RelatedActionsMenu = ({ roomId, roomNumber, show, onToggle }) => {
  const toggleRef = useRef(null);
  const menuItemRefs = useRef([]);
  const openedWithKeyboard = useRef(false);
  const roomLabel = roomNumber ? `Chambre ${roomNumber}` : "cette chambre";

  const closeMenu = useCallback((restoreFocus = false) => {
    onToggle(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, [onToggle]);

  useEffect(() => {
    if (!show || !openedWithKeyboard.current) return undefined;
    const frame = window.requestAnimationFrame(() => menuItemRefs.current[0]?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [show]);

  useEffect(() => {
    if (!show) return undefined;

    const closeForViewportChange = () => closeMenu(false);
    const closeForEscape = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu(true);
      }
    };

    window.addEventListener("scroll", closeForViewportChange, true);
    window.addEventListener("resize", closeForViewportChange);
    document.addEventListener("keydown", closeForEscape);

    return () => {
      window.removeEventListener("scroll", closeForViewportChange, true);
      window.removeEventListener("resize", closeForViewportChange);
      document.removeEventListener("keydown", closeForEscape);
    };
  }, [closeMenu, show]);

  const handleToggleClick = (event) => {
    openedWithKeyboard.current = event.detail === 0;
    onToggle(!show);
  };

  const handleToggleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openedWithKeyboard.current = true;
      if (show) menuItemRefs.current[0]?.focus();
      else onToggle(true);
    } else if (event.key === "Enter" || event.key === " ") {
      openedWithKeyboard.current = true;
    }
  };

  const handleMenuKeyDown = (event) => {
    const items = menuItemRefs.current.filter(Boolean);
    const currentIndex = items.indexOf(document.activeElement);
    let nextIndex = null;

    if (event.key === "ArrowDown") nextIndex = (currentIndex + 1) % items.length;
    if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + items.length) % items.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = items.length - 1;

    if (nextIndex !== null && items.length > 0) {
      event.preventDefault();
      items[nextIndex]?.focus();
    }
  };

  const links = [
    { label: "Voir l’état", to: `/etat-chambre?room_id=${roomId}` },
    { label: "Voir les équipements", to: `/equipements?chambre_id=${roomId}` },
    { label: "Voir les réservations", to: `/reservation?chambre_id=${roomId}` },
  ];

  return (
    <span className="app-related-actions-menu">
      <button
        ref={toggleRef}
        type="button"
        className="app-table-action is-muted app-related-actions-toggle"
        aria-label={`Actions liées à ${roomLabel}`}
        aria-haspopup="menu"
        aria-expanded={show}
        title="Actions liées"
        onClick={handleToggleClick}
        onKeyDown={handleToggleKeyDown}
      >
        <FontAwesomeIcon icon={faEllipsisVertical} />
      </button>

      <Overlay
        target={toggleRef.current}
        show={show}
        placement="bottom-end"
        flip
        rootClose
        rootCloseEvent="mousedown"
        onHide={() => closeMenu(false)}
        container={typeof document !== "undefined" ? document.body : null}
        popperConfig={{
          modifiers: [
            { name: "offset", options: { offset: [0, 7] } },
            { name: "preventOverflow", options: { boundary: "viewport", padding: 8 } },
            { name: "flip", options: { boundary: "viewport", padding: 8, fallbackPlacements: ["top-end", "bottom-start", "top-start"] } },
          ],
        }}
      >
        {({ placement, arrowProps, show: overlayShow, popper, ...overlayProps }) => (
          <div
            {...overlayProps}
            className="app-related-actions-overlay"
            role="menu"
            aria-label={`Actions liées à ${roomLabel}`}
            data-popper-placement={placement}
            onKeyDown={handleMenuKeyDown}
          >
            {links.map((link, index) => (
              <Link
                key={link.to}
                ref={(node) => { menuItemRefs.current[index] = node; }}
                className="app-related-actions-item"
                role="menuitem"
                tabIndex={-1}
                to={link.to}
                onClick={() => closeMenu(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </Overlay>
    </span>
  );
};

export default RelatedActionsMenu;
