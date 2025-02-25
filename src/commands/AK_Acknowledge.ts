import Proto from "../proto/Proto";
import * as net from "net";

export default class AK_Acknowledge {
    requestId: number;
    agentId: number;

    constructor(requestId: number, agentId: number) {
        this.requestId = requestId;
        this.agentId = agentId;
    }

    getAgentId() {
        return this.agentId;
    }

    send(client: net.Socket) {
        const proto = new Proto("AK_ACKNOWLEDGE");

        proto.setMessageMapIntValue("RequestID", this.requestId);
        proto.setMessageMapEntityIdValue("AgentID", this.agentId);

        proto.send(client);
    }
}
