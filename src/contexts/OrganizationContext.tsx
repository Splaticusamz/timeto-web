import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { collection, doc, getDoc, setDoc, updateDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Organization, CreateOrganizationData, OrgMemberRole } from '../types/organization';

interface OrganizationContextType {
  currentOrganization: Organization | null;
  userOrganizations: Organization[];
  loading: boolean;
  error: string | null;
  createOrganization: (data: CreateOrganizationData) => Promise<Organization>;
  updateOrganization: (id: string, data: Partial<Organization>) => Promise<void>;
  switchOrganization: (id: string) => Promise<void>;
  getCurrentUserRole: () => OrgMemberRole | null;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setCurrentOrganization(null);
      setUserOrganizations([]);
      setLoading(false);
      return;
    }

    const loadUserOrganizations = async () => {
      try {
        setLoading(true);
        const q = query(
          collection(db, 'organizations'),
          where(`members.${currentUser.uid}`, 'in', ['owner', 'admin', 'member'])
        );
        const querySnapshot = await getDocs(q);
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
        
        // Set current organization to the first one if none is selected
        if (!currentOrganization && orgs.length > 0) {
          setCurrentOrganization(orgs[0]);
        }
      } catch (err) {
        setError('Failed to load organizations');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadUserOrganizations();
  }, [currentUser]);

  const createOrganization = async (data: CreateOrganizationData): Promise<Organization> => {
    if (!currentUser) throw new Error('User must be authenticated');

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
      settings: {
        allowPublicEvents: false,
        requireMemberApproval: true,
        defaultEventVisibility: 'organization' as const,
        ...data.settings,
      },
    };

    await setDoc(orgRef, newOrg);
    const createdOrg = {
      id: orgRef.id,
      ...newOrg,
      createdAt: now.toDate(),
      updatedAt: now.toDate(),
    } as Organization;

    setUserOrganizations((prev) => [...prev, createdOrg]);
    setCurrentOrganization(createdOrg);
    return createdOrg;
  };

  const updateOrganization = async (id: string, data: Partial<Organization>) => {
    if (!currentUser) throw new Error('User must be authenticated');
    
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
  };

  const switchOrganization = async (id: string) => {
    const org = userOrganizations.find((o) => o.id === id);
    if (!org) {
      const orgRef = doc(db, 'organizations', id);
      const orgDoc = await getDoc(orgRef);
      if (!orgDoc.exists()) throw new Error('Organization not found');
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
  };

  const getCurrentUserRole = (): OrgMemberRole | null => {
    if (!currentUser || !currentOrganization) return null;
    return currentOrganization.members[currentUser.uid] || null;
  };

  const value = {
    currentOrganization,
    userOrganizations,
    loading,
    error,
    createOrganization,
    updateOrganization,
    switchOrganization,
    getCurrentUserRole,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}; 