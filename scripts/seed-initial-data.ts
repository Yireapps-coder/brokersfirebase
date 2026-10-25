/**
 * Script de inicialización de datos para BrokersFirebase.
 *
 * Crea la cuenta de Administrador Inicial en Firebase Auth,
 * la Organización inmobiliaria y la primera Propiedad (Casa del cliente).
 *
 * Uso: npx tsx scripts/seed-initial-data.ts [email] [password]
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { firebaseConfig } from "../src/integrations/firebase/client";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function seed() {
  const email = process.argv[2] || "admin@brokers.com";
  const password = process.argv[3] || "Brokers2026!";

  console.log(`\nIniciando configuración inicial en BrokersFirebase...`);
  console.log(`Usuario administrador: ${email}`);

  let uid = "";

  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    uid = cred.user.uid;
    console.log(`✔ Cuenta de administrador creada en Firebase Auth (UID: ${uid})`);
  } catch (err: any) {
    if (err.code === "auth/email-already-in-use") {
      console.log(`ℹ La cuenta ya existía en Firebase Auth. Iniciando sesión...`);
      const cred = await signInWithEmailAndPassword(auth, email, password);
      uid = cred.user.uid;
      console.log(`✔ Sesión iniciada con éxito.`);
    } else {
      throw err;
    }
  }

  const orgId = "agencia_principal";
  const now = new Date().toISOString();

  // 1. Crear / Actualizar Perfil de Administrador
  await setDoc(
    doc(db, "profiles", uid),
    {
      id: uid,
      email: email.toLowerCase(),
      full_name: "Administrador Principal",
      phone: "2221234567",
      organization_id: orgId,
      role: "super_admin",
      status: "active",
      created_at: now,
      updated_at: now,
    },
    { merge: true }
  );
  console.log(`✔ Perfil de super_admin registrado en Firestore.`);

  // 2. Crear Organización Inmobiliaria
  await setDoc(
    doc(db, "organizations", orgId),
    {
      id: orgId,
      name: "Broker's Compass",
      slug: "inmobiliaria",
      status: "active",
      phone: "2221234567",
      whatsapp_number: "522221234567",
      address: "Puebla, Pue.",
      primary_color: "#1B4F8A",
      created_at: now,
      updated_at: now,
    },
    { merge: true }
  );
  console.log(`✔ Organización 'Broker's Compass' creada con éxito.`);

  // 3. Crear Primera Propiedad (Casa del Cliente)
  const propId = "casa-residencial-01";
  const propRef = doc(db, "properties", propId);
  const existingProp = await getDoc(propRef);
  const propCreatedAt = existingProp.exists()
    ? existingProp.data()?.created_at || now
    : now;

  await setDoc(
    propRef,
    {
      id: propId,
      organization_id: orgId,
      agent_id: uid,
      internal_id: "CS-001",
      folio: "FOL-1001",
      slug: "hermosa-casa-residencial-en-venta",
      title: "Hermosa Casa Residencial",
      description:
        "Excelente propiedad con acabados de primera calidad, amplios espacios, iluminación natural y ubicación inmejorable.",
      property_type: "casa",
      operation_type: "venta",
      status: "disponible",
      price: 3850000,
      sale_price: 3850000,
      currency: "MXN",
      publish_prices: true,
      bedrooms: 3,
      bathrooms: 2,
      half_bathrooms: 1,
      parking_spaces: 2,
      construction_area_m2: 240,
      land_area_m2: 180,
      address_street: "Av. Principal",
      colonia: "La Paz",
      city: "Puebla",
      state: "Puebla",
      country: "México",
      public_latitude: 19.0414,
      public_longitude: -98.2063,
      amenity_ids: ["seguridad_privada", "jardin", "cocina_integral", "cochera_techada"],
      images: [
        {
          id: "img-1",
          url: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
          thumbUrl:
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=400&q=70",
          order: 0,
          isCover: true,
          alt: "Fachada principal",
        },
      ],
      featured: true,
      views_count: 1,
      created_at: propCreatedAt,
      updated_at: now,
    },
    { merge: true }
  );
  console.log(`✔ Propiedad de muestra completa registrada con éxito.`);

  console.log(`\n🎉 ¡Todo listo! Credenciales iniciales para ingresar:`);
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   URL CRM:  /crm/dashboard o /login\n`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
