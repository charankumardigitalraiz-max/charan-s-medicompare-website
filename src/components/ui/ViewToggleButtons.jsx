import React from "react";
import { RiLayoutGrid2Fill, RiListCheck } from "react-icons/ri";

const ViewToggleButtons = ({
  isFull = false,
  onToggle,
  className = "",
  style = {},
}) => {
  return (
    <div className={`view-toggle-buttons ${className}`} style={style}>
      <button
        className={`d-none d-lg-block view-toggle-btn ${
          !isFull ? "active" : ""
        }`}
        onClick={() => onToggle(false)}
        title="Grid View"
        type="button"
        style={{
          height: "28px",
          width: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        <RiLayoutGrid2Fill size={16} />
      </button>

      <button
        className={`d-none d-lg-block view-toggle-btn ${
          isFull ? "active" : ""
        }`}
        onClick={() => onToggle(true)}
        title="List View"
        type="button"
        style={{
          height: "28px",
          width: "28px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        <RiListCheck size={16} />
      </button>
    </div>
  );
};

export default ViewToggleButtons;
