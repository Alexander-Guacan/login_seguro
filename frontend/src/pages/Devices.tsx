import { HiOutlineTrash } from "react-icons/hi";
import { PageHeader } from "../components/PageSection/PageHeader";
import { useCredentials } from "../hooks/biometric/useCredentials";
import { TbDeviceDesktopOff } from "react-icons/tb";
import { ConfirmDialog } from "../components/Dialog/ConfirmDialog";
import { useState } from "react";
import { ImSpinner2 } from "react-icons/im";
import { AiOutlinePlus } from "react-icons/ai";
import { MdOutlineFingerprint } from "react-icons/md";
import { InputDialog } from "../components/Dialog/InputDialog";
import { useDialog } from "../hooks/useDialog";
import { useAlert } from "../hooks/useAlert";

export function Devices() {
  const { devices, loading, deleteCredential, addCredential } =
    useCredentials();
  const {
    open: confirmDialogOpen,
    show: showConfirmDialog,
    hide: hideConfirmDialog,
  } = useDialog();
  const {
    open: inputDialogOpen,
    show: showInputDialog,
    hide: hideInputDialog,
  } = useDialog();
  const { showAlert } = useAlert();
  const [deviceId, setDeviceId] = useState<string | null>(null);

  const registerDevice = async (deviceName: string) => {
    const result = await addCredential(deviceName);

    if (!result.success) {
      showAlert(result.error, { type: "error" });
    } else {
      showAlert(result.message, { type: "success" });
    }

    hideInputDialog();
  };

  const verifyDeleteDevice = (id: string) => {
    setDeviceId(id);
    showConfirmDialog();
  };

  const deleteDevice = async () => {
    if (!deviceId) return;

    const result = await deleteCredential(deviceId);

    if (!result.success) {
      showAlert(result.error, { type: "error" });
    } else {
      showAlert(result.message, { type: "success" });
    }

    setDeviceId(null);
    hideConfirmDialog();
  };

  return (
    <main className="h-full flex flex-col gap-y-6">
      <PageHeader
        title="Dispositivos"
        breadcrumbsLabels={["Dashboard", "Dispositivos"]}
      />
      <section className="flex flex-col gap-y-6 border-gray-500/30 border p-6 rounded-lg grow">
        <header className="flex flex-col gap-y-2">
          <div className="flex flex-wrap justify-between gap-x-8 gap-y-1 items-center">
            <h2 className="text-lg">Autenticación</h2>
            <button
              className="button-solid flex gap-x-2 items-center text-sm"
              type="button"
              onClick={showInputDialog}
            >
              <AiOutlinePlus />
              <span>Agregar</span>
            </button>
          </div>
          <p className="text-sm">
            Los dispositivos registrados pueden iniciar sesión usando una
            passkey (Windows Hello, Huella Digital o Face ID).
          </p>
        </header>
        {loading ? (
          <article className="grow flex flex-col justify-center items-center">
            <ImSpinner2 className="text-4xl text-gray-500/80 animate-spin" />
            <p className="text-gray-500/80">Cargando información</p>
          </article>
        ) : devices && devices.length > 0 ? (
          <ul className="flex flex-wrap gap-4 overflow-y-auto">
            {devices.map((credential) => (
              <li
                className="bg-blue-500/15 rounded-lg p-4 flex flex-col gap-y-2 w-fit"
                key={credential.id}
              >
                <div className="flex justify-between items-center text-lg">
                  <MdOutlineFingerprint className="text-xl" />
                  <h4 className="text-blue-500 font-semibold ">
                    {credential.deviceName}
                  </h4>
                </div>
                <div className="flex justify-between items-center gap-x-12 text-sm">
                  <div className="flex flex-col gap-y-1">
                    <time dateTime={credential.createdAt.toISOString()}>
                      <span className="font-semibold">Registrado en:</span>{" "}
                      {credential.createdAt.toLocaleDateString("es-EC")}
                    </time>
                    <time dateTime={credential.lastUsedAt.toISOString()}>
                      <span className="font-semibold">Ultimo uso:</span>{" "}
                      {credential.lastUsedAt.toLocaleDateString("es-EC")}
                    </time>
                  </div>
                  <button
                    type="button"
                    title="Eliminar método de autenticación"
                    onClick={() => verifyDeleteDevice(credential.id)}
                  >
                    <HiOutlineTrash className="text-xl" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <article className="grow flex flex-col justify-center items-center">
            <TbDeviceDesktopOff className="text-4xl text-gray-500/80" />
            <p className="text-gray-500/80">No hay dispositivos registrados</p>
          </article>
        )}
      </section>

      <ConfirmDialog
        open={confirmDialogOpen}
        title="Eliminar dispositivo"
        question="¿Estás seguro de eliminar esta credencial?"
        note="Ya no podras usarla para iniciar sesión con ese dispositivo."
        disabled={loading}
        onAccept={deleteDevice}
        onCancel={hideConfirmDialog}
      />

      <InputDialog
        open={inputDialogOpen}
        title="Agregar credencial"
        label="Nombre del dispositivo"
        disabled={loading}
        onSubmit={registerDevice}
        onCancel={hideInputDialog}
      />
    </main>
  );
}
