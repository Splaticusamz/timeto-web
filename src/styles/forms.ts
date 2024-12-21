export const formClasses = {
  input: "block w-full rounded-md border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",
  select: "block w-full rounded-md border border-gray-300 px-4 py-3 bg-white text-gray-900 focus:border-primary-500 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",
  label: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1",
  switch: {
    base: "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
    active: "bg-primary-600",
    inactive: "bg-gray-200 dark:bg-gray-700",
    dot: {
      base: "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
      active: "translate-x-6",
      inactive: "translate-x-1"
    }
  }
}; 