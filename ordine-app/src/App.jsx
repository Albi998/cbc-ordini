// App.jsx
import React, { useState } from "react";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import RequireStaff from "./pages/RequireStaff";

import Ordina from "./pages/ordina";
import Login from "./pages/login";
import Cassa from "./pages/cassa";
import Cuoco from "./pages/cuoco";
import Assemblaggio from "./pages/assemblaggio";
import Success from "./pages/success";
import "./App.css";

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isStaff = localStorage.getItem("isStaff") === "true";

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleLogout = () => {
    localStorage.removeItem("isStaff");
    navigate("/");
    window.location.reload(); // forza il refresh per nascondere sidebar e ripulire tutto
  };

  return (
    <div className={`app-container ${sidebarOpen ? "sidebar-open" : ""}`}>
      {isStaff && (
        <div className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <button className="hamburger" onClick={toggleSidebar}>
            ☰
          </button>

          <div className="sidebar-content">
            <div className="logo">
              <img
                className="logo-img"
                src="./src/assets/logo.webp"
                alt="logo"
              />
            </div>

            <div className="sidebar-links">
              <Link
                to="/cassa"
                className={`link-nav ${
                  location.pathname === "/cassa" ? "active" : ""
                }`}
              >
                Cassa
              </Link>
              <Link
                to="/cuoco"
                className={`link-nav ${
                  location.pathname === "/cuoco" ? "active" : ""
                }`}
              >
                Cucina
              </Link>
              <Link
                to="/assemblaggio"
                className={`link-nav ${
                  location.pathname === "/assemblaggio" ? "active" : ""
                }`}
              >
                Assemblaggio
              </Link>
            </div>

            <button onClick={handleLogout} className="link-nav logout-button">
              Logout
            </button>
          </div>
        </div>
      )}
      <div className="main-content">{children}</div>
    </div>
  );
};

const App = () => {
  return (
    <>
      <Toaster />
      <AppLayout>
        <Routes>
          <Route path="/" element={<Ordina />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/cassa"
            element={
              <RequireStaff>
                <Cassa />
              </RequireStaff>
            }
          />
          <Route
            path="/cuoco"
            element={
              <RequireStaff>
                <Cuoco />
              </RequireStaff>
            }
          />
          <Route
            path="/assemblaggio"
            element={
              <RequireStaff>
                <Assemblaggio />
              </RequireStaff>
            }
          />
          <Route path="/success/:id" element={<Success />} />
        </Routes>
      </AppLayout>
    </>
  );
};

export default App;
