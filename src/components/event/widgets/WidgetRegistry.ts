import { Widget } from '../../../types/event';

export interface WidgetDefinition {
  type: Widget['type'];
  name: string;
  description: string;
  defaultConfig: Record<string, any>;
  configSchema: {
    type: string;
    properties: Record<string, {
      type: string;
      title: string;
      description?: string;
      enum?: string[];
      default?: any;
    }>;
    required: string[];
  };
}

const widgetRegistry: Record<Widget['type'], WidgetDefinition> = {
  photos: {
    type: 'photos',
    name: 'Photos/Media',
    description: 'Display photos and media related to the event',
    defaultConfig: {
      maxPhotos: 10,
      allowComments: true,
      layout: 'grid',
    },
    configSchema: {
      type: 'object',
      properties: {
        maxPhotos: {
          type: 'number',
          title: 'Maximum Photos',
          description: 'Maximum number of photos allowed',
          default: 10,
        },
        allowComments: {
          type: 'boolean',
          title: 'Allow Comments',
          description: 'Allow users to comment on photos',
          default: true,
        },
        layout: {
          type: 'string',
          title: 'Layout',
          enum: ['grid', 'carousel', 'masonry'],
          default: 'grid',
        },
      },
      required: ['maxPhotos', 'allowComments', 'layout'],
    },
  },
  location: {
    type: 'location',
    name: 'Location',
    description: 'Show event location on a map',
    defaultConfig: {
      showMap: true,
      showDirections: true,
      mapType: 'roadmap',
    },
    configSchema: {
      type: 'object',
      properties: {
        showMap: {
          type: 'boolean',
          title: 'Show Map',
          default: true,
        },
        showDirections: {
          type: 'boolean',
          title: 'Show Directions',
          default: true,
        },
        mapType: {
          type: 'string',
          title: 'Map Type',
          enum: ['roadmap', 'satellite', 'hybrid'],
          default: 'roadmap',
        },
      },
      required: ['showMap', 'showDirections', 'mapType'],
    },
  },
  messageBoard: {
    type: 'messageBoard',
    name: 'Message Board',
    description: 'Allow attendees to post messages and updates',
    defaultConfig: {
      allowReplies: true,
      moderationEnabled: false,
      sortOrder: 'newest',
    },
    configSchema: {
      type: 'object',
      properties: {
        allowReplies: {
          type: 'boolean',
          title: 'Allow Replies',
          default: true,
        },
        moderationEnabled: {
          type: 'boolean',
          title: 'Enable Moderation',
          default: false,
        },
        sortOrder: {
          type: 'string',
          title: 'Sort Order',
          enum: ['newest', 'oldest', 'popular'],
          default: 'newest',
        },
      },
      required: ['allowReplies', 'moderationEnabled', 'sortOrder'],
    },
  },
  comments: {
    type: 'comments',
    name: 'Comments',
    description: 'Enable post-event comments and feedback',
    defaultConfig: {
      allowReplies: true,
      moderationEnabled: true,
      allowRatings: true,
    },
    configSchema: {
      type: 'object',
      properties: {
        allowReplies: {
          type: 'boolean',
          title: 'Allow Replies',
          default: true,
        },
        moderationEnabled: {
          type: 'boolean',
          title: 'Enable Moderation',
          default: true,
        },
        allowRatings: {
          type: 'boolean',
          title: 'Allow Ratings',
          default: true,
        },
      },
      required: ['allowReplies', 'moderationEnabled', 'allowRatings'],
    },
  },
  attendees: {
    type: 'attendees',
    name: 'Attendees',
    description: 'Show list of event attendees',
    defaultConfig: {
      showCount: true,
      showList: true,
      privacyLevel: 'name-only',
    },
    configSchema: {
      type: 'object',
      properties: {
        showCount: {
          type: 'boolean',
          title: 'Show Count',
          default: true,
        },
        showList: {
          type: 'boolean',
          title: 'Show List',
          default: true,
        },
        privacyLevel: {
          type: 'string',
          title: 'Privacy Level',
          enum: ['name-only', 'name-photo', 'full-profile'],
          default: 'name-only',
        },
      },
      required: ['showCount', 'showList', 'privacyLevel'],
    },
  },
  quickInfo: {
    type: 'quickInfo',
    name: 'Quick Info',
    description: 'Display key event information at a glance',
    defaultConfig: {
      showTime: true,
      showLocation: true,
      showOrganizer: true,
    },
    configSchema: {
      type: 'object',
      properties: {
        showTime: {
          type: 'boolean',
          title: 'Show Time',
          default: true,
        },
        showLocation: {
          type: 'boolean',
          title: 'Show Location',
          default: true,
        },
        showOrganizer: {
          type: 'boolean',
          title: 'Show Organizer',
          default: true,
        },
      },
      required: ['showTime', 'showLocation', 'showOrganizer'],
    },
  },
  weather: {
    type: 'weather',
    name: 'Weather',
    description: 'Show weather forecast for the event',
    defaultConfig: {
      showForecast: true,
      unit: 'celsius',
      daysAhead: 7,
    },
    configSchema: {
      type: 'object',
      properties: {
        showForecast: {
          type: 'boolean',
          title: 'Show Forecast',
          default: true,
        },
        unit: {
          type: 'string',
          title: 'Temperature Unit',
          enum: ['celsius', 'fahrenheit'],
          default: 'celsius',
        },
        daysAhead: {
          type: 'number',
          title: 'Days Ahead',
          default: 7,
        },
      },
      required: ['showForecast', 'unit', 'daysAhead'],
    },
  },
  website: {
    type: 'website',
    name: 'Website',
    description: 'Link to event website or related resources',
    defaultConfig: {
      showPreview: true,
      openInNewTab: true,
    },
    configSchema: {
      type: 'object',
      properties: {
        showPreview: {
          type: 'boolean',
          title: 'Show Preview',
          default: true,
        },
        openInNewTab: {
          type: 'boolean',
          title: 'Open in New Tab',
          default: true,
        },
      },
      required: ['showPreview', 'openInNewTab'],
    },
  },
  call: {
    type: 'call',
    name: 'Call',
    description: 'Display contact information for calls',
    defaultConfig: {
      showNumber: true,
      allowDirectCall: true,
    },
    configSchema: {
      type: 'object',
      properties: {
        showNumber: {
          type: 'boolean',
          title: 'Show Number',
          default: true,
        },
        allowDirectCall: {
          type: 'boolean',
          title: 'Allow Direct Call',
          default: true,
        },
      },
      required: ['showNumber', 'allowDirectCall'],
    },
  },
};

export const getWidgetDefinition = (type: Widget['type']): WidgetDefinition => {
  const definition = widgetRegistry[type];
  if (!definition) {
    throw new Error(`Widget type "${type}" not found in registry`);
  }
  return definition;
};

export const getAllWidgetDefinitions = (): WidgetDefinition[] => {
  return Object.values(widgetRegistry);
};

export const createWidget = (type: Widget['type'], order: number): Widget => {
  const definition = getWidgetDefinition(type);
  return {
    id: crypto.randomUUID(),
    type,
    config: { ...definition.defaultConfig },
    data: {},
    order,
    isEnabled: true,
  };
}; 