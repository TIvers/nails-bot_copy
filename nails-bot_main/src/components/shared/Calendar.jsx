import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/Button";
import { normal } from "../../utils/constants";

const cn = (...classes) => classes.filter(Boolean).join(" ");

export default function Calendar({ setActiveCalendar, filterByDate }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date(2024, 0, 12)); // January 12, 2024

  // Get the first day of the month
  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const startingDayIndex = firstDayOfMonth.getDay();

  // Get the last day of the month
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );
  const totalDays = lastDayOfMonth.getDate();

  // Get days from previous month
  const daysFromPrevMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    0
  ).getDate();

  const weeks = [];
  let days = [];
  let day = 1;
  let prevMonthDay = daysFromPrevMonth - startingDayIndex + 1;
  let nextMonthDay = 1;

  // Calendar header
  const daysOfWeek = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

  // Get month name
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  // Navigation handlers
  const prevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    );
  };

  // Build calendar grid
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 7; j++) {
      if (i === 0 && j < startingDayIndex) {
        // Previous month days
        days.push({
          date: new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() - 1,
            prevMonthDay
          ),
          dayNumber: prevMonthDay++,
          isCurrentMonth: false,
        });
      } else if (day <= totalDays) {
        // Current month days
        days.push({
          date: new Date(
            currentDate.getFullYear(),
            currentDate.getMonth(),
            day
          ),
          dayNumber: day++,
          isCurrentMonth: true,
        });
      } else {
        // Next month days
        days.push({
          date: new Date(
            currentDate.getFullYear(),
            currentDate.getMonth() + 1,
            nextMonthDay
          ),
          dayNumber: nextMonthDay++,
          isCurrentMonth: false,
        });
      }
    }
    weeks.push(days);
    days = [];
  }
  const formatter = new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
  const formatted = formatter.format(selectedDate);

  return (
    <div className="w-full max-w-sm mx-auto p-4">
      <div className="mb-4">
        {/* Calendar header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-2">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h2 className="text-lg font-medium">{monthName}</h2>
          <button onClick={nextMonth} className="p-2">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Days of week */}
        <div className="grid grid-cols-7 mb-2">
          {daysOfWeek.map((day, index) => (
            <div key={index} className="text-center text-sm py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="border border-gray-200 rounded-lg">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7">
              {week.map(({ date, dayNumber, isCurrentMonth }, dayIndex) => {
                const isToday =
                  date.toDateString() === new Date().toDateString();
                const isSelected =
                  date.toDateString() === selectedDate?.toDateString();
                return (
                  <button
                    key={dayIndex}
                    onClick={() => setSelectedDate(date)}
                    className={cn(
                      "h-10 text-sm font-medium",
                      "hover:bg-secondary",
                      "disabled:cursor-not-allowed",
                      "border-t first:border-l",
                      dayIndex !== 6 && "border-r",
                      weekIndex === 5 && "border-b",
                      !isCurrentMonth && "text-gray_dark",
                      isToday && "bg-gray_dark text-white rounded-lg",
                      isSelected && !isToday && " bg-secondary  rounded-lg",
                      isSelected && "text-white"
                    )}
                  >
                    {dayNumber}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Add event button */}
      <Button
        type={normal}
        className="w-full text-white bg-secondary"
        onClick={() => {
          setActiveCalendar();
          console.log(filterByDate(formatted));
        }}
        text={"Выбрать дату"}
      />
    </div>
  );
}
