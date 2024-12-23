import { Timestamp } from 'firebase/firestore';

export type EventVisibility = 'public' | 'organization' | 'invite-only';
export type EventStatus = 'draft' | 'published' | 'cancelled';
export type LocationType = 'fixed' | 'multiple' | 'virtual' | 'tbd';
export type EventSource = 'events' | 'publicEvents';

export interface EventLocation {
  type: LocationType;
  address?: string;
  meetingUrl?: string;
  multipleLocations?: string[];
}

export interface Widget {
  id: string;
  type: 'photos' | 'location' | 'messageBoard' | 'comments' | 'attendees' | 'quickInfo' | 'weather' | 'website' | 'call';
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
  timezone: string;
  location: EventLocation;
  visibility: EventVisibility;
  recurrence?: RecurrenceRule;
  widgets: Widget[];
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  owner: string;
  status: 'draft' | 'published';
  source: 'events' | 'publicEvents';
  photo?: string;
  phoneNumber?: string;
  website?: string;
  coverPhoto?: string;
  coverImage?: string;
  logoImage?: string;
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
}

export interface EventDraft {
  id: string;
  organizationId: string;
  data: Partial<Event>;
  lastModified: Date;
  step: number;
} 