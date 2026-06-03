
export type Role = 'ADMIN' | 'STAFF' | 'CLIENT';

export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE_MONEY';

export type PaymentProvider = 'PAYSTACK' | 'CASH' | 'MOBILE_MONEY';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export type NotificationType = 'GENERAL' | 'APPOINTMENT' | 'PAYMENT' | 'PROMOTION' | 'SYSTEM';

export type NotificationStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';

export type WaitlistStatus = 'PENDING' | 'NOTIFIED' | 'BOOKED' | 'CANCELLED';


export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  // Google Calendar — only present if connected
  googleAccessToken?: string | null;
  googleRefreshToken?: string | null;
  googleTokenExpiry?: string | null;
  // Relations (may be included depending on endpoint)
  admin?: Admin | null;
  client?: Client | null;
  staff?: Staff | null;
}

export interface JwtPayload {
  id: number;
  email: string;
  name: string;
  role: Role;
  iat: number;
  exp: number;
}

export interface Admin {
  id: number;
  userId: number;
  permissions?: Record<string, boolean> | null;
  department?: string | null;
  user?: User;
}

export interface Client {
  id: number;
  userId: number;
  phone?: string | null;
  address?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: User;
  bookings?: Booking[];
  reviews?: Review[];
  waitlists?: Waitlist[];
}

export interface Staff {
  id: number;
  userId: number;
  bio?: string | null;
  createdAt: string;
  user?: User;
  appointments?: Appointment[];
  reviews?: Review[];
}

export interface Service {
  id: number;
  name: string;
  description?: string | null;
  duration: number; // minutes
  price: number;   // GHS
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: number;
  serviceId: number;
  staffId?: number | null;
  date: string; // ISO string
  status: AppointmentStatus;
  notes?: string | null;
  reminderScheduled: boolean;
  reminderSent: boolean;
  reminderSentAt?: string | null;
  googleEventId?: string | null;
  // Relations
  service?: Service;
  staff?: Staff;
  booking?: Booking | null;
  slots?: Slot[];
}

export interface Slot {
  id: number;
  appointmentId: number;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  isBooked: boolean;
  appointment?: Appointment;
}

export interface Booking {
  id: number;
  appointmentId: number;
  clientId: number;
  userId?: number | null;
  promocodeId?: number | null;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  // Relations
  appointment?: Appointment;
  client?: Client;
  user?: User;
  promocode?: Promocode | null;
  payment?: Payment | null;
  form?: Form | null;
}

export interface Payment {
  id: number;
  bookingId: number;
  amount: number;
  currency: string; // 'GHS'
  method: PaymentMethod;
  provider: PaymentProvider;
  status: PaymentStatus;
  transactionRef?: string | null;
  externalId?: string | null;
  metadata?: Record<string, unknown> | null;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  booking?: Booking;
}

export interface Review {
  id: number;
  clientId: number;
  serviceId?: number | null;
  staffId?: number | null;
  rating: number; // 1–5
  comment?: string | null;
  createdAt: string;
  client?: Client;
  service?: Service | null;
  staff?: Staff | null;
}

export interface Promocode {
  id: number;
  code: string;
  description?: string | null;
  discount: number;
  type: DiscountType;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

export interface Form {
  id: number;
  clientId: number;
  bookingId?: number | null;
  title: string;
  fields: Record<string, unknown>; // flexible JSON
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  id: number;
  key: string;
  value: Record<string, unknown>; // flexible JSON
  description?: string | null;
  updatedAt: string;
}

export interface Waitlist {
  id: number;
  clientId: number;
  serviceId?: number | null;
  preferredDate?: string | null;
  status: WaitlistStatus;
  createdAt: string;
  client?: Client;
  service?: Service | null;
}

export interface Notification {
  id: number;
  userId: number;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Report {
  id: number;
  title: string;
  data: Record<string, unknown>;
  createdAt: string;
}


export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  // Some endpoints return the resource directly at top level
  token?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: Role;
}

export interface CreateAppointmentPayload {
  serviceId: number;
  staffId?: number;
  date: string; // ISO string
  notes?: string;
  status?: AppointmentStatus;
}

export interface ReschedulePayload {
  newDate: string; // ISO string
}

export interface CreateBookingPayload {
  appointmentId: number;
  clientId: number;
  promocodeId?: number;
  status?: BookingStatus;
}

export interface InitPaymentPayload {
  bookingId: number;
  amount: number;
  method: PaymentMethod;
  email: string;
}

export interface CreateSlotPayload {
  appointmentId: number;
  startTime: string;
  endTime: string;
}

export interface RevenueReportData {
  totalRevenue: number;
  currency: string;
  breakdown: Array<{ date: string; amount: number; bookings: number }>;
}

export interface TopServicesData {
  services: Array<{ serviceId: number; name: string; bookings: number; revenue: number }>;
}


export interface BookingFlowState {
  step: 1 | 2 | 3 | 4;
  selectedService: Service | null;
  selectedStaff: Staff | null;
  selectedSlot: Slot | null;
  selectedDate: string | null; // YYYY-MM-DD
  appliedPromocode: Promocode | null;
  notes: string;
}