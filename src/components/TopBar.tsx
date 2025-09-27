import React from "react";

interface TopBarProps {
  editMode: boolean;
  onToggleEditMode: () => void;
  completedView: "all" | "hide" | "collapse";
  onCompletedViewChange: (view: "all" | "hide" | "collapse") => void;
  checkedCount: number;
  totalPrice: string;
  cartCCYS: string;
  onNavigateBack: () => void;
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
}) => {
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
