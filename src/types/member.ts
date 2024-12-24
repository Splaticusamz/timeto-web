export type MemberStatus = 'pending' | 'transformed' | 'invited';
export type MemberType = 'lead' | 'member';

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  status: MemberStatus;
  type: MemberType;
  photoUrl?: string;
  organizations: string[];
}

// Add new types to handle the different collections
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  status: 'pending'; // Leads are always pending
  organizations: string[];
  photoUrl?: string;
}

export interface RegisteredMember {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  status: 'transformed';
  organizations: string[];
  photoUrl?: string;
} 