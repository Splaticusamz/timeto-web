import { MemberType } from '../../types/member';

interface MemberFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showLeads: boolean;
  onShowLeadsChange: (value: boolean) => void;
  showMembers: boolean;
  onShowMembersChange: (value: boolean) => void;
}

export function MemberFilters({
  searchTerm,
  onSearchChange,
  showLeads,
  onShowLeadsChange,
  showMembers,
  onShowMembersChange
}: MemberFiltersProps) {
  return (
    <div className="mb-4 space-y-4">
      <div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search members..."
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>
      <div className="flex space-x-4">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={showLeads}
            onChange={(e) => onShowLeadsChange(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show Leads</span>
        </label>
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={showMembers}
            onChange={(e) => onShowMembersChange(e.target.checked)}
            className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Show Members</span>
        </label>
      </div>
    </div>
  );
} 