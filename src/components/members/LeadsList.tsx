import { UserIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { SlideAction } from '../common/SlideAction';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useOrganization } from '../../contexts/OrganizationContext';

interface Lead {
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
}

interface LeadsListProps {
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
}

export function LeadsList({ leads, setLeads }: LeadsListProps) {
  const { currentOrganization } = useOrganization();

  const handleDelete = async (leadId: string) => {
    if (!currentOrganization?.id) {
      console.error('No organization ID found');
      return;
    }

    if (!leadId) {
      console.error('No lead ID provided');
      return;
    }

    try {
      console.log('Deleting lead with path:', {
        orgId: currentOrganization.id,
        leadId,
        fullPath: `organizations/${currentOrganization.id}/leads/${leadId}`
      });

      const leadRef = doc(db, 'organizations', currentOrganization.id, 'leads', leadId);
      await deleteDoc(leadRef);
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
    } catch (error) {
      console.error('Failed to delete lead:', error, {
        orgId: currentOrganization.id,
        leadId,
        fullPath: `organizations/${currentOrganization.id}/leads/${leadId}`
      });
    }
  };

  if (leads.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
        No leads yet. Add some leads to get started.
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-28rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
      <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
        {leads.map((lead) => {
          if (!lead.id) {
            console.warn('Lead missing ID:', lead);
            return null;
          }
          
          return (
            <li key={lead.id} className="px-4 py-4 sm:px-6 cursor-pointer rounded-lg">
              <SlideAction onDelete={() => handleDelete(lead.id)}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {lead.firstName} {lead.lastName}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <PhoneIcon className="mr-1.5 h-4 w-4 flex-shrink-0" />
                      {lead.phoneNumber}
                    </div>
                    <div className="mt-1">
                      {lead.addedBy ? `by ${lead.addedBy}` : ''}
                    </div>
                  </div>
                </div>
              </SlideAction>
            </li>
          );
        })}
      </ul>
    </div>
  );
} 