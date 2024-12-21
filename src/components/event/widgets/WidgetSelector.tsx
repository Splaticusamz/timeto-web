import { useState } from 'react';
import { Widget } from '../../../types/event';
import { getWidgetDefinition } from './WidgetRegistry';

interface WidgetSelectorProps {
  selectedWidgets: Widget[];
  onWidgetsChange: (widgets: Widget[]) => void;
}

export function WidgetSelector({ selectedWidgets, onWidgetsChange }: WidgetSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleWidgetToggle = (widgetId: string) => {
    const isSelected = selectedWidgets.some(w => w.id === widgetId);
    if (isSelected) {
      onWidgetsChange(selectedWidgets.filter(w => w.id !== widgetId));
    } else {
      const definition = getWidgetDefinition(widgetId);
      if (definition) {
        onWidgetsChange([...selectedWidgets, {
          id: widgetId,
          isEnabled: true,
          config: definition.defaultConfig || {},
        }]);
      }
    }
  };

  const availableWidgets = Object.values(getWidgetDefinition())
    .filter(widget => 
      widget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      widget.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="widget-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Search Widgets
        </label>
        <input
          type="text"
          id="widget-search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search widgets..."
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
        />
      </div>

      <div className="space-y-2">
        {availableWidgets.map((widget) => {
          const isSelected = selectedWidgets.some(w => w.id === widget.id);
          return (
            <div
              key={widget.id}
              className={`p-4 rounded-lg border ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700'
              } cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800`}
              onClick={() => handleWidgetToggle(widget.id)}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {widget.name}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {widget.description}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleWidgetToggle(widget.id)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 