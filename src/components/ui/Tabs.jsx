import React from "react";

/**
 * Reusable Tabs Component styled with Tailwind CSS
 * @param {Array} tabs - List of tab objects (each containing a name, fixedType, or _id)
 * @param {any} activeTab - The currently active tab type
 * @param {function} onChange - Callback triggered on tab selection
 */
const Tabs = ({ tabs = [], activeTab, onChange }) => {
  return (
    <div className="!flex !flex-wrap !gap-3 !mb-4">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.fixedType;
        return (
          <button
            key={tab._id || tab.fixedType}
            type="button"
            onClick={() => onChange(tab.fixedType)}
            className={`!px-4 !py-1.5 !rounded-sm !text-[13px] !font-semibold !whitespace-nowrap !transition-all !duration-250 !cursor-pointer !shadow-sm !border ${isActive
              ? "!bg-[var(--color-primary,#4c2691)] !border-[var(--color-primary,#4c2691)] !text-white !shadow-[var(--color-primary,#4c2691)]/15 !shadow-sm"
              : "!bg-white !border-slate-200 !text-slate-700 hover:!bg-purple-50/50 hover:!border-[var(--color-primary,#4c2691)] hover:!text-[var(--color-primary,#4c2691)]"
              }`}
          >
            {tab.name}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
