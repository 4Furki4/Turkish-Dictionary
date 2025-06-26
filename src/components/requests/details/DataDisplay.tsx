// src/components/requests/details/DataDisplay.tsx
import { FC } from 'react';
import { useTranslations } from 'next-intl';

interface DataDisplayProps {
  data: Record<string, any>;
  title?: string;
}

const DataField: FC<{ label: string; value: any }> = ({ label, value }) => {
  const tDbFieldLabels = useTranslations("DbFieldLabels");
  const renderValue = (val: any) => {
    if (val === null || val === undefined || val === '') return <span className="text-gray-500 italic">empty</span>;
    if (Array.isArray(val)) {
      if (val.length === 0) return <span className="text-gray-500 italic">empty array</span>;
      return (
        <ul className="list-disc list-inside">
          {val.map((item, index) => (
            <li key={index}>{renderValue(item)}</li>
          ))}
        </ul>
      );
    }
    if (typeof val === 'object') {
      return <DataDisplay data={val} />;
    }
    return String(val);
  };

  return (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-border">
      <dt className="font-medium text-gray-600 dark:text-gray-400">{tDbFieldLabels(label)}</dt>
      <dd className="col-span-2 text-gray-800 dark:text-gray-200">{renderValue(value)}</dd>
    </div>
  );
};

export const DataDisplay: FC<DataDisplayProps> = ({ data, title }) => {
  const allKeys = Object.keys(data);

  return (
    <div className="bg-background-soft p-4 rounded-lg border border-border">
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}
      <dl>
        {allKeys.map(key => (
          <DataField key={key} label={key} value={data[key]} />
        ))}
      </dl>
    </div>
  );
};
