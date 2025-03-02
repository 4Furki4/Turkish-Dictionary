import RequestsManagement from "@/src/_pages/dashboard/requests/requests-management";
import { HydrateClient } from "@/src/trpc/server";

export const metadata = {
  title: "Request Management | Turkish Dictionary",
  description: "Manage dictionary contribution requests",
};

export default function RequestsPage() {
  return (
    <HydrateClient>
      <RequestsManagement />
    </HydrateClient>
  );
}
