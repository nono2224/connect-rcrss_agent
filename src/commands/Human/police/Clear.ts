import Proto from "../../../proto/Proto";
import HumanCommand from "../HumanCommand";

export class Clear extends HumanCommand {
    agent_id;

    constructor(agent_id: number) {
        super();

        this.agent_id = agent_id;
    }

    createProto(): Proto {
        const proto = new Proto("AK_CLEAR");

        proto.setMessageMapEntityIdValue("Target", this.agent_id);

        return proto;
    }
}
