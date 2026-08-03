"use client";

import { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import DocumentRegistry from "@/components/admin/DocumentRegistry";
import DocumentViewer from "@/components/admin/DocumentViewer";

export default function KnowledgeBasePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleChanged() {
    setRefreshKey((k) => k + 1);
  }

  function handleDeleted() {
    setSelectedId(null);
    setRefreshKey((k) => k + 1);
  }

  return (
    <AdminLayout>
      <div className="-mx-10 -my-10 h-[calc(100vh-0px)] flex">
        <DocumentRegistry
          key={refreshKey}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {selectedId ? (
          <DocumentViewer
            key={selectedId}
            documentId={selectedId}
            onChanged={handleChanged}
            onDeleted={handleDeleted}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-center px-6">
            <p className="text-sm text-gray-400">
              Select a document from the registry to view or edit it.
            </p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
