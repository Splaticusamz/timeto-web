import { UserIcon } from '@heroicons/react/24/outline';

interface Lead {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  status: string;
  referalOrgs: string[];
  convertedTo?: string;
  photoUrl?: string;
  convertedName?: string;
}

interface ConvertedMembersListProps {
  members: Lead[];
}

export function ConvertedMembersList({ members }: ConvertedMembersListProps) {
  if (members.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
        No converted members yet.
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-28rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
      <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
        {members.map((member) => (
          <li key={member.id} className="px-4 py-4 sm:px-6">
            <div className="flex items-center">
              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                {member.photoUrl ? (
                  <img src={member.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <UserIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <div className="ml-4">
                <div className="font-medium text-gray-900 dark:text-white">
                  {member.firstName} {member.lastName}
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <UserIcon className="mr-1.5 h-4 w-4 flex-shrink-0" />
                  {member.convertedName || `${member.firstName} ${member.lastName}`.trim()}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
} 