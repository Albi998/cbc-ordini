import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import credentials from "../data/login.json";
import { motion } from "framer-motion";

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      form.username === credentials.username &&
      form.password === credentials.password
    ) {
      localStorage.setItem("isStaff", "true");
      navigate("/cassa");
    } else {
      setError("Credenziali errate");
    }
  };

  return (
    <div className="login-back">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="login-card"
      >
        <h2 className="login-title">Login Staff</h2>
        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={form.username}
            onChange={handleChange}
            className="login-input"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="login-input"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="login-button"
          >
            Login
          </motion.button>
          {error && <p className="login-error">{error}</p>}
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
