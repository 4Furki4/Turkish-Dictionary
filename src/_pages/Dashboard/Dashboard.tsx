import { Card, CardBody, CardFooter, CardHeader } from "@nextui-org/react";
import React from "react";
import DashboardLinks from "./DashboardLinks";


export default async function Dashboard({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode,
}) {

  return (
    <Card className="max-w-7xl w-full mx-auto my-4" radius="sm">
      <CardHeader className="gap-2">
        <DashboardLinks />
      </CardHeader>
      <CardBody>
        {children}
      </CardBody>
    </Card>
  );
}
