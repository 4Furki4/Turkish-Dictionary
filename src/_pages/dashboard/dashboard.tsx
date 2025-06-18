import { Card, CardBody, CardHeader } from "@heroui/react";
import React from "react";
import DashboardLinks from "./dashboard-links";


export default function Dashboard({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode,
}) {

  return (
    <Card isBlurred className="max-w-7xl w-full mx-auto my-4 max-lg:mx-4 h-max border-2 border-border" radius="sm">
      <CardHeader className="gap-2">
        <DashboardLinks />
      </CardHeader>
      <CardBody>
        {children}
      </CardBody>
    </Card>
  );
}
