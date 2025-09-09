"use client";

import { useState, useRef, useEffect } from "react";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

interface DatePickerProps {
  value?: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: Date;
  maxDate?: Date;
  showTime?: boolean;
  className?: string;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  minDate,
  maxDate,
  showTime = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState({ hours: 12, minutes: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value && showTime) {
      setSelectedTime({
        hours: value.getHours(),
        minutes: value.getMinutes(),
      });
    }
  }, [value, showTime]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    if (showTime) {
      return date.toLocaleString();
    }
    return date.toLocaleDateString();
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const handleDateSelect = (day: number) => {
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
      showTime ? selectedTime.hours : 0,
      showTime ? selectedTime.minutes : 0
    );

    if (!isDateDisabled(selectedDate)) {
      onChange(selectedDate);
      if (!showTime) {
        setIsOpen(false);
      }
    }
  };

  const handleTimeChange = (hours: number, minutes: number) => {
    setSelectedTime({ hours, minutes });
    if (value) {
      const newDate = new Date(value);
      newDate.setHours(hours, minutes);
      onChange(newDate);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(prev.getMonth() - 1);
      } else {
        newMonth.setMonth(prev.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const isSelected = value && 
        value.getDate() === day && 
        value.getMonth() === currentMonth.getMonth() && 
        value.getFullYear() === currentMonth.getFullYear();
      const isDisabled = isDateDisabled(date);
      const isToday = new Date().toDateString() === date.toDateString();

      days.push(
        <button
          key={day}
          onClick={() => handleDateSelect(day)}
          disabled={isDisabled}
          className={`
            w-8 h-8 text-sm rounded-md transition-colors
            ${isSelected 
              ? 'bg-blue-600 text-white' 
              : isToday 
                ? 'bg-blue-100 text-blue-800' 
                : 'hover:bg-gray-100'
            }
            ${isDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700'}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value ? formatDate(value) : placeholder}
        </span>
        <CalendarIcon className="h-5 w-5 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 p-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <h3 className="font-medium text-gray-900">
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h3>
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="w-8 h-8 text-xs font-medium text-gray-500 flex items-center justify-center">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {renderCalendar()}
          </div>

          {/* Time Picker */}
          {showTime && (
            <div className="border-t pt-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Time:</label>
                <select
                  value={selectedTime.hours}
                  onChange={(e) => handleTimeChange(parseInt(e.target.value), selectedTime.minutes)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
                <span className="text-gray-500">:</span>
                <select
                  value={selectedTime.minutes}
                  onChange={(e) => handleTimeChange(selectedTime.hours, parseInt(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {Array.from({ length: 60 }, (_, i) => (
                    <option key={i} value={i}>
                      {i.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
            <button
              onClick={() => {
                onChange(null);
                setIsOpen(false);
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
            >
              Clear
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;