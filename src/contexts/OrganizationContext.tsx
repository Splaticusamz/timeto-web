import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, Timestamp, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Organization, CreateOrganizationData, OrgMemberRole, UserRoles, Member } from '../types/organization';
import { useNavigate } from 'react-router-dom';
import debounce from 'lodash/debounce';

interface OrganizationWithEventCount extends Organization {
  eventCount: number;
}

interface OrganizationContextType {
  currentOrganization: OrganizationWithEventCount | null;
  userOrganizations: OrganizationWithEventCount[];
  loading: boolean;
  error: string | null;
  userRoles: UserRoles | null;
  createOrganization: (data: CreateOrganizationData) => Promise<OrganizationWithEventCount>;
  updateOrganization: (id: string, data: Partial<Organization>) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  switchOrganization: (id: string) => Promise<void>;
  getCurrentUserRole: () => OrgMemberRole | null;
  isSystemAdmin: () => boolean;
  canCreateOrganization: () => boolean;
  canCreateSubOrganization: (parentOrgId: string) => boolean;
  assignMemberToOrganization: (userId: string, organizationId: string, role: OrgMemberRole) => Promise<void>;
  loadOrganizationMembers: (organizationId: string) => Promise<Member[]>;
  removeMemberFromOrganization: (userId: string, organizationId: string) => Promise<void>;
  refreshOrganization: (orgId: string) => Promise<OrganizationWithEventCount | null>;
}

