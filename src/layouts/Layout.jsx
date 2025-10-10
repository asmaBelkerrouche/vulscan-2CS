import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Routes from "../routes/Routes";

export default function Layout() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login"; // Adjust path if needed

  return (
    <div>
      {!isLoginPage && <Navbar />} {/* Show Navbar only if not on /login */}
      
      <main>
        <Routes />
      </main>

      {!isLoginPage && <Footer />} {/* Optional: also hide footer on login if desired */}
    </div>
  );
}
