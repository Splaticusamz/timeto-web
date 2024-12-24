import { Member, MemberStatus } from '../../types/member';

interface MemberTableProps {
  members: Member[];
  showStatus?: boolean;
  startIndex?: number;
}

function StatusBadge({ status }: { status: MemberStatus }) {
  const colors: Record<MemberStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    transformed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    invited: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
  };

  const labels: Record<MemberStatus, string> = {
    pending: 'Pending',
    transformed: 'Transformed',
    invited: 'Invited'
  };

  return (
    <span className={`px-2 py-1 text-xs rounded-full ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}

export function MemberTable({ 
  members, 
  showStatus = true, 
  startIndex = 0 
}: MemberTableProps) {
  return (
    <table className="w-full">
      <thead>
        <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <th className="w-8 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
            #
          </th>
          <th className="w-12"></th>
          <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
            First Name
          </th>
          <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
            Last Name
          </th>
          <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
            Phone Number
          </th>
          {showStatus && (
            <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
              Status
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {members.map((member, index) => (
          <tr key={member.id}>
            <td className="py-2 text-sm px-4 text-gray-500 dark:text-gray-400">
              {startIndex + index + 1}
            </td>
            <td className="py-2">
              {member.photoUrl ? (
                <img 
                  src={member.photoUrl} 
                  alt={`${member.firstName} ${member.lastName}`}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {member.firstName[0]}
                  </span>
                </div>
              )}
            </td>
            <td className="py-2 text-sm px-4 text-gray-900 dark:text-white">
              {member.firstName}
            </td>
            <td className="py-2 text-sm px-4 text-gray-900 dark:text-white">
              {member.lastName}
            </td>
            <td className="py-2 text-sm px-4 text-gray-900 dark:text-white">
              {member.phoneNumber}
            </td>
            {showStatus && (
              <td className="py-2 px-4">
                <StatusBadge status={member.status} />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
} 