const OrganizationContext = createContext<OrganizationContextType | null>(null);

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider = ({ children }: { children: ReactNode }) => {
  const [currentOrganization, setCurrentOrganization] = useState<OrganizationWithEventCount | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<OrganizationWithEventCount[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [skipNextLoad, setSkipNextLoad] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Load user roles
  useEffect(() => {
    if (!currentUser) {
      setUserRoles(null);
      setLoading(false);
      return;
    }

    const loadUserRoles = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserRoles(userDoc.data() as UserRoles);
        } else {
          // Initialize new user with default roles
          const defaultRoles: UserRoles = {
            systemRole: 'user',
            organizations: {},
          };
          await setDoc(doc(db, 'users', currentUser.uid), defaultRoles);
          setUserRoles(defaultRoles);
        }
      } catch (err) {
        console.error('Failed to load user roles:', err);
        setError('Failed to load user roles. Please try again.');
      }
    };

    loadUserRoles();
  }, [currentUser]);

  const loadEventCounts = async (organizations: Organization[]): Promise<OrganizationWithEventCount[]> => {
    try {
      const orgsWithCounts = await Promise.all(
        organizations.map(async (org) => {
          try {
            const eventsQuery = query(
              collection(db, 'events'),
              where('organizationId', '==', org.id)
            );
            const eventsSnapshot = await getDocs(eventsQuery);
            
            return {
              ...org,
              eventCount: eventsSnapshot.size,
            };
          } catch (err) {
            console.error(`Failed to load events for organization ${org.id}:`, err);
            return {
              ...org,
              eventCount: 0,
            };
          }
        })
      );
      return orgsWithCounts;
    } catch (err) {
      console.error('Failed to load event counts:', err);
      return organizations.map(org => ({ ...org, eventCount: 0 }));
    }
  };

  // Load organizations and restore selected organization
  useEffect(() => {
    if (!currentUser || !userRoles) {
      setCurrentOrganization(null);
      setUserOrganizations([]);
      setLoading(false);
      return;
    }

    // Skip this load if we just created an organization
    if (skipNextLoad) {
      setSkipNextLoad(false);
      return;
    }

    const loadUserOrganizations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get the last selected organization ID from localStorage
        const lastSelectedOrgId = localStorage.getItem(`lastOrg_${currentUser.uid}`);

        let querySnapshot;
        if (userRoles?.systemRole === 'system_admin') {
          querySnapshot = await getDocs(collection(db, 'organizations'));
        } else {
          const orgsQuery = query(
            collection(db, 'organizations'),
            where(`members.${currentUser.uid}`, '!=', null)
          );
          querySnapshot = await getDocs(orgsQuery);
        }

        const orgs: Organization[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          orgs.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || new Date(),
          } as Organization);
        });

        const orgsWithCounts = await loadEventCounts(orgs);
        setUserOrganizations(orgsWithCounts);

        // If we have a lastSelectedOrgId and it exists in the loaded organizations
        if (lastSelectedOrgId) {
          const lastOrg = orgsWithCounts.find(org => org.id === lastSelectedOrgId);
          if (lastOrg) {
            setCurrentOrganization(lastOrg);
            return; // Exit early if we found and set the last organization
          }
        }

        // Only set to first org if we don't have a current organization
        if (!currentOrganization && orgsWithCounts.length > 0) {
          setCurrentOrganization(orgsWithCounts[0]);
        }
      } catch (err) {
        console.error('[DEBUG] Failed to load organizations:', err);
        setError('Failed to load organizations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadUserOrganizations();
  }, [currentUser, userRoles, skipNextLoad]);

  const createOrganization = async (data: CreateOrganizationData): Promise<OrganizationWithEventCount> => {
    console.log('[DEBUG] Starting organization creation:', {
      data,
      currentUser: currentUser?.uid,
      hasUserRoles: !!userRoles
    });

    if (!currentUser || !userRoles) throw new Error('User must be authenticated');
    if (isCreating) throw new Error('Organization creation already in progress');

    try {
      setIsCreating(true);
      const orgRef = doc(collection(db, 'organizations'));
      const now = Timestamp.now();

      const newOrg = {
        ...data,
        type: data.type || 'business',
        createdAt: now,
        updatedAt: now,
        ownerId: currentUser.uid,
        nameLower: data.name.toLowerCase(),
        members: {
          [currentUser.uid]: 'owner' as const,
        },
      };

      console.log('[DEBUG] About to write organization:', {
        orgId: orgRef.id,
        data: newOrg
      });

      try {
        await setDoc(orgRef, newOrg);
        console.log('[DEBUG] Organization written successfully');
      } catch (writeError) {
        console.error('[DEBUG] Failed to write organization:', writeError);
        throw writeError;
      }

      // Verify the write
      const verifyDoc = await getDoc(orgRef);
      console.log('[DEBUG] Verification check:', {
        exists: verifyDoc.exists(),
        data: verifyDoc.exists() ? verifyDoc.data() : null
      });

      const createdOrg = {
        id: orgRef.id,
        ...newOrg,
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
        eventCount: 0,
      } as OrganizationWithEventCount;

      // Set skip flag before updating userRoles
      setSkipNextLoad(true);
      
      // Update user roles
      const updatedRoles = {
        ...userRoles,
        organizations: {
          ...userRoles.organizations,
          [createdOrg.id]: 'owner' as const,
        },
      };
      
      await updateDoc(doc(db, 'users', currentUser.uid), updatedRoles);
      
      // Update local state
      setUserRoles(updatedRoles);
      setUserOrganizations(prev => {
        const updated = [...prev, createdOrg];
        return updated;
      });
      
      // Set as current organization
      setCurrentOrganization(createdOrg);
      
      // Store in localStorage
      localStorage.setItem(`lastOrg_${currentUser.uid}`, createdOrg.id);
      
      // Final verification
      const finalCheck = await getDoc(orgRef);
      console.log('[DEBUG] Final verification:', {
        exists: finalCheck.exists(),
        data: finalCheck.exists() ? JSON.stringify(finalCheck.data(), null, 2) : null,
        stateUpdated: {
          userRoles: Boolean(updatedRoles),
          currentOrg: Boolean(createdOrg),
          organizationsList: true
        }
      });

      return createdOrg;
    } catch (err) {
      setSkipNextLoad(false); // Reset skip flag on error
      console.error('[DEBUG] Creation failed:', err);
      throw err instanceof Error ? err : new Error('Failed to create organization');
    } finally {
      // Add a small delay before allowing another creation
      setTimeout(() => setIsCreating(false), 1000);
    }
  };

  const updateOrganization = async (id: string, data: Partial<Organization>) => {
    if (!currentUser || !userRoles) throw new Error('User must be authenticated');
    
    if (!isSystemAdmin() && (!userRoles.organizations[id] || !['owner', 'admin'].includes(userRoles.organizations[id]))) {
      throw new Error('You do not have permission to update this organization');
    }

    try {
      setError(null);
      const orgRef = doc(db, 'organizations', id);
      const now = Timestamp.now();

      // Get current data first
      const orgDoc = await getDoc(orgRef);
      if (!orgDoc.exists()) {
        throw new Error('Organization not found');
      }

      // Deep merge the updates
      const currentData = orgDoc.data();
      const updateData = {
        ...currentData,
        ...JSON.parse(JSON.stringify(data)), // Deep clone to avoid reference issues
        updatedAt: now,
        ...(data.name ? { nameLower: data.name.toLowerCase() } : {}),
      };

      // Update in Firestore
      await updateDoc(orgRef, updateData);

      // Update local state with properly merged data
      const updatedOrg = {
        id,
        ...updateData,
        updatedAt: now.toDate(),
      } as Organization;

      setCurrentOrganization(updatedOrg);
      setUserOrganizations((prev) =>
        prev.map((org) => (org.id === id ? updatedOrg : org))
      );

    } catch (err) {
      console.error('Failed to update organization:', err);
      throw new Error('Failed to update organization. Please try again.');
    }
  };

  const deleteOrganization = async (id: string) => {
    if (!currentUser || !userRoles) throw new Error('User must be authenticated');
    
    // Check if user can delete organization
    if (!isSystemAdmin() && (!userRoles.organizations[id] || !['owner'].includes(userRoles.organizations[id]))) {
      throw new Error('You do not have permission to delete this organization');
    }

    try {
      setError(null);
      const orgRef = doc(db, 'organizations', id);
      await deleteDoc(orgRef);

      // Update user roles
      if (userRoles.organizations[id]) {
        const updatedRoles = {
          ...userRoles,
          organizations: { ...userRoles.organizations },
        };
        delete updatedRoles.organizations[id];
        await updateDoc(doc(db, 'users', currentUser.uid), updatedRoles);
        setUserRoles(updatedRoles);
      }

      // Update state
      setUserOrganizations((prev) => prev.filter((org) => org.id !== id));
      if (currentOrganization?.id === id) {
        const remainingOrgs = userOrganizations.filter((org) => org.id !== id);
        setCurrentOrganization(remainingOrgs.length > 0 ? remainingOrgs[0] : null);
      }
    } catch (err) {
      console.error('Failed to delete organization:', err);
      throw new Error('Failed to delete organization. Please try again.');
    }
  };

  const saveOrgToLocalStorage = (org: OrganizationWithEventCount) => {
    try {
      // Convert dates to ISO strings before saving
      const orgToSave = {
        ...org,
        createdAt: org.createdAt instanceof Date ? org.createdAt.toISOString() : org.createdAt,
        updatedAt: org.updatedAt instanceof Date ? org.updatedAt.toISOString() : org.updatedAt
      };
      localStorage.setItem(`currentOrg_${currentUser?.uid}`, JSON.stringify(orgToSave));
    } catch (err) {
      console.error('Failed to save org to localStorage:', err);
    }
  };

  const switchOrganization = useCallback(async (id: string): Promise<void> => {
    if (!currentUser) return;

    try {
      const orgRef = doc(db, 'organizations', id);
      const orgDoc = await getDoc(orgRef);
      
      if (!orgDoc.exists()) {
        throw new Error('Organization not found');
      }

      const orgData = orgDoc.data();
      const org = {
        id: orgDoc.id,
        ...orgData,
        createdAt: orgData.createdAt?.toDate?.() || orgData.createdAt || new Date(),
        updatedAt: orgData.updatedAt?.toDate?.() || orgData.updatedAt || new Date(),
        eventCount: 0
      } as OrganizationWithEventCount;

      setCurrentOrganization(org);
      localStorage.setItem(`lastOrg_${currentUser.uid}`, id);
      saveOrgToLocalStorage(org);
    } catch (err) {
      console.error('Failed to switch organization:', err);
      throw err;
    }
  }, [currentUser, db]);

  useEffect(() => {
    if (!currentUser || !userOrganizations.length) return;

    const loadInitialOrg = async () => {
      try {
        // Try to get org from localStorage first
        const savedOrgData = localStorage.getItem(`currentOrg_${currentUser.uid}`);
        if (savedOrgData) {
          const parsedOrg = JSON.parse(savedOrgData);
          // Convert ISO strings back to dates
          const savedOrg = {
            ...parsedOrg,
            createdAt: parsedOrg.createdAt ? new Date(parsedOrg.createdAt) : null,
            updatedAt: parsedOrg.updatedAt ? new Date(parsedOrg.updatedAt) : null
          };
          setCurrentOrganization(savedOrg);
          return;
        }

        // Fall back to lastOrg_id if no saved org data
        const lastOrgId = localStorage.getItem(`lastOrg_${currentUser.uid}`);
        if (lastOrgId) {
          await switchOrganization(lastOrgId);
        } else if (userOrganizations.length > 0) {
          await switchOrganization(userOrganizations[0].id);
        }
      } catch (err) {
        console.error('Failed to load initial organization:', err);
      }
    };

    loadInitialOrg();
  }, [currentUser, userOrganizations, switchOrganization]);

  const getCurrentUserRole = (): OrgMemberRole | null => {
    if (!currentUser || !currentOrganization || !userRoles) return null;
    return userRoles.organizations[currentOrganization.id] || null;
  };

  const isSystemAdmin = useCallback(() => {
    return currentUser?.systemRole === 'system_admin';
  }, [currentUser]);

  const canCreateOrganization = (): boolean => {
    const result = isSystemAdmin() || (userRoles?.systemRole === 'user' || false);
    return result;
  };

  const canCreateSubOrganization = (parentOrgId: string): boolean => {
    const result = isSystemAdmin() || (userRoles?.organizations[parentOrgId] && ['owner', 'admin'].includes(userRoles.organizations[parentOrgId]));
    return result;
  };

  const assignMemberToOrganization = async (
    userId: string, 
    organizationId: string, 
    role: OrgMemberRole
  ) => {
    const memberRef = doc(db, 'organizations', organizationId, 'members', userId);
    await setDoc(memberRef, {
      role,
      addedBy: currentUser.uid,
      addedAt: serverTimestamp(),
      status: 'active'
    });
    
    // Update user's organizations record
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      [`organizations.${organizationId}`]: role
    });
  };

  const loadOrganizationMembers = async (organizationId: string): Promise<Member[]> => {
    if (!currentUser) throw new Error('User must be authenticated');

    try {
      const membersRef = collection(db, 'organizations', organizationId, 'members');
      const membersSnapshot = await getDocs(membersRef);
      
      const memberPromises = membersSnapshot.docs.map(async (memberDoc) => {
        const userRef = doc(db, 'users', memberDoc.id);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        return {
          id: memberDoc.id,
          firstName: userData?.firstName || '',
          lastName: userData?.lastName || '',
          email: userData?.email || '',
          role: memberDoc.data().role as OrgMemberRole,
          photoUrl: userData?.profileImageUrl || '',
        };
      });

      return await Promise.all(memberPromises);
    } catch (err) {
      console.error('Failed to load organization members:', err);
      throw new Error('Failed to load organization members');
    }
  };

  const removeMemberFromOrganization = async (userId: string, organizationId: string) => {
    if (!currentUser) throw new Error('User must be authenticated');
    
    try {
      // Remove from organization members
      await deleteDoc(doc(db, 'organizations', organizationId, 'members', userId));
      
      // Remove from user's organizations
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const updatedOrgs = { ...userData.organizations };
        delete updatedOrgs[organizationId];
        await updateDoc(userRef, { organizations: updatedOrgs });
      }
    } catch (err) {
      console.error('Failed to remove member:', err);
      throw new Error('Failed to remove member from organization');
    }
  };

  const refreshOrganization = async (orgId: string) => {
    const orgDoc = await getDoc(doc(db, 'organizations', orgId));
    if (orgDoc.exists()) {
      const refreshedOrg = { id: orgDoc.id, ...orgDoc.data() } as OrganizationWithEventCount;
      setCurrentOrganization(refreshedOrg);
      return refreshedOrg;
    }
    return null;
  };

  const value = {
    currentOrganization,
    userOrganizations,
    loading,
    error,
    userRoles,
    createOrganization,
    updateOrganization,
    deleteOrganization,
    switchOrganization,
    getCurrentUserRole,
    isSystemAdmin,
    canCreateOrganization,
    canCreateSubOrganization,
    assignMemberToOrganization,
    loadOrganizationMembers,
    removeMemberFromOrganization,
    refreshOrganization
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}; 