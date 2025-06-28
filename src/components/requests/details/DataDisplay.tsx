import { useTranslations } from "next-intl";

interface DataDisplayProps {
  data: Record<string, any>;
  title?: string;
}

const DataDisplay: React.FC<DataDisplayProps> = ({ data, title }) => {
  const tDb = useTranslations("DbFieldLabels");
  const tRequestDetails = useTranslations("RequestDetails");

  const renderValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined || value === '') {
      return <span className="text-muted-foreground italic">{tRequestDetails("empty")}</span>;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-muted-foreground italic">{tRequestDetails("emptyArray")}</span>;
      }
      return (
        <ul className="list-none list-inside space-y-1">
          {value.map((item, index) => (
            <li key={index}>{renderValue(item)}</li>
          ))}
        </ul>
      );
    }
    if (typeof value === 'object') {
      return <DataDisplay data={value} />;
    }
    return String(value);
  };

  const allKeys = Object.keys(data);

  return (
    <div className="border rounded-lg">
      {title && (
        <div className="px-4 py-2 bg-muted/50 border-b border-border">
          <h3 className="text-lg font-semibold">{title}</h3>
        </div>
      )}
      <div className="divide-y divide-border">
        {allKeys.map((key) => (
          <div key={key} className="px-4 py-3 md:grid md:grid-cols-3 md:gap-4 text-sm">
            <dt className="font-semibold md:font-medium text-foreground">{tDb(key as any)}</dt>
            <dd className="mt-1 md:mt-0 md:col-span-2 text-muted-foreground">{renderValue(data[key])}</dd>
          </div>
        ))}
      </div>
    </div>
  );
};

export { DataDisplay };