import { createContext, useContext, useState, useCallback } from "react"

const ToastContext = createContext()

let counter = 0

function ToastProvider({ children }) {

  const [toasts, setToasts] = useState([])

  const remove = useCallback((id) => {
    setToasts(list => list.filter(t => t.id !== id))
  }, [])

  const toast = useCallback((message, type = "info") => {
    const id = ++counter
    setToasts(list => [...list, { id, message, type }])
    setTimeout(() => remove(id), 3000)
  }, [remove])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast toast-${t.type}`}
            role="status"
            onClick={() => remove(t.id)}
          >
            <span className="toast-icon">
              {t.type === "success" ? "✓" : t.type === "error" ? "⚠" : "ℹ"}
            </span>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => useContext(ToastContext)

export default ToastProvider
