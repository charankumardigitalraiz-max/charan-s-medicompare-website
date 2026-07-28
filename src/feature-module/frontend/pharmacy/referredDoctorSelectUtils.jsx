import { Children } from "react";
import { components } from "react-select";

export const NOT_APPLICABLE_DOCTOR_OPTION = {
  value: "self_referral",
  // value: "not_applicable",
  label: "Self Referral",
};

export const mapDoctorToSelectOption = (doctor) => ({
  value: doctor._id,
  label: `${doctor.name}${doctor["AreaOfPractice "] ? ` (${doctor["AreaOfPractice "]})` : ""}${doctor.place ? `, ${doctor.place}` : ""}`,
});

export const getReferredDoctorSelectOptions = (doctors) => {
  // doctors here are raw doctor objects with _id, name, etc.
  const mapped = (doctors || []).map(mapDoctorToSelectOption);
  return mapped; // NOT_APPLICABLE is always shown via ReferredDoctorMenuList
};

export const ReferredDoctorMenuList = (props) => {
  const { children, selectProps } = props;
  const isSelected = selectProps.value?.value === "self_referral";

  const handleNotApplicableMouseDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    selectProps.onChange(NOT_APPLICABLE_DOCTOR_OPTION, {
      action: "select-option",
      option: NOT_APPLICABLE_DOCTOR_OPTION,
    });
  };

  const filteredChildren = Children.toArray(children).filter((child) => {
    const optionValue = child?.props?.data?.value;
    return optionValue !== "self_referral";
  });

  return (
    <components.MenuList {...props}>
      <div
        role="option"
        aria-selected={isSelected}
        onMouseDown={handleNotApplicableMouseDown}
        style={{
          padding: "10px 14px",
          cursor: "pointer",
          fontSize: "14px",
          color: isSelected ? "#fff" : "#333",
          backgroundColor: isSelected ? "#8059ca" : "#fff",
          borderBottom: "1px solid #eee",
        }}
        onMouseEnter={(event) => {
          if (!isSelected) {
            event.currentTarget.style.backgroundColor = "#f3effa";
          }
        }}
        onMouseLeave={(event) => {
          if (!isSelected) {
            event.currentTarget.style.backgroundColor = "#fff";
          }
        }}
      >
        Self Referral
      </div>
      {filteredChildren}
    </components.MenuList>
  );
};

export const referredDoctorSelectComponents = {
  MenuList: ReferredDoctorMenuList,
};

export const handleReferredDoctorInputChange = (
  inputValue,
  actionMeta,
  setSearchQuery,
) => {
  if (actionMeta.action === "input-change") {
    setSearchQuery(inputValue);
  }
};

export const handleReferredDoctorSelectChange = (
  selectedOption,
  setSelectedDoctor,
  setDoctorName,
  setSearchQuery,
) => {
  setSelectedDoctor(selectedOption);
  setDoctorName(selectedOption?.label || "");
  setSearchQuery("");
};
