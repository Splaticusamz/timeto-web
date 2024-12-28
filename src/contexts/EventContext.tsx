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

      const loadedEvents: Event[] = [
        ...privateEvents.docs.map(doc => {
          const data = doc.data();
          console.log('Raw Firestore data:', data);
          
          return {
            id: doc.id,
            source: 'events' as const,
            title: data.title || '',
            description: data.description || '',
            start: data.start?._seconds 
              ? new Date(data.start._seconds * 1000) 
              : data.start instanceof Date 
                ? data.start 
                : new Date(data.start),
            end: data.end?._seconds 
              ? new Date(data.end._seconds * 1000) 
              : data.end instanceof Date 
                ? data.end 
                : data.end ? new Date(data.end) : undefined,
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            organizationId: data.organizationId,
            owner: data.owner,
            status: data.status || 'draft',
            visibility: data.visibility || 'organization',
            location: data.location || { type: 'fixed' as const },
            widgets: data.widgets?.map((w: string) => ({
              id: w,
              type: w,
              config: {},
              data: {},
              order: 0,
              isEnabled: true
            })) || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            photo: data.photo || data.photoUrl || data.image || data.imageUrl,
            phoneNumber: data.phoneNumber || data.phone || data.tel,
            website: data.website || data.url || data.webUrl,
            coverImage: data.coverImage || data.coverPhoto || data.cover,
            logoImage: data.logoImage || data.logo,
            attendees: Array.isArray(data.attendees) ? data.attendees : [],
            accepted: Array.isArray(data.accepted) ? data.accepted : [],
            declined: Array.isArray(data.declined) ? data.declined : [],
            undecided: Array.isArray(data.undecided) ? data.undecided : [],
          } as Event;
        }),
        ...publicEvents.docs.map(doc => {
          const data = doc.data();
          console.log('Raw public event data:', data);

          return {
            id: doc.id,
            source: 'publicEvents' as const,
            title: data.title || '',
            description: data.description || '',
            start: data.start?._seconds 
              ? new Date(data.start._seconds * 1000) 
              : data.start instanceof Date 
                ? data.start 
                : new Date(data.start),
            end: data.end?._seconds 
              ? new Date(data.end._seconds * 1000) 
              : data.end instanceof Date 
                ? data.end 
                : data.end ? new Date(data.end) : undefined,
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            organizationId: data.organizationId || currentOrganization.id,
            owner: data.owner || currentOrganization.id,
            status: data.status || 'published',
            visibility: data.visibility || 'organization',
            location: data.location || { type: 'fixed' as const },
            widgets: data.widgets?.map((w: string) => ({
              id: w,
              type: w,
              config: {},
              data: {},
              order: 0,
              isEnabled: true
            })) || [],
            createdAt: new Date(),
            updatedAt: new Date(),
            photo: data.photo || data.photoUrl || data.image || data.imageUrl,
            phoneNumber: data.phoneNumber || data.phone || data.tel,
            website: data.website || data.url || data.webUrl,
            coverImage: data.coverImage || data.coverPhoto || data.cover,
            logoImage: data.logoImage || data.logo,
            attendees: Array.isArray(data.attendees) ? data.attendees : [],
            accepted: Array.isArray(data.accepted) ? data.accepted : [],
            declined: Array.isArray(data.declined) ? data.declined : [],
            undecided: Array.isArray(data.undecided) ? data.undecided : [],
          } as Event;
        })
      ];

      setEvents(loadedEvents);
    } catch (err) {
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

    const now = Timestamp.now();
    const eventData: Event = {
      id: '', // Will be set by Firestore
      source: 'events' as const,
      title: data.title,
      description: data.description,
      start: data.start,
      end: data.end || null,
      timezone: data.timezone,
      location: data.location,
      visibility: data.visibility,
      widgets: data.widgets.filter(w => w.isEnabled),
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
      owner: currentOrganization.id,
      organizationId: currentOrganization.id,
      status: data.status || 'draft',
      photo: data.photo || null,
      phoneNumber: data.phoneNumber || null,
      website: data.website || null,
      coverImage: data.coverImage || null,
      logoImage: data.logoImage || null,
      attendees: [],
      accepted: [],
      declined: [],
      undecided: [],
    };

    try {
      const eventsRef = collection(db, 'events');
      const docRef = doc(eventsRef);
      const docData = {
        ...eventData,
        id: docRef.id,
        // Convert dates to Firestore Timestamps consistently
        start: Timestamp.fromDate(data.start),
        end: data.end ? Timestamp.fromDate(data.end) : null,
        createdAt: now,
        updatedAt: now,
        // Store widgets with their full configuration
        widgets: data.widgets.filter(w => w.isEnabled).map(w => ({
          id: w.id,
          type: w.type,
          isEnabled: true,
          config: w.config || {},
          data: w.data || {},
          order: w.order || 0
        }))
      };

      await setDoc(docRef, docData);
      
      // Convert the timestamps back to dates for the returned event
      const newEvent: Event = {
        ...eventData,
        id: docRef.id,
        start: docData.start.toDate(),
        end: docData.end ? docData.end.toDate() : null,
        createdAt: docData.createdAt.toDate(),
        updatedAt: docData.updatedAt.toDate()
      };

      setEvents((prev) => [newEvent, ...prev]);
      return newEvent;
    } catch (err) {
      console.error('Failed to create event:', err);
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