import { useCallback, useRef, useState, type PointerEvent } from "react";
import {
  ImagePlus,
  Loader2,
  Trash2,
  Star,
  AlertCircle,
  GripVertical,
} from "lucide-react";
import { toast } from "sonner";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";

import { storage } from "@/integrations/firebase/client";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { PropertyImage } from "@/lib/property-images";
import {
  ACCEPTED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  createImageVersions,
} from "@/lib/image-processing";

type PendingItem = {
  id: string;
  name: string;
  status: "processing" | "uploading" | "error";
};

export function PropertyImagesSection({
  orgId,
  propertyId,
  altBase,
  value,
  onChange,
}: {
  orgId: string;
  propertyId: string;
  altBase: string;
  value: PropertyImage[];
  onChange: (next: PropertyImage[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<number | null>(null);
  const activePointerRef = useRef<{ index: number; pointerId: number } | null>(
    null,
  );

  const latestRef = useRef(value);
  latestRef.current = value;

  const commit = useCallback(
    (next: PropertyImage[]) => {
      const reindexed = next.map((img, idx) => ({ ...img, sort_order: idx }));
      onChange(reindexed);
    },
    [onChange],
  );

  const uploadOne = useCallback(
    async (file: File) => {
      const pendingId = crypto.randomUUID();
      const item: PendingItem = {
        id: pendingId,
        name: file.name,
        status: "processing",
      };
      setPending((p) => [...p, item]);

      const fail = (msg: string) => {
        toast.error(`"${file.name}": ${msg}`);
        setPending((p) => p.filter((it) => it.id !== pendingId));
      };

      try {
        if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
          return fail("formato no permitido (usa JPG, PNG o WebP)");
        }
        if (file.size > MAX_UPLOAD_BYTES) {
          return fail("supera el límite de 5MB");
        }

        const { full, thumb } = await createImageVersions(file);

        setPending((p) =>
          p.map((it) =>
            it.id === pendingId ? { ...it, status: "uploading" } : it,
          ),
        );

        const base = crypto.randomUUID();
        const fullPath = `property-images/${orgId}/${propertyId}/full/${base}.webp`;
        const thumbPath = `property-images/${orgId}/${propertyId}/thumb/${base}.webp`;

        const fullRef = storageRef(storage, fullPath);
        const thumbRef = storageRef(storage, thumbPath);

        await Promise.all([
          uploadBytes(fullRef, full, { contentType: "image/webp" }),
          uploadBytes(thumbRef, thumb, { contentType: "image/webp" }),
        ]);

        const [fullUrl, thumbUrl] = await Promise.all([
          getDownloadURL(fullRef),
          getDownloadURL(thumbRef),
        ]);

        commit([
          ...latestRef.current,
          {
            full_url: fullUrl,
            thumb_url: thumbUrl,
            alt: altBase,
            sort_order: latestRef.current.length,
          },
        ]);

        setPending((p) => p.filter((it) => it.id !== pendingId));
      } catch (e) {
        fail(e instanceof Error ? e.message : "error al subir");
      }
    },
    [orgId, propertyId, altBase, commit],
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      void list.reduce(
        (chain, file) => chain.then(() => uploadOne(file)),
        Promise.resolve(),
      );
    },
    [uploadOne],
  );

  const removeAt = async (index: number) => {
    commit(latestRef.current.filter((_, i) => i !== index));
  };

  const moveImage = (from: number, to: number) => {
    if (from === to) return;
    const next = [...latestRef.current];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    commit(next);
  };

  const makeCover = (index: number) => {
    if (index === 0) return;
    moveImage(index, 0);
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Fotos de la propiedad
            </h3>
            <p className="text-xs text-muted-foreground">
              Arrastra para reordenar. La primera foto es la portada principal.
            </p>
          </div>
          <span className="text-xs text-muted-foreground">
            {value.length} {value.length === 1 ? "foto" : "fotos"}
          </span>
        </div>

        {/* Drop zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragOver(false);
            if (e.dataTransfer.files?.length) {
              handleFiles(e.dataTransfer.files);
            }
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors",
            isDragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/40",
          )}
        >
          <ImagePlus className="h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm font-medium text-foreground">
            Haz clic para subir o arrastra tus fotos aquí
          </p>
          <p className="text-xs text-muted-foreground">
            JPG, PNG o WebP hasta 5MB por imagen.
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                handleFiles(e.target.files);
                e.target.value = "";
              }
            }}
          />
        </div>

        {/* Pending uploads */}
        {pending.length > 0 && (
          <div className="space-y-2">
            {pending.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded border border-border bg-muted/30 px-3 py-2 text-xs"
              >
                <span className="truncate max-w-[200px] text-foreground font-medium">
                  {item.name}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {item.status === "processing" ? "Optimizando WebP..." : "Subiendo a Firebase..."}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Existing gallery */}
        {value.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {value.map((img, idx) => (
              <div
                key={img.full_url + idx}
                className="group relative aspect-video overflow-hidden rounded-lg border border-border bg-muted"
              >
                <img
                  src={img.thumb_url || img.full_url}
                  alt={img.alt || "Foto de propiedad"}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => makeCover(idx)}
                    title="Hacer portada"
                    className={cn(
                      "rounded p-1.5 transition-colors",
                      idx === 0
                        ? "bg-amber-500 text-white"
                        : "bg-black/60 text-white hover:bg-black/80"
                    )}
                  >
                    <Star className="h-4 w-4 fill-current" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(idx)}
                    title="Eliminar foto"
                    className="rounded bg-destructive p-1.5 text-destructive-foreground hover:bg-destructive/90"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                {idx === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow">
                    Portada
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        <AlertDialog
          open={pendingDelete !== null}
          onOpenChange={(open) => !open && setPendingDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar esta foto?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción removerá la imagen de la galería de la propiedad.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (pendingDelete !== null) {
                    removeAt(pendingDelete);
                    setPendingDelete(null);
                  }
                }}
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
