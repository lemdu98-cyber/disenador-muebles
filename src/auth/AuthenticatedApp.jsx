import App from "../App";
import Login from "../components/auth/Login";
import { useAuth } from "./useAuth";

export default function AuthenticatedApp() {
  const { loading, session } = useAuth();
  if (loading) return <main className="auth-page"><p className="auth-loading">Cargando MuebleCAD...</p></main>;
  return session ? <App /> : <Login />;
}
