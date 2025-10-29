import { useLocation } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Routes from "../routes/Routes";

export default function Layout() {
  const location = useLocation();
  const hideLayout =
    location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div className="flex flex-col min-h-screen">
      {!hideLayout && <Navbar />}
      <main className="flex-grow">
        <Routes /> {/* Page content will render here */}
      </main>
      {!hideLayout && <Footer />}
    </div>
  );
}
