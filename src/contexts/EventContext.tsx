import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
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

// Helper function to handle Firestore timestamp objects
const convertTimestamp = (timestamp: any): Date => {
  if (!timestamp) return null;
  
  // Handle Firestore Timestamp instance
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  
  // Handle raw timestamp object with _seconds and _nanoseconds
  if (typeof timestamp === 'object' && '_seconds' in timestamp) {
    return new Date(timestamp._seconds * 1000);
  }
  
  // Handle raw timestamp object with seconds and nanoseconds
  if (typeof timestamp === 'object' && 'seconds' in timestamp) {
    return new Date(timestamp.seconds * 1000);
  }
  
  // Handle date string or number
  return new Date(timestamp);
};

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
      const eventsRef = collection(db, 'events');
      const publicEventsRef = collection(db, 'publicEvents');

      const [privateEvents, publicEvents] = await Promise.all([
        getDocs(query(
          eventsRef,
          where('owner', '==', currentOrganization.id),
          orderBy('start', 'desc')
        )),
        getDocs(query(
          publicEventsRef,
          where('owner', '==', currentOrganization.id),
          orderBy('start', 'desc')
        ))
      ]);

      // Debug the first event's data
      if (privateEvents.docs.length > 0) {
        const sampleData = privateEvents.docs[0].data();
        console.log('Sample event data:', {
          start: sampleData.start,
          startType: typeof sampleData.start,
          startProps: Object.keys(sampleData.start || {}),
          end: sampleData.end,
          endType: typeof sampleData.end,
          endProps: Object.keys(sampleData.end || {})
        });
      }

      const loadedEvents: Event[] = [
        ...privateEvents.docs.map(doc => {
          const data = doc.data();
          // Debug each event's start date
          console.log(`Event ${doc.id} start:`, {
            raw: data.start,
            type: typeof data.start,
            isTimestamp: data.start instanceof Timestamp,
            hasSeconds: typeof data.start === 'object' && 'seconds' in data.start
          });

          return {
            id: doc.id,
            source: 'events' as const,
            title: data.title || '',
            description: data.description || '',
            start: convertTimestamp(data.start),
            end: convertTimestamp(data.end),
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            organizationId: data.organizationId,
            owner: data.owner,
            status: data.status || 'draft',
            visibility: data.visibility || 'organization',
            location: data.location || { type: 'fixed' as const },
            widgets: Array.isArray(data.widgets) ? data.widgets.map((w: any) => 
              typeof w === 'string' ? {
                id: w,
                type: w,
                isEnabled: true,
                config: {},
                data: {},
                order: 0
              } : {
                id: w.id || w.type,
                type: w.type,
                isEnabled: w.isEnabled ?? true,
                config: w.config || {},
                data: w.data || {},
                order: w.order || 0
              }
            ).filter(w => w.isEnabled !== false) : [],
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            photo: data.photo || null,
            phoneNumber: data.phoneNumber || null,
            website: data.website || null,
            coverImage: data.coverImage || null,
            logoImage: data.logoImage || null,
            attendees: Array.isArray(data.attendees) ? data.attendees : [],
            accepted: Array.isArray(data.accepted) ? data.accepted : [],
            declined: Array.isArray(data.declined) ? data.declined : [],
            undecided: Array.isArray(data.undecided) ? data.undecided : [],
            notificationSettings: data.notificationSettings ? {
              enabled: Boolean(data.notificationSettings.enabled) || false,
              reminderTimes: Array.isArray(data.notificationSettings.reminderTimes) 
                ? data.notificationSettings.reminderTimes 
                : []
            } : null,
          } as Event;
        }),
        ...publicEvents.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            source: 'publicEvents' as const,
            title: data.title || '',
            description: data.description || '',
            start: convertTimestamp(data.start),
            end: convertTimestamp(data.end),
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            organizationId: data.organizationId || currentOrganization.id,
            owner: data.owner || currentOrganization.id,
            status: data.status || 'published',
            visibility: data.visibility || 'organization',
            location: data.location || { type: 'fixed' as const },
            widgets: Array.isArray(data.widgets) ? data.widgets.map((w: any) => 
              typeof w === 'string' ? {
                id: w,
                type: w,
                isEnabled: true,
                config: {},
                data: {},
                order: 0
              } : {
                id: w.id || w.type,
                type: w.type,
                isEnabled: w.isEnabled ?? true,
                config: w.config || {},
                data: w.data || {},
                order: w.order || 0
              }
            ).filter(w => w.isEnabled !== false) : [],
            createdAt: convertTimestamp(data.createdAt),
            updatedAt: convertTimestamp(data.updatedAt),
            photo: data.photo || null,
            phoneNumber: data.phoneNumber || null,
            website: data.website || null,
            coverImage: data.coverImage || null,
            logoImage: data.logoImage || null,
            attendees: Array.isArray(data.attendees) ? data.attendees : [],
            accepted: Array.isArray(data.accepted) ? data.accepted : [],
            declined: Array.isArray(data.declined) ? data.declined : [],
            undecided: Array.isArray(data.undecided) ? data.undecided : [],
            notificationSettings: data.notificationSettings ? {
              enabled: Boolean(data.notificationSettings.enabled) || false,
              reminderTimes: Array.isArray(data.notificationSettings.reminderTimes) 
                ? data.notificationSettings.reminderTimes 
                : []
            } : null,
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
    if (!currentUser || !currentOrganization) return;
    
    // Load events once when component mounts or when user/org changes
    loadEvents();
  }, [currentUser, currentOrganization, loadEvents]);

  const createEvent = useCallback(async (data: CreateEventData): Promise<Event> => {
    if (!currentUser || !currentOrganization) {
      throw new Error('No user logged in or no organization selected');
    }

    try {
      // Ensure location has all required fields with defaults
      const location = {
        type: data.location?.type || 'fixed',
        address: data.location?.address || '',
        virtualLink: data.location?.virtualLink || '',
        meetingProvider: data.location?.meetingProvider || 'none', // Add default
        multiple: data.location?.multiple || []
      };

      const eventData: Event = {
        id: '', // Will be set by Firestore
        source: 'events' as const,
        title: data.title,
        description: data.description,
        start: data.start,
        end: data.end || null,
        timezone: data.timezone,
        location,
        visibility: data.visibility,
        widgets: data.widgets.filter(w => w.isEnabled !== false),
        createdAt: Timestamp.fromDate(data.start),
        updatedAt: Timestamp.fromDate(data.start),
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

      const eventsRef = collection(db, 'events');
      const docRef = doc(eventsRef);
      const docData = {
        ...eventData,
        id: docRef.id,
        // Convert dates to Firestore Timestamps consistently
        start: Timestamp.fromDate(data.start),
        end: data.end ? Timestamp.fromDate(data.end) : null,
        createdAt: Timestamp.fromDate(data.start),
        updatedAt: Timestamp.fromDate(data.start),
        // Store widgets as strings to match existing database structure
        widgets: data.widgets.filter(w => w.isEnabled !== false).map(w => w.type)
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

      // If notifications are enabled, create scheduled notifications
      if (data.notificationSettings?.enabled) {
        const scheduledNotificationsRef = collection(db, 'scheduledNotifications');
        
        for (const timeBeforeEvent of data.notificationSettings.reminderTimes) {
          await setDoc(doc(scheduledNotificationsRef), {
            owner: currentUser.uid,
            eventId: docRef.id,
            timeBeforeEvent,
            nextNotification: new Date(data.start.getTime() - timeBeforeEvent * 60000),
            recurrenceId: data.recurrence ? recurrenceRef.id : null
          });
        }
      }

      return newEvent;
    } catch (err) {
      console.error('Failed to create event:', err);
      throw new Error('Failed to create event');
    }
  }, [currentUser, currentOrganization]);

  const updateEvent = useCallback(async (id: string, data: UpdateEventData): Promise<Event> => {
    console.log('EventContext updateEvent called with:', { id, data });
    
    if (!currentUser || !currentOrganization) {
      throw new Error('No user logged in or no organization selected');
    }

    try {
      const [privateDoc, publicDoc] = await Promise.all([
        getDoc(doc(db, 'events', id)),
        getDoc(doc(db, 'publicEvents', id))
      ]);

      let eventDoc = privateDoc.exists() ? privateDoc : publicDoc;
      let currentCollection = privateDoc.exists() ? 'events' : 'publicEvents';
      
      if (!eventDoc.exists()) {
        throw new Error('Event not found');
      }

      const currentData = eventDoc.data();
      const now = Timestamp.now();
      
      // Prepare the update data with special handling for notification settings
      const updatedData = {
        ...data,
        updatedAt: now,
        organizationId: currentOrganization.id,
      };

      // Special handling for notification settings
      if (data.notificationSettings) {
        updatedData.notificationSettings = {
          enabled: Boolean(data.notificationSettings.enabled),
          reminderTimes: Array.isArray(data.notificationSettings.reminderTimes) 
            ? data.notificationSettings.reminderTimes 
            : []
        };
      }

      console.log('Data being saved to Firestore:', updatedData);

      // Update the event document
      const eventRef = doc(db, currentCollection, id);
      await updateDoc(eventRef, updatedData);

      // Fetch the latest data after update
      const updatedDoc = await getDoc(eventRef);
      const updatedDocData = updatedDoc.data();

      // Create the updated event object with proper handling of all fields
      const updatedEvent = {
        ...currentData,
        ...updatedDocData,
        id,
        organizationId: currentOrganization.id,
        source: currentCollection as EventSource,
        updatedAt: now.toDate(),
        start: updatedDocData.start ? convertTimestamp(updatedDocData.start) : currentData.start,
        end: updatedDocData.end ? convertTimestamp(updatedDocData.end) : currentData.end,
        createdAt: convertTimestamp(currentData.createdAt),
        notificationSettings: updatedDocData.notificationSettings ? {
          enabled: Boolean(updatedDocData.notificationSettings.enabled),
          reminderTimes: Array.isArray(updatedDocData.notificationSettings.reminderTimes)
            ? updatedDocData.notificationSettings.reminderTimes
            : []
        } : null
      };

      // Update local state
      setEvents(prev => prev.map(event => 
        event.id === id ? updatedEvent : event
      ));

      return updatedEvent;
    } catch (err) {
      console.error('Update event error:', err);
      throw new Error('Failed to update event');
    }
  }, [currentUser, currentOrganization]);

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