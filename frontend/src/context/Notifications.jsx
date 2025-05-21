import React, { createContext, useState, useContext, useCallback } from "react";
import { createPortal } from "react-dom";

const NotificationContext = createContext(null);

let idCounter = 0;

const getNotificationRoot = () => {
  let root = document.getElementById("notifications-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "notifications-root";
    document.body.appendChild(root);
  }
  return root;
};

const notificationRoot = getNotificationRoot();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const showNotification = useCallback(
    ({ message, type = "info", duration = 3000 }) => {
      const id = idCounter++;
      setNotifications((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    },
    []
  );

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {createPortal(
        <div style={rootcontainernotify}>
          <div style={containerStyle} aria-live="polite" aria-atomic="true">
            {notifications.map(({ id, message, type }) => (
              <div key={id} style={{ ...notificationStyle, ...typeStyles[type] }}>
                {message}
              </div>
            ))}
          </div>
        </div>,
        notificationRoot
      )}
      <style>{keyframes}</style>
    </NotificationContext.Provider>
  );
};

// Хук для вызова уведомлений из компонентов
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error("useNotification должен использоваться внутри NotificationProvider");
  }
  return context.showNotification;
};

const rootcontainernotify = {
  position: "fixed",
  top: 32,
  left: 32,
  zIndex: 9999,
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  maxWidth: "350px",
  width: "90vw",
  boxSizing: "border-box",
  height: "fit-content",
  pointerEvents: "none", // Чтобы уведомления не мешали кликам по странице
};

// Стили и анимация
const containerStyle = {
  top: 32,
  left: 32,
  zIndex: 9999,
  display: "flex",
  flexDirection: "column-reverse",
  gap: "8px",
  maxWidth: "350px",
  width: "90vw",
  boxSizing: "border-box",
  height: "100%",
  pointerEvents: "none", // Чтобы уведомления не мешали кликам по странице
  transition: "all 150ms ease-in-out",
};

const notificationStyle = {
  backgroundColor: "#2196F3",
  color: "white",
  padding: "12px 20px",
  width: "fit-content",
  borderRadius: 6,
  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
  fontWeight: "500",
  fontSize: 16,
  pointerEvents: "auto",
  userSelect: "none",
  animation: "fadeinout 4.2s ease forwards",
};

const typeStyles = {
  info: { backgroundColor: "var(--variable-collection-accent)" },
  success: { backgroundColor: "limegreen" },
  error: { backgroundColor: "red" },
  warning: { backgroundColor: "#FF9800" },
};

const keyframes = `
@keyframes fadeinout {
  0% {display: none; opacity: 0; transform: translateY(-20px); }
  10%{display: block}
  20%, 80% { opacity: 1; transform: translateY(-5px); }
  90% { opacity: 0; transform: translatex(-50px);transform: translateY(-5px);}
  100%{opacity: 0; display: none;}
}
`;

// Пример использования внутри компонента
/*
import React from "react";
import { NotificationProvider, useNotification } from "./NotificationProvider";

const DemoComponent = () => {
  const notify = useNotification();

  return (
    <button
      onClick={() =>
        notify({ message: "Привет! Это уведомление.", type: "success", duration: 4000 })
      }
    >
      Показать уведомление
    </button>
  );
};

export default function App() {
  return (
    <NotificationProvider>
      <DemoComponent />
      {/* другие компоненты приложения * /}
    </NotificationProvider>
  );
}
*/