import * as proto from "./../proto/RCRSProto_pb";
import send from "./send";

export default (res, client, thisAgentId) => {
    const message = new proto.MessageProto();
    message.setUrn(0x0113); // AK_ACKNOWLEDGE

    const map = message.getComponentsMap();
    const requestId = new proto.MessageComponentProto();
    const agentId = new proto.MessageComponentProto();

    requestId.setIntvalue(
        res
            .getComponentsMap()
            .get(0x0200 | 1)
            .getIntvalue() // requestId
    );
    agentId.setEntityid(
        res
            .getComponentsMap()
            .get(0x0200 | 2)
            .getEntityid() // agentId
    );

    thisAgentId = res
        .getComponentsMap()
        .get(0x0200 | 2)
        .getEntityid();

    map.set(0x0200 | 1, requestId);
    map.set(0x0200 | 2, agentId);

    send(client, message);
};
