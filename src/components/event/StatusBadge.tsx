import { MemberStatus } from '../../types/member';

interface StatusBadgeProps {
  status: MemberStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
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