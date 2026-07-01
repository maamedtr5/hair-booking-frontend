// src/pages/LandingPage.tsx
import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <nav className="flex justify-between items-center px-10 py-5 bg-white shadow-md">
        <h1 className="text-3xl font-extrabold text-blue-600 tracking-wide">
          Locs Allure
        </h1>
        <div className="space-x-6">
          <Link
            to="/book"
            className="px-5 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Book Now
          </Link>
          <Link
            to="/login"
            className="px-5 py-2 rounded-md bg-gray-200 font-medium hover:bg-gray-300 transition"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="px-5 py-2 rounded-md bg-gray-200 font-medium hover:bg-gray-300 transition"
          >
            Register
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center flex-grow text-center px-6">
        <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-gray-900 leading-tight">
          Your Trusted Hair Booking Service
        </h2>
        <p className="text-lg md:text-xl text-gray-600 max-w-2xl mb-10">
          Book appointments with ease, manage your schedule, and enjoy a seamless salon experience.
        </p>
        <Link
          to="/book"
          className="px-8 py-3 bg-blue-600 text-white rounded-lg shadow-lg hover:bg-blue-700 transition text-lg font-semibold"
        >
          Get Started
        </Link>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 bg-white border-t text-gray-500 text-sm">
        © {new Date().getFullYear()} Locs Allure. All rights reserved.
      </footer>
    </div>
  );
}
