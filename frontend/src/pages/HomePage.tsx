import { AiOutlineUser } from "react-icons/ai";
import { Link } from "react-router";

export function HomePage() {
  return (
    <main className="h-full flex flex-col justify-evenly items-center gap-y-10 px-8 py-8">
      <section className="text-center flex flex-col gap-y-3 items-center md:max-w-[50%] text-sm md:text-base">
        <h1 className="text-2xl font-semibold md:text-3xl">
          Seguridad reforzada con autenticación biométrica.
        </h1>
        <p>
          Plataforma de gestión de usuarios con inicio de sesión seguro que
          combina correo, contraseña y verificación biométrica.
        </p>
        <p>
          Añade una capa extra de protección sin sacrificar la experiencia del
          usuario.
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
        <ul className="flex justify-evenly gap-x-6 gap-y-2 flex-wrap text-sm md:text-base">
          <li className="flex flex-col gap-y-4 p-4 text-center">
            <i className="text-2xl">🧬</i>
            <p>Biometría como segundo factor</p>
          </li>
          <li className="flex flex-col gap-y-4 p-4 text-center">
            <i className="text-2xl">⚡</i>
            <p>Login rápido, sin fricción innecesaria</p>
          </li>
          <li className="flex flex-col gap-y-4 p-4 text-center">
            <i className="text-2xl">🛠</i>
            <p>Gestión de usuarios sencilla</p>
          </li>
        </ul>
      </section>
    </main>
  );
}
