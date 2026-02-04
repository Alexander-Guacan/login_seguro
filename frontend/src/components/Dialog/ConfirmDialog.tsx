interface Props {
  open: boolean;
  title: string;
  question: string;
  onAccept: () => void;
  onDecline: () => void;
}

export function ConfirmDialog({
  open,
  title,
  question,
  onAccept,
  onDecline,
}: Props) {
  return (
    <dialog
      className={
        open
          ? "fixed w-full h-full flex items-center justify-center text-white bg-white/30 backdrop-blur-md"
          : ""
      }
      open={open}
    >
      <section className="bg-sky-800 p-8 rounded-md flex flex-col gap-y-6">
        <header>
          <h3 className="text-2xl font-semibold">{title}</h3>
        </header>
        <p>{question}</p>
        <footer className="flex justify-evenly">
          <button
            className="button button--accept"
            type="button"
            onClick={onAccept}
          >
            Aceptar
          </button>
          <button
            className="button button--danger"
            type="button"
            onClick={onDecline}
          >
            Cancelar
          </button>
        </footer>
      </section>
    </dialog>
  );
}
