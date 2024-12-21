import { useState } from 'react';
import { useEvent } from '../../contexts/EventContext';
import { Event } from '../../types/event';

export default function Calendar() {
  const { events } = useEvent();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const daysInMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth() + 1,
    0
  ).getDate();

  const firstDayOfMonth = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1
  ).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const getEventsForDay = (day: number): Event[] => {
    const currentDate = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      day
    );
    return events.filter((event) => {
      const eventDate = new Date(event.startDate);
      return (
        eventDate.getFullYear() === currentDate.getFullYear() &&
        eventDate.getMonth() === currentDate.getMonth() &&
        eventDate.getDate() === currentDate.getDate()
      );
    });
  };

  const previousMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setSelectedDate(
      new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1)
    );
  };

  return (
    <div className="min-h-full bg-white dark:bg-gray-900">
      <div className="py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Calendar</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={previousMonth}
                className="inline-flex items-center rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Previous
              </button>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedDate.toLocaleString('default', {
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>
              <button
                onClick={nextMonth}
                className="inline-flex items-center rounded-md bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow ring-1 ring-black ring-opacity-5">
            <div className="grid grid-cols-7 gap-px border-b border-gray-300 dark:border-gray-700 bg-gray-200 dark:bg-gray-700 text-center text-xs font-semibold leading-6 text-gray-700 dark:text-gray-300">
              <div className="bg-white dark:bg-gray-800 py-2">Sun</div>
              <div className="bg-white dark:bg-gray-800 py-2">Mon</div>
              <div className="bg-white dark:bg-gray-800 py-2">Tue</div>
              <div className="bg-white dark:bg-gray-800 py-2">Wed</div>
              <div className="bg-white dark:bg-gray-800 py-2">Thu</div>
              <div className="bg-white dark:bg-gray-800 py-2">Fri</div>
              <div className="bg-white dark:bg-gray-800 py-2">Sat</div>
            </div>
            <div className="grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-700">
              {emptyDays.map((index) => (
                <div
                  key={`empty-${index}`}
                  className="bg-white dark:bg-gray-800 p-3 text-right text-sm"
                />
              ))}
              {days.map((day) => {
                const dayEvents = getEventsForDay(day);
                const isToday =
                  new Date().getDate() === day &&
                  new Date().getMonth() === selectedDate.getMonth() &&
                  new Date().getFullYear() === selectedDate.getFullYear();

                return (
                  <div
                    key={day}
                    className={`min-h-[120px] bg-white dark:bg-gray-800 p-3 text-sm ${
                      isToday
                        ? 'bg-primary-50 dark:bg-primary-900/20'
                        : ''
                    }`}
                  >
                    <time
                      dateTime={`${selectedDate.getFullYear()}-${
                        selectedDate.getMonth() + 1
                      }-${day}`}
                      className={`flex h-6 w-6 items-center justify-center rounded-full ${
                        isToday
                          ? 'bg-primary-600 font-semibold text-white'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {day}
                    </time>
                    <ol className="mt-2">
                      {dayEvents.map((event) => (
                        <li key={event.id}>
                          <a
                            href="#"
                            className="group flex"
                          >
                            <p className="flex-auto truncate font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                              {event.title}
                            </p>
                            <time
                              dateTime={event.startDate}
                              className="ml-3 hidden flex-none text-gray-500 dark:text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 xl:block"
                            >
                              {new Date(event.startDate).toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                              })}
                            </time>
                          </a>
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 