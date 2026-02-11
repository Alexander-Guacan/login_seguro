import { useEffect, useRef, useState } from "react";
import { AlertContext, type AlertOptions } from "../../context/alertContext";
import { FloatingAlert } from "./FloatingAlert";

const DEFAULT_ALERT_AUTO_HIDE_DURATION = 5000;

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState(
    "Este es un mensaje de alerta por defecto",
  );
  const [{ position, type, duration }, setOptions] = useState<AlertOptions>({
    position: "top-right",
    type: "default",
    duration: DEFAULT_ALERT_AUTO_HIDE_DURATION,
  });
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cancelTimeout = () => {
    if (!timeoutRef.current) return;

    clearTimeout(timeoutRef.current);
    timeoutRef.current = null;
  };

  const showAlert = (message: string, options?: AlertOptions) => {
    cancelTimeout();

    setMessage(message);

    if (options) {
      setOptions((previous) => ({
        ...previous,
        ...options,
      }));
    }

    setVisible(true);

    const hideDelay = options?.duration ?? duration;

    timeoutRef.current = setTimeout(() => {
      setVisible(false);
      timeoutRef.current = null;
    }, hideDelay);
  };

  const hideAlert = () => {
    cancelTimeout();
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      cancelTimeout();
    };
  }, []);

  return (
    <AlertContext
      value={{
        showAlert,
        hideAlert,
      }}
    >
      {children}
      <FloatingAlert
        visible={visible}
        message={message}
        position={position}
        type={type}
      />
    </AlertContext>
  );
}
