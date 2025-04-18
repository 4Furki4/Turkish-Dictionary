import { RequestDetails } from "@/src/_pages/dashboard/requests/request-details";
import { HydrateClient } from "@/src/trpc/server";

export const metadata = {
  title: "Request Details | Turkish Dictionary",
  description: "View and manage dictionary request details",
};
type Params = Promise<{ id: string }>
export default async function RequestDetailsPage({ params }: { params: Params }) {
  const { id } = await params;
  return (
    <HydrateClient>
      <RequestDetails requestId={parseInt(id)} />
    </HydrateClient>
  );
}
