import React from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";

export default function SavedWordCardSkeleton() {
  return (
    <Card className="shadow-xs animate-pulse">
      <CardHeader>
        <div className="h-6 bg-foreground rounded-sm w-1/3 mb-2" />
        <div className="h-4 bg-foreground rounded-sm w-1/2" />
      </CardHeader>
      <CardBody>
        <div className="h-4 bg-foreground rounded-sm w-full" />
      </CardBody>
      <CardFooter className="flex justify-between">
        <div className="h-8 bg-foreground rounded-sm w-12" />
        <div className="h-8 bg-foreground rounded-sm w-12" />
      </CardFooter>
    </Card>
  );
}
