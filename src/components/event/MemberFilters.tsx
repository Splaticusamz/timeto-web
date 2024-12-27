import { MemberType } from '../../types/member';

interface MemberFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showLeads?: boolean;
  onShowLeadsChange?: (value: boolean) => void;
  showMembers?: boolean;
  onShowMembersChange?: (value: boolean) => void;
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
    <div className="mb-4 flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
      <div className="flex-1">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search members..."
          className="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>
      
      {showLeads !== undefined && onShowLeadsChange && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showLeads"
            checked={showLeads}
            onChange={(e) => onShowLeadsChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="showLeads" className="ml-2 text-sm text-gray-600 dark:text-gray-300">
            Show Leads
          </label>
        </div>
      )}
      
      {showMembers !== undefined && onShowMembersChange && (
        <div className="flex items-center ml-4">
          <input
            type="checkbox"
            id="showMembers"
            checked={showMembers}
            onChange={(e) => onShowMembersChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor="showMembers" className="ml-2 text-sm text-gray-600 dark:text-gray-300">
            Show Members
          </label>
        </div>
      )}
    </div>
  );
} 