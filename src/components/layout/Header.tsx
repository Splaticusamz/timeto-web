import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { Bars3Icon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { currentUser } = useAuth();

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 dark:text-gray-200 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1"></div>
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
            onClick={toggleTheme}
          >
            <span className="sr-only">Toggle theme</span>
            {theme === 'dark' ? (
              <SunIcon className="h-6 w-6" aria-hidden="true" />
            ) : (
              <MoonIcon className="h-6 w-6" aria-hidden="true" />
            )}
          </button>

          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200 dark:lg:bg-gray-700" />
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full bg-gray-800 dark:bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium leading-none text-white dark:text-gray-900">
                  {currentUser?.email?.[0].toUpperCase()}
                </span>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-200">
                {currentUser?.email}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 