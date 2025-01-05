export type MemberStatus = 'pending' | 'transformed' | 'invited' | 'accepted' | 'declined' | 'maybe';
export type MemberType = 'lead' | 'member';

export interface Member {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  status: 'active' | 'pending';
  joinedAt: Date;
  photoUrl?: string;  // Can come from either profileImageUrl or photoUrl
}

// Add new types to handle the different collections
export interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  status: string;
  referalOrgs: string[];
  convertedTo?: string;
  createdAt: Date;
  addedBy?: string;
  photoUrl?: string;  // Can come from either profileImageUrl or photoUrl
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