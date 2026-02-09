import { HiOutlineTrash } from "react-icons/hi";
import { PageHeader } from "../components/PageSection/PageHeader";
import { useCredentials } from "../hooks/biometric/useCredentials";
import { TbDeviceDesktopOff } from "react-icons/tb";
import { ConfirmDialog } from "../components/Dialog/ConfirmDialog";
import { useMemo, useState } from "react";
import { ImSpinner2 } from "react-icons/im";
import { AiOutlinePlus } from "react-icons/ai";
import { MdOutlineFingerprint } from "react-icons/md";
import { useDialog } from "../hooks/useDialog";
import { useAlert } from "../hooks/useAlert";
import { FaceDetectorModal } from "../components/Modal/FaceDetectionModal";
import { InputDialog } from "../components/Dialog/InputDialog";
import { useFacialDescriptors } from "../hooks/biometric/useFacialDescriptors";
import { BiometricCredential, BiometricDescriptor } from "../models/biometric";
import { LuScanFace } from "react-icons/lu";

export function Devices() {
  const {
    credentials,
    loading: loadingCredentials,
    deleteCredential,
    addCredential,
  } = useCredentials();
  const {
    descriptors,
    loading: loadingDescriptors,
    addDescriptor,
    deleteDescriptor,
  } = useFacialDescriptors();
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
  const {
    open: faceDetectorModalOpen,
    show: showFaceDetectorModal,
    hide: hideFaceDetectorModal,
  } = useDialog();
  const { showAlert } = useAlert();
  const [deviceToDelete, setDeviceToDelete] = useState<
    BiometricCredential | BiometricDescriptor | null
  >(null);
  const [biometricMethod, setBiometricMethod] = useState<
    "fingerprint" | "facial" | null
  >(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);

  const selectFingerprint = () => {
    setBiometricMethod("fingerprint");
    showInputDialog();
  };

  const selectFacialId = () => {
    setBiometricMethod("facial");
    showInputDialog();
  };

  const finishBiometricRegister = () => {
    hideInputDialog();
    hideFaceDetectorModal();
    setDeviceName(null);
  };

  const registerFingerprint = async (deviceName: string) => {
    const result = await addCredential(deviceName);

    if (!result.success) {
      showAlert(result.error, { type: "error" });
    } else {
      showAlert(result.message, { type: "success" });
    }

    finishBiometricRegister();
  };

  const handleInputDialog = async (deviceName: string) => {
    if (!biometricMethod) {
      hideInputDialog();
      return;
    }

    switch (biometricMethod) {
      case "fingerprint": {
        await registerFingerprint(deviceName);
        break;
      }

      case "facial": {
        setDeviceName(deviceName);
        showFaceDetectorModal();
        break;
      }

      default:
        break;
    }
  };

  const handleFaceDetection = async (descriptor: number[]) => {
    if (!deviceName) return;

    const result = await addDescriptor(descriptor, deviceName);

    if (!result.success) {
      showAlert(result.error, { type: "error" });
    } else {
      showAlert(result.message, { type: "success" });
    }

    finishBiometricRegister();
  };

  const verifyDeleteDevice = (
    device: BiometricCredential | BiometricDescriptor,
  ) => {
    setDeviceToDelete(device);
    showConfirmDialog();
  };

  const deleteDevice = async () => {
    if (!deviceToDelete) return;

    const deleteDevice =
      deviceToDelete instanceof BiometricCredential
        ? deleteCredential
        : deleteDescriptor;

    const result = await deleteDevice(deviceToDelete.id);

    if (!result.success) {
      showAlert(result.error, { type: "error" });
    } else {
      showAlert(result.message, { type: "success" });
    }

    setDeviceToDelete(null);
    hideConfirmDialog();
  };

  const loading = loadingCredentials || loadingDescriptors;

  const devices = useMemo<(BiometricCredential | BiometricDescriptor)[]>(() => {
    if (!credentials || !descriptors) return [];

    return [...credentials, ...descriptors];
  }, [credentials, descriptors]);

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
            <div className="flex flex-col gap-y-4 justify-between">
              <button
                className="button-solid flex gap-x-2 items-center text-sm"
                type="button"
                onClick={selectFingerprint}
              >
                <AiOutlinePlus />
                <span>Agregar huella o PIN</span>
              </button>
              <button
                className="button-solid flex gap-x-2 items-center text-sm"
                type="button"
                onClick={selectFacialId}
              >
                <AiOutlinePlus />
                <span>Agregar Face ID</span>
              </button>
            </div>
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
            {devices.map((device) => (
              <li
                className="bg-blue-500/15 rounded-lg p-4 flex flex-col gap-y-2 w-fit"
                key={device.id}
              >
                <div className="flex justify-between items-center text-lg">
                  {device instanceof BiometricCredential ? (
                    <MdOutlineFingerprint className="text-xl" />
                  ) : (
                    <LuScanFace className="text-xl" />
                  )}
                  <h4 className="text-blue-500 font-semibold ">
                    {device.deviceName}
                  </h4>
                </div>
                <div className="flex justify-between items-center gap-x-12 text-sm">
                  <div className="flex flex-col gap-y-1">
                    <time dateTime={device.createdAt.toISOString()}>
                      <span className="font-semibold">Registrado en:</span>{" "}
                      {device.createdAt.toLocaleDateString("es-EC")}
                    </time>
                    <time dateTime={device.lastUsedAt.toISOString()}>
                      <span className="font-semibold">Ultimo uso:</span>{" "}
                      {device.lastUsedAt.toLocaleDateString("es-EC")}
                    </time>
                  </div>
                  <button
                    type="button"
                    title="Eliminar método de autenticación"
                    onClick={() => verifyDeleteDevice(device)}
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
        onSubmit={handleInputDialog}
        onCancel={hideInputDialog}
      />

      <FaceDetectorModal
        open={faceDetectorModalOpen}
        onDetection={handleFaceDetection}
        onCancel={finishBiometricRegister}
      />
    </main>
  );
}
