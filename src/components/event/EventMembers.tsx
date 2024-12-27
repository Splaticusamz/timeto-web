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
  isRegisteredView?: boolean;
}

function MemberTable({ members, showStatus = true, currentPage = 1, itemsPerPage = 50, startIndex = 0, isRegisteredView = false }: MemberTableProps) {
  if (!members || members.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No members found
      </div>
    );
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <th className="w-8 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
            #
          </th>
          {isRegisteredView && (
            <th className="w-12 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
              Photo
            </th>
          )}
          <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
            First Name
          </th>
          <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
            Last Name
          </th>
          {!isRegisteredView && (
            <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
              Phone Number
            </th>
          )}
          {showStatus && !isRegisteredView && (
            <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
              Status
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {members.map((member, index) => (
          <tr key={member.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
            <td className="py-2 text-sm px-4 text-gray-500 dark:text-gray-400">
              {startIndex + index + 1}
            </td>
            {isRegisteredView && (
              <td className="py-2 px-4">
                {member.photoUrl ? (
                  <img 
                    src={member.photoUrl} 
                    alt={`${member.firstName} ${member.lastName}`}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {member.firstName ? member.firstName[0] : '?'}
                    </span>
                  </div>
                )}
              </td>
            )}
            <td className="py-2 text-sm px-4 text-gray-900 dark:text-white">
              {member.firstName}
            </td>
            <td className="py-2 text-sm px-4 text-gray-900 dark:text-white">
              {member.lastName}
            </td>
            {!isRegisteredView && (
              <td className="py-2 text-sm px-4 text-gray-900 dark:text-white">
                {member.phoneNumber.startsWith('+') ? member.phoneNumber : `+${member.phoneNumber}`}
              </td>
            )}
            {showStatus && !isRegisteredView && (
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
  const { members, registeredMembers, loading, error, loadMembers, addMember } = useMember();
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
    let filtered = members;

    // Apply search filter if there's a search term
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
    console.log('getPaginatedData input:', { members, tabState });
    const filteredMembers = filterMembers(members, tabState);
    console.log('filteredMembers:', filteredMembers);
    const startIndex = (tabState.currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredMembers.length);
    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage) || 1;

    const result = {
      members: filteredMembers.slice(startIndex, endIndex),
      totalPages,
      totalItems: filteredMembers.length,
      startIndex,
      currentPage: tabState.currentPage
    };
    console.log('getPaginatedData output:', result);
    return result;
  };

  useEffect(() => {
    loadMembers(eventId);
  }, [eventId, loadMembers]);

  // Get paginated data for each tab
  const {
    members: paginatedInvited,
    totalPages: invitedPages,
    startIndex: invitedStartIndex
  } = getPaginatedData(members, tabStates.invited);

  const {
    members: paginatedRegistered,
    totalPages: registeredPages,
    startIndex: registeredStartIndex
  } = getPaginatedData(registeredMembers, tabStates.registered);

  // Search tab should show 0 results since all members are already in other tabs
  const searchMembers: Member[] = [];
  const {
    members: paginatedSearch,
    totalPages: searchPages
  } = getPaginatedData(searchMembers, tabStates.search);

  // Add debug logging
  console.log('Members State:', {
    members,
    registeredMembers,
    paginatedInvited,
    paginatedRegistered,
    paginatedSearch
  });

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
            Invited Members ({members.length})
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
            Search (0)
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
                isRegisteredView={false}
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
            />
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <MemberTable 
                members={paginatedRegistered}
                showStatus={false}
                currentPage={tabStates.registered.currentPage}
                itemsPerPage={itemsPerPage}
                startIndex={registeredStartIndex}
                isRegisteredView={true}
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