import { Member } from '../../types/member';
import { StatusBadge } from './StatusBadge';

interface SearchTableProps {
  members: Member[];
}

export function SearchTable({ members }: SearchTableProps) {
  return (
    <table className="w-full">
      <thead>
        <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
            Name
          </th>
          <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
            Phone Number
          </th>
          <th className="py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase text-left px-4">
            Status
          </th>
        </tr>
      </thead>
      <tbody>
        {members.map((member) => (
          <tr key={member.id} className="border-b border-gray-100 dark:border-gray-700 last:border-b-0">
            <td className="py-2 text-sm px-4 text-gray-900 dark:text-white">
              {`${member.firstName} ${member.lastName}`}
            </td>
            <td className="py-2 text-sm px-4 text-gray-900 dark:text-white">
              {member.phoneNumber}
            </td>
            <td className="py-2 px-4">
              <StatusBadge status={member.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
} 