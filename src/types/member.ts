export type MemberStatus = 'pending' | 'transformed' | 'invited' | 'accepted' | 'declined' | 'maybe';
export type MemberType = 'lead' | 'member';

export interface Member {
  id: string;
  type: MemberType;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  status: MemberStatus;
  organizations: string[];
  photoUrl?: string;
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