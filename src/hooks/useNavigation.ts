import { useOrganization } from '../contexts/OrganizationContext';
import { CalendarIcon, BuildingOfficeIcon, Cog8ToothIcon } from '@heroicons/react/24/outline';

export function useNavigation() {
  const { userOrganizations } = useOrganization();

  const navigation = [
    {
      name: 'Organizations',
      href: '/organizations',
      icon: BuildingOfficeIcon,
      current: false,
    },
    ...(userOrganizations.length > 0
      ? [
          {
            name: 'Events',
            href: '/events',
            icon: CalendarIcon,
            current: false,
          },
        ]
      : []),
    {
      name: 'Settings',
      href: '/settings',
      icon: Cog8ToothIcon,
      current: false,
    },
  ];

  return navigation;
} 