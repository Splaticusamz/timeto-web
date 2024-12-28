export type SystemRole = 'system_admin' | 'user';
export type OrgMemberRole = 'owner' | 'admin' | 'member';
export type OrganizationType = 'school' | 'business' | 'other';
export type LocationType = 'fixed' | 'multiple' | 'virtual' | 'tbd';

export interface Location {
  type: LocationType;
  address?: string;
  virtualLink?: string;
  multiple?: string[];
}

export interface OperatingHours {
  monday?: { open: string; close: string };
  tuesday?: { open: string; close: string };
  wednesday?: { open: string; close: string };
  thursday?: { open: string; close: string };
  friday?: { open: string; close: string };
  saturday?: { open: string; close: string };
  sunday?: { open: string; close: string };
}

export interface UserRoles {
  systemRole: SystemRole;
  organizations: Record<string, OrgMemberRole>; // orgId -> role mapping
}

export interface Organization {
  id: string;
  name: string;
  nameLower: string;
  type: OrganizationType;
  description?: string;
  logo?: string;
  location: Location;
  operatingHours?: OperatingHours;
  contactInfo: {
    email: string;
    phone?: string;
    website?: string;
  };
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
  description: string;
  parentOrgId?: string;
  type?: string;
  location?: string;
  contactInfo?: string;
  settings: {
    allowPublicEvents: boolean;
    requireMemberApproval: boolean;
    defaultEventVisibility: 'public' | 'organization' | 'private';
    allowSubOrganizations: boolean;
    maxSubOrganizations: number;
  };
} 