export type SystemRole = 'system_admin' | 'user';
export type OrgMemberRole = 'owner' | 'admin' | 'member';

export interface UserRoles {
  systemRole: SystemRole;
  organizations: Record<string, OrgMemberRole>; // orgId -> role mapping
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  parentOrgId?: string; // For sub-organizations
  members: Record<string, OrgMemberRole>;
  settings: {
    allowPublicEvents: boolean;
    requireMemberApproval: boolean;
    defaultEventVisibility: 'public' | 'organization' | 'private';
    allowSubOrganizations: boolean; // Whether this org can have sub-orgs
    maxSubOrganizations?: number; // Limit on number of sub-orgs
  };
}

export interface CreateOrganizationData {
  name: string;
  description?: string;
  logo?: string;
  parentOrgId?: string;
  settings: {
    allowPublicEvents: boolean;
    requireMemberApproval: boolean;
    defaultEventVisibility: 'public' | 'organization' | 'private';
    allowSubOrganizations: boolean;
    maxSubOrganizations?: number;
  };
} 