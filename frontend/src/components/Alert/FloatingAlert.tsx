import {
  AiOutlineCheckCircle,
  AiOutlineInfoCircle,
  AiOutlineWarning,
} from "react-icons/ai";
import { FaRegCircleXmark } from "react-icons/fa6";

export type AlertType = "default" | "success" | "warning" | "error";

export type FloatingAlertPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left";

interface Props {
  visible: boolean;
  message: string;
  type?: AlertType;
  position?: FloatingAlertPosition;
}

const positionClass: Record<FloatingAlertPosition, string> = {
  "bottom-left": "bottom-0 left-0",
  "bottom-right": "bottom-0 right-0",
  "top-left": "top-0 left-0",
  "top-right": "top-0 right-0",
};

const alertIcon: Record<AlertType, React.ReactNode> = {
  default: <AiOutlineInfoCircle />,
  error: <FaRegCircleXmark />,
  success: <AiOutlineCheckCircle />,
  warning: <AiOutlineWarning />,
};

export function FloatingAlert({
  visible,
  message,
  type = "default",
  position = "top-right",
}: Props) {
  return (
    <aside
      className={`alert alert--${type} ${visible ? "alert--visible" : "alert--invisible"} fixed ${positionClass[position]} z-10 mx-6 my-5 max-w-86 text-sm inline-flex items-center gap-x-2`}
    >
      <span className="text-xl">{alertIcon[type]}</span>
      <span>{message}</span>
    </aside>
  );
}
