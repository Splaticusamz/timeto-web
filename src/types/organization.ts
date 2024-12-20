export interface Organization {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  members: {
    [userId: string]: OrgMemberRole;
  };
  settings: {
    allowPublicEvents: boolean;
    requireMemberApproval: boolean;
    defaultEventVisibility: 'public' | 'organization' | 'private';
  };
}

export type OrgMemberRole = 'owner' | 'admin' | 'member';

export interface CreateOrganizationData {
  name: string;
  description?: string;
  logo?: string;
  settings?: Partial<Organization['settings']>;
} 