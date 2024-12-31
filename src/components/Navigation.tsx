import { useLocation } from 'react-router-dom';
import { useNavigation } from '../hooks/useNavigation';
import { NavLink } from 'react-router-dom';
import { classNames } from '../utils/classNames';

export function Navigation() {
  const location = useLocation();
  const navigation = useNavigation();

  return (
    <nav className="flex-1 space-y-1 px-2">
      {navigation.map((item) => {
        const isActive = location.pathname.startsWith(item.href);
        return (
          <NavLink
            key={item.name}
            to={item.href}
            className={classNames(
              isActive
                ? 'bg-gray-100 dark:bg-gray-800 text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
              'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
            )}
          >
            <item.icon
              className={classNames(
                isActive
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500 dark:group-hover:text-gray-300',
                'mr-3 flex-shrink-0 h-6 w-6'
              )}
              aria-hidden="true"
            />
            {item.name}
          </NavLink>
        );
      })}
    </nav>
  );
} 