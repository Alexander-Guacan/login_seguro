import { useNavigate } from "react-router";

export function NotFoundPage() {
  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  return (
    <main className="h-full flex flex-col justify-center items-center">
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
