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
        <button onClick={onNavigateBack} className="back-link">
          ← Back
        </button>
      </div>
      <div className="top-bar-center">
        <div className="view-controls">
          <button
            className={`view-btn ${completedView === "all" ? "active" : ""}`}
            onClick={() => onCompletedViewChange("all")}
          >
            All
          </button>
          <button
            className={`view-btn ${completedView === "hide" ? "active" : ""}`}
            onClick={() => onCompletedViewChange("hide")}
          >
            Hide Done
          </button>
          <button
            className={`view-btn ${
              completedView === "collapse" ? "active" : ""
            }`}
            onClick={() => onCompletedViewChange("collapse")}
          >
            Collapse Done
          </button>
        </div>
      </div>
      <div className="top-bar-right">
        <div className="selected-total-top">
          Selected ({checkedCount} items): {cartCCYS}
          {totalPrice}
        </div>
        <div className="menu" ref={menuRef}>
          <button
            className={`menu-btn`}
            onClick={() => setMenuOpen((v) => !v)}
            aria-haspopup="true"
            aria-expanded={menuOpen}
          >
            •••
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
                Clear all state
              </button>
              <button
                className="menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onClearAllButChecked();
                }}
              >
                Clear all except checked
              </button>
            </div>
          )}
        </div>
        <button
          className={`edit-mode-btn ${editMode ? "active" : ""}`}
          onClick={onToggleEditMode}
        >
          {editMode ? "Done" : "Edit"}
        </button>
      </div>
    </div>
  );
};
