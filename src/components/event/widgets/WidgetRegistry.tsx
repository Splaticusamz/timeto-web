import { 
  DocumentTextIcon, 
  CloudIcon, 
  MapPinIcon, 
  GlobeAltIcon, 
  PhoneIcon 
} from '@heroicons/react/24/outline';

const widgetDefinitions = {
  description: {
    id: 'description',
    name: 'Description',
    description: 'Event description',
    icon: DocumentTextIcon,
  },
  weather: {
    id: 'weather',
    name: 'Weather',
    description: 'Weather forecast for the event',
    icon: CloudIcon,
  },
  location: {
    id: 'location',
    name: 'Location',
    description: 'Event location details',
    icon: MapPinIcon,
  },
  website: {
    id: 'website',
    name: 'Website',
    description: 'Event website',
    icon: GlobeAltIcon,
  },
  phoneNumber: {
    id: 'phoneNumber',
    name: 'Phone',
    description: 'Contact phone number',
    icon: PhoneIcon,
  }
};

export function getWidgetDefinition(widgetId: string) {
  const definition = widgetDefinitions[widgetId as keyof typeof widgetDefinitions];
  if (!definition) {
    throw new Error(`Widget type "${widgetId}" not found in registry`);
  }
  return definition;
}

export const availableWidgets = Object.values(widgetDefinitions);

// Add this debug log
console.log('Available widget definitions:', Object.keys(widgetDefinitions)); 