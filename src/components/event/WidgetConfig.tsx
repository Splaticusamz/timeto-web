import { Switch } from '@headlessui/react';
import { getWidgetDefinition } from './widgets/WidgetRegistry';
import { Widget } from '../../types/event';

interface WidgetConfigProps {
  widgets: Widget[];
  onWidgetsChange: (widgets: Widget[]) => void;
}

export function WidgetConfig({ widgets, onWidgetsChange }: WidgetConfigProps) {
  const toggleWidget = (widgetId: string) => {
    const updatedWidgets = widgets.map(w => 
      w.id === widgetId ? { ...w, isEnabled: !w.isEnabled } : w
    );
    onWidgetsChange(updatedWidgets);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
        Event Widgets
      </h3>
      <div className="grid grid-cols-1 gap-4">
        {widgets.map(widget => {
          const definition = getWidgetDefinition(widget.id);
          return (
            <div 
              key={widget.id}
              className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow"
            >
              <div className="flex items-center space-x-3">
                {definition?.icon && (
                  <definition.icon className="h-6 w-6 text-gray-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {definition?.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {definition?.description}
                  </p>
                </div>
              </div>
              <Switch
                checked={widget.isEnabled}
                onChange={() => toggleWidget(widget.id)}
                className={`${
                  widget.isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                } relative inline-flex h-6 w-11 items-center rounded-full`}
              >
                <span className="sr-only">Enable {definition?.name}</span>
                <span
                  className={`${
                    widget.isEnabled ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                />
              </Switch>
            </div>
          );
        })}
      </div>
    </div>
  );
} 