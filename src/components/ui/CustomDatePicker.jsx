import React from "react";
import { DatePicker } from "rsuite";

const CustomDatePicker = ({ popupClassName = "", container, ...props }) => {
  return (
    <DatePicker
      container={container || (() => document.body)}
      popupClassName={`!z-[999999] ${popupClassName}`}
      {...props}
    />
  );
};

export default CustomDatePicker;
