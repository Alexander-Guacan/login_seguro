import { ImSpinner2 } from "react-icons/im";

interface Props {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function SubmitButton({ children, loading, disabled, onClick }: Props) {
  const isDisabled = disabled || loading;

  return (
    <button
      className={"button-solid flex gap-x-2 justify-center items-center"}
      type={onClick ? "button" : "submit"}
      disabled={isDisabled}
      onClick={onClick}
    >
      {loading && <ImSpinner2 className="animate-spin inline-block text-2xl" />}
      {!loading && children}
    </button>
  );
}
