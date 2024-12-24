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
        ...privateEvents.docs.map(doc => {
          const data = doc.data();
          const widgetObjects = (data.widgets || []).map((widgetId: string) => ({
            id: widgetId,
            type: widgetId,
            config: data.widgetConfigs?.[widgetId] || {},
            data: data.widgetData?.[widgetId] || {},
            order: 0,
            isEnabled: true
          }));

          const start = data.start?._seconds 
            ? new Date(data.start._seconds * 1000) 
            : data.start instanceof Date 
              ? data.start 
              : new Date(data.start);

          const end = data.end?._seconds 
            ? new Date(data.end._seconds * 1000) 
            : data.end instanceof Date 
              ? data.end 
              : data.end ? new Date(data.end) : undefined;

          return {
            id: doc.id,
            source: 'events' as const,
            title: data.title || '',
            description: data.description || '',
            start: start,
            end: end,
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            organizationId: data.organizationId,
            owner: data.owner,
            status: data.status || 'draft',
            visibility: data.visibility || 'organization',
            location: data.location || { type: 'fixed' as const },
            widgets: widgetObjects,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
            photo: data.photo || data.photoUrl || data.image || data.imageUrl,
            phoneNumber: data.phoneNumber || data.phone || data.tel,
            website: data.website || data.url || data.webUrl,
            coverImage: data.coverImage || data.coverPhoto || data.cover,
            logoImage: data.logoImage || data.logo,
          } as Event;
        }),
        ...publicEvents.docs.map(doc => {
          const data = doc.data();
          const widgetObjects = (data.widgets || []).map((widgetId: string) => ({
            id: widgetId,
            type: widgetId,
            config: {},
            data: {},
            order: 0,
            isEnabled: true
          }));

          return {
            id: doc.id,
            source: 'publicEvents' as const,
            title: data.title || '',
            description: data.description || '',
            start: data.start?._seconds ? new Date(data.start._seconds * 1000) : new Date(),
            end: data.end?._seconds ? new Date(data.end._seconds * 1000) : undefined,
            timezone: data.timezone || 'UTC',
            organizationId: data.organizationId || currentOrganization.id,
            owner: data.owner || currentOrganization.id,
            status: data.status || 'published',
            visibility: data.visibility || 'organization',
            location: data.location || { type: 'fixed' as const },
            widgets: widgetObjects,
            createdAt: new Date(),
            updatedAt: new Date(),
            photo: data.photo,
            website: data.website,
            phoneNumber: data.phoneNumber,
            coverImage: data.coverImage,
            logoImage: data.logoImage,
          } as Event;
        })
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
      id: '', // Will be set by Firestore
      source: 'events' as const,
      title: data.title,
      description: data.description,
      start: data.start,
      end: data.end,
      timezone: data.timezone,
      location: data.location,
      visibility: data.visibility,
      widgets: data.widgets || [],
      createdAt: new Date(now),
      updatedAt: new Date(now),
      owner: currentUser.uid,
      organizationId: currentOrganization.id,
      status: data.status || 'draft',
      photo: data.photo,
      phoneNumber: data.phoneNumber,
      website: data.website,
      coverImage: data.coverImage,
      logoImage: data.logoImage,
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
        phoneNumber: data.phoneNumber,
        website: data.website,
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