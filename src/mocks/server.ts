import { setupServer } from "msw/node";
import { handlers } from "./handlers";

// Konfiguruje serwer mockujący z podanymi handlerami
export const server = setupServer(...handlers);
