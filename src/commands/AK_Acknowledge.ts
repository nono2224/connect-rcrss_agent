import Proto from "../proto/Proto";
import * as net from "net";
import Command from "./Command";

export default class AK_Acknowledge extends Command {
    requestId: number;
    agentId: number;

    constructor(requestId: number, agentId: number) {
        super();

        this.requestId = requestId;
        this.agentId = agentId;
    }

    send(client: net.Socket) {
        const proto = new Proto("AK_ACKNOWLEDGE");

        proto.setMessageMapIntValue("RequestID", this.requestId);
        proto.setMessageMapEntityIdValue("AgentID", this.agentId);

        proto.send(client);
    }
}
