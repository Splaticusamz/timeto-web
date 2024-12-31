import { createContext, useContext, useState, useCallback } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Member, MemberStatus, MemberType } from '../types/member';

interface MemberContextType {
  members: Member[];
  registeredMembers: Member[];
  loading: boolean;
  error: string | null;
  loadMembers: (eventId: string) => Promise<void>;
  addMember: (eventId: string, data: Omit<Member, 'id'>) => Promise<void>;
  updateMemberStatus: (memberId: string, status: MemberStatus) => Promise<void>;
}

const MemberContext = createContext<MemberContextType | null>(null);

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [registeredMembers, setRegisteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = useCallback(async (eventId: string) => {
    setLoading(true);
    try {
      console.log('Loading members for event:', eventId);

      // First try events collection
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      let eventData = eventDoc.exists() ? eventDoc.data() : null;

      // If not in events, try publicEvents
      if (!eventDoc.exists()) {
        const publicEventRef = doc(db, 'publicEvents', eventId);
        const publicEventDoc = await getDoc(publicEventRef);
        eventData = publicEventDoc.exists() ? publicEventDoc.data() : null;
      }

      if (!eventData) {
        throw new Error('Event not found');
      }

      // Get all attendee IDs from both event and user timelines
      const attendeeIds = new Set([
        ...(eventData.attendees || []),
        ...(eventData.accepted || []),
        ...(eventData.declined || []),
        ...(eventData.undecided || [])
      ]);

      // For each attendee, check their timeline
      const timelinePromises = Array.from(attendeeIds).map(async (userId) => {
        const timelineRef = doc(db, 'users', userId, 'timeline', eventId);
        const timelineDoc = await getDoc(timelineRef);
        if (timelineDoc.exists()) {
          const timelineData = timelineDoc.data();
          // If found in timeline, update their status
          if (timelineData.event?.accepted?.includes(userId)) {
            return { userId, status: 'accepted' as const };
          } else if (timelineData.event?.declined?.includes(userId)) {
            return { userId, status: 'declined' as const };
          } else if (timelineData.event?.undecided?.includes(userId)) {
            return { userId, status: 'maybe' as const };
          }
        }
        return { userId, status: 'pending' as const };
      });

      const timelineResults = await Promise.all(timelinePromises);
      const statusMap = new Map(timelineResults.map(r => [r.userId, r.status]));

      // Get user documents
      const userPromises = Array.from(attendeeIds).map(userId => 
        getDoc(doc(db, 'users', userId))
      );
      
      const userDocs = await Promise.all(userPromises);
      const attendeeMap = new Map();

      userDocs.forEach(doc => {
        if (doc.exists()) {
          const data = doc.data();
          const status = statusMap.get(doc.id) || 'pending';
          attendeeMap.set(doc.id, {
            id: doc.id,
            type: 'member' as const,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            status,
            organizations: data.referralOrganizations || [],
            photoUrl: data.profileImageUrl || '',
            phoneNumber: data.phoneNumber || '',
          });
        }
      });

      // Debug leads query and load leads (invited members)
      const leadsRef = collection(db, 'organizations', eventData.owner, 'leads');
      const leadsSnapshot = await getDocs(leadsRef);
      console.log('Leads query:', {
        organizationId: eventData.owner,
        leadsCount: leadsSnapshot.size,
        leads: leadsSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()}))
      });

      const leads = leadsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'lead' as const,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phoneNumber: data.phoneNumber || '',
          status: data.status || 'pending',
          organizations: data.referalOrgs || [eventData.owner],
          photoUrl: data.photoUrl,
        };
      });

      // Debug users query and load registered members
      const usersRef = collection(db, 'users');
      const membersRef = collection(db, 'organizations', eventData.owner, 'members');

      // Get users who have this org in their referralOrganizations
      const usersQuery = query(
        usersRef,
        where('referralOrganizations', 'array-contains', eventData.owner)
      );

      const [usersSnapshot, membersSnapshot] = await Promise.all([
        getDocs(usersQuery),
        getDocs(membersRef)
      ]);

      console.log('Debug - Query Results:', {
        usersCount: usersSnapshot.size,
        membersCount: membersSnapshot.size,
        organizationId: eventData.owner
      });

      // First, get all the members from the members collection
      const memberDocsMap = new Map();
      membersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('Processing member doc:', { id: doc.id, ...data });
        
        // Only add if we have a valid user document
        if (data.userId) {
          memberDocsMap.set(data.userId, {
            id: data.userId,
            type: 'member' as const,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            status: 'transformed' as const,
            organizations: [eventData.owner],
            photoUrl: data.profileImageUrl || data.photoUrl || '',
            phoneNumber: data.phoneNumber || '',
          });
        }
      });

      // Then add or update with users that have this org in their referralOrganizations
      usersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('Processing user doc:', { 
          id: doc.id, 
          firstName: data.firstName,
          lastName: data.lastName,
          isOnboard: data.isOnboard,
          referralOrganizations: data.referralOrganizations
        });

        if (data.isOnboard !== false) {
          memberDocsMap.set(doc.id, {
            id: doc.id,
            type: 'member' as const,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            status: 'transformed' as const,
            organizations: data.referralOrganizations || [eventData.owner],
            photoUrl: data.profileImageUrl || '',
            phoneNumber: data.phoneNumber || '',
          });
        }
      });

      const registeredMembersList = Array.from(memberDocsMap.values())
        .filter(member => member.firstName || member.lastName);

      // Merge attendees with other members
      const allMembers = [
        ...leads,
        ...registeredMembersList,
        ...Array.from(attendeeMap.values())
      ];

      // Remove duplicates by ID
      const uniqueMembers = Array.from(
        new Map(allMembers.map(member => [member.id, member])).values()
      );

      console.log('Final results:', {
        leadsCount: leads.length,
        registeredCount: registeredMembersList.length,
        attendeesCount: attendeeMap.size,
        totalUniqueMembers: uniqueMembers.length
      });

      setMembers(leads);
      setRegisteredMembers(uniqueMembers.filter(m => m.type === 'member'));

    } catch (err) {
      console.error('Failed to load members:', err);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, []);

  const addMember = useCallback(async (eventId: string, data: Omit<Member, 'id'>) => {
    try {
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      const organizationId = eventDoc.data()?.owner;

      if (!organizationId) {
        throw new Error('No organization ID found for event');
      }

      const membersRef = collection(db, 'organizations', organizationId, data.type === 'lead' ? 'leads' : 'members');
      await addDoc(membersRef, data);
      await loadMembers(eventId);
    } catch (err) {
      throw new Error('Failed to add member');
    }
  }, [loadMembers]);

  const updateMemberStatus = useCallback(async (memberId: string, status: MemberStatus) => {
    try {
      const member = members.find(m => m.id === memberId);
      if (!member) throw new Error('Member not found');

      // Update status in leads collection
      const docRef = doc(db, 'organizations', member.organizations[0], 'leads', memberId);
      await updateDoc(docRef, { status });

      // Update local state
      setMembers(prevMembers => 
        prevMembers.map(m => 
          m.id === memberId ? { ...m, status } : m
        )
      );
    } catch (err) {
      throw err;
    }
  }, [members]);

  const value = {
    members,
    registeredMembers,
    loading,
    error,
    loadMembers,
    addMember,
    updateMemberStatus,
  };

  return (
    <MemberContext.Provider value={value}>
      {children}
    </MemberContext.Provider>
  );
}

export function useMember() {
  const context = useContext(MemberContext);
  if (!context) {
    throw new Error('useMember must be used within a MemberProvider');
  }
  return context;
} 