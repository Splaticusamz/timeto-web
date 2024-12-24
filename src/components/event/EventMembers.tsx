import { useState, useEffect } from 'react';
import { Member, MemberStatus, MemberType } from '../../types/member';
import { Tab } from '@headlessui/react';
import { UserIcon, UsersIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useMember } from '../../contexts/MemberContext';
import { AddMemberModal } from './AddMemberModal';
import { Menu } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { MemberDetailsModal } from './MemberDetailsModal';
import { SearchTable } from '.';
import { StatusBadge } from './StatusBadge';
import { MemberFilters } from './MemberFilters';
import { Pagination } from '../common/Pagination';

interface EventMembersProps {
  eventId: string;
}

interface MemberTableProps {
  members: Member[];
  showStatus?: boolean;
  currentPage?: number;
  itemsPerPage?: number;
  startIndex?: number;
}

function MemberTable({ members, showStatus = true, currentPage = 1, itemsPerPage = 50, startIndex = 0 }: MemberTableProps) {
  return (
    <table className="w-full">
      <thead>
        <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <th className="w-12 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
            #
          </th>
          <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
            First Name
          </th>
          <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
            Last Name
          </th>
          <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
            Phone Number
          </th>
          {showStatus && (
            <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
              Status
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {members.map((member, index) => (
          <tr 
            key={member.id}
            className="border-b border-gray-100 dark:border-gray-700 last:border-b-0"
          >
            <td className="py-2 text-sm px-4 text-gray-500 dark:text-gray-400">
              {startIndex + index + 1}
            </td>
            <td className="py-2 text-sm px-4 text-gray-900 dark:text-white">
              {member.firstName}
            </td>
            <td className="py-2 text-sm px-4 text-gray-900 dark:text-white">
              {member.lastName}
            </td>
            <td className="py-2 text-sm px-4 text-gray-900 dark:text-white">
              {member.phoneNumber.startsWith('+') ? member.phoneNumber : `+${member.phoneNumber}`}
            </td>
            {showStatus && (
              <td className="py-2 px-4">
                <StatusBadge status={member.status} />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LoadingSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded" />
        ))}
      </div>
    </div>
  );
}

export function EventMembers({ eventId }: EventMembersProps) {
  // Separate state for each tab
  const [tabStates, setTabStates] = useState({
    invited: {
      searchTerm: '',
      showLeads: true,
      showMembers: true,
      currentPage: 1
    },
    registered: {
      searchTerm: '',
      showLeads: true,
      showMembers: true,
      currentPage: 1
    },
    search: {
      searchTerm: '',
      showLeads: true,
      showMembers: true,
      currentPage: 1
    }
  });

  const [selectedTab, setSelectedTab] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { members, loading, error, loadMembers, addMember, updateMemberStatus } = useMember();
  const itemsPerPage = 50;

  // Helper to get current tab state
  const getCurrentTabState = () => {
    switch (selectedTab) {
      case 0: return tabStates.invited;
      case 1: return tabStates.registered;
      case 2: return tabStates.search;
      default: return tabStates.invited;
    }
  };

  // Helper to update tab state
  const updateTabState = (tab: 'invited' | 'registered' | 'search', updates: Partial<typeof tabStates.invited>) => {
    setTabStates(prev => ({
      ...prev,
      [tab]: { ...prev[tab], ...updates }
    }));
  };

  // Filter functions
  const filterMembers = (members: Member[], tabState: typeof tabStates.invited) => {
    // First apply type filter
    let filtered = members;
    if (!tabState.showLeads && !tabState.showMembers) {
      return []; // Return empty if neither type is selected
    }
    if (!tabState.showLeads) {
      filtered = filtered.filter(m => m.type === 'member');
    }
    if (!tabState.showMembers) {
      filtered = filtered.filter(m => m.type === 'lead');
    }

    // Then apply search filter if there's a search term
    if (tabState.searchTerm) {
      filtered = filtered.filter(member => 
        `${member.firstName} ${member.lastName}`
          .toLowerCase()
          .includes(tabState.searchTerm.toLowerCase())
      );
    }

    return filtered;
  };

  // Get paginated data for a specific tab
  const getPaginatedData = (members: Member[], tabState: typeof tabStates.invited) => {
    const filteredMembers = filterMembers(members, tabState);
    const startIndex = (tabState.currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredMembers.length);
    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;

    return {
      members: filteredMembers.slice(startIndex, endIndex),
      totalPages,
      totalItems: filteredMembers.length,
      startIndex,
      currentPage: tabState.currentPage
    };
  };

  // Add back the useEffect to load members
  useEffect(() => {
    console.log('Loading members for event:', eventId);
    loadMembers(eventId);
  }, [eventId, loadMembers]);

  // Add debug logging after filtering
  useEffect(() => {
    if (members.length > 0) {
      console.log('Total members:', members.length);
      console.log('Total invited:', invitedMembers.length);
      console.log('Total registered:', registeredMembers.length);
      console.log('Members by type:', {
        leads: members.filter(m => m.type === 'lead').length,
        members: members.filter(m => m.type === 'member').length
      });
      console.log('Members by status:', {
        pending: members.filter(m => m.status === 'pending').length,
        transformed: members.filter(m => m.status === 'transformed').length
      });
    }
  }, [members]);

  // Filter base lists - keep all members in invited list
  const invitedMembers = members; // All leads stay in invited list, this should be 275
  const registeredMembers = members.filter(m => m.status === 'transformed'); // For count only
  const allMembers = members; // For search tab

  // Add debug logging to verify counts
  useEffect(() => {
    if (members.length > 0) {
      console.log('Member counts:', {
        total: members.length,
        invited: invitedMembers.length,
        registered: registeredMembers.length
      });
    }
  }, [members, invitedMembers, registeredMembers]);

  console.log('All members:', members);
  console.log('Invited members:', invitedMembers);
  console.log('Registered members:', registeredMembers);

  // Get paginated data for each tab
  const {
    members: paginatedInvited,
    totalPages: invitedPages,
    startIndex: invitedStartIndex
  } = getPaginatedData(invitedMembers, tabStates.invited);

  const {
    members: paginatedRegistered,
    totalPages: registeredPages,
    startIndex: registeredStartIndex
  } = getPaginatedData(registeredMembers, tabStates.registered);

  const {
    members: paginatedSearch,
    totalPages: searchPages
  } = getPaginatedData(allMembers, tabStates.search);

  console.log('Paginated invited:', paginatedInvited);
  console.log('Paginated registered:', paginatedRegistered);
  console.log('Paginated search:', paginatedSearch);

  const handleAddMember = async (data: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    type: MemberType;
  }) => {
    await addMember(eventId, {
      ...data,
      status: 'pending' as MemberStatus,
      organizations: [],
    });
  };

  if (error) {
    return (
      <div className="mt-8 p-4 bg-red-50 dark:bg-red-900 rounded-md">
        <p className="text-red-700 dark:text-red-200">{error}</p>
        <button
          onClick={() => loadMembers(eventId)}
          className="mt-2 text-sm text-red-600 dark:text-red-300 hover:text-red-500"
        >
          Try again
        </button>
      </div>
    );
  }

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">Members</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <PlusIcon className="h-5 w-5 mr-1" />
          Add Member
        </button>
      </div>

      <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
        <Tab.List className="flex space-x-1 border-b border-gray-200 dark:border-gray-700">
          <Tab className={({ selected }) => `
            px-4 py-2 text-sm font-medium border-b-2 
            ${selected 
              ? 'border-primary-500 text-primary-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}>
            Invited Members ({invitedMembers.length})
          </Tab>
          <Tab className={({ selected }) => `
            px-4 py-2 text-sm font-medium border-b-2 
            ${selected 
              ? 'border-primary-500 text-primary-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}>
            Registered Members ({registeredMembers.length})
          </Tab>
          <Tab className={({ selected }) => `
            px-4 py-2 text-sm font-medium border-b-2 
            ${selected 
              ? 'border-primary-500 text-primary-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }
          `}>
            Search ({members.length})
          </Tab>
        </Tab.List>

        <Tab.Panels className="mt-4">
          <Tab.Panel>
            <MemberFilters
              searchTerm={tabStates.invited.searchTerm}
              onSearchChange={(value) => updateTabState('invited', { searchTerm: value })}
              showLeads={tabStates.invited.showLeads}
              onShowLeadsChange={(value) => updateTabState('invited', { showLeads: value })}
              showMembers={tabStates.invited.showMembers}
              onShowMembersChange={(value) => updateTabState('invited', { showMembers: value })}
            />
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <MemberTable 
                members={paginatedInvited} 
                showStatus={true}
                currentPage={tabStates.invited.currentPage}
                itemsPerPage={itemsPerPage}
                startIndex={invitedStartIndex}
              />
              <Pagination
                currentPage={tabStates.invited.currentPage}
                totalPages={invitedPages}
                onPageChange={(page) => updateTabState('invited', { currentPage: page })}
              />
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <MemberFilters
              searchTerm={tabStates.registered.searchTerm}
              onSearchChange={(value) => updateTabState('registered', { searchTerm: value })}
              showLeads={tabStates.registered.showLeads}
              onShowLeadsChange={(value) => updateTabState('registered', { showLeads: value })}
              showMembers={tabStates.registered.showMembers}
              onShowMembersChange={(value) => updateTabState('registered', { showMembers: value })}
            />
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <MemberTable 
                members={paginatedRegistered}
                showStatus={false}
                currentPage={tabStates.registered.currentPage}
                itemsPerPage={itemsPerPage}
                startIndex={registeredStartIndex}
              />
              <Pagination
                currentPage={tabStates.registered.currentPage}
                totalPages={registeredPages}
                onPageChange={(page) => updateTabState('registered', { currentPage: page })}
              />
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <MemberFilters
              searchTerm={tabStates.search.searchTerm}
              onSearchChange={(value) => updateTabState('search', { searchTerm: value })}
              showLeads={tabStates.search.showLeads}
              onShowLeadsChange={(value) => updateTabState('search', { showLeads: value })}
              showMembers={tabStates.search.showMembers}
              onShowMembersChange={(value) => updateTabState('search', { showMembers: value })}
            />
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <SearchTable members={paginatedSearch} />
              <Pagination
                currentPage={tabStates.search.currentPage}
                totalPages={searchPages}
                onPageChange={(page) => updateTabState('search', { currentPage: page })}
              />
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddMember}
      />
    </div>
  );
} 