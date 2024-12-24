import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Member } from '../../types/member';

interface MemberDetailsModalProps {
  member: Member;
  isOpen: boolean;
  onClose: () => void;
}

export function MemberDetailsModal({ member, isOpen, onClose }: MemberDetailsModalProps) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="absolute right-0 top-0 pr-4 pt-4">
                <button
                  type="button"
                  className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                  onClick={onClose}
                >
                  <span className="sr-only">Close</span>
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="sm:flex sm:items-start">
                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                    Member Details
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-center space-x-4">
                      {member.photoUrl ? (
                        <img 
                          src={member.photoUrl} 
                          alt={`${member.firstName} ${member.lastName}`}
                          className="h-16 w-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-xl text-gray-500 dark:text-gray-400">
                            {member.firstName[0]}
                          </span>
                        </div>
                      )}
                      <div>
                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                          {member.firstName} {member.lastName}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {member.type}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Phone Number
                      </h5>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">
                        {member.phoneNumber}
                      </p>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Status
                      </h5>
                      <p className="mt-1">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          member.status === 'transformed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : member.status === 'registered'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {member.status}
                        </span>
                      </p>
                    </div>

                    <div>
                      <h5 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Organizations
                      </h5>
                      <ul className="mt-1 space-y-1">
                        {member.organizations.map((org, index) => (
                          <li key={index} className="text-sm text-gray-900 dark:text-white">
                            {org}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
} 