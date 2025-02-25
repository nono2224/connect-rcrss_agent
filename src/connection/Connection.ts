import { EventEmitter } from "events";
import AK_Connect from "./../commands/AK_Connect";
import { exit } from "process";
import * as net from "net";
import ReceiveData from "./ReceiveData";

export class Connection extends EventEmitter {
    agentType: string;
    agentName: string;
    requestId: number;
    port: number;
    host: string;
    receiveData: ReceiveData;

    constructor(agentType: string, agentName: string, requestId: number, port: number, host: string, currentStep: number, agentId: number, client) {
        super();

        this.agentType = agentType;
        this.agentName = agentName;
        this.requestId = requestId;
        this.port = port;
        this.host = host;
        this.receiveData = new ReceiveData();

        if (agentType === "POLICE_FORCE") {
            client = new AK_Connect("POLICE_FORCE", agentName, requestId, port, host).connectToServer();
        } else {
            console.error("対象のエージェントが見つかりません");
            exit;
        }

        client.on("data", (data) => {
            this.receiveData.receive(data, this.emit.bind(this), agentId, client, currentStep);
        });

        client.on("error", (err) => {
            //エラーハンドリング
            console.error("Socket error:", err);
            // 接続エラーが発生した場合の処理 (例: リトライ、終了)
        });

        client.on("close", () => {
            // 接続終了時のイベントハンドラを追加 (任意)
            console.log("Connection closed.");
        });
    }
}
