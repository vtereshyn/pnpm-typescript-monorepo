import { StrictMode } from "react";
import { render } from "react-dom";

import Root from "./Root";

render(
  <StrictMode>
    <Root />
  </StrictMode>,
  document.getElementById("app-root")
);
