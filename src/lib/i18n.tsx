import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export const LANGUAGES = [
  { code: "hi", label: "हिन्दी", english: "Hindi", speech: "hi-IN" },
  { code: "en", label: "English", english: "English", speech: "en-IN" },
  { code: "bn", label: "বাংলা", english: "Bengali", speech: "bn-IN" },
  { code: "bho", label: "भोजपुरी", english: "Bhojpuri", speech: "hi-IN" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["code"];
export const LANG_STORAGE_KEY = "rrk.lang";

type Dict = Record<Lang, string>;

const strings: Record<string, Dict> = {
  welcome: {
    hi: "RRK Bazaar में आपका स्वागत है",
    en: "RRK Bazaar में आपका स्वागत है",
    bn: "RRK Bazaar में आपका स्वागत है",
    bho: "RRK Bazaar में आपका स्वागत है",
  },
  tagline: {
    hi: "आपकी जरूरत, आपके पास।",
    en: "Everything you need, right next door.",
    bn: "আপনার প্রয়োজন, আপনার পাশে।",
    bho: "आपके जरूरत, आपके पास।",
  },
  choose_language: { hi: "भाषा चुनें", en: "Choose your language", bn: "ভাষা নির্বাচন করুন", bho: "भाषा चुनीं" },
  continue: { hi: "आगे बढ़ें", en: "Continue", bn: "এগিয়ে যান", bho: "आगे बढ़ीं" },
  deliver_to: { hi: "डिलीवरी यहाँ", en: "Deliver to", bn: "ডেলিভারি", bho: "डिलीवरी इहाँ" },
  select_location: { hi: "लोकेशन चुनें", en: "Select Location", bn: "লোকেশন বাছুন", bho: "लोकेशन चुनीं" },
  use_gps: { hi: "मौजूदा लोकेशन इस्तेमाल करें", en: "Use current location", bn: "বর্তমান লোকেশন", bho: "अभी के लोकेशन" },
  manual_location: { hi: "पता खुद भरें", en: "Enter address manually", bn: "নিজে ঠিকানা দিন", bho: "पता खुद भरीं" },
  saved_addresses: { hi: "सेव किए पते", en: "Saved addresses", bn: "সংরক্ষিত ঠিকানা", bho: "सेव कइल पता" },
  gps_denied: {
    hi: "लोकेशन की अनुमति नहीं मिली। कृपया पता खुद भरें।",
    en: "Location permission denied. Please enter your address manually.",
    bn: "লোকেশন অনুমতি পাওয়া যায়নি। ঠিকানা লিখুন।",
    bho: "लोकेशन के अनुमति ना मिलल। पता खुद भरीं।",
  },
  search_placeholder: {
    hi: "आटा, दूध, दवा... खोजें",
    en: "Search atta, milk, medicine...",
    bn: "আটা, দুধ, ঔষধ... খুঁজুন",
    bho: "आटा, दूध, दवाई... खोजीं",
  },
  voice_search: { hi: "बोलकर खोजें", en: "Voice search", bn: "ভয়েস সার্চ", bho: "बोल के खोजीं" },
  photo_search: { hi: "फोटो से खोजें", en: "Photo search", bn: "ছবি দিয়ে খুঁজুন", bho: "फोटो से खोजीं" },
  listening: { hi: "सुन रहे हैं...", en: "Listening...", bn: "শুনছি...", bho: "सुनत बानी..." },
  categories: { hi: "श्रेणियाँ", en: "Categories", bn: "বিভাগ", bho: "श्रेणी" },
  popular: { hi: "लोकप्रिय सामान", en: "Popular items", bn: "জনপ্রিয় পণ্য", bho: "लोकप्रिय सामान" },
  all_products: { hi: "सारे प्रोडक्ट", en: "All products", bn: "সব পণ্য", bho: "सब प्रोडक्ट" },
  add: { hi: "जोड़ें", en: "Add", bn: "যোগ করুন", bho: "जोड़ीं" },
  added: { hi: "कार्ट में जोड़ा गया", en: "Added to cart", bn: "কার্টে যোগ হয়েছে", bho: "कार्ट में जुड़ल" },
  out_of_stock: { hi: "स्टॉक खत्म", en: "Out of stock", bn: "স্টক নেই", bho: "स्टॉक खतम" },
  cart: { hi: "कार्ट", en: "Cart", bn: "কার্ট", bho: "कार्ट" },
  cart_empty: { hi: "आपका कार्ट खाली है", en: "Your cart is empty", bn: "আপনার কার্ট খালি", bho: "आपके कार्ट खाली बा" },
  checkout: { hi: "ऑर्डर करें", en: "Checkout", bn: "চেকআউট", bho: "ऑर्डर करीं" },
  place_order: { hi: "ऑर्डर पक्का करें", en: "Place order", bn: "অর্ডার করুন", bho: "ऑर्डर पक्का करीं" },
  items_total: { hi: "सामान का कुल", en: "Items total", bn: "পণ্যের মোট", bho: "सामान के कुल" },
  delivery_fee: { hi: "डिलीवरी शुल्क", en: "Delivery fee", bn: "ডেলিভারি ফি", bho: "डिलीवरी शुल्क" },
  total: { hi: "कुल", en: "Total", bn: "মোট", bho: "कुल" },
  cod: { hi: "डिलीवरी पर नकद", en: "Cash on delivery", bn: "ক্যাশ অন ডেলিভারি", bho: "डिलीवरी पर नकद" },
  orders: { hi: "ऑर्डर", en: "Orders", bn: "অর্ডার", bho: "ऑर्डर" },
  no_orders: { hi: "कोई ऑर्डर नहीं", en: "No orders yet", bn: "কোনো অর্ডার নেই", bho: "कोई ऑर्डर नइखे" },
  track_order: { hi: "ऑर्डर ट्रैक करें", en: "Track order", bn: "অর্ডার ট্র্যাক", bho: "ऑर्डर ट्रैक करीं" },
  notifications: { hi: "सूचनाएँ", en: "Notifications", bn: "বিজ্ঞপ্তি", bho: "सूचना" },
  profile: { hi: "प्रोफाइल", en: "Profile", bn: "প্রোফাইল", bho: "प्रोफाइल" },
  settings: { hi: "सेटिंग्स", en: "Settings", bn: "সেটিংস", bho: "सेटिंग" },
  language: { hi: "भाषा", en: "Language", bn: "ভাষা", bho: "भाषा" },
  home: { hi: "होम", en: "Home", bn: "হোম", bho: "होम" },
  search: { hi: "खोज", en: "Search", bn: "সার্চ", bho: "खोज" },
  login: { hi: "लॉगिन करें", en: "Log in", bn: "লগ ইন", bho: "लॉगिन करीं" },
  signup: { hi: "नया खाता बनाएँ", en: "Create account", bn: "নতুন অ্যাকাউন্ট", bho: "नया खाता बनाईं" },
  logout: { hi: "लॉग आउट", en: "Log out", bn: "লগ আউট", bho: "लॉग आउट" },
  email: { hi: "ईमेल", en: "Email", bn: "ইমেইল", bho: "ईमेल" },
  password: { hi: "पासवर्ड", en: "Password", bn: "পাসওয়ার্ড", bho: "पासवर्ड" },
  full_name: { hi: "पूरा नाम", en: "Full name", bn: "পুরো নাম", bho: "पूरा नाम" },
  phone: { hi: "मोबाइल नंबर", en: "Mobile number", bn: "মোবাইল নম্বর", bho: "मोबाइल नंबर" },
  seller: { hi: "दुकानदार", en: "Seller", bn: "বিক্রেতা", bho: "दुकानदार" },
  delivery_partner: { hi: "डिलीवरी पार्टनर", en: "Delivery partner", bn: "ডেলিভারি পার্টনার", bho: "डिलीवरी पार्टनर" },
  admin: { hi: "एडमिन", en: "Admin", bn: "অ্যাডমিন", bho: "एडमिन" },
  save: { hi: "सेव करें", en: "Save", bn: "সেভ করুন", bho: "सेव करीं" },
  cancel: { hi: "रद्द करें", en: "Cancel", bn: "বাতিল", bho: "रद्द करीं" },
  no_results: { hi: "कुछ नहीं मिला", en: "Nothing found", bn: "কিছু পাওয়া যায়নি", bho: "कुछ ना मिलल" },
  similar_products: { hi: "मिलते-जुलते प्रोडक्ट", en: "Similar products", bn: "একই ধরনের পণ্য", bho: "मिलत-जुलत प्रोडक्ट" },
  login_required: { hi: "जारी रखने के लिए लॉगिन करें", en: "Log in to continue", bn: "চালিয়ে যেতে লগ ইন করুন", bho: "आगे बढ़े खातिर लॉगिन करीं" },
};

export const SPEECH_GREETING = "जय हिंद! RRK Bazaar में आपका स्वागत है। क्या चाहिए आपको?";

type I18nValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: keyof typeof strings | string) => string;
  hasChosen: boolean;
  speechLocale: string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("hi");
  const [hasChosen, setHasChosen] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(LANG_STORAGE_KEY) as Lang | null;
    if (stored && LANGUAGES.some((l) => l.code === stored)) {
      setLangState(stored);
      setHasChosen(true);
    } else {
      setHasChosen(false);
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    setHasChosen(true);
    window.localStorage.setItem(LANG_STORAGE_KEY, next);
    document.documentElement.lang = next === "bho" ? "hi" : next;
  }, []);

  const t = useCallback(
    (key: string) => {
      const entry = strings[key];
      return entry ? entry[lang] : key;
    },
    [lang],
  );

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t,
      hasChosen,
      speechLocale: LANGUAGES.find((l) => l.code === lang)?.speech ?? "hi-IN",
    }),
    [lang, setLang, t, hasChosen],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}

export function localizedName(
  row: { name_en?: string | null; name_hi?: string | null; name_bn?: string | null; name_bho?: string | null; name?: string | null },
  lang: Lang,
) {
  const map: Record<Lang, string | null | undefined> = {
    hi: row.name_hi,
    en: row.name_en ?? row.name,
    bn: row.name_bn,
    bho: row.name_bho ?? row.name_hi,
  };
  return map[lang] || row.name_en || row.name || "";
}
