import * as proto from "./../proto/RCRSProto_pb";

export default class Command {
    message: proto.MessageProto;

    send(client) {
        // console.log("送るメッセージ");
        // console.log(JSON.stringify(message.toObject()));
        // console.log("\n");
        const buffer = this.message.serializeBinary();
        const sizeBuffer = new Uint8Array([(buffer.length >> 24) & 255, (buffer.length >> 16) & 255, (buffer.length >> 8) & 255, buffer.length & 255]);
        client.write(sizeBuffer);
        client.write(buffer);
    }
}
