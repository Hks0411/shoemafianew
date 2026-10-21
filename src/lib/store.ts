export const STORE = {
  name: "SHOE MAFIA",
  tagline: "Premium footwear from Bilaspur",
  address: "Bus Stand, Old Telephone Exchange Road, Bilaspur, Telipara, Chhattisgarh 495001, India",
  city: "Bilaspur",
  state: "Chhattisgarh",
  pincode: "495001",
  phone: "075875 55558",
  phoneTel: "+917587555558",
  email: "hello@shoemafia.in",
  whatsapp: "917587555558",
} as const;

export const DEFAULT_SETTINGS = {
  shippingCharge: 0,
  freeShippingAbove: 0,
  currency: "INR",
  paymentsEnabled: false,
  lowStockThreshold: 3,
  logoPath: "/brand/logo.png",
};

export type StoreSettings = typeof DEFAULT_SETTINGS;
