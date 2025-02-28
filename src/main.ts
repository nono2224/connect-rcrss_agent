import HumanCommand from "./commands/Human/HumanCommand";
import { Connection } from "./connection/Connection";
import * as net from "net";

export class Main {
    currentStep: number;
    agentId: number;
    client: net.Socket;

    constructor() {}

    connect(agentType: string = "POLICE_FORCE", agentName: string = "ringo", requestId: number = 9999, port: number = 27931, host: string = "localhost") {
        return new Connection(agentType, agentName, requestId, port, host, this);
    }

    sendCommand(command: HumanCommand) {
        command.send(this.agentId, this.currentStep, this.client);
    }

    getCurrentStep() {
        return this.currentStep;
    }

    getAgentId() {
        return this.agentId;
    }
}
