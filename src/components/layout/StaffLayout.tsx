import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar'; 
import '../../styles/layout/staffLayout.css';

export function StaffLayout() {
  

  return (
    <>
      <Navbar variant="staff" /> {/* Global Navbar always visible */}

      <div className="staff-root">

        {/* Main Content */}
        <main className="staff-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
