import { UserIcon } from '@heroicons/react/24/outline';
import { SlideAction } from '../common/SlideAction';
import { deleteDoc, doc, getDoc, updateDoc, deleteField } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useOrganization } from '../../contexts/OrganizationContext';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  status: 'active' | 'pending';
  joinedAt: Date;
  photoUrl?: string;
}

interface MembersTableProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
}

export function MembersTable({ members, setMembers }: MembersTableProps) {
  const { currentOrganization } = useOrganization();

  if (!members || members.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
        No members found
      </div>
    );
  }

  const handleDelete = async (memberId: string) => {
    if (!currentOrganization?.id) return;
    
    try {
      // Ensure we have all 4 segments: organizations/[orgId]/members/[memberId]
      const memberRef = doc(db, 'organizations', currentOrganization.id, 'members', memberId);
      await deleteDoc(memberRef);
      
      // Also check if there's a corresponding lead and update it
      const leadRef = doc(db, 'organizations', currentOrganization.id, 'leads', memberId);
      const leadDoc = await getDoc(leadRef);
      if (leadDoc.exists()) {
        await updateDoc(leadRef, {
          convertedTo: deleteField(),
          status: 'pending'
        });
      }
      
      setMembers(prev => prev.filter(member => member.id !== memberId));
    } catch (error) {
      console.error('Failed to delete member:', error);
    }
  };

  return (
    <div className="h-[calc(100vh-28rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
      <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
        {members.map((member) => (
          <li key={member.id} className="px-4 py-4 sm:px-6 cursor-pointer rounded-lg">
            <SlideAction onDelete={() => handleDelete(member.id)}>
              <div className="flex items-center">
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
                <div className="ml-4">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {member.firstName} {member.lastName}
                  </div>
                </div>
              </div>
            </SlideAction>
          </li>
        ))}
      </ul>
    </div>
  );
} 