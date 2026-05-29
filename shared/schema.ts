export type EventItem = {
  id: number;
  eventName: string;
  date: string;
  audience?: string;
  location?: string;
  startTime?: string;
  endTime?: string;
  reservationConfirmation?: string;
  roomReserved?: boolean;
  cateringNeeded?: boolean;
  cateringOrdered?: boolean;
  accountNumber?: string;
  host?: string;
  status?: string;
  roomConfirmation?: string;
  description?: string;
};