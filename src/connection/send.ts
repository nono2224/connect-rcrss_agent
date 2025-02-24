export default function send(client, message) {
    // console.log("送るメッセージ");
    // console.log(JSON.stringify(message.toObject()));
    // console.log("\n");
    const buffer = message.serializeBinary();
    const sizeBuffer = new Uint8Array([(buffer.length >> 24) & 255, (buffer.length >> 16) & 255, (buffer.length >> 8) & 255, buffer.length & 255]);
    client.write(sizeBuffer);
    client.write(buffer);
}
