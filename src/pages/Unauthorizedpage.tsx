import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="unauthorized-page">
      <div className="unauthorized-page__icon">
        <ShieldAlert size={40} />
      </div>
      <h1 className="page-title">Access Denied</h1>
      <p className="page-subtitle">
        You don't have permission to view this page.
      </p>
      <Link to="/login" className="btn btn--gold btn--lg">
        Go to Login
      </Link>
    </div>
  );
}