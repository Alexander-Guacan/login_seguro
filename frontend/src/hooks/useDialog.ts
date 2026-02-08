import { useState } from "react";

interface Params {
  initialOpen: boolean;
}

export function useDialog({ initialOpen }: Params = { initialOpen: false }) {
  const [open, setOpen] = useState(initialOpen);

  const show = () => setOpen(true);

  const hide = () => setOpen(false);

  return {
    open,
    show,
    hide,
  };
}
