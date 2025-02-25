import * as proto from "./RCRSProto_pb";
import * as urn from "../URN/URN";
import { prototype } from "events";
import * as net from "net";

export default class Proto {
    message: proto.MessageProto;
    messageMap: proto.MessageProto.getComponentsMap;

    constructor(protoType: string) {
        this.message = new proto.MessageProto();

        this.message.setUrn(urn.URN_MAP_R[protoType]);

        this.messageMap = this.message.getComponentsMap();
    }

    getMessage() {
        return this.message;
    }

    send(client: net.Socket) {
        // console.log("送るメッセージ");
        // console.log(JSON.stringify(message.toObject()));
        // console.log("\n");
        const buffer = this.message.serializeBinary();
        const sizeBuffer = new Uint8Array([(buffer.length >> 24) & 255, (buffer.length >> 16) & 255, (buffer.length >> 8) & 255, buffer.length & 255]);
        client.write(sizeBuffer);
        client.write(buffer);

        console.log(JSON.stringify(this.message.toObject()));
    }

    setMessageMapIntValue(type: string, res: number) {
        const map = new proto.MessageComponentProto();

        map.setIntvalue(res);

        this.messageMap.set(urn.URN_MAP_R[type], map);
    }

    setMessageMapStringValue(type: string, res: string) {
        const map = new proto.MessageComponentProto();

        map.setStringvalue(res);

        this.messageMap.set(urn.URN_MAP_R[type], map);
    }

    setMessageMapIntListValue(type: string, res: number[]) {
        const map = new proto.MessageComponentProto();

        const IntListProto = new proto.IntListProto();
        for (const num of res) {
            IntListProto.addValues(num);
        }
        map.setIntlist(IntListProto);

        this.messageMap.set(urn.URN_MAP_R[type], map);
    }

    setMessageMapEntityIdValue(type: string, res: number) {
        const map = new proto.MessageComponentProto();

        map.setEntityid(res);

        this.messageMap.set(urn.URN_MAP_R[type], map);
    }
}
