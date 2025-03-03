import { EventEmitter } from "events";
import AK_Connect from "./../commands/AK_Connect";
import { exit } from "process";
import * as net from "net";
import ReceiveData from "./ReceiveData";
import { AgentType } from "../enum/AgentType";
import { Main } from "../main";

export class Connection extends EventEmitter {
    private receiveData: ReceiveData;

    constructor(private agentType: AgentType, private agentName: string, private requestId: number, private port: number, private host: string, private main: Main) {
        super();

        this.receiveData = new ReceiveData();

        this.connect();
    }

    private async connect() {
        try {
            const client = await new AK_Connect(this.agentType, this.agentName, this.requestId, this.port, this.host).connectToServer();

            this.main.client = client;
            this.emit("connected", client);

            client.on("data", (data) => {
                this.receiveData.receive(data, this.main);
            });

            client.on("error", (err) => {
                this.emit("error", err);
            });

            client.on("close", () => {
                this.emit("close");
            });
        } catch (error) {
            this.emit("error", error);
        }
    }
}
