import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import { db, auth, getSecondaryAdminAuth } from "../client";
import type { Profile, AppRole } from "../types";

const COLLECTION = "profiles";

export async function getTeamMembers(orgId: string): Promise<Profile[]> {
  const q = query(collection(db, COLLECTION), where("organization_id", "==", orgId));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Profile);
  return list.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
}

export async function getProfileById(userId: string): Promise<Profile | null> {
  const snap = await getDoc(doc(db, COLLECTION, userId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Profile;
}

export async function createTeamMember({
  email,
  password,
  fullName,
  phone,
  role,
  organizationId,
}: {
  email: string;
  password?: string;
  fullName: string;
  phone?: string;
  role: AppRole;
  organizationId: string;
}): Promise<Profile> {
  const secondaryAuth = getSecondaryAdminAuth();
  const tempPassword = password || "Brokers@" + Math.random().toString(36).slice(-6) + "!";
  
  // Creamos el usuario en Auth usando la app secundaria para no cerrar la sesión del admin
  const cred = await createUserWithEmailAndPassword(secondaryAuth, email.trim(), tempPassword);
  const uid = cred.user.uid;
  await signOut(secondaryAuth);

  const profile: Profile = {
    id: uid,
    email: email.trim().toLowerCase(),
    full_name: fullName.trim(),
    phone: phone?.trim() || null,
    organization_id: organizationId,
    role,
    status: "active",
    created_at: new Date().toISOString(),
  };

  await setDoc(doc(db, COLLECTION, uid), profile);
  return profile;
}

export async function updateMemberRole(userId: string, role: AppRole): Promise<void> {
  await updateDoc(doc(db, COLLECTION, userId), {
    role,
    updated_at: new Date().toISOString(),
  });
}

export async function updateMemberStatus(userId: string, status: "active" | "inactive"): Promise<void> {
  await updateDoc(doc(db, COLLECTION, userId), {
    status,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteTeamMember(userId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION, userId));
}

export async function sendMemberPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}
