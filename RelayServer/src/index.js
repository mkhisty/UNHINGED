import { start_socket_server } from "./socket.js";
import * as dotenv from "dotenv"

async function main() {
    dotenv.config()
    await start_socket_server(process.env.PORT);
}

main()