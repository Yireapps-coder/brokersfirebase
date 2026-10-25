import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db } from "../client";
import type { Organization } from "../types";

const COLLECTION = "organizations";

export async function getOrganizationById(orgId: string): Promise<Organization | null> {
  const snap = await getDoc(doc(db, COLLECTION, orgId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Organization;
}

export async function getOrganizationBySlug(slug: string): Promise<Organization | null> {
  const q = query(collection(db, COLLECTION), where("slug", "==", slug), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Organization;
}

export async function updateOrganization(
  orgId: string,
  data: Partial<Omit<Organization, "id" | "created_at">>
): Promise<void> {
  const ref = doc(db, COLLECTION, orgId);
  await updateDoc(ref, {
    ...data,
    updated_at: new Date().toISOString(),
  });
}

export async function createOrganization(org: Omit<Organization, "created_at">): Promise<string> {
  const ref = doc(db, COLLECTION, org.id);
  await setDoc(ref, {
    ...org,
    created_at: new Date().toISOString(),
  });
  return org.id;
}
