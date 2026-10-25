import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../client";
import type { PropertyOwner } from "../types";

const COLLECTION = "property_owners";

export async function getOwnersByOrg(orgId: string): Promise<PropertyOwner[]> {
  const q = query(collection(db, COLLECTION), where("organization_id", "==", orgId));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as PropertyOwner);
  return list.sort((a, b) => (b.created_at || "").localeCompare(a.created_at || ""));
}

export async function saveOwner(owner: Partial<PropertyOwner> & { organization_id: string }): Promise<string> {
  const isNew = !owner.id;
  const ref = isNew ? doc(collection(db, COLLECTION)) : doc(db, COLLECTION, owner.id!);
  const id = ref.id;

  await setDoc(
    ref,
    {
      ...owner,
      id,
      ...(isNew ? { created_at: new Date().toISOString() } : {}),
    },
    { merge: true }
  );
  return id;
}

export async function deleteOwner(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
