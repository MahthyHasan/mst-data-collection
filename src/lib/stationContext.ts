export const STATION_CONTEXT_KEY = 'mst_station_context';

export interface StationContext {
  campId: string;
  label: string;
  modules: string[];
}

export function getStationContext(): StationContext | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(STATION_CONTEXT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StationContext;
  } catch {
    return null;
  }
}

export function setStationContext(context: StationContext | null) {
  if (typeof window === 'undefined') return;
  if (context) {
    localStorage.setItem(STATION_CONTEXT_KEY, JSON.stringify(context));
  } else {
    localStorage.removeItem(STATION_CONTEXT_KEY);
  }
}
