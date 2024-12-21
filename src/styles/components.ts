export const componentClasses = {
  // Layout
  container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  section: "py-6 sm:py-8",
  card: "bg-white dark:bg-gray-800 shadow rounded-lg",
  cardBody: "p-6",

  // Typography
  heading: {
    h1: "text-3xl font-bold text-gray-900 dark:text-white",
    h2: "text-2xl font-semibold text-gray-900 dark:text-white",
    h3: "text-lg font-medium text-gray-900 dark:text-white",
    subtitle: "text-sm text-gray-500 dark:text-gray-400"
  },

  // Buttons
  button: {
    base: "inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2",
    primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
    secondary: "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700",
    sizes: {
      sm: "px-3 py-2 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg"
    }
  },

  // Navigation
  nav: {
    link: "text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 text-sm font-medium",
    activeLink: "text-primary-600 dark:text-primary-400"
  },

  // Tables
  table: {
    container: "min-w-full divide-y divide-gray-200 dark:divide-gray-700",
    header: "bg-gray-50 dark:bg-gray-800",
    headerCell: "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
    row: "bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800",
    cell: "px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
  },

  // Lists
  list: {
    container: "divide-y divide-gray-200 dark:divide-gray-700",
    item: "py-4"
  },

  // Status indicators
  status: {
    success: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    error: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    info: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  },

  // Badges
  badge: {
    base: "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
    colors: {
      gray: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
      red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      primary: "bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200"
    }
  }
}; 