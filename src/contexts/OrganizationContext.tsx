import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Organization, CreateOrganizationData, OrgMemberRole, UserRoles } from '../types/organization';

interface OrganizationContextType {
  currentOrganization: Organization | null;
  userOrganizations: Organization[];
  loading: boolean;
  error: string | null;
  userRoles: UserRoles | null;
  createOrganization: (data: CreateOrganizationData) => Promise<Organization>;
  updateOrganization: (id: string, data: Partial<Organization>) => Promise<void>;
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
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [userOrganizations, setUserOrganizations] = useState<Organization[]>([]);
  const [userRoles, setUserRoles] = useState<UserRoles | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

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

  // Load organizations
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

        let orgsQuery;
        if (userRoles.systemRole === 'system_admin') {
          // System admins can see all organizations
          orgsQuery = query(collection(db, 'organizations'));
        } else {
          // Regular users can only see organizations they're members of
          orgsQuery = query(
            collection(db, 'organizations'),
            where(`members.${currentUser.uid}`, 'in', ['owner', 'admin', 'member'])
          );
        }

        const querySnapshot = await getDocs(orgsQuery);
        const orgs: Organization[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          orgs.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Organization);
        });
        setUserOrganizations(orgs);
        
        if (!currentOrganization && orgs.length > 0) {
          setCurrentOrganization(orgs[0]);
        }
      } catch (err) {
        console.error('Failed to load organizations:', err);
        setError('Failed to load organizations. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadUserOrganizations();
  }, [currentUser, userRoles]);

  const createOrganization = async (data: CreateOrganizationData): Promise<Organization> => {
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
      } as Organization;

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

  const switchOrganization = async (id: string) => {
    if (!currentUser || !userRoles) throw new Error('User must be authenticated');

    try {
      setError(null);
      const org = userOrganizations.find((o) => o.id === id);
      if (!org) {
        const orgRef = doc(db, 'organizations', id);
        const orgDoc = await getDoc(orgRef);
        if (!orgDoc.exists()) throw new Error('Organization not found');

        // Check if user has access to this organization
        if (!isSystemAdmin() && !userRoles.organizations[id]) {
          throw new Error('You do not have access to this organization');
        }

        const data = orgDoc.data();
        const org = {
          id: orgDoc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Organization;
        setCurrentOrganization(org);
      } else {
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