import { createContext, useContext, useState, useCallback } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
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
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      const organizationId = eventDoc.data()?.owner;

      if (!organizationId) {
        throw new Error('No organization ID found for event');
      }

      // Load leads (invited members)
      const leadsRef = collection(db, 'organizations', organizationId, 'leads');
      const leadsSnapshot = await getDocs(leadsRef);
      const leads = leadsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: 'lead' as const,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          phoneNumber: data.phoneNumber || '',
          status: data.status || 'pending',
          organizations: [organizationId],
          photoUrl: data.photoUrl,
        };
      });

      // Load registered members from users collection and organization members
      const usersRef = collection(db, 'users');
      const membersRef = collection(db, 'organizations', organizationId, 'members');

      // Get users who have this org in their referralOrganizations
      const usersQuery = query(
        usersRef,
        where('referralOrganizations', 'array-contains', organizationId)
      );

      const [usersSnapshot, membersSnapshot] = await Promise.all([
        getDocs(usersQuery),
        getDocs(membersRef)
      ]);

      console.log('Users from referralOrganizations:', usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })));

      console.log('Members from org members collection:', membersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })));

      // First, get all the members from the members collection
      const memberDocsMap = new Map();
      membersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        console.log('Processing member doc:', { id: doc.id, ...data });
        memberDocsMap.set(doc.id, {
          id: doc.id,
          type: 'member' as const,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          status: 'transformed' as const,
          organizations: [organizationId],
          photoUrl: data.profileImageUrl || data.photoUrl || '',
          phoneNumber: '',
        });
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
            organizations: data.referralOrganizations || [organizationId],
            photoUrl: data.profileImageUrl || '',
            phoneNumber: '',
          });
        }
      });

      const registeredMembersList = Array.from(memberDocsMap.values())
        .filter(member => member.firstName || member.lastName);

      console.log('Final member count:', registeredMembersList.length);
      console.log('Members filtered out:', 
        Array.from(memberDocsMap.values()).length - registeredMembersList.length);
      console.log('Members without names:', 
        Array.from(memberDocsMap.values())
          .filter(member => !member.firstName && !member.lastName)
          .map(m => m.id)
      );

      setMembers(leads);
      setRegisteredMembers(registeredMembersList);

    } catch (err) {
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