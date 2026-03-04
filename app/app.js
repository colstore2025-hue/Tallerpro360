import { initRouter } from "./router.js";
import { buildMenu } from "./router.js";

document.addEventListener("DOMContentLoaded", () => {
  buildMenu();
  initRouter();
});