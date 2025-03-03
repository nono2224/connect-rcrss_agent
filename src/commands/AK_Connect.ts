import * as urn from "../URN/URN";
import * as net from "net";
import Command from "./Command";
import Proto from "../proto/Proto";
import { AgentType } from "../enum/AgentType";
import { resolve } from "path";
import { rejects } from "assert";

export default class AK_Connect extends Command {
    constructor(private agentType: AgentType, private agentName: string, private requestId: number, private port: number, private host: string) {
        super();
    }

    connectToServer(): Promise<net.Socket> {
        return new Promise((resolve, reject) => {
            const client = net.connect({ port: this.port, host: this.host, timeout: 5000 }, () => {
                const proto = new Proto("AK_CONNECT");

                proto.setMessageMapIntValue("RequestID", this.requestId);
                proto.setMessageMapIntValue("Version", 2);
                proto.setMessageMapStringValue("Name", this.agentName);
                proto.setMessageMapIntListValue("RequestedEntityTypes", [urn.URN_MAP_R[this.agentType]]);

                proto.send(client);
                resolve(client);
            });

            client.on("error", (err) => {
                reject(err);
            });
        });
    }
}
