export interface LocationOption {
  id: string;
  name: string;
}

export const COUNTRIES: LocationOption[] = [
  { id: "mx", name: "México" },
  { id: "us", name: "Estados Unidos" },
];

export const STATES_MX: LocationOption[] = [
  { id: "agu", name: "Aguascalientes" },
  { id: "bcn", name: "Baja California" },
  { id: "bcs", name: "Baja California Sur" },
  { id: "cam", name: "Campeche" },
  { id: "chp", name: "Chiapas" },
  { id: "chh", name: "Chihuahua" },
  { id: "cmx", name: "Ciudad de México" },
  { id: "coa", name: "Coahuila" },
  { id: "col", name: "Colima" },
  { id: "dur", name: "Durango" },
  { id: "gua", name: "Guanajuato" },
  { id: "gro", name: "Guerrero" },
  { id: "hid", name: "Hidalgo" },
  { id: "jal", name: "Jalisco" },
  { id: "mex", name: "Estado de México" },
  { id: "mic", name: "Michoacán" },
  { id: "mor", name: "Morelos" },
  { id: "nay", name: "Nayarit" },
  { id: "nle", name: "Nuevo León" },
  { id: "oax", name: "Oaxaca" },
  { id: "pue", name: "Puebla" },
  { id: "que", name: "Querétaro" },
  { id: "roo", name: "Quintana Roo" },
  { id: "slp", name: "San Luis Potosí" },
  { id: "sin", name: "Sinaloa" },
  { id: "son", name: "Sonora" },
  { id: "tab", name: "Tabasco" },
  { id: "tam", name: "Tamaulipas" },
  { id: "tla", name: "Tlaxcala" },
  { id: "ver", name: "Veracruz" },
  { id: "yuc", name: "Yucatán" },
  { id: "zac", name: "Zacatecas" },
];

export const CITIES_BY_STATE: Record<string, LocationOption[]> = {
  pue: [
    { id: "pue_pue", name: "Puebla" },
    { id: "pue_san_andres", name: "San Andrés Cholula" },
    { id: "pue_san_pedro", name: "San Pedro Cholula" },
    { id: "pue_cuautlancingo", name: "Cuautlancingo" },
    { id: "pue_atlixco", name: "Atlixco" },
    { id: "pue_tehuacan", name: "Tehuacán" },
  ],
  cmx: [
    { id: "cmx_bju", name: "Benito Juárez" },
    { id: "cmx_mig", name: "Miguel Hidalgo" },
    { id: "cmx_cua", name: "Cuauhtémoc" },
    { id: "cmx_ao", name: "Álvaro Obregón" },
    { id: "cmx_coy", name: "Coyoacán" },
    { id: "cmx_tla", name: "Tlalpan" },
    { id: "cmx_cuaj", name: "Cuajimalpa de Morelos" },
  ],
  jal: [
    { id: "jal_gdl", name: "Guadalajara" },
    { id: "jal_zap", name: "Zapopan" },
    { id: "jal_tlaq", name: "Tlaquepaque" },
    { id: "jal_pvr", name: "Puerto Vallarta" },
  ],
  nle: [
    { id: "nle_mty", name: "Monterrey" },
    { id: "nle_spgg", name: "San Pedro Garza García" },
    { id: "nle_sann", name: "San Nicolás de los Garza" },
    { id: "nle_gpe", name: "Guadalupe" },
    { id: "nle_sc", name: "Santa Catarina" },
  ],
  que: [
    { id: "que_qro", name: "Querétaro" },
    { id: "que_correg", name: "Corregidora" },
    { id: "que_elmarques", name: "El Marqués" },
    { id: "que_sjdr", name: "San Juan del Río" },
  ],
  roo: [
    { id: "roo_cancun", name: "Cancún (Benito Juárez)" },
    { id: "roo_playa", name: "Playa del Carmen (Solidaridad)" },
    { id: "roo_tulum", name: "Tulum" },
  ],
  yuc: [
    { id: "yuc_merida", name: "Mérida" },
    { id: "yuc_progreso", name: "Progreso" },
    { id: "yuc_valladolid", name: "Valladolid" },
  ],
};
