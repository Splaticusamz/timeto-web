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

export interface CreateOrganizationData {
  name: string;
  description: string;
  type: string;
  location: string;
  contactInfo: Record<string, string>;
  settings: Record<string, any>;
  logoImage?: string;
  previewImage?: string;
  fullImage?: string;
}

export interface Organization extends CreateOrganizationData {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  nameLower: string;
  members: Record<string, OrgMemberRole>;
}

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: OrgMemberRole;
} 