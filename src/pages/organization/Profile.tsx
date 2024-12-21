import { useState, useMemo } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { CreateOrganizationForm } from '../../components/organization/CreateOrganizationForm';
import { Organization } from '../../types/organization';

type SortField = 'name' | 'createdAt' | 'eventCount';
type SortDirection = 'asc' | 'desc';

interface DeleteConfirmation {
  isOpen: boolean;
  organizations: Organization[];
  isBulk: boolean;
}

export const Organizations = () => {
  const { currentOrganization, userOrganizations, loading, error, switchOrganization, deleteOrganization } = useOrganization();
  const [formError, setFormError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedOrgs, setSelectedOrgs] = useState<Set<string>>(new Set());
  const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
    isOpen: false,
    organizations: [],
    isBulk: false,
  });

  const filteredAndSortedOrganizations = useMemo(() => {
    return [...userOrganizations]
      .filter(org => 
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (org.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        if (sortField === 'name') {
          return sortDirection === 'asc' 
            ? a.name.localeCompare(b.name)
            : b.name.localeCompare(a.name);
        } else if (sortField === 'eventCount') {
          return sortDirection === 'asc'
            ? a.eventCount - b.eventCount
            : b.eventCount - a.eventCount;
        } else {
          const aValue = a[sortField];
          const bValue = b[sortField];
          return sortDirection === 'asc'
            ? aValue.getTime() - bValue.getTime()
            : bValue.getTime() - aValue.getTime();
        }
      });
  }, [userOrganizations, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedOrgs(new Set(filteredAndSortedOrganizations.map(org => org.id)));
    } else {
      setSelectedOrgs(new Set());
    }
  };

  const handleSelectOrg = (e: React.ChangeEvent<HTMLInputElement>, orgId: string) => {
    e.stopPropagation();
    const newSelected = new Set(selectedOrgs);
    if (e.target.checked) {
      newSelected.add(orgId);
    } else {
      newSelected.delete(orgId);
    }
    setSelectedOrgs(newSelected);
  };

  const handleDeleteClick = (e: React.MouseEvent, org: Organization) => {
    e.stopPropagation();
    setDeleteConfirmation({
      isOpen: true,
      organizations: [org],
      isBulk: false,
    });
  };

  const handleBulkDelete = () => {
    if (selectedOrgs.size === 0) return;
    
    const orgsToDelete = filteredAndSortedOrganizations.filter(org => 
      selectedOrgs.has(org.id)
    );
    
    setDeleteConfirmation({
      isOpen: true,
      organizations: orgsToDelete,
      isBulk: true,
    });
  };

  const handleConfirmDelete = async () => {
    try {
      for (const org of deleteConfirmation.organizations) {
        await deleteOrganization(org.id);
      }
      setDeleteConfirmation({
        isOpen: false,
        organizations: [],
        isBulk: false,
      });
      setSelectedOrgs(new Set());
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to delete organization(s)');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  const SortIcon = ({ field }: { field: SortField }) => (
    <span className="inline-block ml-1">
      {sortField === field ? (
        sortDirection === 'asc' ? '↑' : '↓'
      ) : '↕'}
    </span>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <h1 className="text-3xl font-bold">Organizations</h1>
        <div className="w-full sm:w-64 mt-4 sm:mt-0">
          <input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
          />
        </div>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {selectedOrgs.size} selected
        </div>
        {selectedOrgs.size > 0 && (
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Delete Selected
          </button>
        )}
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={selectedOrgs.size === filteredAndSortedOrganizations.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  Name <SortIcon field="name" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('createdAt')}
                >
                  Created <SortIcon field="createdAt" />
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('eventCount')}
                >
                  Events <SortIcon field="eventCount" />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedOrganizations.map((org) => (
                <tr 
                  key={org.id}
                  onClick={() => switchOrganization(org.id)}
                  className={`cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    currentOrganization?.id === org.id 
                      ? 'bg-primary-50 dark:bg-primary-900/20' 
                      : ''
                  }`}
                >
                  <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedOrgs.has(org.id)}
                      onChange={(e) => handleSelectOrg(e, org.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{org.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div 
                      className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-md"
                      title={org.description || 'No description provided'}
                    >
                      {org.description || 'No description provided'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {org.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {org.eventCount} events
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={(e) => handleDeleteClick(e, org)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {!currentOrganization && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mt-8">
          <h2 className="text-2xl font-semibold mb-4">Create Organization</h2>
          {formError && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{formError}</span>
            </div>
          )}
          <CreateOrganizationForm onError={setFormError} />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Confirm Delete</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {deleteConfirmation.isBulk 
                ? `Are you sure you want to delete ${deleteConfirmation.organizations.length} organizations? This action cannot be undone.`
                : `Are you sure you want to delete "${deleteConfirmation.organizations[0].name}"? This action cannot be undone.`
              }
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setDeleteConfirmation({ isOpen: false, organizations: [], isBulk: false })}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 