import React from "react";
import { Routes, Route, Link } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Account from "./pages/Account.jsx";
import AccountEdit from "./pages/AccountEdit.jsx";
import AccountDelete from "./pages/AccountDelete.jsx";
import StateIndex from "./pages/StateIndex.jsx";
import StateDetail from "./pages/StateDetail.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { useAuth } from "./context/AuthContext.jsx";

export default function App() {
  const { user, logout } = useAuth();
  return (
    <>
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/states">States</Link>
          {user ? (
            <>
              <Link to="/account">My Account</Link>
              <button onClick={logout}>Logout</button>
              <span style={{ marginLeft: 8, color: "#9ca3af" }}>
                Hi, {user.name}
              </span>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/register">Sign up</Link>
            </>
          )}
        </nav>
      </header>
      <main>
        <Routes>
          <Route
            path="/"
            element={<p>Welcome. These are the account + state pages.</p>}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/account"
            element={
              <ProtectedRoute>
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/edit"
            element={
              <ProtectedRoute>
                <AccountEdit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/account/delete"
            element={
              <ProtectedRoute>
                <AccountDelete />
              </ProtectedRoute>
            }
          />
          <Route path="/states" element={<StateIndex />} />
          <Route path="/states/:code" element={<StateDetail />} />
        </Routes>
      </main>
    </>
  );
}
