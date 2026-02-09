import { useState } from "react";
import { ImSpinner2 } from "react-icons/im";

interface DialogOption<T> {
  label: string;
  value: T;
}

interface Props<T> {
  open: boolean;
  title: string;
  options: DialogOption<T>[];
  disabled?: boolean;
  onSubmit?: (optionSelected: T) => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
}

export function OptionsDialog<T>({
  open,
  title,
  options,
  disabled,
  onSubmit,
  onCancel,
}: Props<T>) {
  const [submitting, setSubmitting] = useState(false);
  const [selectedOption, setSelectedOption] = useState(options[0].value);

  const handleAccept = async () => {
    setSubmitting(true);
    await onSubmit?.(selectedOption);
    setSubmitting(false);
    setSelectedOption(options[0].value);
  };

  return (
    <dialog
      className={`modal-container ${open ? "modal-container--open" : "modal-container--closed"}`}
      open={open}
    >
      <section className="modal">
        <header className="modal__header">
          <div>
            <h3 className="modal__title">{title}</h3>
          </div>
        </header>

        <div className="form-container border-0 p-0">
          <form>
            {options.map((option, index) => (
              <div
                key={`${index}-${option}`}
                className="field-group flex-row gap-x-2"
              >
                <input
                  type="radio"
                  name="options-dialog"
                  id={String(option.value)}
                  value={String(option.value)}
                  checked={option.value === selectedOption}
                  onChange={() => setSelectedOption(option.value)}
                />
                <label htmlFor={String(option.value)}>{option.label}</label>
              </div>
            ))}
            <div className="modal__actions">
              <button
                className="button-primary"
                type="button"
                disabled={disabled || submitting}
                onClick={handleAccept}
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
