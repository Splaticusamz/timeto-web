import { useState, useEffect } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { PlusIcon, UserPlusIcon, UsersIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { AddLeadModal } from '../../components/members/AddLeadModal';
import { InviteUserModal } from '../../components/members/InviteUserModal';
import { LeadsList } from '../../components/members/LeadsList';
import { ConvertedMembersList } from '../../components/members/ConvertedMembersList';
import { MembersTable } from '../../components/members/MembersTable';
import { collection, getDocs, query, where, doc, setDoc, Timestamp, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { Pagination } from '../../components/common/Pagination';

// Match existing schema
interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  status: string;
  referalOrgs: string[];
  convertedTo?: string;
  createdAt: Date;
  addedBy?: string;
}

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

interface PaginatedData<T> {
  data: T[];
  totalPages: number;
}

export function Members() {
  const { currentOrganization } = useOrganization();
  const { currentUser } = useAuth();
  const [showNewLeadForm, setShowNewLeadForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [leads, setLeads] = useState<Lead[]>([]);
  const [convertedLeads, setConvertedLeads] = useState<Lead[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerms, setSearchTerms] = useState({
    leads: '',
    converted: '',
    members: ''
  });
  const [currentPages, setCurrentPages] = useState({
    leads: 1,
    converted: 1,
    members: 1
  });
  const itemsPerPage = 10;

  // Load leads and members from the organization's subcollections
  useEffect(() => {
    const loadData = async () => {
      if (!currentOrganization) return;

      try {
        setLoading(true);
        
        // Load leads
        const leadsRef = collection(db, 'organizations', currentOrganization.id, 'leads');
        const leadsSnapshot = await getDocs(leadsRef);
        const leadsData = await Promise.all(leadsSnapshot.docs.map(async docSnap => {
          const data = docSnap.data();
          // If lead is converted, get their TimeTo user data
          let convertedData = {};
          if (data.convertedTo) {
            const userRef = doc(db, 'users', data.convertedTo);
            const userDoc = await getDoc(userRef);
            const userData = userDoc.data();
            convertedData = {
              photoUrl: userData?.profileImageUrl || userData?.photoUrl,
              convertedName: userData?.displayName || `${userData?.firstName} ${userData?.lastName}`.trim()
            };
          }
          return { 
            id: docSnap.id,
            ...data,
            ...convertedData,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as Lead;
        }));

        // Separate converted and non-converted leads
        const converted = leadsData.filter(lead => lead.convertedTo);
        const pending = leadsData.filter(lead => !lead.convertedTo);
        
        setLeads(pending);
        setConvertedLeads(converted);

        // Load members with proper data transformation
        const membersRef = collection(db, 'organizations', currentOrganization.id, 'members');
        const membersSnapshot = await getDocs(membersRef);
        const membersData = await Promise.all(membersSnapshot.docs.map(async memberDoc => {
          const memberData = memberDoc.data();
          
          // Get user data for this member
          const userRef = doc(db, 'users', memberDoc.id);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.data();

          return {
            id: memberDoc.id,
            firstName: userData?.firstName || '',
            lastName: userData?.lastName || '',
            phoneNumber: userData?.phoneNumber || '',
            email: userData?.email || '',
            status: memberData.status || 'pending',
            joinedAt: memberData.joinedAt?.toDate() || new Date(),
            photoUrl: userData?.profileImageUrl || userData?.photoUrl
          } as Member;
        }));

        setMembers(membersData);
      } catch (err) {
        console.error('Failed to load members data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentOrganization]);

  const handleAddLead = async (data: { firstName: string; lastName: string; phoneNumber: string }) => {
    if (!currentOrganization) return;
    if (!currentUser) return;

    try {
      const leadData: Lead = {
        ...data,
        id: '', // Will be set by Firestore
        email: '', // Optional in form
        status: 'pending',
        referalOrgs: [currentOrganization.id],
        createdAt: new Date(),
        addedBy: currentUser.displayName || currentUser.email || 'Unknown',
      };

      const leadsRef = collection(db, 'organizations', currentOrganization.id, 'leads');
      const docRef = doc(leadsRef);
      await setDoc(docRef, {
        ...leadData,
        createdAt: Timestamp.fromDate(leadData.createdAt),
      });

      // Add the document ID to the lead data
      leadData.id = docRef.id;

      // Refresh leads list
      setLeads(prev => [...prev, leadData]);
      setShowNewLeadForm(false);
    } catch (err) {
      console.error('Failed to add lead:', err);
    }
  };

  const handleInviteUser = async (phoneNumber: string) => {
    if (!currentOrganization) return;

    try {
      // Check if user exists in the system
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
      const userSnapshot = await getDocs(q);

      if (userSnapshot.empty) {
        alert('No TimeTo user found with this phone number');
        return;
      }

      const userData = userSnapshot.docs[0];
      
      // Add to members subcollection
      const memberRef = doc(db, 'organizations', currentOrganization.id, 'members', userData.id);
      await setDoc(memberRef, {
        status: 'pending',
        joinedAt: Timestamp.now(),
      });

      setShowInviteForm(false);
    } catch (err) {
      console.error('Failed to invite user:', err);
    }
  };

  const filterAndPaginate = <T extends { firstName: string; lastName: string }>(
    items: T[],
    searchTerm: string,
    currentPage: number
  ): PaginatedData<T> => {
    const filtered = items.filter(item =>
      `${item.firstName} ${item.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

    return {
      data: paginatedData,
      totalPages: Math.max(totalPages, 1)
    };
  };

  if (!currentOrganization) {
    return (
      <div className="text-center py-4 text-gray-500">
        Please select an organization first.
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Members</h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Manage your organization's members and leads
        </p>
      </div>

      {/* Add Member Section */}
      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Add New Lead Card */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <UserPlusIcon className="h-5 w-5 mr-2 text-gray-400" />
              Add New Lead
            </h2>
            <button
              onClick={() => setShowNewLeadForm(true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Lead
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Add potential members who aren't on TimeTo yet
          </p>
        </div>

        {/* Invite Existing User Card */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <UsersIcon className="h-5 w-5 mr-2 text-gray-400" />
              Invite TimeTo User
            </h2>
            <button
              onClick={() => setShowInviteForm(true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Invite
            </button>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Already using TimeTo? Invite them directly with their phone number
          </p>
        </div>
      </div>

      {/* All Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* Leads Column */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2 text-gray-400" />
              Leads ({leads.length})
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerms.leads}
                onChange={(e) => setSearchTerms(prev => ({ ...prev, leads: e.target.value }))}
                className="pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent w-[150px]"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden flex-1">
            <LeadsList 
              leads={leads.filter(lead =>
                `${lead.firstName} ${lead.lastName}`
                  .toLowerCase()
                  .includes(searchTerms.leads.toLowerCase())
              )}
              setLeads={setLeads}
            />
          </div>
        </div>

        {/* Converted Members Column */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2 text-gray-400" />
              Converted ({convertedLeads.length})
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerms.converted}
                onChange={(e) => setSearchTerms(prev => ({ ...prev, converted: e.target.value }))}
                className="pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent w-[150px]"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden flex-1">
            <ConvertedMembersList 
              members={convertedLeads.filter(lead =>
                `${lead.firstName} ${lead.lastName}`
                  .toLowerCase()
                  .includes(searchTerms.converted.toLowerCase())
              )}
              setConvertedLeads={setConvertedLeads}
              setLeads={setLeads}
            />
          </div>
        </div>

        {/* Members Column */}
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <UsersIcon className="h-5 w-5 mr-2 text-gray-400" />
              All Members ({members.length})
            </h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerms.members}
                onChange={(e) => setSearchTerms(prev => ({ ...prev, members: e.target.value }))}
                className="pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent w-[150px]"
              />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden flex-1">
            <MembersTable 
              members={members.filter(member =>
                `${member.firstName} ${member.lastName}`
                  .toLowerCase()
                  .includes(searchTerms.members.toLowerCase())
              )}
              setMembers={setMembers}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showNewLeadForm && (
        <AddLeadModal
          onClose={() => setShowNewLeadForm(false)}
          onSubmit={handleAddLead}
        />
      )}

      {showInviteForm && (
        <InviteUserModal
          onClose={() => setShowInviteForm(false)}
          onSubmit={handleInviteUser}
        />
      )}
    </div>
  );
} 