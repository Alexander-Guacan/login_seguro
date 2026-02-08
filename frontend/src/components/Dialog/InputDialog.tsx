import { useState } from "react";
import { ImSpinner2 } from "react-icons/im";

interface Props {
  open: boolean;
  title: string;
  label: string;
  disabled?: boolean;
  onSubmit?: (value: string) => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
}

export function InputDialog({
  open,
  title,
  label,
  disabled,
  onSubmit,
  onCancel,
}: Props) {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const target = e.currentTarget;
    const form = Object.fromEntries(new FormData(target));
    const { userInput } = form;
    await onSubmit?.(userInput.toString().trim());
    setSubmitting(false);
    target.reset();
  };

  return (
    <dialog
      className={`modal-container ${open ? "modal-container--open" : "modal-container--closed"}`}
      open={open}
    >
      <section className="modal md:min-w-100">
        <header className="modal__header">
          <h3 className="modal__title">{title}</h3>
        </header>
        <div className="form-container border-0 p-0">
          <form onSubmit={handleSubmit}>
            <div className="field-group text-sm">
              <label htmlFor="userInput">{label}</label>
              <input type="text" id="userInput" name="userInput" />
            </div>
            <div className="modal__actions">
              <button
                className="button-primary"
                type="submit"
                disabled={disabled || submitting}
              >
                <span>
                  {submitting ? (
                    <ImSpinner2 className="animate-spin" />
                  ) : (
                    "Aceptar"
                  )}
                </span>
              </button>
              <button
                className="button-secondary"
                type="button"
                onClick={onCancel}
                disabled={disabled || submitting}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </section>
    </dialog>
  );
}
