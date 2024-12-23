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
        // Private events query - match by owner
        getDocs(query(
          eventsRef,
          where('owner', '==', currentOrganization.id),
          orderBy('start', 'desc')
        )),
        
        // Public events query - match by owner
        getDocs(query(
          publicEventsRef,
          where('owner', '==', currentOrganization.id),
          orderBy('start', 'desc')
        ))
      ]);

      console.log('Found private events:', {
        size: privateEvents.size,
        data: privateEvents.docs.map(doc => ({id: doc.id, ...doc.data()}))
      });
      console.log('Found public events:', {
        size: publicEvents.size,
        data: publicEvents.docs.map(doc => ({id: doc.id, ...doc.data()}))
      });

      const loadedEvents: Event[] = [
        ...privateEvents.docs.map(doc => ({
          id: doc.id,
          source: 'events' as EventSource,
          title: doc.data().title || '',
          description: doc.data().description || '',
          timezone: doc.data().timezone || 'UTC',
          organizationId: doc.data().organizationId || currentOrganization.id,
          owner: doc.data().owner || currentUser.uid,
          status: 'published' as EventStatus,
          visibility: doc.data().visibility || 'organization',
          location: doc.data().location || { type: 'fixed' },
          widgets: doc.data().widgets || [],
          start: doc.data().start?._seconds ? new Date(doc.data().start._seconds * 1000) : new Date(),
          end: doc.data().end?._seconds ? new Date(doc.data().end._seconds * 1000) : new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
        ...publicEvents.docs.map(doc => ({
          id: doc.id,
          source: 'publicEvents' as EventSource,
          title: doc.data().title || '',
          description: doc.data().description || '',
          timezone: doc.data().timezone || 'UTC',
          organizationId: doc.data().organizationId || currentOrganization.id,
          owner: doc.data().owner || currentOrganization.id,
          status: 'published' as EventStatus,
          visibility: doc.data().visibility || 'organization',
          location: doc.data().location || { type: 'fixed' },
          widgets: doc.data().widgets || [],
          start: doc.data().start?._seconds ? new Date(doc.data().start._seconds * 1000) : new Date(),
          end: doc.data().end?._seconds ? new Date(doc.data().end._seconds * 1000) : new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      ];

      console.log('Total events loaded:', loadedEvents.length);
      console.log('Private events statuses:', privateEvents.docs.map(doc => ({
        id: doc.id,
        status: doc.data().status
      })));
      console.log('Public events statuses:', publicEvents.docs.map(doc => ({
        id: doc.id,
        status: doc.data().status
      })));

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