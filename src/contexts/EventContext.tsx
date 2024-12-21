import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { useOrganization } from './OrganizationContext';
import { Event, CreateEventData, UpdateEventData, EventStatus } from '../types/event';

interface EventContextType {
  events: Event[];
  loading: boolean;
  error: string | null;
  createEvent: (data: CreateEventData) => Promise<Event>;
  updateEvent: (id: string, data: UpdateEventData) => Promise<Event>;
  deleteEvent: (id: string) => Promise<void>;
  loadEvents: () => Promise<void>;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const { currentOrganization } = useOrganization();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    if (!currentUser) {
      console.error('No user logged in');
      setError('Please log in to view events.');
      setEvents([]);
      return;
    }

    if (!currentOrganization) {
      console.error('No organization selected');
      setError('Please select an organization to view events.');
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Loading events for organization:', currentOrganization.id);
      const eventsRef = collection(db, 'events');
      const q = query(
        eventsRef,
        where('organizationId', '==', currentOrganization.id),
        orderBy('startDate', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const loadedEvents: Event[] = [];
      querySnapshot.forEach((doc) => {
        loadedEvents.push({ id: doc.id, ...doc.data() } as Event);
      });

      console.log('Loaded events:', loadedEvents);
      setEvents(loadedEvents);
      setError(null);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events. Please try again.');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser, currentOrganization]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents, currentOrganization?.id]);

  const createEvent = useCallback(async (data: CreateEventData): Promise<Event> => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    if (!currentOrganization) {
      throw new Error('No organization selected');
    }

    const now = new Date().toISOString();
    const eventData: Event = {
      ...data,
      id: '', // Will be set by Firestore
      createdAt: now,
      updatedAt: now,
      owner: currentUser.uid,
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
      
      const updatedEvent = {
        ...eventDoc.data(),
        ...updatedData,
        id,
      } as Event;

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

  const value = {
    events,
    loading,
    error,
    createEvent,
    updateEvent,
    deleteEvent,
    loadEvents,
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