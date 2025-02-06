"use client";

import DynamicParameterTable from "@/src/components/DynamicParameterTable";
import DynamicParameterForm from "@/src/components/DynamicParameterForm";
import { useState } from "react";
import { api } from "@/src/trpc/react";

export default function MeaningAttributesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const skip = (page - 1) * itemsPerPage;

  const { data, refetch, isLoading } = api.admin.dynamicParameters.getMeaningAttributes.useQuery({
    take: itemsPerPage,
    skip,
    search
  });

  const createMutation = api.admin.dynamicParameters.createMeaningAttribute.useMutation({
    onSuccess: () => {
      refetch();
      setIsFormOpen(false);
    }
  });

  const updateMutation = api.admin.dynamicParameters.updateMeaningAttribute.useMutation({
    onSuccess: () => {
      refetch();
      setIsFormOpen(false);
    }
  });

  const deleteMutation = api.admin.dynamicParameters.deleteMeaningAttribute.useMutation({
    onSuccess: () => refetch()
  });

  const columns = [
    { key: "id", label: "ID" },
    { key: "attribute", label: "Attribute" },
    { key: "actions", label: "Actions" }
  ];

  const formFields = [
    { key: "attribute", label: "Attribute Name", type: "text" as const }
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
      <h1 className="text-2xl font-bold mb-4">Meaning Attributes</h1>
      <DynamicParameterTable
        columns={columns}
        data={data?.items || []}
        totalCount={data?.total || 0}
        setPageNumber={setPage}
        pageNumber={page}
        setItemsPerPage={setItemsPerPage}
        itemsPerPage={itemsPerPage}
        onSearch={setSearch}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(item) => deleteMutation.mutate({ id: item.id })}
        isLoading={isLoading}
      />

      <DynamicParameterForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        title={selectedItem ? "Edit Meaning Attribute" : "Add Meaning Attribute"}
        fields={formFields}
        initialData={selectedItem}
      />
    </div>
  );
}
