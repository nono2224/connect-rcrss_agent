import { EventEmitter } from "events";
import AK_Connect from "./../commands/AK_Connect";
import { exit } from "process";
import * as net from "net";
import ReceiveData from "./ReceiveData";
import { Socket } from "dgram";

export class Connection extends EventEmitter {
    agentType: string;
    agentName: string;
    requestId: number;
    port: number;
    host: string;
    receiveData: ReceiveData;
    client: net.Socket;
    agentId: number;
    currentStep: number;
    commandQueue = [];

    constructor(agentType: string, agentName: string, requestId: number, port: number, host: string) {
        super();

        this.agentType = agentType;
        this.agentName = agentName;
        this.requestId = requestId;
        this.port = port;
        this.host = host;

        if (agentType === "POLICE_FORCE") {
            this.client = new AK_Connect("POLICE_FORCE", agentName, requestId, port, host).connectToServer();
        } else {
            console.error("対象のエージェントが見つかりません");
            exit;
        }

        this.receiveData = new ReceiveData();

        this.client.on("data", (data) => {
            this.receiveData.receive(data, this.emit.bind(this), this.agentId, this.client, this.currentStep);
        });
    }
}
