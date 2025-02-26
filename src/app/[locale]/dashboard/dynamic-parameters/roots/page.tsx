"use client";

import DynamicParameterTable from "@/src/components/dynamic-parameter-table";
import DynamicParameterForm from "@/src/components/dynamic-parameter-form";
import { useState } from "react";
import { api } from "@/src/trpc/react";

export default function RootsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const skip = (page - 1) * itemsPerPage;

  const { data, refetch, isLoading } = api.admin.dynamicParameters.getRoots.useQuery({
    take: itemsPerPage,
    skip,
    search
  });

  const createMutation = api.admin.dynamicParameters.createRoot.useMutation({
    onSuccess: () => {
      refetch();
      setIsFormOpen(false);
    }
  });

  const updateMutation = api.admin.dynamicParameters.updateRoot.useMutation({
    onSuccess: () => {
      refetch();
      setIsFormOpen(false);
    }
  });

  const deleteMutation = api.admin.dynamicParameters.deleteRoot.useMutation({
    onSuccess: () => refetch()
  });

  const columns = [
    { key: "id", label: "ID" },
    { key: "root", label: "Root" },
    { key: "language_id", label: "Language" },
    { key: "actions", label: "Actions" }
  ];

  const formFields = [
    { key: "root", label: "Root", type: "text" as const },
    { key: "language_id", label: "Language", type: "number" as const }
  ];

  const handleAdd = () => {
    setSelectedItem(null);
    setIsFormOpen(true);
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };

  const handleSubmit = (formData: any) => {
    if (selectedItem) {
      updateMutation.mutate({
        id: selectedItem.id,
        ...formData
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Roots</h1>
      <DynamicParameterTable
        columns={columns}
        data={data?.items || []}
        totalCount={data?.total || 0}
        setPageNumber={setPage}
        pageNumber={page}
        onSearch={setSearch}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(item) => deleteMutation.mutate({ id: item.id })}
        itemsPerPage={itemsPerPage}
        setItemsPerPage={setItemsPerPage}
        isLoading={isLoading}
      />

      <DynamicParameterForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        title={selectedItem ? "Edit Root" : "Add Root"}
        fields={formFields}
        initialData={selectedItem}
      />
    </div>
  );
}
