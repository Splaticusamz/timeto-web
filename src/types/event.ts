import { Timestamp } from 'firebase/firestore';

export type EventVisibility = 'public' | 'private';
export type EventStatus = 'draft' | 'published' | 'cancelled';

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  owner: string;
  status: EventStatus;
  visibility: EventVisibility;
  location?: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  organizationId: string;
  status: EventStatus;
  visibility: EventVisibility;
}

export interface UpdateEventData {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  status?: EventStatus;
  visibility?: EventVisibility;
} 