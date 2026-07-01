// src/pages/client/ConfirmationPage.tsx
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "../../components/ui/Button";
import { getBookingById } from "../../api/bookings";
import { getPaymentStatus } from "../../api/payments";

export function ConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();

  // Fetch booking details
  const {
    data: booking,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => getBookingById(bookingId!),
    enabled: !!bookingId,
  });

  // Fetch payment status
  const { data: paymentStatus } = useQuery({
    queryKey: ["paymentStatus", bookingId],
    queryFn: () => getPaymentStatus(bookingId!),
    enabled: !!bookingId,
  });

  if (isLoading) {
    return <p className="text-center mt-10">Loading booking...</p>;
  }

  if (error || !booking) {
    return (
      <div className="text-center mt-10">
        <p className="text-red-600">Booking not found.</p>
        <Link to="/book" className="text-blue-600 underline">
          Return to booking
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-md text-center">
        <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-full bg-green-100 border-4 border-green-700 text-4xl">
          ✓
        </div>

        <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
        <p className="text-gray-600 mb-6">
          Your appointment at Locs Allure has been successfully booked.
          We’ll send you a reminder before your appointment.
        </p>

        <div className="bg-gray-100 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500 mb-1">Booking Reference</p>
          <p className="text-lg font-semibold text-gray-900">#{booking.id}</p>
        </div>

        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Service:</span> {booking.service.name}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Date:</span> {booking.slot.date}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Time:</span> {booking.slot.time}
          </p>
          <p className="text-sm text-gray-700">
            <span className="font-semibold">Payment Status:</span>{" "}
            {paymentStatus?.status ?? "Pending"}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Link to="/my/bookings">
            <Button fullWidth size="lg">View My Bookings</Button>
          </Link>
          <Link to="/book">
            <Button fullWidth variant="outline" size="md">
              Book Another Appointment
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
