"use client";

import DynamicParameterTable from "@/src/components/DynamicParameterTable";
import DynamicParameterForm from "@/src/components/DynamicParameterForm";
import { useState } from "react";
import { api } from "@/src/trpc/react";

export default function PartOfSpeechPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const skip = (page - 1) * itemsPerPage;
  const { data, refetch, isLoading } = api.admin.dynamicParameters.getPartOfSpeeches.useQuery({
    take: itemsPerPage,
    skip,
    search
  });

  const createMutation = api.admin.dynamicParameters.createPartOfSpeech.useMutation({
    onSuccess: () => {
      refetch();
      setIsFormOpen(false);
    }
  });

  const updateMutation = api.admin.dynamicParameters.updatePartOfSpeech.useMutation({
    onSuccess: () => {
      refetch();
      setIsFormOpen(false);
    }
  });

  const deleteMutation = api.admin.dynamicParameters.deletePartOfSpeech.useMutation({
    onSuccess: () => refetch()
  });

  const columns = [
    { key: "id", label: "ID" },
    { key: "partOfSpeech", label: "Part of Speech" },
    { key: "actions", label: "Actions" }
  ];

  const formFields = [
    { key: "partOfSpeech", label: "Part of Speech", type: "text" as const }
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
      <h1 className="text-2xl font-bold mb-4">Parts of Speech</h1>
      <DynamicParameterTable
        columns={columns}
        data={data?.items || []}
        totalCount={data?.total || 1}
        setPageNumber={setPage}
        setItemsPerPage={setItemsPerPage}
        onSearch={setSearch}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(item) => deleteMutation.mutate({ id: item.id })}
        isLoading={isLoading}
        itemsPerPage={itemsPerPage}
        pageNumber={page}
      />

      <DynamicParameterForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        title={selectedItem ? "Edit Part of Speech" : "Add Part of Speech"}
        fields={formFields}
        initialData={selectedItem}
      />
    </div>
  );
}
