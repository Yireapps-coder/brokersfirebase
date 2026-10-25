import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  Clock,
  Ban,
  AlertTriangle,
  Loader2,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PROPERTY_DOCUMENT_TYPES,
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_LABELS,
  DOCUMENT_STATUS_LABELS,
  TOTAL_DOCUMENT_TYPES,
  ACCEPTED_DOCUMENT_EXT,
  ACCEPTED_DOCUMENT_MIME,
  MAX_DOCUMENT_BYTES,
  type DocumentTypeDef,
  type DocumentStatus,
} from "@/lib/property-documents-catalog";
import {
  getDocumentsByProperty,
  savePropertyDocumentMeta,
  uploadDocumentFile,
  deletePropertyDocument,
} from "@/integrations/firebase/services/documents.service";
import type { PropertyDocument } from "@/integrations/firebase/types";

export function PropertyDocumentsSection({
  propertyId,
  orgId,
}: {
  propertyId: string;
  orgId: string;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<DocumentTypeDef | null>(null);
  const [editingNotesFor, setEditingNotesFor] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryKey = ["property_documents", propertyId];

  const { data: documents = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => getDocumentsByProperty(propertyId),
  });

  const uploadMutation = useMutation({
    mutationFn: async ({
      docType,
      file,
    }: {
      docType: DocumentTypeDef;
      file: File;
    }) => {
      const { path, url } = await uploadDocumentFile(
        orgId,
        propertyId,
        file,
        file.name
      );

      const existing = documents.find((d) => d.document_type === docType.id);

      await savePropertyDocumentMeta({
        id: existing?.id,
        organization_id: orgId,
        property_id: propertyId,
        category: docType.category,
        document_type: docType.id,
        file_path: path,
        file_url: url,
        status: "pendiente",
        uploaded_by: user?.uid,
        uploaded_at: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      toast.success("Documento subido correctamente.");
      queryClient.invalidateQueries({ queryKey });
    },
    onError: (err: any) => {
      toast.error(err?.message || "Error al subir documento.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: PropertyDocument) => {
      await deletePropertyDocument(doc.id, doc.file_path);
    },
    onSuccess: () => {
      toast.success("Documento eliminado.");
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const updateNotesMutation = useMutation({
    mutationFn: async ({
      docId,
      docType,
      notes,
    }: {
      docId?: string;
      docType: DocumentTypeDef;
      notes: string;
    }) => {
      await savePropertyDocumentMeta({
        id: docId,
        organization_id: orgId,
        property_id: propertyId,
        category: docType.category,
        document_type: docType.id,
        notes,
      });
    },
    onSuccess: () => {
      toast.success("Notas actualizadas.");
      setEditingNotesFor(null);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const docByType = useMemo(() => {
    const map = new Map<string, PropertyDocument>();
    documents.forEach((d) => map.set(d.document_type, d));
    return map;
  }, [documents]);

  const stats = useMemo(() => {
    const uploaded = documents.filter((d) => Boolean(d.file_url)).length;
    const percentage = Math.round((uploaded / TOTAL_DOCUMENT_TYPES) * 100);
    return { uploaded, percentage };
  }, [documents]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedType) return;

    if (file.size > MAX_DOCUMENT_BYTES) {
      toast.error("El archivo excede el límite de 15MB.");
      return;
    }
    uploadMutation.mutate({ docType: selectedType, file });
    e.target.value = "";
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-card p-5">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Expediente Digital de la Propiedad
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stats.uploaded} de {TOTAL_DOCUMENT_TYPES} documentos recopilados.
          </p>
        </div>
        <div className="w-full sm:w-64 space-y-1.5">
          <div className="flex justify-between text-xs font-medium">
            <span>Progreso del expediente</span>
            <span>{stats.percentage}%</span>
          </div>
          <Progress value={stats.percentage} className="h-2" />
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_DOCUMENT_EXT.join(",")}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="space-y-6">
        {DOCUMENT_CATEGORIES.map((category) => {
          const catTypes = PROPERTY_DOCUMENT_TYPES.filter(
            (t) => t.category === category
          );
          return (
            <div
              key={category}
              className="rounded-xl border border-border bg-card overflow-hidden"
            >
              <div className="border-b border-border bg-muted/40 px-5 py-3">
                <h4 className="text-sm font-semibold text-foreground">
                  {DOCUMENT_CATEGORY_LABELS[category]}
                </h4>
              </div>
              <div className="divide-y divide-border">
                {catTypes.map((t) => {
                  const docItem = docByType.get(t.id);
                  const isEditingNotes = editingNotesFor === t.id;

                  return (
                    <div key={t.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">
                              {t.label}
                            </span>
                            {t.required && (
                              <Badge variant="outline" className="text-[10px] py-0">
                                Requerido
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {t.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {docItem?.file_url ? (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(docItem.file_url!)}
                              >
                                <Download className="h-3.5 w-3.5 mr-1.5" />
                                Ver
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => deleteMutation.mutate(docItem)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedType(t);
                                fileInputRef.current?.click();
                              }}
                              disabled={uploadMutation.isPending}
                            >
                              <Upload className="h-3.5 w-3.5 mr-1.5" />
                              Subir
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Notas */}
                      {isEditingNotes ? (
                        <div className="space-y-2 pt-2">
                          <Textarea
                            placeholder="Notas o comentarios sobre este documento..."
                            rows={2}
                            value={notesDraft}
                            onChange={(e) => setNotesDraft(e.target.value)}
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingNotesFor(null)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              size="sm"
                              onClick={() =>
                                updateNotesMutation.mutate({
                                  docId: docItem?.id,
                                  docType: t,
                                  notes: notesDraft,
                                })
                              }
                            >
                              Guardar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                          <span className="italic">
                            {docItem?.notes ? `Nota: ${docItem.notes}` : "Sin notas adicionales."}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingNotesFor(t.id);
                              setNotesDraft(docItem?.notes || "");
                            }}
                            className="text-primary hover:underline inline-flex items-center gap-1"
                          >
                            <StickyNote className="h-3 w-3" />
                            {docItem?.notes ? "Editar nota" : "Agregar nota"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
