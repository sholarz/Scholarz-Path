
  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  import { AuthProvider } from "./lib/auth-context";
  import { ForumProvider } from "./lib/forum-context";
  import "./index.css";

  createRoot(document.getElementById("root")!).render(
    <AuthProvider>
      <ForumProvider>
        <App />
      </ForumProvider>
    </AuthProvider>
  );
  