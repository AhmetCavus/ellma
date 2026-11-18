import { useStore } from "../lib/store";

export function Toast() {
  const { toast } = useStore();
  return (
    <div className={`toast ${toast ? "toast-visible" : ""}`} role="status" aria-live="polite">
      {toast}
    </div>
  );
}
