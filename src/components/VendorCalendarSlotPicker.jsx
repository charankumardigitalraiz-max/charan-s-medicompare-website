import { useEffect, useMemo, useState } from "react";
import { format, isSameDay, startOfDay } from "date-fns";

const generateSlotsFromRange = (startTimeStr, endTimeStr, selectedDate) => {
  if (!startTimeStr || !endTimeStr) return [];

  const slots = [];
  let [startHours, startMinutes] = startTimeStr.split(":").map(Number);
  let [endHours, endMinutes] = endTimeStr.split(":").map(Number);

  let currentTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  const now = new Date();
  const isToday = isSameDay(selectedDate, now);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const twoHoursBuffer = 120; // 2 hours in minutes

  while (currentTotalMinutes < endTotalMinutes) {
    const hh = Math.floor(currentTotalMinutes / 60);
    const mm = currentTotalMinutes % 60;
    const ampm = hh >= 12 ? "PM" : "AM";
    const displayHH = hh % 12 || 12;
    const displayMM = mm.toString().padStart(2, "0");

    let nextTotalMinutes = currentTotalMinutes + 60;
    if (nextTotalMinutes > endTotalMinutes) {
      nextTotalMinutes = endTotalMinutes;
    }

    const nextHH = Math.floor(nextTotalMinutes / 60);
    const nextMM = nextTotalMinutes % 60;
    const nextAmpm = nextHH >= 12 ? "PM" : "AM";
    const nextDisplayHH = nextHH % 12 || 12;
    const nextDisplayMM = nextMM.toString().padStart(2, "0");

    const slot = `${displayHH}:${displayMM} ${ampm} - ${nextDisplayHH}:${nextDisplayMM} ${nextAmpm}`;
    if (!isToday || currentTotalMinutes >= currentMinutes + twoHoursBuffer) {
      slots.push(slot);
    }

    currentTotalMinutes += 60;
  }

  return slots;
};

