import { useState } from "react";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";

interface Props {
  id: string;
  name: string;
  value?: string;
  required?: boolean;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
}

export function PasswordInput({
  id,
  name,
  value,
  required,
  onChange,
  onBlur,
}: Props) {
  const [isVisiblePassword, setIsVisiblePassword] = useState(false);

  const togglePasswordVisibility = () => {
    setIsVisiblePassword((visible) => !visible);
  };

  return (
    <div className="relative">
      <input
        type={isVisiblePassword ? "text" : "password"}
        name={name}
        id={id}
        onChange={onChange}
        onBlur={onBlur}
        value={value}
        required={required}
      />
      <button
        className="absolute right-4 top-0 bottom-0"
        type="button"
        onClick={togglePasswordVisibility}
      >
        {isVisiblePassword ? <FaRegEyeSlash /> : <FaRegEye />}
      </button>
    </div>
  );
}
