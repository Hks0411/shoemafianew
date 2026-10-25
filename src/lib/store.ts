export const STORE = {
  name: "SHOE MAFIA",
  tagline: "Premium footwear from Bilaspur",
  address: "Bus Stand, Old Telephone Exchange Road, Bilaspur, Telipara, Chhattisgarh 495001, India",
  city: "Bilaspur",
  state: "Chhattisgarh",
  pincode: "495001",
  phone: "075875 55558",
  phoneTel: "+917587555558",
  email: "shoemafiabsp@gmail.com",
  instagram: "https://www.instagram.com/shoe__mafia_",
  instagramHandle: "@shoe__mafia_",
  whatsapp: "917587555558",
} as const;

export const DEFAULT_SETTINGS = {
  shippingCharge: 0,
  freeShippingAbove: 0,
  /** Courier added on COD orders (INR). */
  codCourierCharge: 200,
  /** Courier added on prepaid / Razorpay orders (INR). */
  prepaidCourierCharge: 150,
  currency: "INR",
  paymentsEnabled: false,
  lowStockThreshold: 3,
  logoPath: "/brand/logo.png",
};

export type StoreSettings = typeof DEFAULT_SETTINGS;
