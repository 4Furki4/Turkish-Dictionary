"use client";

import DynamicParameterForm from "@/src/components/dynamic-parameter-form";
import DynamicParameterTable from "@/src/components/dynamic-parameter-table";
import { useState } from "react";
import { api } from "@/src/trpc/react";
import { keepPreviousData } from "@tanstack/react-query";

export default function LanguagesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const [itemsPerPage, setItemsPerPage] = useState(10);
  const skip = (page - 1) * itemsPerPage;

  const { data, refetch, isLoading } = api.admin.dynamicParameters.getLanguages.useQuery({
    take: itemsPerPage,
    skip,
    search
  }, {
    placeholderData: keepPreviousData
  });

  const createMutation = api.admin.dynamicParameters.createLanguage.useMutation({
    onSuccess: () => {
      refetch();
      setIsFormOpen(false);
    }
  });

  const updateMutation = api.admin.dynamicParameters.updateLanguage.useMutation({
    onSuccess: () => {
      refetch();
      setIsFormOpen(false);
    }
  });

  const deleteMutation = api.admin.dynamicParameters.deleteLanguage.useMutation({
    onSuccess: () => refetch()
  });

  const columns = [
    { key: "id", label: "ID" },
    { key: "language_code", label: "Code" },
    { key: "language_en", label: "English" },
    { key: "language_tr", label: "Turkish" },
    { key: "actions", label: "Actions" }
  ];

  const formFields = [
    { key: "language_code", label: "Language Code", type: "text" as const },
    { key: "language_en", label: "English Name", type: "text" as const },
    { key: "language_tr", label: "Turkish Name", type: "text" as const }
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
      <h1 className="text-2xl font-bold mb-4">Languages</h1>
      <DynamicParameterTable
        columns={columns}
        data={data?.items || []}
        totalCount={data?.total || 1}
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
        title={selectedItem ? "Edit Language" : "Add Language"}
        fields={formFields}
        initialData={selectedItem}
      />
    </div>
  );
}
