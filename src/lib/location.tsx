import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type DeliveryLocation = {
  label: string;
  line1: string;
  city: string;
  pincode: string;
  lat?: number | undefined;
  lng?: number | undefined;
  addressId?: string | undefined;
};

const STORAGE_KEY = "rrk.location";

type LocationValue = {
  location: DeliveryLocation | null;
  setLocation: (loc: DeliveryLocation | null) => void;
  requestGps: () => Promise<{ ok: boolean; error?: string }>;
  gpsBusy: boolean;
};

const LocationContext = createContext<LocationValue | null>(null);

export function LocationProvider({ children }: { children: ReactNode }) {
  const [location, setLocationState] = useState<DeliveryLocation | null>(null);
  const [gpsBusy, setGpsBusy] = useState(false);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setLocationState(JSON.parse(raw) as DeliveryLocation);
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const setLocation = useCallback((loc: DeliveryLocation | null) => {
    setLocationState(loc);
    if (loc) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    else window.localStorage.removeItem(STORAGE_KEY);
  }, []);

  const requestGps = useCallback(async () => {
    if (!("geolocation" in navigator)) return { ok: false, error: "unsupported" };
    setGpsBusy(true);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 12000, enableHighAccuracy: true }),
      );
      const { latitude, longitude } = position.coords;
      setLocation({
        label: "Current location",
        line1: `GPS ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        city: "",
        pincode: "",
        lat: latitude,
        lng: longitude,
      });
      return { ok: true };
    } catch {
      return { ok: false, error: "denied" };
    } finally {
      setGpsBusy(false);
    }
  }, [setLocation]);

  const value = useMemo(() => ({ location, setLocation, requestGps, gpsBusy }), [location, setLocation, requestGps, gpsBusy]);
  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

export function useLocationCtx() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocationCtx must be used inside LocationProvider");
  return ctx;
}
