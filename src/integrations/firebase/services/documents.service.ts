import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { db, storage } from "../client";
import type { PropertyDocument } from "../types";

const COLLECTION = "property_documents";

export async function getDocumentsByProperty(propertyId: string): Promise<PropertyDocument[]> {
  const q = query(collection(db, COLLECTION), where("property_id", "==", propertyId));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PropertyDocument);
  return list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

export async function savePropertyDocumentMeta(
  data: Partial<PropertyDocument> & { organization_id: string; property_id: string }
): Promise<string> {
  const isNew = !data.id;
  const ref = isNew ? doc(collection(db, COLLECTION)) : doc(db, COLLECTION, data.id!);
  const id = ref.id;

  await setDoc(
    ref,
    {
      ...data,
      id,
      ...(isNew ? { created_at: new Date().toISOString(), status: data.status || "pendiente" } : {}),
    },
    { merge: true }
  );
  return id;
}

export async function uploadDocumentFile(
  orgId: string,
  propertyId: string,
  file: File,
  filename: string
): Promise<{ path: string; url: string }> {
  const filePath = `property-documents/${orgId}/${propertyId}/${Date.now()}_${filename}`;
  const sRef = storageRef(storage, filePath);
  await uploadBytes(sRef, file);
  const url = await getDownloadURL(sRef);
  return { path: filePath, url };
}

export async function deletePropertyDocument(id: string, filePath?: string | null): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
  if (filePath) {
    try {
      await deleteObject(storageRef(storage, filePath));
    } catch (e) {
      console.warn("No se pudo eliminar el archivo en Storage:", e);
    }
  }
}
