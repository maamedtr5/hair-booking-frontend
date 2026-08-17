 // src/types/models.ts

// ===== Enums =====
export type Role = 'ADMIN' | 'STAFF' | 'CLIENT';

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'NO_SHOW'
  | 'WAITLISTED';

export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

export type PaymentMethod = 'CASH' | 'CARD' | 'MOBILE_MONEY';

export type PaymentProvider = 'PAYSTACK' | 'CASH' | 'MOBILE_MONEY';

// REFUND_PENDING: set automatically when a booking with a SUCCESS payment
// gets cancelled — needs a human to actually process the refund and then
// mark it REFUNDED.
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUND_PENDING' | 'REFUNDED';

export type DiscountType = 'PERCENTAGE' | 'FIXED';

export type NotificationType =
  | 'GENERAL'
  | 'APPOINTMENT'
  | 'PAYMENT'
  | 'PROMOTION'
  | 'SYSTEM';

export type NotificationStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';

export type WaitlistStatus = 'PENDING' | 'NOTIFIED' | 'BOOKED' | 'CANCELLED';

// ===== Core Models =====
export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  googleAccessToken?: string | null;
  googleRefreshToken?: string | null;
  googleTokenExpiry?: string | null;
  admin?: Admin | null;
  client?: Client | null;
  staff?: Staff | null;
}
export interface AuthUser extends User {
  admin?: Admin | null;
  client?: Client | null;
  staffId?: number| null;
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
  forms?: Form[];
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
  duration: number;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: number;
  serviceId: number;
  staffId?: number | null;
  date: string;
  status: AppointmentStatus;
  notes?: string | null;
  reminderScheduled: boolean;
  reminderSent: boolean;
  reminderSentAt?: string | null;
  googleEventId?: string | null;
  service?: Service;
  staff?: Staff;
  booking?: Booking | null;
  slots?: Slot[];
  // Present only on the createAppointment response — true when every
  // stylist was already committed and this booking was queued onto the
  // waitlist (status will be 'WAITLISTED') instead of confirmed outright.
  waitlisted?: boolean;
  bookingReference?: number;
}

export interface Slot {
  id: number;
  appointmentId: number;
  startTime: string;
  endTime: string;
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
  currency: string;
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
  rating: number;
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
  fields: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Settings {
  id: number;
  key: string;
  value: Record<string, unknown>;
  description?: string | null;
  updatedAt: string;
}

export interface DayHours {
  open: boolean;
  start: string; // 'HH:MM' 24hr
  end: string;   // 'HH:MM' 24hr
}

export interface BusinessHoursConfig {
  sunday: DayHours;
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
}

export interface PaymentPolicy {
  requireDeposit: boolean;
  depositType: 'PERCENTAGE' | 'FIXED';
  depositAmount: number;
}

export interface SalonLocation {
  address: string;
  latitude: number | null;
  longitude: number | null;
  gettingHereNotes: string;
}

export interface BusinessInfo {
  name: string;
  phone: string;
  email: string;
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

export interface AppNotification {
  id: number;
  userId: number;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Report {
  id: number;
  title: string;
  data: Record<string, unknown>;
  createdAt: string;
}

// ===== API Responses =====
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  token?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total?: number;
  page?: number;
  limit?: number;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===== Payloads =====
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

export interface ReschedulePayload {
  newDate: string;
}

export interface CreateBookingPayload {
  appointmentId: number;
  clientId: number;
  promocodeId?: number;
  status?: BookingStatus;
}

export interface InitPaymentPayload {
  bookingId: number;
  amount?: number; // ignored by the server — kept optional for backwards compat
  method: PaymentMethod;
  // Required by POST /payments/init (validatePaymentCreate rejects a
  // missing provider) — online deposits (card or mobile money) both run
  // through Paystack in the Ghana market, so this is always 'PAYSTACK'
  // whenever this payload is sent at all. CASH/MOBILE_MONEY collected in
  // person go through recordManualPayment instead, not this endpoint.
  provider: PaymentProvider;
  email: string;
}

export interface CreateSlotPayload {
  appointmentId: number;
  startTime: string;
  endTime: string;
}

// ===== Reports =====
export interface RevenueReportData {
  totalRevenue: number;
  currency: string;
  breakdown: Array<{ date: string; amount: number; bookings: number }>;
}

export interface TopServicesData {
  services: Array<{ serviceId: number; name: string; bookings: number; revenue: number }>;
}

// ===== Booking Flow =====
export interface BookingFlowState {
  step: 1 | 2 | 3 | 4;
  selectedService: Service | null;
  selectedStaff: Staff | null;
  selectedSlot: Slot | null;
  selectedDate: string | null;
  appliedPromocode: Promocode | null;
  notes: string;
  consentData: Record<string, boolean> | null;
}

export interface IntakeForm {
  id: number;
  clientId: number;
  hairType?: string | null;
  scalpCondition?: string | null;
  productPreference?: string | null;
  visitReason?: string | null;
  lastChemicalTreatment?: string | null;
  currentProducts?: string | null;
  goals?: string | null;
  allergies?: string | null;
  notes?: string | null;
  createdAt: string;
  client?: Client;
}

export interface ConsentForm {
  id: number;
  clientId: number;
  consentGiven: boolean;
  signature?: string | null;
  date: string;
  client?: Client;
}
export interface CreateAppointmentPayload {
  serviceId: number;
  staffId?: number;
  date: string;
  notes?: string;
  status?: AppointmentStatus;
  // Required only when booking without being logged in.
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  // Validated server-side (exists, active, within date range) at booking
  // time — see resolvePromocodeId in appointmentController.js.
  promoCode?: string;
}