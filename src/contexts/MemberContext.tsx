import { createContext, useContext, useState, useCallback } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Member, MemberStatus, MemberType } from '../types/member';

interface MemberContextType {
  members: Member[];
  loading: boolean;
  error: string | null;
  loadMembers: (eventId: string) => Promise<void>;
  addMember: (eventId: string, data: Omit<Member, 'id'>) => Promise<void>;
  updateMemberStatus: (memberId: string, status: MemberStatus) => Promise<void>;
}

const MemberContext = createContext<MemberContextType | null>(null);

export function MemberProvider({ children }: { children: React.ReactNode }) {
  const [members, setMembers] = useState<Member[]>([]);
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

      // Load only leads - they are our main members list
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
          // If not explicitly transformed, they are pending
          status: data.status === 'transformed' ? 'transformed' : 'pending',
          organizations: [organizationId],
          photoUrl: data.photoUrl,
        };
      });

      setMembers(leads);

      console.log('Loading complete:', {
        total: leads.length,
        byStatus: {
          pending: leads.filter(m => m.status === 'pending').length,
          transformed: leads.filter(m => m.status === 'transformed').length
        }
      });

    } catch (err) {
      console.error('Error loading members:', err);
      setError('Failed to load members');
    } finally {
      setLoading(false);
    }
  }, []);

  const addMember = useCallback(async (eventId: string, data: Omit<Member, 'id'>) => {
    try {
      const membersRef = collection(db, 'events', eventId, 'members');
      await addDoc(membersRef, data);
      await loadMembers(eventId);
    } catch (err) {
      console.error('Error adding member:', err);
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

      // Update local state - just change the status
      setMembers(prevMembers => 
        prevMembers.map(m => 
          m.id === memberId ? { ...m, status } : m
        )
      );
    } catch (err) {
      console.error('Error updating member status:', err);
      throw err;
    }
  }, [members]);

  const value = {
    members,
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