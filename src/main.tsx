import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

const main = () => {
  const root = document.getElementById("root");
  if (root == null) {
    throw new Error("Failed to find the root element");
  }

  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
};

main();
