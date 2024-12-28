import { Widget } from '../../types/event';
import { getWidgetDefinition } from './widgets/WidgetRegistry';

interface WidgetConfigFormProps {
  widget: Widget;
  onChange: (widget: Widget) => void;
}

export function WidgetConfigForm({ widget, onChange }: WidgetConfigFormProps) {
  const definition = getWidgetDefinition(widget.type);
  if (!definition) return null;

  const handleConfigChange = (field: string, value: any) => {
    onChange({
      ...widget,
      config: {
        ...widget.config,
        [field]: value,
      },
    });
  };

  const renderConfigField = (field: string, schema: any) => {
    switch (schema.type) {
      case 'boolean':
        return (
          <div key={field} className="flex items-center">
            <input
              type="checkbox"
              id={field}
              checked={widget.config[field] ?? schema.default}
              onChange={(e) => handleConfigChange(field, e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor={field} className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              {schema.title}
            </label>
          </div>
        );

      case 'number':
        return (
          <div key={field}>
            <label htmlFor={field} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {schema.title}
            </label>
            <input
              type="number"
              id={field}
              value={widget.config[field] ?? schema.default}
              onChange={(e) => handleConfigChange(field, parseFloat(e.target.value))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
            />
            {schema.description && (
              <p className="mt-1 text-sm text-gray-500">{schema.description}</p>
            )}
          </div>
        );

      case 'string':
        if (schema.enum) {
          return (
            <div key={field}>
              <label htmlFor={field} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {schema.title}
              </label>
              <select
                id={field}
                value={widget.config[field] ?? schema.default}
                onChange={(e) => handleConfigChange(field, e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
              >
                {schema.enum.map((option: string) => (
                  <option key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </option>
                ))}
              </select>
              {schema.description && (
                <p className="mt-1 text-sm text-gray-500">{schema.description}</p>
              )}
            </div>
          );
        }
        return (
          <div key={field}>
            <label htmlFor={field} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {schema.title}
            </label>
            <input
              type="text"
              id={field}
              value={widget.config[field] ?? schema.default}
              onChange={(e) => handleConfigChange(field, e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600"
            />
            {schema.description && (
              <p className="mt-1 text-sm text-gray-500">{schema.description}</p>
            )}
          </div>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{definition.name}</h3>
        <div className="flex items-center">
          <input
            type="checkbox"
            id={`${widget.id}-enabled`}
            checked={widget.isEnabled}
            onChange={(e) => onChange({ ...widget, isEnabled: e.target.checked })}
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <label htmlFor={`${widget.id}-enabled`} className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Enabled
          </label>
        </div>
      </div>

      {widget.isEnabled && definition.configSchema && (
        <div className="space-y-4">
          {Object.entries(definition.configSchema.properties).map(([field, schema]) =>
            renderConfigField(field, schema)
          )}
        </div>
      )}
    </div>
  );
} 