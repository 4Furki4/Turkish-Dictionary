
// src/components/requests/details/RequestDetails.tsx
import { FC } from "react";
import { getRequestDetailComponent } from "./registry";
import { EntityTypes, Actions } from "@/db/schema/requests";

interface RequestDetailsProps {
  entityType: EntityTypes;
  action: Actions;
  newData?: any;
  oldData?: any;
}

const RequestDetails: FC<RequestDetailsProps> = ({ entityType, action, newData, oldData }) => {
  const Component = getRequestDetailComponent(entityType, action);

  if (!Component) {
    return <div>Component for {entityType} - {action} not found</div>;
  }

  return <Component newData={newData} oldData={oldData} />;
};

export default RequestDetails;