const VendorCalendarSlotPicker = ({
  selectedDate: initialDate,
  selectedTimeSlot: initialTimeSlot,
  calendarDays = [],
  calendarMonth,
  calendarYear,
  isLoading = false,
  onMonthChange,
  onSelectSlot,
  confirmLabel = "Confirm Slot",
  layout = "column",
}) => {
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(
    initialTimeSlot || "",
  );

  // console.log("calender dates", calendarDays)

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    setSelectedTimeSlot(initialTimeSlot || "");
  }, [initialTimeSlot]);

  const daysMap = useMemo(() => {
    const map = {};
    calendarDays.forEach((day) => {
      if (day?.date) {
        map[day.date] = day;
      }
    });
    return map;
  }, [calendarDays]);

  const selectedDateKey = format(selectedDate, "yyyy-MM-dd");
  const selectedDayData = daysMap[selectedDateKey];

  const availableSlots =
    selectedDayData?.isOpen && selectedDayData?.startTime && selectedDayData?.endTime
      ? generateSlotsFromRange(
        selectedDayData.startTime,
        selectedDayData.endTime,
        selectedDate,
      )
      : [];

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTimeSlot("");
  };

  const handleDone = () => {
    if (selectedDate && selectedTimeSlot) {
      onSelectSlot(selectedDate, selectedTimeSlot);
    }
  };

  const handleMonthNav = (direction) => {
    if (!onMonthChange || !calendarMonth || !calendarYear) return;

    const nextDate = new Date(calendarYear, calendarMonth - 1 + direction, 1);
    setSelectedDate(nextDate);
    setSelectedTimeSlot("");
    onMonthChange(nextDate.getMonth() + 1, nextDate.getFullYear());
  };

  const monthLabel = calendarMonth
    ? format(new Date(calendarYear, calendarMonth - 1, 1), "MMMM yyyy")
    : format(selectedDate, "MMMM yyyy");

  // Custom Calendar Grid generation
  const calendarGrid = useMemo(() => {
    const year = calendarYear || selectedDate.getFullYear();
    const month = calendarMonth || (selectedDate.getMonth() + 1);

    const firstDayOfMonth = new Date(year, month - 1, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month, 0).getDate();

    const grid = [];

    // Prev month padding (empty cells)
    for (let i = 0; i < startDayOfWeek; i++) {
      grid.push({ date: null, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month - 1, i);
      grid.push({ date: d, isCurrentMonth: true });
    }

    // Next month padding to complete 42 cells (empty cells)
    const totalCells = 42;
    const nextMonthPadding = totalCells - grid.length;
    for (let i = 1; i <= nextMonthPadding; i++) {
      grid.push({ date: null, isCurrentMonth: false });
    }

    return grid;
  }, [calendarMonth, calendarYear, selectedDate]);

  const isDateDisabled = (date) => {
    if (!date) return true;
    const today = startOfDay(new Date());
    if (startOfDay(date) < today) return true;

    const dateKey = format(date, "yyyy-MM-dd");
    const dayData = daysMap[dateKey];
    if (!dayData) return true;
    return !dayData.isOpen;
  };

  const getDayData = (date) => {
    if (!date) return null;
    const dateKey = format(date, "yyyy-MM-dd");
    return daysMap[dateKey];
  };

  return (
    <div className="slot-picker-container">
      <style>{`
        .slot-picker-container {
          position: relative;
          display: flex;
          flex-direction: column;
          font-family: inherit;
          background: #fff;
        }
        .slot-picker-columns-wrapper {
          display: flex;
          align-items: stretch;
        }
        .layout-column {
          flex-direction: row;
          gap: 24px;
        }
        .layout-row {
          flex-direction: column;
          gap: 12px;
        }
        .calendar-column {
          flex: 1.2;
          min-width: 0;
        }
        .slots-column {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .slot-picker-columns-wrapper.layout-column .slots-column {
          border-left: 1px solid #f1f5f9;
          padding-left: 20px;
        }
        .slot-picker-columns-wrapper.layout-row .slots-column {
          border-left: none;
          padding-left: 0;
          margin-top: 10px;
        }
        @media (max-width: 768px) {
          .slot-picker-columns-wrapper.layout-column {
            flex-direction: column;
          }
          .slot-picker-columns-wrapper.layout-column .slots-column {
            border-left: none;
            padding-left: 0;
            margin-top: 10px;
          }
        }
        .vc-month-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 12px;
        }
        .vc-month-nav button {
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          font-size: 14px;
          transition: color 0.2s;
        }
        .vc-month-nav button:hover:not(:disabled) {
          color: #8059ca;
        }
        .vc-month-nav button:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .vc-month-nav span {
          font-size: 14px;
          font-weight: 600;
          color: #334155;
        }
        
        .custom-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 6px;
        }
        .calendar-weekday-header {
          text-align: center;
          font-size: 11px;
          font-weight: 600;
          color: #94a3b8;
          padding: 2px 0;
        }
        .calendar-day-cell {
          aspect-ratio: 1;
          width: 32px;
          height: 32px;
          margin: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 500;
          cursor: pointer;
          position: relative;
          user-select: none;
          transition: all 0.15s;
          color: #475569;
          background: #fff;
          border: 1px solid #e2e8f0; /* Border on every date */
        }
        .calendar-day-cell:hover:not(.disabled):not(.selected) {
          background: #f8fafc;
          border-color: #cbd5e1;
          color: #1e293b;
        }
        .calendar-day-cell.disabled {
          color: #cbd5e1;
          cursor: not-allowed;
          opacity: 0.35;
          background: #f8fafc;
          border-color: #f1f5f9;
        }
        .calendar-day-cell.selected {
          background: #f3effa !important;
          border-color: #8059ca !important;
          color: #8059ca !important;
          font-weight: 700 !important;
        }
        .day-dot-indicator {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          position: absolute;
          bottom: 3px;
          background-color: #a78bfa;
        }

        .time-slots-grid-fixed {
          display: grid;
          grid-template-columns: repeat(2, 1fr); /* Compact columns */
          gap: 8px;
          margin-top: 8px;
        }
        .time-slot-pill {
          padding: 8px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          text-align: center;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          background: #fff;
          transition: all 0.15s;
          color: #475569;
        }
        .time-slot-pill:hover {
          border-color: #8059ca;
          color: #8059ca;
          background: #fdfaff;
        }
        .time-slot-pill.selected {
          background: #8059ca;
          border-color: #8059ca;
          color: #fff;
        }
        .slots-action-bar {
          margin-top: auto;
          padding-top: 14px;
          background: #fff;
          border-top: 1px solid #f1f5f9;
        }
        .book-btn-purple {
          width: 100%;
          background: #8059ca;
          color: #fff;
          border: none;
          padding: 10px;
          border-radius: 6px;
          font-weight: 600;
          font-size: 13.5px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .book-btn-purple:hover:not(:disabled) {
          background: #6f42c1;
        }
        .book-btn-purple:disabled {
          background: #e2e8f0;
          color: #94a3b8;
          cursor: not-allowed;
        }
        .section-title {
          font-size: 11.5px;
          font-weight: 600;
          color: #64748b;
          margin-bottom: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .vc-loading-overlay {
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 15;
        }
      `}</style>

      <div className={`slot-picker-columns-wrapper layout-${layout}`}>
        {/* LEFT COLUMN: Calendar */}
        <div className="calendar-column">
          <div className="vc-month-nav">
            <button
              type="button"
              onClick={() => handleMonthNav(-1)}
              disabled={isLoading}
              aria-label="Previous month"
            >
              <i className="fas fa-chevron-left" />
            </button>
            <span>{monthLabel}</span>
            <button
              type="button"
              onClick={() => handleMonthNav(1)}
              disabled={isLoading}
              aria-label="Next month"
            >
              <i className="fas fa-chevron-right" />
            </button>
          </div>

          <div className="custom-calendar-grid">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day} className="calendar-weekday-header">
                {day}
              </div>
            ))}

            {calendarGrid.map((cell, idx) => {
              if (!cell.date) {
                return <div key={`empty-${idx}`} />;
              }

              const { date } = cell;
              const isSel = isSameDay(date, selectedDate);
              const isDisabled = isDateDisabled(date);
              const dayData = getDayData(date);
              const hasSlots = dayData?.isOpen && dayData?.startTime && dayData?.endTime;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => !isDisabled && handleDateChange(date)}
                  disabled={isDisabled}
                  className={`calendar-day-cell ${isDisabled ? "disabled" : ""} ${isSel ? "selected" : ""}`}
                >
                  {date.getDate()}
                  {hasSlots && !isSel && <span className="day-dot-indicator" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Available slots & confirmation */}
        <div className="slots-column">
          {isLoading ? (
            <div
              className="d-flex align-items-center justify-content-center"
              style={{ minHeight: "150px" }}
            >
              <div className="spinner-border spinner-border-sm text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : !selectedDayData || !selectedDayData.isOpen ? (
            <div
              className="closed-message"
              style={{
                textAlign: "center",
                padding: "12px",
                color: "#ef4444",
                fontWeight: "500",
                background: "#fef2f2",
                border: "1px solid #fee2e2",
                borderRadius: "6px",
                fontSize: "12.5px"
              }}
            >
              {selectedDayData?.vacationReason || "Closed on this day."}
            </div>
          ) : (
            <>
              <div className="section-title">
                Available Timings
              </div>
              <div className="time-slots-grid-fixed">
                {availableSlots.map((slot) => (
                  <div
                    key={slot}
                    className={`time-slot-pill ${selectedTimeSlot === slot ? "selected" : ""}`}
                    onClick={() => setSelectedTimeSlot(slot)}
                  >
                    {slot}
                  </div>
                ))}
                {availableSlots.length === 0 && (
                  <div
                    style={{
                      gridColumn: "span 2",
                      textAlign: "center",
                      padding: "16px",
                      color: "#94a3b8",
                      fontSize: "12px",
                    }}
                  >
                    No slots available.
                  </div>
                )}
              </div>
            </>
          )}

          <div className="slots-action-bar">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
                fontSize: "12px",
              }}
            >
              <span style={{ color: "#64748b" }}>Selection</span>
              <span style={{ fontWeight: 600, color: "#8059ca" }}>
                {selectedTimeSlot
                  ? `${format(selectedDate, "dd MMM")} at ${selectedTimeSlot}`
                  : "Pick a time"}
              </span>
            </div>
            <button
              className="book-btn-purple"
              disabled={!selectedTimeSlot || isLoading}
              onClick={handleDone}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorCalendarSlotPicker;
