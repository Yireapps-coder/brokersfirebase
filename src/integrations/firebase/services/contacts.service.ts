import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  addDoc,
} from "firebase/firestore";
import { db } from "../client";
import type { Contact } from "../types";

const COLLECTION = "contacts";

export async function getContactsByOrg(orgId: string): Promise<Contact[]> {
  const q = query(collection(db, COLLECTION), where("organization_id", "==", orgId));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Contact);
  return list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

export async function saveContact(contact: Partial<Contact> & { organization_id: string }): Promise<string> {
  const isNew = !contact.id;
  const ref = isNew ? doc(collection(db, COLLECTION)) : doc(db, COLLECTION, contact.id!);
  const id = ref.id;

  const now = new Date().toISOString();
  await setDoc(
    ref,
    {
      ...contact,
      id,
      updated_at: now,
      ...(isNew ? { created_at: now, status: contact.status || "nuevo" } : {}),
    },
    { merge: true }
  );
  return id;
}

export async function updateContactStatus(id: string, status: Contact["status"]): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    status,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteContact(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}

export async function createPublicLead(data: {
  organization_id: string;
  property_id?: string;
  full_name: string;
  phone: string;
  email?: string;
  message?: string;
  source?: "portal_web" | "facebook";
}): Promise<string> {
  const now = new Date().toISOString();
  const docRef = await addDoc(collection(db, COLLECTION), {
    organization_id: data.organization_id,
    property_id: data.property_id || null,
    full_name: data.full_name,
    phone: data.phone,
    email: data.email || null,
    notes: data.message || null,
    source: data.source || "portal_web",
    status: "nuevo",
    created_at: now,
    updated_at: now,
  });
  return docRef.id;
}
