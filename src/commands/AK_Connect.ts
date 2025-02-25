import * as urn from "../URN/URN";
import * as net from "net";
import Command from "./Command";
import Proto from "../proto/Proto";

export default class AK_Connect extends Command {
    agentType: string;
    agentName: string;
    requestId: number;
    port: number;
    host: string;

    constructor(agentType: string, agentName: string, requestId: number, port: number, host: string) {
        super();

        this.agentType = agentType;
        this.agentName = agentName;
        this.requestId = requestId;
        this.port = port;
        this.host = host;
    }

    connectToServer(): net.Socket {
        const client = net.connect({ port: this.port, host: this.host }, () => {
            const proto = new Proto("AK_CONNECT");

            proto.setMessageMapIntValue("RequestID", this.requestId);
            proto.setMessageMapIntValue("Version", 2);
            proto.setMessageMapStringValue("Name", this.agentName);
            proto.setMessageMapIntListValue("RequestedEntityTypes", [urn.URN_MAP_R[this.agentType]]);

            proto.send(client);
        });

        return client;
    }
}
