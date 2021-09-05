export type Branch = "primary" | "pharmacy" | "community"

export interface HealthpointPage {
  lat: number;
  lng: number;
  name: string;
  id: number;
  url: string;
  branch: Branch;
}
export interface OpennningHours {
  schedule: Record<string, string>;
  exceptions: Map<string, string>;
}
export interface HealthpointLocation {
  lat?: number;
  lng?: number;
  name: string;
  branch: string;
  isOpenToday?: boolean;
  instructionLis: string[];
  address: string;
  faxNumber?: string;
  telephone?: string;
  opennningHours: OpennningHours;
}

export interface HealthpointData {
  results: HealthpointPage[];
  total: number
}