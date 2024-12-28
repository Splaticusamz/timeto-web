import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, Timestamp, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { Organization, CreateOrganizationData, OrgMemberRole, UserRoles } from '../types/organization';
import { useNavigate } from 'react-router-dom';

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

    const loadUserOrganizations = async () => {
      try {
        setLoading(true);
        setError(null);

        let querySnapshot;
        if (userRoles?.systemRole === 'system_admin') {
          // System admin sees all organizations
          querySnapshot = await getDocs(collection(db, 'organizations'));
        } else {
          // Regular users only see their organizations
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
        
        // Try to restore the last selected organization from localStorage
        const lastSelectedOrgId = localStorage.getItem(`lastOrg_${currentUser.uid}`);
        const lastPath = localStorage.getItem(`lastPath_${currentUser.uid}`);
        
        if (lastSelectedOrgId) {
          const lastOrg = orgsWithCounts.find(org => org.id === lastSelectedOrgId);
          if (lastOrg) {
            setCurrentOrganization(lastOrg);
            // Use React Router navigation instead of window.location
            if (lastPath && window.location.pathname === '/') {
              navigate(lastPath);
            }
            return;
          }
        }
        
        // If no stored organization or it's not found, default to the first one
        if (orgsWithCounts.length > 0) {
          setCurrentOrganization(orgsWithCounts[0]);
        }
      } catch (err) {
        console.error('Failed to load organizations:', err);
        setError('Failed to load organizations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      loadUserOrganizations();
    }
  }, [currentUser, navigate]);

  const createOrganization = async (data: CreateOrganizationData): Promise<OrganizationWithEventCount> => {
    if (!currentUser || !userRoles) throw new Error('User must be authenticated');

    // Check if user can create organization
    if (data.parentOrgId && !canCreateSubOrganization(data.parentOrgId)) {
      throw new Error('You do not have permission to create sub-organizations');
    }

    if (!data.parentOrgId && !canCreateOrganization()) {
      throw new Error('You do not have permission to create organizations');
    }

    try {
      setError(null);
      const orgRef = doc(collection(db, 'organizations'));
      const now = Timestamp.now();
      const newOrg = {
        ...data,
        createdAt: now,
        updatedAt: now,
        ownerId: currentUser.uid,
        nameLower: data.name.toLowerCase(),
        members: {
          [currentUser.uid]: 'owner' as const,
        },
      };

      await setDoc(orgRef, newOrg);
      const createdOrg = {
        id: orgRef.id,
        ...newOrg,
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
        eventCount: 0,
      } as OrganizationWithEventCount;

      // Update user roles
      const updatedRoles = {
        ...userRoles,
        organizations: {
          ...userRoles.organizations,
          [createdOrg.id]: 'owner' as const,
        },
      };
      await updateDoc(doc(db, 'users', currentUser.uid), updatedRoles);
      setUserRoles(updatedRoles);

      setUserOrganizations((prev) => [...prev, createdOrg]);
      setCurrentOrganization(createdOrg);
      return createdOrg;
    } catch (err) {
      console.error('Failed to create organization:', err);
      throw new Error('Failed to create organization. Please try again.');
    }
  };

  const updateOrganization = async (id: string, data: Partial<Organization>) => {
    if (!currentUser || !userRoles) throw new Error('User must be authenticated');
    
    // Check if user can update organization
    if (!isSystemAdmin() && (!userRoles.organizations[id] || !['owner', 'admin'].includes(userRoles.organizations[id]))) {
      throw new Error('You do not have permission to update this organization');
    }

    try {
      setError(null);
      const orgRef = doc(db, 'organizations', id);
      const now = Timestamp.now();
      await updateDoc(orgRef, {
        ...data,
        updatedAt: now,
        ...(data.name ? { nameLower: data.name.toLowerCase() } : {}),
      });

      const updatedOrg = {
        ...currentOrganization,
        ...data,
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

  const switchOrganization = async (id: string) => {
    if (!currentUser || !userRoles) throw new Error('User must be authenticated');

    try {
      setError(null);
      const org = userOrganizations.find((o) => o.id === id);
      
      if (!org) {
        const orgRef = doc(db, 'organizations', id);
        const orgDoc = await getDoc(orgRef);
        if (!orgDoc.exists()) throw new Error('Organization not found');

        if (!isSystemAdmin() && !userRoles.organizations[id]) {
          throw new Error('You do not have access to this organization');
        }

        const data = orgDoc.data();
        const newOrg = {
          id: orgDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as OrganizationWithEventCount;
        
        // Store the selected organization ID in localStorage
        localStorage.setItem(`lastOrg_${currentUser.uid}`, newOrg.id);
        localStorage.setItem(`lastPath_${currentUser.uid}`, window.location.pathname);
        setCurrentOrganization(newOrg);
      } else {
        // Store the selected organization ID in localStorage
        localStorage.setItem(`lastOrg_${currentUser.uid}`, org.id);
        localStorage.setItem(`lastPath_${currentUser.uid}`, window.location.pathname);
        setCurrentOrganization(org);
      }
    } catch (err) {
      console.error('Failed to switch organization:', err);
      throw new Error('Failed to switch organization. Please try again.');
    }
  };

  const getCurrentUserRole = (): OrgMemberRole | null => {
    if (!currentUser || !currentOrganization || !userRoles) return null;
    return userRoles.organizations[currentOrganization.id] || null;
  };

  const isSystemAdmin = (): boolean => {
    return userRoles?.systemRole === 'system_admin' || false;
  };

  const canCreateOrganization = (): boolean => {
    return isSystemAdmin() || (userRoles?.systemRole === 'user' || false);
  };

  const canCreateSubOrganization = (parentOrgId: string): boolean => {
    if (isSystemAdmin()) return true;
    const parentOrg = userOrganizations.find(org => org.id === parentOrgId);
    if (!parentOrg || !userRoles) return false;
    
    const userRole = userRoles.organizations[parentOrgId];
    return Boolean(
      parentOrg.settings.allowSubOrganizations &&
      userRole && ['owner', 'admin'].includes(userRole)
    );
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
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}; 