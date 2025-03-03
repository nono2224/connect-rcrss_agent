import HumanCommand from "./commands/Human/HumanCommand";
import { Connection } from "./connection/Connection";
import * as net from "net";
import { EventEmitter } from "stream";
import { AgentType } from "./enum/AgentType";

export class Main extends EventEmitter {
    currentStep: number = -1;
    agentId: number = -1;
    client: net.Socket | null = null;

    connect(agentType: AgentType = AgentType.POLICE_FORCE, agentName: string = "ringo", requestId: number = 9999, port: number = 27931, host: string = "localhost"): Promise<void> {
        return new Promise((resolve, rejects) => {
            const connection = new Connection(agentType, agentName, requestId, port, host, this);

            connection.on("connected", (client: net.Socket) => {
                this.client = client;
                resolve();
            });

            connection.on("error", (err) => {
                rejects(err);
            });

            connection.on("close", () => {
                this.emit("close");
            });
        });
    }

    sendCommand(command: HumanCommand) {
        if (this.client) {
            command.send(this.agentId, this.currentStep, this.client);
        } else {
            this.emit("error", new Error("not connected"));
        }
    }

    getCurrentStep() {
        return this.currentStep;
    }

    getAgentId() {
        return this.agentId;
    }
}
