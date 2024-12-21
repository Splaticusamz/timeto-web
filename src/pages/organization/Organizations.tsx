import { useOrganization } from '../../contexts/OrganizationContext';

export function Organizations() {
  const { userOrganizations, switchOrganization, currentOrganization } = useOrganization();

  const handleOrganizationClick = async (orgId: string) => {
    try {
      await switchOrganization(orgId);
    } catch (err) {
      console.error('Failed to switch organization:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organizations</h1>
      <div className="mt-6 space-y-4">
        {userOrganizations.map(org => (
          <div
            key={org.id}
            onClick={() => handleOrganizationClick(org.id)}
            className={`
              bg-white dark:bg-gray-800 shadow rounded-lg p-6 cursor-pointer
              transition-all duration-200
              ${org.id === currentOrganization?.id 
                ? 'ring-2 ring-primary-500 dark:ring-primary-400' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            `}
          >
            <h2 className={`text-xl font-medium ${
              org.id === currentOrganization?.id
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-900 dark:text-white'
            }`}>
              {org.name}
            </h2>
          </div>
        ))}
      </div>
    </div>
  );
} 