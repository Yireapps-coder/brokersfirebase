import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../client";
import type { Property, PropertyStatus } from "../types";

const COLLECTION = "properties";

export async function getPropertiesByOrg(orgId: string): Promise<Property[]> {
  try {
    const q = query(
      collection(db, COLLECTION),
      where("organization_id", "==", orgId),
      orderBy("created_at", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Property);
  } catch {
    // Fallback sin orderBy en caso de que los índices aún se estén aprovisionando
    const qFallback = query(collection(db, COLLECTION), where("organization_id", "==", orgId));
    const snap = await getDocs(qFallback);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Property);
    return list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  }
}

export async function getPublicProperties(orgId?: string): Promise<Property[]> {
  try {
    let q = query(
      collection(db, COLLECTION),
      where("status", "==", "disponible")
    );
    if (orgId) {
      q = query(q, where("organization_id", "==", orgId));
    }
    const snap = await getDocs(q);
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Property);
    return list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
  } catch (error) {
    console.error("Error al obtener propiedades públicas:", error);
    return [];
  }
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const snap = await getDoc(doc(db, COLLECTION, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Property;
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const q = query(collection(db, COLLECTION), where("slug", "==", slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) {
    // Si no lo encuentra por slug, intentamos buscar por ID directo
    return getPropertyById(slug);
  }
  const d = snap.docs[0];
  return { id: d.id, ...d.data() } as Property;
}

export async function saveProperty(property: Partial<Property> & { organization_id: string }): Promise<string> {
  const isNew = !property.id;
  const ref = isNew ? doc(collection(db, COLLECTION)) : doc(db, COLLECTION, property.id!);
  const id = ref.id;

  const now = new Date().toISOString();
  const payload = {
    ...property,
    id,
    updated_at: now,
    ...(isNew ? { created_at: now, views_count: 0 } : {}),
  };

  await setDoc(ref, payload, { merge: true });
  return id;
}

export async function updatePropertyStatus(id: string, status: PropertyStatus): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    status,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteProperty(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
