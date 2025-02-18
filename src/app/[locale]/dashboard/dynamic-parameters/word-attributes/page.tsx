"use client";

import DynamicParameterForm from "@/src/components/DynamicParameterForm";
import DynamicParameterTable from "@/src/components/DynamicParameterTable";
import { api } from "@/src/trpc/react";
import { useState } from "react";

export default function WordAttributesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const skip = (page - 1) * itemsPerPage;

  const { data, refetch, isLoading } = api.admin.dynamicParameters.getWordAttributes.useQuery({
    take: itemsPerPage,
    skip,
    search
  });

  const createMutation = api.admin.dynamicParameters.createWordAttribute.useMutation({
    onSuccess: () => {
      refetch();
      setIsFormOpen(false);
    }
  });

  const updateMutation = api.admin.dynamicParameters.updateWordAttribute.useMutation({
    onSuccess: () => {
      refetch();
      setIsFormOpen(false);
    }
  });

  const deleteMutation = api.admin.dynamicParameters.deleteWordAttribute.useMutation({
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

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearch = (query: string) => {
    setSearch(query);
    setPage(1); // Reset to first page when searching
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setPage(1); // Reset to first page when changing items per page
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Word Attributes</h1>
      <DynamicParameterTable
        columns={columns}
        data={data?.items || []}
        totalCount={data?.total || 0}
        itemsPerPage={itemsPerPage}
        setPageNumber={handlePageChange}
        pageNumber={page}
        isLoading={isLoading}
        setItemsPerPage={setItemsPerPage}
        onSearch={handleSearch}
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={(item) => deleteMutation.mutate({ id: item.id })}
      />

      <DynamicParameterForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        title={selectedItem ? "Edit Word Attribute" : "Add Word Attribute"}
        fields={formFields}
        initialData={selectedItem}
      />
    </div>
  );
}
