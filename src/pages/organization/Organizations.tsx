import { useEffect, useState } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserIcon, UsersIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export function Organizations() {
  const { userOrganizations, currentOrganization, switchOrganization } = useOrganization();
  const [organizationEventCounts, setOrganizationEventCounts] = useState<Record<string, {private: number, public: number}>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to chunk array into smaller arrays
  const chunkArray = <T,>(array: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  useEffect(() => {
    const loadEventCounts = async () => {
      if (!userOrganizations.length) return;
      
      setIsLoading(true);
      try {
        const orgIds = userOrganizations.map(org => org.id);
        const CHUNK_SIZE = 30; // Firestore's limit for 'in' queries
        const orgIdChunks = chunkArray(orgIds, CHUNK_SIZE);

        const counts: Record<string, {private: number, public: number}> = {};
        orgIds.forEach(id => {
          counts[id] = { private: 0, public: 0 };
        });

        // Process chunks sequentially
        for (const chunk of orgIdChunks) {
          // Query private events for this chunk
          const privateEventsQuery = query(
            collection(db, 'events'),
            where('owner', 'in', chunk)
          );

          // Query public events for this chunk
          const publicEventsQuery = query(
            collection(db, 'publicEvents'),
            where('owner', 'in', chunk)
          );

          const [privateSnapshot, publicSnapshot] = await Promise.all([
            getDocs(privateEventsQuery),
            getDocs(publicEventsQuery)
          ]);

          // Count private events
          privateSnapshot.forEach(doc => {
            const owner = doc.data().owner;
            if (counts[owner]) {
              counts[owner].private++;
            }
          });

          // Count public events
          publicSnapshot.forEach(doc => {
            const owner = doc.data().owner;
            if (counts[owner]) {
              counts[owner].public++;
            }
          });
        }

        console.log('Event counts:', counts);
        setOrganizationEventCounts(counts);
      } catch (err) {
        console.error('Failed to load event counts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadEventCounts();
  }, [userOrganizations]);

  const handleOrganizationClick = async (orgId: string) => {
    try {
      await switchOrganization(orgId);
    } catch (err) {
      console.error('Failed to switch organization:', err);
    }
  };

  const filteredOrganizations = userOrganizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const EventCountPill = ({ type, count }: { type: 'private' | 'public', count: number }) => {
    const isPrimary = type === 'private';
    const Icon = isPrimary ? UserIcon : UsersIcon;
    const baseClasses = `inline-flex items-center px-3 py-1 text-sm rounded-full ${
      isPrimary 
        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
        : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
    }`;

    if (isLoading) {
      return (
        <span className={`${baseClasses} animate-pulse`}>
          <Icon className="w-4 h-4 mr-1 opacity-50" />
          <div className="h-4 w-6 bg-current opacity-20 rounded" />
        </span>
      );
    }

    return (
      <span className={baseClasses}>
        <Icon className="w-4 h-4 mr-1" />
        {count}
      </span>
    );
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organizations</h1>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 w-full sm:w-auto">
          {/* Search input */}
          <div className="relative w-full sm:w-64">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Legend */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                <UserIcon className="w-4 h-4 mr-1" />
                Private
              </span>
              <span className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                <UsersIcon className="w-4 h-4 mr-1" />
                Public
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {filteredOrganizations.map(org => (
          <div
            key={org.id}
            onClick={() => handleOrganizationClick(org.id)}
            className={`
              bg-white dark:bg-gray-800 shadow rounded-lg p-6 cursor-pointer
              transition-all duration-200 flex justify-between items-center
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
            <div className="flex items-center space-x-3">
              <EventCountPill 
                type="private" 
                count={organizationEventCounts[org.id]?.private || 0} 
              />
              <EventCountPill 
                type="public" 
                count={organizationEventCounts[org.id]?.public || 0} 
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 