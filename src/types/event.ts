import { Timestamp } from 'firebase/firestore';

export type EventVisibility = 'public' | 'organization' | 'invite-only';
export type EventStatus = 'draft' | 'published' | 'cancelled';
export type LocationType = 'fixed' | 'multiple' | 'virtual' | 'tbd';

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
  startDate: Date;
  endDate?: Date;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  subOrganizationId?: string;
  owner: string;
  status: EventStatus;
  visibility: EventVisibility;
  location: EventLocation;
  widgets: Widget[];
  recurrence?: RecurrenceRule;
  invitedUsers?: string[];
  attendees?: string[];
  deepLink?: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  startDate: Date;
  endDate?: Date;
  timezone: string;
  location: EventLocation;
  organizationId: string;
  subOrganizationId?: string;
  status: EventStatus;
  visibility: EventVisibility;
  widgets: Widget[];
  recurrence?: RecurrenceRule;
  invitedUsers?: string[];
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  timezone?: string;
  location?: EventLocation;
  status?: EventStatus;
  visibility?: EventVisibility;
  widgets?: Widget[];
  recurrence?: RecurrenceRule;
  invitedUsers?: string[];
}

export interface EventDraft {
  id: string;
  organizationId: string;
  data: Partial<Event>;
  lastModified: Date;
  step: number;
} 