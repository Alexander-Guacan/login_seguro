import { useNavigate } from "react-router";
import { useAuth } from "../hooks/auth/useAuth";

export function NotFoundPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const goBack = () => {
    navigate(user ? "/dashboard" : "/", { replace: true });
  };

  return (
    <main className="h-dvh flex flex-col justify-center items-center">
      <section className="max-w-[50%] text-center flex flex-col gap-y-6 items-center">
        <h2 className="text-6xl font-semibold">Página No Encontrada</h2>
        <p className="text-xl">
          Lo sentimos, la página que estas buscando no existe, fue removida o la
          URL esta incorrecta.
        </p>
        <a className="link link--solid" onClick={goBack}>
          Regresar
        </a>
      </section>
    </main>
  );
}
