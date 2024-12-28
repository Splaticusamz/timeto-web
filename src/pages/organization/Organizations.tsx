import { useEffect, useState, useCallback, useRef } from 'react';
import { useOrganization } from '../../contexts/OrganizationContext';
import { collection, query, where, getDocs, orderBy, startAfter, limit, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserIcon, UsersIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import debounce from 'lodash/debounce';

interface OrganizationEventCounts {
  [key: string]: {
    private: number;
    public: number;
  };
}

export function Organizations() {
  const { currentOrganization, switchOrganization } = useOrganization();
  const [organizationEventCounts, setOrganizationEventCounts] = useState<OrganizationEventCounts>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerTarget = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 10;

  const loadOrganizations = async (searchQuery: string = '', lastDoc: QueryDocumentSnapshot<DocumentData> | null = null) => {
    try {
      if (!searchQuery && lastDoc) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      let baseQuery;
      
      if (searchQuery) {
        // When searching, use a simple prefix search
        baseQuery = query(
          collection(db, 'organizations'),
          orderBy('name'),
          where('name', '>=', searchQuery),
          where('name', '<=', searchQuery + '\uf8ff'),
          limit(ITEMS_PER_PAGE)
        );
      } else {
        // Normal paginated load when not searching
        baseQuery = query(
          collection(db, 'organizations'),
          orderBy('name'),
          limit(ITEMS_PER_PAGE)
        );

        if (lastDoc) {
          baseQuery = query(baseQuery, startAfter(lastDoc));
        }
      }

      const snapshot = await getDocs(baseQuery);
      const fetchedOrgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Update pagination state
      setHasMore(snapshot.docs.length === ITEMS_PER_PAGE);
      setLastVisible(snapshot.docs[snapshot.docs.length - 1] || null);

      // Update organizations state
      if (!searchQuery && lastDoc) {
        setOrganizations(prev => [...prev, ...fetchedOrgs]);
      } else {
        setOrganizations(fetchedOrgs);
      }

      // Load event counts for organizations
      const counts: OrganizationEventCounts = {};
      await Promise.all(
        fetchedOrgs.map(async (org) => {
          // Query both private and public events in parallel
          const [eventsRef, publicEventsRef] = [
            collection(db, 'events'),
            collection(db, 'publicEvents')
          ];

          const [privateEventsQuery, publicEventsQuery] = [
            query(eventsRef, where('owner', '==', org.id)),
            query(publicEventsRef, where('owner', '==', org.id))
          ];

          try {
            const [privateEvents, publicEvents] = await Promise.all([
              getDocs(privateEventsQuery),
              getDocs(publicEventsQuery)
            ]);

            counts[org.id] = {
              private: privateEvents.size,
              public: publicEvents.size
            };
          } catch (error) {
            console.error(`Error loading events for org ${org.id}:`, error);
            counts[org.id] = {
              private: 0,
              public: 0
            };
          }
        })
      );

      setOrganizationEventCounts(prev => ({ ...prev, ...counts }));
    } catch (err) {
      console.error('Failed to load organizations:', err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setLastVisible(null);
      setHasMore(true);
      // Capitalize first letter to match the format in the database
      const formattedQuery = query ? query.charAt(0).toUpperCase() + query.slice(1) : '';
      loadOrganizations(formattedQuery);
    }, 300),
    []
  );

  useEffect(() => {
    debouncedSearch(searchTerm);
    return () => debouncedSearch.cancel();
  }, [searchTerm, debouncedSearch]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadOrganizations(searchTerm, lastVisible);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, lastVisible, searchTerm]);

  const handleOrganizationClick = async (orgId: string) => {
    try {
      await switchOrganization(orgId);
    } catch (err) {
      console.error('Failed to switch organization:', err);
    }
  };

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
        {organizations.map(org => (
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

        {/* Infinite scroll observer target */}
        <div 
          ref={observerTarget} 
          className="h-4"
          aria-hidden="true"
        />

        {(isLoading || isLoadingMore) && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        )}

        {!isLoading && organizations.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No organizations found
          </div>
        )}
      </div>
    </div>
  );
} 