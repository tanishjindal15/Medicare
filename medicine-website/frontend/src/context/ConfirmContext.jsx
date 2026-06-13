import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"

const ConfirmContext = createContext()

export const useConfirm = () => useContext(ConfirmContext)

function ConfirmProvider({ children }) {

  const [dialog, setDialog] = useState(null)
  const resolver = useRef(null)

  /* confirm({ title, message, confirmText, cancelText, danger }) -> Promise<boolean> */
  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      resolver.current = resolve
      setDialog({
        title: opts.title || "Are you sure?",
        message: opts.message || "",
        confirmText: opts.confirmText || "Confirm",
        cancelText: opts.cancelText || "Cancel",
        danger: Boolean(opts.danger)
      })
    })
  }, [])

  const close = useCallback((result) => {
    setDialog(null)
    if (resolver.current) {
      resolver.current(result)
      resolver.current = null
    }
  }, [])

  // Close on Escape while the dialog is open
  useEffect(() => {
    if (!dialog) return
    const onKey = (e) => {
      if (e.key === "Escape") close(false)
      if (e.key === "Enter") close(true)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [dialog, close])

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {dialog && (
        <div className="modal-overlay" onClick={() => close(false)}>
          <div
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-label={dialog.title}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title">{dialog.title}</h3>
            {dialog.message && <p className="modal-message">{dialog.message}</p>}

            <div className="modal-actions">
              <button className="modal-btn modal-cancel" onClick={() => close(false)}>
                {dialog.cancelText}
              </button>
              <button
                className={`modal-btn ${dialog.danger ? "modal-danger" : "modal-confirm"}`}
                onClick={() => close(true)}
                autoFocus
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export default ConfirmProvider
