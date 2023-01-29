import { WebSocketServer } from "ws"
import { compress } from "./utils/compression.js";
import { distribute_all_relays, file_check_all_relays } from "./relays.js"
import path from "path"
import fs from "fs"
import * as uuid from "uuid"

async function start_socket_server(port) {
    const wss = new WebSocketServer({ port: port })
    console.log(`Socket server started on ${port}`)
    wss.on("connection", async (ws) => {
        ws.on("error", (err) => {
            console.log(err)
        })

        ws.on("message", async (msg) => {
            msg = msg.toString()
            try {
                msg = JSON.parse(msg)
            } catch (err) {
                ws.send("Data is not in json format")
                return
            }
            if(!msg["type"]) {
                ws.send("Missing request type")
                return
            }
            switch(msg["type"]){
                /*
                case "register":
                    console.log("new register")
                    const id = msg["from_id"]
                    await refresh_client_lists(id)
                    return
                */
                case "add_file":
                    if(!msg["file_data"] || !msg["file_name"]) {
                        ws.send("Missing field parameters")
                        return
                    }
                    let extention = path.extname(msg["file_name"])
                    let file_secure_name = uuid.v4()
                    let status = 404
                    let file_name = ""
                    try {
                        const full_path = path.join(process.env.STORAGE_DIR, file_secure_name) + extention
                        fs.writeFileSync(full_path, msg["file_data"])
                        await compress(full_path)
                        file_name = full_path
                        status = 200
                    } catch (err) {}
                    await distribute_all_relays(msg, "add")
                    ws.send(JSON.stringify({
                        status: status,
                        path: file_name
                    }))
                    return
                case "del_file":
                    if(!msg["file_path"]) {
                        ws.send("Missing field parameters")
                        return
                    }
                    const file_path = msg["file_path"]
                    try {
                        fs.unlinkSync(file_path)
                    } catch(err) {}
                    await distribute_all_relays(file_path, "del")
                case "get_file":
                    if(!msg["file_path"] || !msg["out_name"]) {
                        ws.send("Missing field parameters")
                        return
                    }
                    const file = msg["file_path"]
                    if(!fs.existsSync(file)) {
                        ws.send(JSON.stringify({
                            status: 404,
                        }))
                    }4
                    const data = await file_check_all_relays(msg)
                    console.log(data)
                    //fs.writeFileSync(msg["out_name"], data)
                    return
                case "read_file":
                    if(!msg["file_path"]) {
                        ws.send("Missing field parameters")
                        return
                    }
                    const file_Path = msg["file_path"]
                    if(!fs.existsSync(file_Path)) {
                        ws.send(JSON.stringify({
                            status: 404,
                        }))
                    }
                    const file_data = fs.readFileSync(file_Path)
                    ws.send(JSON.stringify({
                        status: 200,
                        file_data: file_data
                    }))
            }
        })
        ws.on("close", (code, reason) => {
            console.log(`Client left: ${reason}`)
        })
    })
}

export { start_socket_server }