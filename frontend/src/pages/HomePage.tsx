import { AiOutlineUser } from "react-icons/ai";
import { Link } from "react-router";

export function HomePage() {
  return (
    <main className="h-full flex flex-col justify-evenly items-center gap-y-8">
      <section className="max-w-[50%] text-center flex flex-col gap-y-6 items-center">
        <h1 className="text-6xl font-semibold">
          Seguridad reforzada con autenticación biométrica.
        </h1>
        <p className="text-xl">
          Plataforma de gestión de usuarios con inicio de sesión seguro que
          combina correo, contraseña y verificación biométrica. Añade una capa
          extra de protección sin sacrificar la experiencia del usuario.
        </p>
        <Link
          to={"/register"}
          className="link-solid flex gap-x-2 justify-center items-center"
        >
          <AiOutlineUser />
          Registrarse
        </Link>
      </section>
      <section>
        <ul className="flex justify-evenly gap-7 flex-wrap">
          <li className="flex flex-col gap-y-4 p-4 text-center">
            <i className="text-3xl">🧬</i>
            <p className="font-semibold">Biometría como segundo factor</p>
          </li>
          <li className="flex flex-col gap-y-4 p-4 text-center">
            <i className="text-3xl">⚡</i>
            <p className="font-semibold">
              Login rápido, sin fricción innecesaria
            </p>
          </li>
          <li className="flex flex-col gap-y-4 p-4 text-center">
            <i className="text-3xl">🛠</i>
            <p className="font-semibold">Gestión de usuarios sencilla</p>
          </li>
        </ul>
      </section>
    </main>
  );
}
