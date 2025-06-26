// src/components/requests/details/DiffTable.tsx
import { FC } from 'react';
import { useTranslations } from 'next-intl';

interface DiffTableProps {
  oldData: Record<string, any>;
  newData: Record<string, any>;
  title?: string;
}

const DiffField: FC<{ label: string; oldValue: any; newValue: any }> = ({ label, oldValue, newValue }) => {
  const tDbFieldLabels = useTranslations("DbFieldLabels");
  const renderValue = (value: any) => {
    if (value === null || value === undefined || value === '') return <span className="text-gray-500 italic">empty</span>;
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const hasChanged = JSON.stringify(oldValue) !== JSON.stringify(newValue);

  if (!hasChanged) {
    return (
      <div className="grid grid-cols-3 gap-4 py-2 border-b border-border">
        <dt className="font-medium text-gray-600 dark:text-gray-400">{tDbFieldLabels(label)}</dt>
        <dd className="col-span-2 text-gray-800 dark:text-gray-200">{renderValue(newValue)}</dd>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-border">
      <dt className="font-medium text-gray-600 dark:text-gray-400">{label}</dt>
      <dd className="text-red-600 line-through">{renderValue(oldValue)}</dd>
      <dd className="text-green-600">{renderValue(newValue)}</dd>
    </div>
  );
};

export const DiffTable: FC<DiffTableProps> = ({ oldData, newData, title }) => {
  const t = useTranslations("RequestDetails.DiffTable");
  const allKeys = Array.from(new Set([...Object.keys(oldData), ...Object.keys(newData)]));

  return (
    <div className="bg-background-soft p-4 rounded-lg border border-border">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <div className="grid grid-cols-3 gap-4 font-semibold text-sm text-gray-500 dark:text-gray-400 border-b-2 border-border pb-2 mb-2">
        <span>{t('field')}</span>
        <span>{t('oldValue')}</span>
        <span>{t('newValue')}</span>
      </div>
      <dl>
        {allKeys.map(key => (
          <DiffField key={key} label={key} oldValue={oldData[key]} newValue={newData[key]} />
        ))}
      </dl>
    </div>
  );
};
