import React, { useState, useEffect, useRef } from "react";

interface TopBarProps {
  editMode: boolean;
  onToggleEditMode: () => void;
  completedView: "all" | "hide" | "collapse";
  onCompletedViewChange: (view: "all" | "hide" | "collapse") => void;
  checkedCount: number;
  totalPrice: string;
  cartCCYS: string;
  onNavigateBack: () => void;
  onClearAllState: () => void;
  onClearAllButChecked: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  editMode,
  onToggleEditMode,
  completedView,
  onCompletedViewChange,
  checkedCount,
  totalPrice,
  cartCCYS,
  onNavigateBack,
  onClearAllState,
  onClearAllButChecked,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <button onClick={onNavigateBack} className="back-btn" title="Go back">
          <span className="icon">←</span>
        </button>
      </div>

      <div className="top-bar-center">
        <div className="view-controls">
          <button
            className={`view-btn ${completedView === "all" ? "active" : ""}`}
            onClick={() => onCompletedViewChange("all")}
            title="Show all items"
          >
            <span className="icon">👁</span>
            <span className="label">All</span>
          </button>
          <button
            className={`view-btn ${completedView === "hide" ? "active" : ""}`}
            onClick={() => onCompletedViewChange("hide")}
            title="Hide completed items"
          >
            <span className="icon">🙈</span>
            <span className="label">Hide</span>
          </button>
          <button
            className={`view-btn ${
              completedView === "collapse" ? "active" : ""
            }`}
            onClick={() => onCompletedViewChange("collapse")}
            title="Collapse completed items"
          >
            <span className="icon">📁</span>
            <span className="label">Collapse</span>
          </button>
        </div>
      </div>

      <div className="top-bar-right">
        <div className="selected-total-top">
          <span className="icon">✓</span>
          <span className="count">{checkedCount}</span>
          <span className="price">
            {cartCCYS}
            {totalPrice}
          </span>
        </div>

        <div className="menu" ref={menuRef}>
          <button
            className="menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
            title="More options"
          >
            <span className="icon">⋮</span>
          </button>
          {menuOpen && (
            <div className="menu-dropdown" role="menu">
              <button
                className="menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onClearAllState();
                }}
              >
                <span className="icon">🗑</span>
                <span className="label">Clear all</span>
              </button>
              <button
                className="menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onClearAllButChecked();
                }}
              >
                <span className="icon">✓</span>
                <span className="label">Keep checked</span>
              </button>
            </div>
          )}
        </div>

        <button
          className={`edit-mode-btn ${editMode ? "active" : ""}`}
          onClick={onToggleEditMode}
          title={editMode ? "Finish editing" : "Edit items"}
        >
          <span className="icon">{editMode ? "✓" : "✏"}</span>
          <span className="label">{editMode ? "Done" : "Edit"}</span>
        </button>
      </div>
    </div>
  );
};
