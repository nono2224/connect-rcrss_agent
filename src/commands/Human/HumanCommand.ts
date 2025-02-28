import Proto from "../../proto/Proto";
import Command from "../Command";
import * as net from "net";

export default abstract class extends Command {
    constructor() {
        super();
    }

    abstract createProto(): Proto;

    send(agentId: number, currentStep: number, client: net.Socket) {
        const proto: Proto = this.createProto();

        const nextStep: number = currentStep + 1;

        proto.setMessageMapEntityIdValue("AgentID", agentId);
        proto.setMessageMapIntValue("Time", nextStep);

        proto.send(client);
    }
}
