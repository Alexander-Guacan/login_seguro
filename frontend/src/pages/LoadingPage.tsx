import { ImSpinner2 } from "react-icons/im";

export function LoadingPage() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 text-gray-800">
      <ImSpinner2 className="mb-4 text-5xl animate-spin text-indigo-500" />
      <h1 className="text-xl font-semibold tracking-wide">Cargando...</h1>
      <p className="mt-2 text-sm text-gray-500">Por favor espera un momento</p>
    </div>
  );
}
