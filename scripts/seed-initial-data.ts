/**
 * Script de inicialización de datos para BrokersFirebase.
 *
 * Puedes ejecutarlo directamente o desde la consola para crear:
 * 1. La agencia / organización inicial
 * 2. La primera propiedad (la casa de tu cliente)
 *
 * Uso: npx tsx scripts/seed-initial-data.ts
 */

import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { firebaseConfig } from "../src/integrations/firebase/client";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  console.log("Iniciando seed para BrokersFirebase...");

  const orgId = "agencia_principal";
  const now = new Date().toISOString();

  // 1. Crear Organización
  const orgRef = doc(db, "organizations", orgId);
  await setDoc(
    orgRef,
    {
      id: orgId,
      name: "Brokers Inmobiliaria",
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
  console.log("Organización creada / verificada.");

  // 2. Crear la Primera Propiedad (Casa del Cliente)
  const propId = "casa-muestra-01";
  const propRef = doc(db, "properties", propId);
  await setDoc(
    propRef,
    {
      id: propId,
      organization_id: orgId,
      internal_id: "CS-001",
      folio: "FOL-1001",
      slug: "hermosa-casa-en-venta",
      title: "Hermosa Casa Residencial",
      description:
        "Excelente propiedad con acabados de primera calidad, amplios espacios, iluminación natural y ubicación inmejorable.",
      property_type: "house",
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
      created_at: now,
      updated_at: now,
    },
    { merge: true }
  );
  console.log("Primera casa registrada con éxito en Firestore.");
  console.log("¡Seed completado con éxito!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Error en seed:", err);
  process.exit(1);
});
