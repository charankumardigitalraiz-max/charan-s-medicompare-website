import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { axiosCommonInstance } from "../../../../Apiservice";

const CommonPhoneInput = ({
  onChange,
  placeholder = "Enter phone number",
  required = true,
}) => {
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [phoneNumber, setPhoneNumber] = useState("");

  const getAllCountries = async () => {
    try {
      const response = await axiosCommonInstance.get("countries");
      const { countries, defaultCountry } = response.data.data;
      setCountries(countries);
      setSelectedCountry(defaultCountry || countries[0]);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    getAllCountries();
  }, []);

  const handleCountryChange = (e) => {
    const country = countries.find((c) => c._id === e.target.value);
    if (country) {
      setSelectedCountry(country);
      onChange({
        countryCode: country.phonecode,
        phoneNumber: phoneNumber,
      });
    }
  };

  const handleInput = (e) => {
    let onlyNums = e.target.value.replace(/\D/g, "");
    if (selectedCountry?.phonecode === "91") {
      onlyNums = onlyNums.replace(/^0+/, "");
      if (onlyNums.length > 0 && !/^[6-9]/.test(onlyNums)) {
        onlyNums = "";
      }
      onlyNums = onlyNums.slice(0, 10);
    }

    setPhoneNumber(onlyNums);
    onChange({
      countryCode: selectedCountry?.phonecode || "",
      phoneNumber: onlyNums,
    });
  };

  return (
    <div className="phone-input PhoneInput" style={{ width: "100%" }}>
      <div
        className="phone-input-container"
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          height: "48px",
          borderRadius: "8px",
          border: "1px solid #b470f3ff",
          backgroundColor: "#fff",
          padding: "0 16px",
          boxSizing: "border-box",
          gap: "12px",
        }}
      >
        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
          }}
        >
          <select
            aria-label="Phone number country"
            className="PhoneInputCountrySelect"
            value={selectedCountry?._id || ""}
            onChange={handleCountryChange}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              cursor: "pointer",
              appearance: "none",
              backgroundColor: "transparent",
              zIndex: 2,
              opacity: 0,
            }}
          >
            {countries.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} (+{c.phonecode})
              </option>
            ))}
          </select>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "16px",
                overflow: "hidden",
                backgroundColor: "#f3f3f3",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "2px",
              }}
            >
              {selectedCountry?.flagSvg ? (
                <span
                  dangerouslySetInnerHTML={{ __html: selectedCountry.flagSvg }}
                  style={{ lineHeight: 1 }}
                />
              ) : (
                <img
                  src="/assets/default.png"
                  alt="Default country"
                  width="16"
                  height="16"
                />
              )}
            </div>

            <span
              style={{
                fontWeight: "600",
                fontSize: "16px",
                color: "#374151",
                whiteSpace: "nowrap",
              }}
            >
              +{selectedCountry?.phonecode}
            </span>

            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              style={{ marginLeft: "2px" }}
            >
              <path
                d="M3 4.5L6 7.5L9 4.5"
                stroke="#6b7280"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <div
          style={{
            width: "1px",
            height: "24px",
            backgroundColor: "#e5e7eb",
          }}
        />

        <input
          autoComplete="tel"
          placeholder="Mobile Number"
          required={required}
          className="PhoneInputInput"
          type="tel"
          value={phoneNumber}
          onChange={handleInput}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: "16px",
            color: "#374151",
            backgroundColor: "transparent",
            height: "100%",
            padding: "0",
            boxShadow: "none",
          }}
        />
      </div>
    </div>
  );
};

export default CommonPhoneInput;