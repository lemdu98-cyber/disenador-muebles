import { useState } from "react";
import { useAuth } from "../../auth/useAuth";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage("");
    setSubmitting(true);
    const { error } = await login(email.trim(), password);

    if (error) {
      setErrorMessage("Correo o contraseña incorrectos.");
      if (import.meta.env.DEV) console.error("Supabase rechazó el inicio de sesión:", error.message);
    }
    setSubmitting(false);
  };

  return (
    <main className="auth-page">
      <section className="login-card" aria-labelledby="login-title">
        <h1 id="login-title">MuebleCAD <span aria-hidden="true">🪵</span></h1>
        <p>Inicia sesión para acceder al diseñador.</p>
        <form onSubmit={handleSubmit}>
          <label>Correo electrónico<input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Contraseña<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {errorMessage && <p className="login-error" role="alert">{errorMessage}</p>}
          <button className="login-button" type="submit" disabled={submitting}>{submitting ? "Iniciando sesión..." : "Iniciar sesión"}</button>
        </form>
      </section>
    </main>
  );
}
