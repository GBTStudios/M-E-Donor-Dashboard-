"use client";
import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import DocumentRegistry from "@/components/admin/DocumentRegistry";
import DocumentViewer from "@/components/admin/DocumentViewer";

function KnowledgeBaseContent() {
  const searchParams = useSearchParams();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Support deep linking from the Uploaded Documents audit page, e.g.
  // /admin/knowledge-base?document=<id> — auto-selects that document on
  // load instead of leaving the admin to find it manually in the list.
  useEffect(() => {
    const documentParam = searchParams.get("document");
    if (documentParam) {
      setSelectedId(documentParam);
    }
  }, [searchParams]);

  function handleChanged() {
    setRefreshKey((k) => k + 1);
  }
  function handleDeleted() {
    setSelectedId(null);
    setRefreshKey((k) => k + 1);
  }

  return (
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
  );
}

export default function KnowledgeBasePage() {
  return (
    <AdminLayout>
      <Suspense fallback={null}>
        <KnowledgeBaseContent />
      </Suspense>
    </AdminLayout>
  );
}
