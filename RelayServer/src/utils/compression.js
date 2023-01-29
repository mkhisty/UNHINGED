import * as zlib from "zlib"
import fs from "fs"

async function compress(file_path){
    const file_data = fs.readFileSync(file_path)
    const compressed_file = zlib.deflateSync(file_data);
    fs.unlinkSync(file_path)
    fs.writeFileSync(file_path, compressed_file)
}

export { compress }
