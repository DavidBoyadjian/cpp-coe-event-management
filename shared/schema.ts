export type EventItem = {
  id: number;
  eventName: string;
  date: string;
  location?: string;
  host?: string;
  roomReserved?: boolean;
  cateringNeeded?: boolean;
  cateringOrdered?: boolean;
  status?: string;
  description?: string;
};