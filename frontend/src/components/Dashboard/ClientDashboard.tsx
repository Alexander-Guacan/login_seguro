import { useMemo } from "react";
import { useAuth } from "../../hooks/auth/useAuth";
import { capitalize } from "../../utils/text.util";

export function ClientDashboard() {
  const { user } = useAuth();

  const personalInformation = useMemo<Record<
    string,
    string | Date
  > | null>(() => {
    if (!user) return null;

    return {
      Nombre: capitalize(user.firstName),
      Apellido: capitalize(user.lastName),
      "Correo electrónico": user?.email,
      "Fecha creación": user.createdAt,
      Rol: user.roleName,
    };
  }, [user]);

  if (!personalInformation) return null;

  return (
    <article className="p-4 border border-gray-500/20 rounded-md flex flex-col gap-y-6">
      <header>
        <h3 className="text-lg font-semibold">Información personal</h3>
      </header>
      <div className="grid grid-cols-2 gap-4">
        {Object.keys(personalInformation).map((label) => (
          <article key={label} className="flex flex-col">
            <header>
              <h4>{label}</h4>
            </header>
            {typeof personalInformation[label] === "string" ? (
              <p className="text-gray-500">{personalInformation[label]}</p>
            ) : (
              <time
                className="text-gray-500"
                dateTime={personalInformation[label].toISOString()}
              >
                {personalInformation[label].toLocaleDateString("ec-EC")}
              </time>
            )}
          </article>
        ))}
      </div>
    </article>
  );
}
