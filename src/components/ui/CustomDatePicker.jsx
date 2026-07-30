import React from "react";
import { DatePicker } from "rsuite";

const CustomDatePicker = ({ container, ...props }) => {
  return (
    <DatePicker
      container={container || (() => document.body)}
      menuStyle={{ zIndex: 999999999 }}
      // popupClassName={`!z-[999999]`}
      {...props}
    />
  );
};

export default CustomDatePicker;
