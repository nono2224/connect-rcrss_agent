import { EventEmitter } from "events";
import AK_Connect from "./AK_Connect";
import { exit } from "process";
import receiveData from "./receiveData";

export class Connection extends EventEmitter {
    agentType: string;
    agentName: string;
    requestId: number;
    port: number;
    host: string;
    client;
    buffer = Buffer.alloc(0);
    agentId;
    currentStep;
    commandQueue = [];

    constructor(agentType: string, agentName: string, requestId: number, port: number, host: string) {
        super();

        this.agentType = agentType;
        this.agentName = agentName;
        this.requestId = requestId;
        this.port = port;
        this.host = host;

        (async () => {
            if (agentType === "POLICE_FORCE") {
                this.client = await AK_Connect("POLICE_FORCE", agentName, requestId, port, host);
            } else {
                console.error("対象のエージェントが見つかりません");
                exit;
            }

            await this.client.on("data", (data) => {
                receiveData(this.buffer, data, this.emit.bind(this), this.agentId, this.client, this.currentStep);
            });
        })();
    }
}
