import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  type User,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/integrations/firebase/client";
import type { AppRole, Profile, Organization } from "@/integrations/firebase/types";

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  organization: Organization | null;
  role: AppRole | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function roleHome(role: AppRole | null): string {
  if (role === "super_admin") return "/admin";
  return "/crm/dashboard";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (firebaseUser: User) => {
    try {
      const profSnap = await getDoc(doc(db, "profiles", firebaseUser.uid));
      if (profSnap.exists()) {
        const profData = { id: profSnap.id, ...profSnap.data() } as Profile;
        setProfile(profData);
        setRole(profData.role);

        if (profData.organization_id) {
          const orgSnap = await getDoc(doc(db, "organizations", profData.organization_id));
          if (orgSnap.exists()) {
            setOrganization({ id: orgSnap.id, ...orgSnap.data() } as Organization);
          } else {
            setOrganization(null);
          }
        } else {
          setOrganization(null);
        }
      } else {
        setProfile(null);
        setOrganization(null);
        setRole(null);
      }
    } catch (e) {
      console.error("Error al cargar perfil de usuario:", e);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (user) await loadUserData(user);
  }, [user, loadUserData]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser);
      if (fbUser) {
        await loadUserData(fbUser);
      } else {
        setProfile(null);
        setOrganization(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserData]);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      return { error: null };
    } catch (err: any) {
      let message = "Credenciales incorrectas o usuario no registrado.";
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        message = "El correo o la contraseña son incorrectos.";
      } else if (err.code === "auth/user-not-found") {
        message = "No existe una cuenta registrada con este correo.";
      } else if (err.code === "auth/too-many-requests") {
        message = "Demasiados intentos fallidos. Inténtalo más tarde.";
      }
      return { error: message };
    }
  }, []);

  const signOut = useCallback(async () => {
    await fbSignOut(auth);
    setUser(null);
    setProfile(null);
    setOrganization(null);
    setRole(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        organization,
        role,
        loading,
        signIn,
        signOut,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
}
