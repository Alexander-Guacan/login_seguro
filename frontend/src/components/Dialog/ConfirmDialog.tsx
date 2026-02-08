import { useState } from "react";
import { ImSpinner2 } from "react-icons/im";

interface Props {
  open: boolean;
  title: string;
  question: string;
  note?: string;
  disabled?: boolean;
  onAccept: () => void | Promise<void>;
  onCancel: () => void | Promise<void>;
}

export function ConfirmDialog({
  open,
  title,
  question,
  note,
  disabled,
  onAccept,
  onCancel,
}: Props) {
  const [submitting, setSubmitting] = useState(false);

  const handleAccept = async () => {
    setSubmitting(true);
    await onAccept?.();
    setSubmitting(false);
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
            <p>{question}</p>
          </div>
          {note && <p className="text-sm"> {note}</p>}
        </header>
        <footer className="modal__actions">
          <button
            className="button-primary"
            type="button"
            onClick={handleAccept}
            disabled={disabled || submitting}
          >
            <span>
              {submitting ? <ImSpinner2 className="animate-spin" /> : "Aceptar"}
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
        </footer>
      </section>
    </dialog>
  );
}
