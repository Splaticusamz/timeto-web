import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, getDoc, where, limit, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';
import { db } from '../../firebase';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useAuth } from '../../contexts/AuthContext';
import { OrgMemberRole, Organization } from '../../types/organization';
import { UserGroupIcon, MagnifyingGlassIcon, XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  role: OrgMemberRole;
  profileImageUrl?: string;
  auth: boolean;
  isAdmin?: boolean;
}

interface OrganizationWithMembers extends Omit<Organization, 'members'> {
  members: Member[];
}

interface UserDetailsPopupProps {
  member: Member | null;
  organizations: OrganizationWithMembers[];
  isOpen: boolean;
  onClose: () => void;
}

interface User {
  id: string;
  email: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  auth: boolean;
  isAdmin: boolean;
  identifier: string;
}

function UserDetailsPopup({ member, organizations, isOpen, onClose }: UserDetailsPopupProps) {
  if (!member) return null;

  const memberOrganizations = organizations.filter(org => 
    org.members.some(m => m.id === member.id)
  );

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <div className="flex items-center mb-6">
                      <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                        {member.profileImageUrl ? (
                          <img src={member.profileImageUrl} alt={`${member.firstName} ${member.lastName}`} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-2xl font-medium text-gray-500 dark:text-gray-400">
                            {member.firstName[0]?.toUpperCase() || member.email[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                          {member.firstName} {member.lastName}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          User ID: {member.id}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                        Organization Memberships
                      </h4>
                      <div className="space-y-3">
                        {memberOrganizations.map(org => (
                          <div
                            key={org.id}
                            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <h5 className="text-sm font-medium text-gray-900 dark:text-white">
                                  {org.name}
                                </h5>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  Role: {org.members.find(m => m.id === member.id)?.role}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

interface AddMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (email: string, role: OrgMemberRole, organizationId: string) => Promise<void>;
  organizations: OrganizationWithMembers[];
}

function AddMemberModal({ isOpen, onClose, onAdd, organizations }: AddMemberModalProps) {
  const [organizationSearchTerm, setOrganizationSearchTerm] = useState('');
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [role, setRole] = useState<OrgMemberRole>('member');
  const [organizationId, setOrganizationId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        console.log('Starting to load users...');
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        console.log('Raw users from Firestore:', querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const seenIdentifiers = new Set<string>();
        const usersList = querySnapshot.docs
          .map(doc => {
            const data = doc.data();
            console.log('Processing user document:', { id: doc.id, data });
            
            // Get identifier (email, phone, or id if neither exists)
            const identifier = data.auth?.email || data.phoneNumber || doc.id;
            const isAdmin = data.systemRole === 'system_admin';
            
            const user = {
              id: doc.id,
              email: data.auth?.email || '',
              phoneNumber: data.phoneNumber || '',
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              auth: true,
              isAdmin,
              identifier
            };
            console.log('Mapped user:', user);
            return user;
          })
          .filter((user): user is NonNullable<typeof user> => {
            console.log('Filtering user:', { user, identifier: user.identifier, seen: seenIdentifiers.has(user.identifier) });
            if (seenIdentifiers.has(user.identifier)) {
              console.log('Filtering out duplicate user:', user);
              return false;
            }
            seenIdentifiers.add(user.identifier);
            return true;
          });

        console.log('Final users list:', usersList);
        setUsers(usersList);
      } catch (err) {
        console.error('Failed to load users:', err);
        setError('Failed to load users. Please try again.');
      }
    };

    loadUsers();
  }, []);

  // Get current organization's members
  const currentOrgMembers = organizationId 
    ? organizations.find(org => org.id === organizationId)?.members || []
    : [];

  // Filter out users who are already members of the selected organization
  const availableUsers = users.filter(user => 
    !currentOrgMembers.some(member => 
      member.id === user.id || 
      (member.email && user.email && member.email === user.email)
    )
  );

  // Filter and sort organizations
  const filteredOrganizations = organizations
    .filter(org => 
      !organizationSearchTerm || 
      org.name.toLowerCase().includes(organizationSearchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  // Group organizations by first letter
  const groupedOrganizations = filteredOrganizations.reduce((acc, org) => {
    const firstLetter = org.name[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(org);
    return acc;
  }, {} as Record<string, typeof organizations>);

  // Filter and sort users
  const filteredUsers = availableUsers
    .filter(user => {
      const searchTerm = memberSearchTerm.toLowerCase();
      return !memberSearchTerm || 
        user.email?.toLowerCase().includes(searchTerm) ||
        user.firstName?.toLowerCase().includes(searchTerm) ||
        user.lastName?.toLowerCase().includes(searchTerm) ||
        user.phoneNumber?.toLowerCase().includes(searchTerm);
    })
    .sort((a, b) => {
      const aName = a.firstName && a.lastName ? `${a.firstName} ${a.lastName}` : a.email || a.id;
      const bName = b.firstName && b.lastName ? `${b.firstName} ${b.lastName}` : b.email || b.id;
      return aName.localeCompare(bName);
    });

  // Group users by first letter
  const groupedUsers = filteredUsers.reduce((acc, user) => {
    const displayName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}`
      : user.email || user.id;
    const firstLetter = displayName[0].toUpperCase();
    if (!acc[firstLetter]) {
      acc[firstLetter] = [];
    }
    acc[firstLetter].push(user);
    return acc;
  }, {} as Record<string, typeof availableUsers>);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmail || !role || !organizationId) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await onAdd(selectedEmail, role, organizationId);
      onClose();
      setSelectedEmail('');
      setRole('member');
      setOrganizationId('');
    } catch (err) {
      console.error('Failed to add member:', err);
      setError('Failed to add member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition.Root show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-6 pb-6 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white mb-4">
                      Add New Member
                    </Dialog.Title>
                    <form onSubmit={handleSubmit} className="mt-4">
                      <div className="space-y-6">
                        <div>
                          <label htmlFor="organization-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Search Organization
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="organization-search"
                              value={organizationSearchTerm}
                              onChange={(e) => setOrganizationSearchTerm(e.target.value)}
                              placeholder="Search organizations..."
                              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2.5"
                            />
                          </div>
                          <select
                            id="organization"
                            value={organizationId}
                            onChange={(e) => setOrganizationId(e.target.value)}
                            className="mt-2 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2.5"
                            required
                          >
                            <option value="">Select an organization</option>
                            {Object.entries(groupedOrganizations).map(([letter, orgs]) => (
                              <optgroup key={letter} label={letter}>
                                {orgs.map((org) => (
                                  <option key={org.id} value={org.id}>
                                    {org.name}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="member-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Search Member
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              id="member-search"
                              value={memberSearchTerm}
                              onChange={(e) => setMemberSearchTerm(e.target.value)}
                              placeholder="Search members..."
                              className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2.5"
                            />
                          </div>
                          <select
                            id="member-select"
                            value={selectedEmail}
                            onChange={(e) => setSelectedEmail(e.target.value)}
                            className="mt-2 block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2.5"
                            required
                          >
                            <option value="">Select a member</option>
                            {Object.entries(groupedUsers).map(([letter, users]) => (
                              <optgroup key={letter} label={letter}>
                                {users.map((user) => (
                                  <option key={user.id} value={user.identifier}>
                                    {user.isAdmin ? (
                                      `${user.email || user.id} (Admin)`
                                    ) : (
                                      user.firstName && user.lastName ? 
                                      `${user.firstName} ${user.lastName}${user.email ? ` (${user.email})` : ''}` : 
                                      user.email || user.id
                                    )}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Role
                          </label>
                          <select
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value as OrgMemberRole)}
                            className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm px-4 py-2.5"
                            required
                          >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="member">Member</option>
                          </select>
                        </div>

                        {error && (
                          <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md px-4 py-2">
                            {error}
                          </div>
                        )}

                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                          <button
                            type="submit"
                            disabled={loading}
                            className="inline-flex w-full justify-center rounded-md bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loading ? 'Adding...' : 'Add Member'}
                          </button>
                          <button
                            type="button"
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white dark:bg-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 sm:mt-0 sm:w-auto"
                            onClick={onClose}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

export function MemberManagement() {
  const [organizations, setOrganizations] = useState<OrganizationWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const { assignMemberToOrganization, isSystemAdmin } = useOrganization();
  const { currentUser } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const loadAllOrganizationsAndMembers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all organizations
        const orgsRef = collection(db, 'organizations');
        const orgsSnapshot = await getDocs(orgsRef);
        console.log('Raw organizations:', orgsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        
        const orgsWithMembers = await Promise.all(
          orgsSnapshot.docs.map(async (orgDoc) => {
            const orgData = orgDoc.data() as Organization;
            console.log('Processing organization:', orgDoc.id, orgData);
            
            // Get members for this organization
            const membersRef = collection(db, 'organizations', orgDoc.id, 'members');
            const membersSnapshot = await getDocs(membersRef);
            console.log('Raw member data:', membersSnapshot.docs.map(doc => ({
              id: doc.id,
              data: doc.data()
            })));
            
            const members = await Promise.all(
              membersSnapshot.docs.map(async (memberDoc) => {
                const userDoc = await getDoc(doc(db, 'users', memberDoc.id));
                const userData = userDoc.data();
                const memberData = memberDoc.data();
                console.log('Processing member:', { id: memberDoc.id, userData, memberData });
                
                // Skip if no user data
                if (!userData) {
                  console.log('Skipping member - no user data:', memberDoc.id);
                  return null;
                }

                // If member data is empty, update it with default values
                if (Object.keys(memberData).length === 0) {
                  const defaultMemberData = {
                    role: 'member' as OrgMemberRole,
                    addedBy: currentUser?.uid,
                    addedAt: new Date(),
                    status: 'active'
                  };
                  
                  // Update the member document with default data
                  await setDoc(doc(db, 'organizations', orgDoc.id, 'members', memberDoc.id), defaultMemberData);
                  
                  // Update user's organizations record
                  await updateDoc(doc(db, 'users', memberDoc.id), {
                    [`organizations.${orgDoc.id}`]: 'member'
                  });

                  return {
                    id: memberDoc.id,
                    firstName: userData.firstName || '',
                    lastName: userData.lastName || '',
                    email: userData.auth?.email || '',
                    phoneNumber: userData.phoneNumber || '',
                    role: 'member',
                    profileImageUrl: userData.profileImageUrl,
                    auth: true,
                  } as Member;
                }

                return {
                  id: memberDoc.id,
                  firstName: userData.firstName || '',
                  lastName: userData.lastName || '',
                  email: userData.auth?.email || '',
                  phoneNumber: userData.phoneNumber || '',
                  role: memberData.role as OrgMemberRole,
                  profileImageUrl: userData.profileImageUrl,
                  auth: true,
                } as Member;
              })
            );

            // Filter out null values
            const validMembers = members.filter((member): member is Member => member !== null);
            console.log('Valid members for org:', orgDoc.id, validMembers);

            return {
              ...orgData,
              id: orgDoc.id,
              members: validMembers,
            };
          })
        );

        console.log('Final organizations with members:', orgsWithMembers);
        setOrganizations(orgsWithMembers);
      } catch (err) {
        console.error('Failed to load organizations and members:', err);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadAllOrganizationsAndMembers();
  }, []);

  const handleRoleChange = async (organizationId: string, memberId: string, newRole: OrgMemberRole) => {
    try {
      await assignMemberToOrganization(memberId, organizationId, newRole);
      setOrganizations(prev => 
        prev.map(org => 
          org.id === organizationId 
            ? {
                ...org,
                members: org.members.map(member =>
                  member.id === memberId ? { ...member, role: newRole } : member
                ),
              }
            : org
        )
      );
    } catch (err) {
      console.error('Failed to update member role:', err);
      setError('Failed to update member role. Please try again.');
    }
  };

  const handleRemoveMember = async (organizationId: string, memberId: string) => {
    try {
      // Delete the member document from the organization's members collection
      await deleteDoc(doc(db, 'organizations', organizationId, 'members', memberId));

      // Update the local state
      setOrganizations(prev => 
        prev.map(org => 
          org.id === organizationId 
            ? {
                ...org,
                members: org.members.filter(member => member.id !== memberId),
              }
            : org
        )
      );
    } catch (err) {
      console.error('Failed to remove member:', err);
      setError('Failed to remove member. Please try again.');
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    const searchLower = searchTerm.toLowerCase();
    return (
      org.name.toLowerCase().includes(searchLower) ||
      org.members.some(
        member =>
          member.email.toLowerCase().includes(searchLower) ||
          member.firstName.toLowerCase().includes(searchLower) ||
          member.lastName.toLowerCase().includes(searchLower)
      )
    );
  });

  const handleAddMember = async (email: string, role: OrgMemberRole, organizationId: string) => {
    try {
      console.log('Adding member with identifier:', email);
      
      // First try to find existing user by email or phone
      const usersRef = collection(db, 'users');
      let querySnapshot;
      
      // Try to find by email in auth.email
      querySnapshot = await getDocs(query(usersRef, where('auth.email', '==', email)));
      
      // If not found, try by phoneNumber
      if (querySnapshot.empty) {
        querySnapshot = await getDocs(query(usersRef, where('phoneNumber', '==', email)));
      }
      
      // If still not found, try by document ID
      if (querySnapshot.empty) {
        querySnapshot = await getDocs(query(usersRef, where('__name__', '==', email)));
      }
      
      if (querySnapshot.empty) {
        console.error('User not found with identifier:', email);
        throw new Error('User not found');
      }

      const userDoc = querySnapshot.docs[0];
      console.log('Found user:', userDoc.id, userDoc.data());

      // Add member to organization with role
      const memberRef = doc(db, 'organizations', organizationId, 'members', userDoc.id);
      const memberData = {
        role,
        addedBy: currentUser?.uid,
        addedAt: new Date(),
        status: 'active'
      };
      await setDoc(memberRef, memberData);

      // Update user's organizations record
      const userRef = doc(db, 'users', userDoc.id);
      await updateDoc(userRef, {
        [`organizations.${organizationId}`]: role
      });

      // Update local state
      setOrganizations(prev => 
        prev.map(org => {
          if (org.id !== organizationId) return org;
          
          const userData = userDoc.data();
          const newMember: Member = {
            id: userDoc.id,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.auth?.email || '',
            phoneNumber: userData.phoneNumber || '',
            role,
            profileImageUrl: userData.profileImageUrl,
            auth: true,
          };
          
          return {
            ...org,
            members: [...org.members, newMember]
          };
        })
      );
    } catch (err) {
      console.error('Failed to add member:', err);
      throw err;
    }
  };

  if (!isSystemAdmin()) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="text-red-600 dark:text-red-400 font-medium">Access denied</div>
          <p className="text-red-500 dark:text-red-300 mt-1">Only system administrators can access this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <AddMemberModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddMember}
        organizations={organizations}
      />
      
      <UserDetailsPopup
        member={selectedMember}
        organizations={organizations}
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
      />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
          <UserGroupIcon className="h-8 w-8 mr-2" />
          Member Management
        </h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search organizations or members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent min-w-[300px]"
            />
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Add Member
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {filteredOrganizations.map(org => (
          <div key={org.id} className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <h2 className="text-xl font-medium text-gray-900 dark:text-white">
                {org.name}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Role
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {org.members.map(member => (
                    <tr 
                      key={member.id} 
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 cursor-pointer"
                      onClick={() => setSelectedMember(member)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                            {member.profileImageUrl ? (
                              <img src={member.profileImageUrl} alt={`${member.firstName} ${member.lastName}`} className="h-full w-full object-cover" />
                            ) : (
                              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                {member.firstName[0]?.toUpperCase() || member.email[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              {member.isAdmin ? (
                                <>
                                  {member.email}
                                  <span className="inline-flex items-center rounded-md bg-purple-50 dark:bg-purple-900/20 px-2 py-1 text-xs font-medium text-purple-700 dark:text-purple-300">
                                    Admin
                                  </span>
                                </>
                              ) : (
                                <>
                                  {member.firstName} {member.lastName}
                                  {member.phoneNumber && (
                                    <span className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/20 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                                      Phone User
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {member.phoneNumber || member.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <select
                          value={member.role}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleRoleChange(org.id, member.id, e.target.value as OrgMemberRole);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          disabled={member.id === currentUser?.uid}
                          className="block w-full rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:border-primary-500 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed px-3 py-2"
                        >
                          <option value="owner" className="py-2">Owner</option>
                          <option value="admin" className="py-2">Admin</option>
                          <option value="member" className="py-2">Member</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {member.id !== currentUser?.uid && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMember(org.id, member.id);
                            }}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                          >
                            Remove Access
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 