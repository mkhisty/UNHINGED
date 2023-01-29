import fs from "fs"
import { WebSocket } from "ws"

async function get_all_relays() {
    if(!fs.existsSync("relays.json")) {
        return {}
    }
    const file_data = fs.readFileSync("relays.json").toString()
    const relays_data = JSON.parse(file_data)
    return relays_data.relays
}

async function distribute_all_relays(msg, action) {
    const relays = await get_all_relays()
    if("add" === action) {
        const file_data = fs.readFileSync(msg["file_name"])
        for(const relay_addr of relays) {
            const ws = new WebSocket(relay_addr)
            ws.on("open", () => {
                const sendData = {
                    "type": "add_file",
                    "file_data": file_data,
                    "file_name": msg["file_name"]
                }
    
                ws.send(
                    JSON.stringify(sendData)
                )
            })
    
            ws.on("message", (msg) => {
                msg = msg.toString()
                try {
                    msg = JSON.parse(msg)
                } catch (err) {}
                if(msg["status"] === 200) {
                    ws.close()
                    return
                }
            })
        }
    } else {
            for(const relay_addr of relays) {
                const ws = new WebSocket(relay_addr)
                ws.on("open", () => {
                    const sendData = {
                        "type": "del_file",
                        "file_path": msg["file_path"]
                    }
    
                    ws.send(
                        JSON.stringify(sendData)
                    )
                })
    
                ws.on("message", (msg) => {
                    msg = msg.toString()
                    try {
                        msg = JSON.parse(msg)
                    } catch (err) {}
                    if(msg["status"] === 200) {
                        ws.close()
                        return
                    }
                })
            }
    }
}

async function file_check_all_relays(msg) {
    const relays = await get_all_relays()
    let data
    for(const addr of relays) {
        const ws = new WebSocket(addr)
        ws.on("open", () => {
            let send_data = {
                "type": "read_file",
                "file_path": msg["file_path"]
            }
            ws.send(JSON.stringify(send_data))
        })
        ws.on("message", async (msg) => {
            msg = msg.toString()
            try {
                msg = JSON.parse(msg)
            } catch (err) {
                console.log(err)
            }
            if(msg.status !== 200) {
                return
            }
            data = msg.file_data.data
            await write_to_file(data)
            return
        })
    }
}

async function write_to_file(file_path, data) {
    fs.writeFileSync(file_path, data, (err) => {
        if(err) {
            console.log(err)
        }
    })
}

export { get_all_relays, distribute_all_relays, file_check_all_relays }