import { Timestamp } from 'firebase/firestore';

export type EventVisibility = 'public' | 'organization' | 'invite-only';
export type EventStatus = 'draft' | 'published' | 'cancelled';
export type LocationType = 'organization' | 'fixed' | 'virtual' | 'hybrid';
export type EventSource = 'events' | 'publicEvents';
export type RecurrenceType = 'weekly' | 'yearly';
export type WeekDay = 'Sunday' | 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';

export interface EventLocation {
  type: LocationType;
  address?: string;
  meetingUrl?: string;
  multipleLocations?: string[];
}

export interface Widget {
  id: string;
  type: 'description' | 'weather' | 'location' | 'website' | 'phoneNumber' | 'messageBoard' | 'comments' | 'quickInfo' | 'call';
  config: Record<string, any>;
  data: Record<string, any>;
  order: number;
  isEnabled: boolean;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate?: Date;
  isOngoing: boolean;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  start: Date;
  end?: Date;
  timezone?: string;
  location: EventLocation;
  visibility: 'organization' | 'invite-only' | 'public';
  widgets: Widget[];
  createdAt: Date;
  updatedAt: Date;
  owner: string;
  organizationId: string;
  status: EventStatus;
  photo?: string;
  phoneNumber?: string;
  website?: string;
  coverImage?: string;
  logoImage?: string;
  attendees?: string[];
  accepted?: string[];
  declined?: string[];
  undecided?: string[];
  notificationSettings?: {
    enabled: boolean;
    reminderTimes: number[];
  };
}

export interface NotificationSettings {
  reminderTimes: number[]; // Minutes before event
  enabled: boolean;
}

export interface CreateEventData {
  title: string;
  description: string;
  start: Date;
  end?: Date;
  timezone: string;
  location: EventLocation;
  visibility: EventVisibility;
  recurrence?: RecurrenceRule;
  widgets: Widget[];
  organizationId: string;
  status: 'draft' | 'published';
  photo?: string;
  phoneNumber?: string;
  website?: string;
  coverImage?: string;
  logoImage?: string;
  notificationSettings?: NotificationSettings;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
  location?: EventLocation;
  status?: 'draft' | 'published';
  visibility?: EventVisibility;
  widgets?: Widget[];
  recurrence?: RecurrenceRule;
  invitedUsers?: string[];
  photo?: string;
  phoneNumber?: string;
  website?: string;
  coverImage?: string;
  logoImage?: string;
  notificationSettings?: NotificationSettings;
}

export interface EventDraft {
  id: string;
  organizationId: string;
  data: Partial<Event>;
  lastModified: Date;
  step: number;
} 