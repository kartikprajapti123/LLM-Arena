import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { CommonRoutes } from "../common/CommonRoutes";
import "../common/CommonStyle.css";
import { Provider } from "react-redux";
import { CommonStore } from "../common/CommonStore";
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
createRoot(document.getElementById("root")).render(
  <Provider store={CommonStore}>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <CommonRoutes />
    </GoogleOAuthProvider>
  </Provider>,
);
