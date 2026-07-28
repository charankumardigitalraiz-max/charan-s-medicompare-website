import React from "react";

const SearchInput = ({
  value,
  onChange,
  placeholder = "Search...",
  showClearButton = true,
  showSuggestions = false,
  suggestions = [],
  className = "",
  icon = "fas fa-search",
  onClear,
  ...props
}) => {
  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChange({ target: { value: "" } });
    }
  };

  return (
    <div className={`relative max-w-[700px] mx-auto z-10 ${className}`}>
      <div className="relative bg-white rounded-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-solid border-[rgba(0,0,0,0.05)] p-[4px_4px_4px_50px] overflow-hidden focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.08)] focus-within:border-[rgba(0,0,0,0.1)]">
        <div className="absolute left-[18px] top-1/2 -translate-y-1/2 text-[#8059ca] text-[18px] z-10">
          <i className={icon}></i>
        </div>
        <input
          type="text"
          className="w-full border-none outline-none bg-transparent text-[15px] text-[#1a1a1a] p-[6px_0_6px_6px] font-[500] placeholder:text-[#999] placeholder:font-[400]"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          {...props}
        />
        {showClearButton && value && (
          <button
            className="absolute right-[20px] top-1/2 -translate-y-1/2 bg-[rgba(125,46,255,0.1)] border-none rounded-full w-[32px] h-[32px] flex items-center justify-center text-[#8059ca] cursor-pointer z-10 hover:bg-[rgba(125,46,255,0.2)] transition-all duration-200"
            onClick={handleClear}
            aria-label="Clear search"
            type="button"
          >
            <i className="fas fa-times"></i>
          </button>
        )}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-[8px] bg-white rounded-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.1)] border border-solid border-slate-100 overflow-hidden z-20">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-[10px_16px] text-[14px] text-[#333] cursor-pointer hover:bg-slate-50 transition-all duration-150"
                onClick={() => onChange({ target: { value: suggestion } })}
              >
                {suggestion}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchInput;

