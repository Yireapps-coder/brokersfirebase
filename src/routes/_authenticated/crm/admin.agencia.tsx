import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, Upload, Loader2, ImageOff, Image as ImageIcon, FileText, ExternalLink } from "lucide-react";
import { toast } from "sonner";

import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/integrations/firebase/client";
import { updateOrganization } from "@/integrations/firebase/services/organizations.service";
import { useAuth } from "@/hooks/use-auth";
import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/_authenticated/crm/admin/agencia")({
  component: AgenciaSettingsPage,
});

const navItems: NavItem[] = [
  { to: "/crm/admin/agencia", label: "Agencia", icon: Building2 },
];

const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml"];
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_HEIGHT = 200;

const COVER_ACCEPTED = ["image/png", "image/jpeg", "image/jpg"];
const COVER_MAX_BYTES = 8 * 1024 * 1024;
const COVER_MAX_WIDTH = 2000;

const DOC_MAX_BYTES = 15 * 1024 * 1024;

/** Resize a cover photo down to a max width, keeping aspect ratio. */
async function processCover(file: File): Promise<Blob> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const scale = Math.min(1, COVER_MAX_WIDTH / img.width);
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", 0.85),
  );
  return blob ?? file;
}

/** Resize a raster image to a max height, keeping aspect ratio. SVGs pass through. */
async function processLogo(file: File): Promise<Blob> {
  if (file.type === "image/svg+xml") return file;

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const scale = Math.min(1, MAX_HEIGHT / img.height);
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, width, height);

  const isPng = file.type === "image/png";
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, isPng ? "image/png" : "image/jpeg", 0.9),
  );
  return blob ?? file;
}

