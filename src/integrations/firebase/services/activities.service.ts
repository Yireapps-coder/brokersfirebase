import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../client";
import type { Activity } from "../types";

const COLLECTION = "activities";

export async function getActivitiesByOrg(orgId: string): Promise<Activity[]> {
  const q = query(collection(db, COLLECTION), where("organization_id", "==", orgId));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Activity);
  return list.sort((a, b) => (b.scheduled_at || b.created_at || "").localeCompare(a.scheduled_at || a.created_at || ""));
}

export async function saveActivity(act: Partial<Activity> & { organization_id: string }): Promise<string> {
  const isNew = !act.id;
  const ref = isNew ? doc(collection(db, COLLECTION)) : doc(db, COLLECTION, act.id!);
  const id = ref.id;

  await setDoc(
    ref,
    {
      ...act,
      id,
      ...(isNew ? { created_at: new Date().toISOString(), status: act.status || "pendiente" } : {}),
    },
    { merge: true }
  );
  return id;
}

export async function updateActivityStatus(id: string, status: Activity["status"]): Promise<void> {
  await updateDoc(doc(db, COLLECTION, id), {
    status,
    completed_at: status === "completada" ? new Date().toISOString() : null,
  });
}

export async function deleteActivity(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, id));
}
