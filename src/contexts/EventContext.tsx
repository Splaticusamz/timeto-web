import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';
import { Event, CreateEventData, UpdateEventData, EventStatus, EventSource } from '../types/event';

interface EventContextType {
  events: Event[];
  loading: boolean;
  error: string | null;
  createEvent: (data: CreateEventData) => Promise<Event>;
  updateEvent: (id: string, data: UpdateEventData) => Promise<Event>;
  deleteEvent: (id: string) => Promise<void>;
  loadEvents: () => Promise<void>;
  saveDraft: (id: string, data: Partial<Event>) => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { currentOrganization } = useOrganization();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!currentUser || !currentOrganization) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Loading events for organization:', currentOrganization.id);
      
      // Load from both events and publicEvents collections
      const eventsRef = collection(db, 'events');
      const publicEventsRef = collection(db, 'publicEvents');

      const [privateEvents, publicEvents] = await Promise.all([
        // Private events query
        getDocs(query(
          eventsRef,
          where('owner', '==', currentUser.uid),
          orderBy('start', 'desc')
        )),
        
        // Public events query
        getDocs(query(
          publicEventsRef,
          where('owner', '==', currentOrganization.id),
          orderBy('start', 'desc')
        ))
      ]);

      console.log('Found private events:', privateEvents.size);
      console.log('Found public events:', publicEvents.size);

      const loadedEvents: Event[] = [
        ...privateEvents.docs.map(doc => {
          const data = doc.data();
          // First create a base event with all required fields
          const event: Event = {
            id: doc.id,
            source: 'events' as EventSource,
            title: data.title || '',
            description: data.description || '',
            timezone: data.timezone || 'UTC',
            organizationId: data.organizationId || currentOrganization.id,
            owner: data.owner || currentUser.uid,
            status: data.status || 'draft',
            visibility: data.visibility || 'organization',
            location: data.location || { type: 'fixed' },
            widgets: data.widgets || [],
            start: data.start?._seconds ? new Date(data.start._seconds * 1000) : new Date(),
            end: data.end?._seconds ? new Date(data.end._seconds * 1000) : new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return event;
        }),
        ...publicEvents.docs.map(doc => {
          const data = doc.data();
          const event: Event = {
            id: doc.id,
            source: 'publicEvents' as EventSource,
            title: data.title || '',
            description: data.description || '',
            timezone: data.timezone || 'UTC',
            organizationId: data.organizationId || currentOrganization.id,
            owner: data.owner || currentUser.uid,
            status: data.status || 'draft',
            visibility: data.visibility || 'organization',
            location: data.location || { type: 'fixed' },
            widgets: data.widgets || [],
            start: data.start?._seconds ? new Date(data.start._seconds * 1000) : new Date(),
            end: data.end?._seconds ? new Date(data.end._seconds * 1000) : new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          return event;
        })
      ];

      console.log('Total events loaded:', loadedEvents.length);
      console.log('Sample event data:', privateEvents.docs[0]?.data());
      console.log('Converted event:', loadedEvents[0]);
      setEvents(loadedEvents);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [currentUser, currentOrganization]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents, currentOrganization?.id]);

  const createEvent = useCallback(async (data: CreateEventData): Promise<Event> => {
    if (!currentUser || !currentOrganization) {
      throw new Error('No user logged in or no organization selected');
    }

    const now = new Date().toISOString();
    const eventData: Event = {
      ...data,
      id: '', // Will be set by Firestore
      source: 'events' as EventSource,  // Add source
      start: data.startDate,  // Map from old startDate to start
      end: data.endDate,      // Map from old endDate to end
      createdAt: new Date(now),
      updatedAt: new Date(now),
      owner: currentUser.uid,
      organizationId: currentOrganization.id,
      status: data.status || 'draft',
      visibility: data.visibility || 'organization',
      widgets: data.widgets || [],
    };

    try {
      const eventsRef = collection(db, 'events');
      const docRef = doc(eventsRef);
      await setDoc(docRef, { ...eventData, id: docRef.id });
      
      const newEvent = { ...eventData, id: docRef.id };
      setEvents((prev) => [newEvent, ...prev]);
      return newEvent;
    } catch (err) {
      console.error('Error creating event:', err);
      throw new Error('Failed to create event');
    }
  }, [currentUser, currentOrganization]);

  const updateEvent = useCallback(async (id: string, data: UpdateEventData): Promise<Event> => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    try {
      const eventRef = doc(db, 'events', id);
      const eventDoc = await getDoc(eventRef);
      
      if (!eventDoc.exists()) {
        throw new Error('Event not found');
      }

      const updatedData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(eventRef, updatedData);
      const eventData = eventDoc.data() as Event;
      const updatedEvent: Event = {
        ...eventData,
        ...updatedData,
        id,
        updatedAt: new Date(updatedData.updatedAt), // Convert string to Date
      };

      setEvents((prev) =>
        prev.map((event) => (event.id === id ? updatedEvent : event))
      );

      return updatedEvent;
    } catch (err) {
      console.error('Error updating event:', err);
      throw new Error('Failed to update event');
    }
  }, [currentUser]);

  const deleteEvent = useCallback(async (id: string): Promise<void> => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    try {
      await deleteDoc(doc(db, 'events', id));
      setEvents((prev) => prev.filter((event) => event.id !== id));
    } catch (err) {
      console.error('Error deleting event:', err);
      throw new Error('Failed to delete event');
    }
  }, [currentUser]);

  const saveDraft = useCallback(async (id: string, data: Partial<Event>): Promise<void> => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    try {
      const eventRef = doc(db, 'events', id);
      await updateDoc(eventRef, {
        ...data,
        updatedAt: new Date().toISOString(),
        status: 'draft'
      });
    } catch (err) {
      console.error('Error saving draft:', err);
      throw new Error('Failed to save draft');
    }
  }, [currentUser]);

  const value = {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    loadEvents,
    saveDraft,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEvent() {
  const context = useContext(EventContext);
  if (context === undefined) {
    throw new Error('useEvent must be used within an EventProvider');
  }
  return context;
} 