function AgenciaSettingsPage() {
  const { organization, role, loading, refresh } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const privacyRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [customDomain, setCustomDomain] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0.8);
  const [overlayColor, setOverlayColor] = useState("#1B4F8A");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [privacyUrl, setPrivacyUrl] = useState<string | null>(null);
  const [termsUrl, setTermsUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingPrivacy, setUploadingPrivacy] = useState(false);
  const [uploadingTerms, setUploadingTerms] = useState(false);
  const [saving, setSaving] = useState(false);


  const isSuperAdmin = role === "super_admin";

  useEffect(() => {
    if (!loading && role === "agent") {
      navigate({ to: "/crm/dashboard", replace: true });
    }
  }, [loading, role, navigate]);

  useEffect(() => {
    if (organization) {
      setName(organization.name ?? "");
      setWhatsapp(organization.whatsapp_number ?? "");
      setPhone(organization.phone ?? "");
      setAddress(organization.address ?? "");
      setCustomDomain(organization.custom_domain ?? "");
      setLogoUrl(organization.logo_url ?? null);
      setCoverUrl(organization.hero_image_url ?? null);
      setOverlayOpacity(
        organization.hero_overlay_opacity == null
          ? 0.8
          : Number(organization.hero_overlay_opacity),
      );
      setOverlayColor(organization.hero_overlay_color ?? "#1B4F8A");
      setFacebookUrl(organization.facebook_url ?? "");
      setInstagramUrl(organization.instagram_url ?? "");
      setLinkedinUrl(organization.linkedin_url ?? "");
      setTiktokUrl(organization.tiktok_url ?? "");
      setPrivacyUrl(organization.privacy_url ?? null);
      setTermsUrl(organization.terms_url ?? null);
    }
  }, [organization]);

  /** Normalizes user input into a bare host: strips scheme, www, paths and casing. */
  function normalizeDomain(input: string): string | null {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return null;
    const host = trimmed
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/^www\./, "")
      .split(":")[0];
    return host || null;
  }

  /** Normalizes a link: trims and prepends https:// when a scheme is missing. */
  function normalizeUrl(input: string): string | null {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  }



  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !organization) return;

    if (!ACCEPTED.includes(file.type)) {
      toast.error("Formato no válido", {
        description: "Sube una imagen PNG, JPG o SVG.",
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Archivo muy grande", { description: "El máximo es 2 MB." });
      return;
    }

    setUploading(true);
    try {
      const processed = await processLogo(file);
      const ext = file.type === "image/svg+xml" ? "svg" : file.type === "image/png" ? "png" : "jpg";
      const path = `${organization.id}/logo-${Date.now()}.${ext}`;

      const sRef = storageRef(storage, `agencies/${organization.id}/logo-${Date.now()}.${ext}`); await uploadBytes(sRef, processed, { contentType: file.type }); const publicUrl = await getDownloadURL(sRef);

      await updateOrganization(organization.id, { logo_url: publicUrl });

      setLogoUrl(publicUrl);
      await refresh();
      toast.success("Logo actualizado");
    } catch (err) {
      toast.error("No se pudo subir el logo", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !organization) return;

    if (!COVER_ACCEPTED.includes(file.type)) {
      toast.error("Formato no válido", {
        description: "Sube una imagen PNG o JPG.",
      });
      return;
    }
    if (file.size > COVER_MAX_BYTES) {
      toast.error("Archivo muy grande", { description: "El máximo es 8 MB." });
      return;
    }

    setUploadingCover(true);
    try {
      const processed = await processCover(file);
      const path = `${organization.id}/cover-${Date.now()}.jpg`;

      const sRef = storageRef(storage, `agencies/${organization.id}/logo-${Date.now()}.${ext}`); await uploadBytes(sRef, processed, { contentType: file.type }); const publicUrl = await getDownloadURL(sRef);

      await updateOrganization(organization.id, { hero_image_url: publicUrl });

      setCoverUrl(publicUrl);
      await refresh();
      toast.success("Imagen de portada actualizada");
    } catch (err) {
      toast.error("No se pudo subir la imagen", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setUploadingCover(false);
    }
  };



  /** Uploads a public legal document (PDF) and stores its URL on the org. */
  const handleDoc = async (
    e: React.ChangeEvent<HTMLInputElement>,
    kind: "privacy" | "terms",
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !organization) return;

    if (file.type !== "application/pdf") {
      toast.error("Formato no válido", { description: "Sube un archivo PDF." });
      return;
    }
    if (file.size > DOC_MAX_BYTES) {
      toast.error("Archivo muy grande", { description: "El máximo es 15 MB." });
      return;
    }

    const setBusy = kind === "privacy" ? setUploadingPrivacy : setUploadingTerms;
    const prefix = kind === "privacy" ? "aviso-privacidad" : "terminos-condiciones";
    setBusy(true);
    try {
      const path = `${organization.id}/${prefix}-${Date.now()}.pdf`;
      const sRef = storageRef(storage, `agencies/${organization.id}/logo-${Date.now()}.${ext}`); await uploadBytes(sRef, processed, { contentType: file.type }); const publicUrl = await getDownloadURL(sRef);

      await updateOrganization(organization.id, kind === "privacy" ? { privacy_url: publicUrl } : { terms_url: publicUrl });

      if (kind === "privacy") setPrivacyUrl(publicUrl);
      else setTermsUrl(publicUrl);
      await refresh();
      toast.success("Documento subido");
    } catch (err) {
      toast.error("No se pudo subir el documento", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!organization) return;
    setSaving(true);
    try {
      await updateOrganization(organization.id, { name: name.trim() || organization.name, whatsapp_number: whatsapp.trim() || null, phone: phone.trim() || null, address: address.trim() || null, hero_overlay_opacity: overlayOpacity, hero_overlay_color: overlayColor, facebook_url: normalizeUrl(facebookUrl), instagram_url: normalizeUrl(instagramUrl), linkedin_url: normalizeUrl(linkedinUrl), tiktok_url: normalizeUrl(tiktokUrl) });
      await refresh();
      toast.success("Datos guardados");
    } catch (err) {
      toast.error("No se pudieron guardar los datos", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };


  return (
    <AppShell title="Agencia" items={navItems}>
      <PageHeader
        title="Datos de la agencia"
        subtitle="Personaliza el logo y la información de contacto de tu portal público."
      />

      <div className="grid max-w-3xl gap-6">
        {/* Logo */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold text-foreground">Logotipo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              PNG, JPG o SVG. Máximo 2 MB. Se ajusta automáticamente a 200 px de alto.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <div className="flex h-24 w-44 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo de la agencia"
                    className="max-h-20 w-auto object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ImageOff className="h-5 w-5" />
                    <span className="text-xs">Sin logo</span>
                  </div>
                )}
              </div>

              <div>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
                  className="hidden"
                  onChange={handleFile}
                />
                <Button
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {logoUrl ? "Reemplazar logo" : "Subir logo"}
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Si no subes un logo, se mostrará el nombre de la agencia.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cover image */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-base font-semibold text-foreground">
              Imagen de portada
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Es la imagen principal del portal público. PNG o JPG. Máximo 8 MB.
            </p>

            {/* Live preview with overlay */}
            <div className="mt-4 relative aspect-[16/6] w-full overflow-hidden rounded-lg border border-border bg-muted">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt="Imagen de portada"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-muted-foreground">
                  <ImageIcon className="h-6 w-6" />
                  <span className="text-xs">
                    Sin imagen (se usa la portada por defecto)
                  </span>
                </div>
              )}
              <div
                className="absolute inset-0 bg-gradient-to-b from-primary to-primary/80"
                style={{ opacity: overlayOpacity }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-foreground">
                  Vista previa
                </span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <input
                ref={coverRef}
                type="file"
                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                className="hidden"
                onChange={handleCover}
              />
              <Button
                variant="outline"
                onClick={() => coverRef.current?.click()}
                disabled={uploadingCover}
              >
                {uploadingCover ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {coverUrl ? "Reemplazar imagen" : "Subir imagen"}
              </Button>
            </div>

            {/* Overlay opacity */}
            <div className="mt-6 grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="overlay-opacity">Opacidad del filtro</Label>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {Math.round(overlayOpacity * 100)}%
                </span>
              </div>
              <Slider
                id="overlay-opacity"
                min={0}
                max={1}
                step={0.05}
                value={[overlayOpacity]}
                onValueChange={(v) => setOverlayOpacity(v[0] ?? 0)}
              />
              <p className="text-xs text-muted-foreground">
                Controla qué tan oscuro se ve el filtro de color sobre la imagen.
                Recuerda guardar los cambios.
              </p>
            </div>

            {/* Overlay color */}
            <div className="mt-6 grid gap-2">
              <Label htmlFor="overlay-color">Color del filtro</Label>
              <div className="flex items-center gap-3">
                <input
                  id="overlay-color"
                  type="color"
                  value={overlayColor}
                  onChange={(e) => setOverlayColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-md border border-border bg-background p-1"
                />
                <Input
                  value={overlayColor}
                  onChange={(e) => setOverlayColor(e.target.value)}
                  placeholder="#1B4F8A"
                  className="w-32 font-mono uppercase"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Elige el color que cubre la imagen de portada. Recuerda guardar
                los cambios.
              </p>
            </div>
          </CardContent>
        </Card>



        {/* Contact info */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-base font-semibold text-foreground">Información</h2>

            <div className="grid gap-2">
              <Label htmlFor="org-name">Nombre de la agencia</Label>
              <Input
                id="org-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Inmobiliaria Demo"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="org-whatsapp">WhatsApp</Label>
                <Input
                  id="org-whatsapp"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+52 55 1234 5678"
                  inputMode="tel"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="org-phone">Teléfono</Label>
                <Input
                  id="org-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="55 1234 5678"
                  inputMode="tel"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="org-address">Dirección</Label>
              <Textarea
                id="org-address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle, número, colonia, ciudad, estado"
                rows={2}
              />
            </div>

            {isSuperAdmin && (
              <div className="grid gap-2">
                <Label htmlFor="org-domain">Dominio propio</Label>
                <Input
                  id="org-domain"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="ejemplo.com"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
                <p className="text-xs text-muted-foreground">
                  Solo el super administrador puede configurar el dominio. El
                  portal público responderá a este dominio; también debes
                  conectarlo en la configuración del proyecto y apuntar el DNS a
                  Lovable para que funcione.
                </p>
              </div>
            )}





          </CardContent>
        </Card>

        {/* Social media links */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-base font-semibold text-foreground">
              Redes sociales
            </h2>
            <p className="text-sm text-muted-foreground">
              Estos enlaces aparecen en el pie de página del portal público. Si
              dejas una red en blanco, se ocultará automáticamente.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="org-facebook">Facebook</Label>
                <Input
                  id="org-facebook"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/tuagencia"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="org-instagram">Instagram</Label>
                <Input
                  id="org-instagram"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/tuagencia"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="org-linkedin">LinkedIn</Label>
                <Input
                  id="org-linkedin"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  placeholder="https://linkedin.com/company/tuagencia"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="org-tiktok">TikTok</Label>
                <Input
                  id="org-tiktok"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="https://tiktok.com/@tuagencia"
                  inputMode="url"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal documents */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <h2 className="text-base font-semibold text-foreground">
              Documentos legales
            </h2>
            <p className="text-sm text-muted-foreground">
              Sube el aviso de privacidad y los términos y condiciones en PDF
              (máximo 15 MB). Son públicos y aparecen en el pie de página del
              portal. Se guardan al subirlos.
            </p>

            <input
              ref={privacyRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => handleDoc(e, "privacy")}
            />
            <input
              ref={termsRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => handleDoc(e, "terms")}
            />

            <LegalDocRow
              label="Aviso de privacidad"
              url={privacyUrl}
              uploading={uploadingPrivacy}
              onUpload={() => privacyRef.current?.click()}
            />
            <LegalDocRow
              label="Términos y condiciones"
              url={termsUrl}
              uploading={uploadingTerms}
              onUpload={() => termsRef.current?.click()}
            />
          </CardContent>
        </Card>


        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Guardar cambios
          </Button>
        </div>
      </div>
    </AppShell>
  );
}

function LegalDocRow({
  label,
  url,
  uploading,
  onUpload,
}: {
  label: string;
  url: string | null;
  uploading: boolean;
  onUpload: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
      <div className="flex min-w-0 items-center gap-2">
        <FileText className="h-5 w-5 shrink-0 text-primary" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              Ver documento <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <p className="text-xs text-muted-foreground">Sin documento</p>
          )}
        </div>
      </div>
      <Button variant="outline" size="sm" onClick={onUpload} disabled={uploading}>
        {uploading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Upload className="h-4 w-4" />
        )}
        {url ? "Reemplazar" : "Subir PDF"}
      </Button>
    </div>
  );
}


