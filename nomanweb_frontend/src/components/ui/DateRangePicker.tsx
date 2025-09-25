"use client";

import { useState } from "react";
import DatePicker from "./DatePicker";

interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  showTime?: boolean;
  className?: string;
  startPlaceholder?: string;
  endPlaceholder?: string;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  disabled = false,
  minDate,
  maxDate,
  showTime = false,
  className = "",
  startPlaceholder = "Start date",
  endPlaceholder = "End date",
}) => {
  const handleStartDateChange = (date: Date | null) => {
    const newRange = { ...value, startDate: date };
    
    // If start date is after end date, clear end date
    if (date && value.endDate && date > value.endDate) {
      newRange.endDate = null;
    }
    
    onChange(newRange);
  };

  const handleEndDateChange = (date: Date | null) => {
    onChange({ ...value, endDate: date });
  };

  const getEndDateMinDate = () => {
    if (value.startDate && minDate) {
      return value.startDate > minDate ? value.startDate : minDate;
    }
    return value.startDate || minDate;
  };

  return (
    <div className={`flex space-x-2 ${className}`}>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {startPlaceholder}
        </label>
        <DatePicker
          value={value.startDate}
          onChange={handleStartDateChange}
          placeholder={startPlaceholder}
          disabled={disabled}
          minDate={minDate}
          maxDate={value.endDate || maxDate}
          showTime={showTime}
        />
      </div>
      
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {endPlaceholder}
        </label>
        <DatePicker
          value={value.endDate}
          onChange={handleEndDateChange}
          placeholder={endPlaceholder}
          disabled={disabled || !value.startDate}
          minDate={getEndDateMinDate()}
          maxDate={maxDate}
          showTime={showTime}
        />
      </div>
    </div>
  );
};

export default DateRangePicker;