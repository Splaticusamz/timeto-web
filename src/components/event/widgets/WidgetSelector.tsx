import { useState } from 'react';
import { Widget } from '../../../types/event';
import { getAllWidgetDefinitions, getWidgetDefinition } from './WidgetRegistry';
import {
  CloudIcon,
  MapPinIcon,
  GlobeAltIcon,
  PhoneIcon,
  PhotoIcon,
  ChatBubbleLeftIcon,
  ChatBubbleBottomCenterTextIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface WidgetSelectorProps {
  selectedWidgets: Widget[];
  onWidgetsChange: (widgets: Widget[]) => void;
}

export function WidgetSelector({ selectedWidgets, onWidgetsChange }: WidgetSelectorProps) {
  const handleWidgetToggle = (widgetType: Widget['type']) => {
    const isSelected = selectedWidgets.some(w => w.type === widgetType);
    if (isSelected) {
      onWidgetsChange(selectedWidgets.filter(w => w.type !== widgetType));
    } else {
      // Special configuration for specific widgets
      let config = {};
      if (widgetType === 'website') {
        config = {
          useOrganizationWebsite: true,
          customUrl: '',
        };
      } else if (widgetType === 'phoneNumber' || widgetType === 'call') {
        config = {
          useOrganizationPhone: true,
          customPhone: '',
        };
      } else if (widgetType === 'messageBoard') {
        config = {
          messages: [],
          newMessage: '',
        };
      }

      onWidgetsChange([...selectedWidgets, {
        id: crypto.randomUUID(),
        type: widgetType,
        isEnabled: true,
        config,
      }]);
    }
  };

  const getWidgetIcon = (type: Widget['type']) => {
    const icons: Record<string, typeof CloudIcon> = {
      description: InformationCircleIcon,
      weather: CloudIcon,
      location: MapPinIcon,
      website: GlobeAltIcon,
      phoneNumber: PhoneIcon,
      photos: PhotoIcon,
      messageBoard: ChatBubbleLeftIcon,
      comments: ChatBubbleBottomCenterTextIcon,
      quickInfo: InformationCircleIcon,
      call: PhoneIcon,
    };
    
    const Icon = icons[type] || QuestionMarkCircleIcon;
    return Icon;
  };

  const getWidgetName = (type: Widget['type']) => {
    const names: Record<string, string> = {
      description: 'Description',
      weather: 'Weather',
      location: 'Location',
      website: 'Website',
      phoneNumber: 'Phone',
      photos: 'Photos',
      messageBoard: 'Message Board',
      comments: 'Comments',
      quickInfo: 'Quick Info',
      call: 'Call',
    };
    
    return names[type] || type;
  };

  const availableWidgets = getAllWidgetDefinitions()
    .filter(widget => widget.type !== 'attendees'); // Filter out attendees widget

  return (
    <div className="grid grid-cols-2 gap-4">
      {availableWidgets.map((widget) => {
        const isSelected = selectedWidgets.some(w => w.type === widget.type);
        const Icon = getWidgetIcon(widget.type);
        
        return (
          <div 
            key={widget.type}
            onClick={() => handleWidgetToggle(widget.type)}
            className={`flex items-center p-4 rounded-lg border cursor-pointer ${
              isSelected 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}
          >
            <Icon className={`h-6 w-6 mr-3 ${
              isSelected
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            }`} />
            <div className="flex-1">
              <span className={`text-sm font-medium ${
                isSelected
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {getWidgetName(widget.type)}
              </span>
            </div>
            {isSelected && (
              <CheckIcon className="h-5 w-5 text-green-700 dark:text-green-300" />
            )}
          </div>
        );
      })}
    </div>
  );
} 