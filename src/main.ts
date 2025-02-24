import { Connection } from "./connection/Connection";

export class Main {
    constructor() {}

    connect(agentType: string = "POLICE_FORCE", agentName: string = "ringo", requestId: number = 9999, port: number = 27931, host: string = "localhost") {
        return new Connection(agentType, agentName, requestId, port, host);
    }
}
