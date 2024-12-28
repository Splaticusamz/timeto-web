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
          default: 10,
        },
        allowComments: {
          type: 'boolean',
          title: 'Allow Comments',
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
      messages: [],
    },
    configSchema: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          title: 'Messages',
          default: [],
        },
      },
      required: ['messages'],
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
  quickInfo: {
    type: 'quickInfo',
    name: 'Quick Info',
    description: 'Display key event information',
    defaultConfig: {},
    configSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  weather: {
    type: 'weather',
    name: 'Weather',
    description: 'Show weather forecast for the event',
    defaultConfig: {},
    configSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  website: {
    type: 'website',
    name: 'Website',
    description: 'Link to event website or related resources',
    defaultConfig: {
      useOrganizationWebsite: false,
      customUrl: '',
      organizationWebsite: '',
    },
    configSchema: {
      type: 'object',
      properties: {
        useOrganizationWebsite: {
          type: 'boolean',
          title: 'Use Organization Website',
          default: false,
        },
        customUrl: {
          type: 'string',
          title: 'Custom URL',
          default: '',
        },
        organizationWebsite: {
          type: 'string',
          title: 'Organization Website',
          default: '',
        },
      },
      required: ['useOrganizationWebsite', 'customUrl', 'organizationWebsite'],
    },
  },
  call: {
    type: 'call',
    name: 'Call',
    description: 'Display contact information for calls',
    defaultConfig: {
      useOrganizationPhone: false,
      customPhone: '',
      organizationPhone: '',
    },
    configSchema: {
      type: 'object',
      properties: {
        useOrganizationPhone: {
          type: 'boolean',
          title: 'Use Organization Phone',
          default: false,
        },
        customPhone: {
          type: 'string',
          title: 'Custom Phone',
          default: '',
        },
        organizationPhone: {
          type: 'string',
          title: 'Organization Phone',
          default: '',
        },
      },
      required: ['useOrganizationPhone', 'customPhone', 'organizationPhone'],
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