import * as net from "net";
import * as proto from "./../proto/RCRSProto_pb";
import * as urn from "./../URN/URN";
import send from "./send";

export default (agentType: string, agentName: string, requestId: number, port: number, host: string) => {
    const client = net.connect({ port: port, host: host }, () => {
        // オブジェクト形式でオプション指定
        const message = new proto.MessageProto();

        // AKConnect: エージェントプログラムからカーネルに接続要求をするメッセージ
        message.setUrn(urn.URN_MAP_R["AK_CONNECT"]);

        const map = message.getComponentsMap();

        const map_requestId = new proto.MessageComponentProto();
        const map_version = new proto.MessageComponentProto();
        const map_name = new proto.MessageComponentProto();
        const map_requestedEntityTypes = new proto.MessageComponentProto();

        // requestIdはユニークな値にする必要あり
        map_requestId.setIntvalue(requestId);

        // versionはサーバ側で使用されている気配はないので適当な値で良い
        // 1とそれ以外でサーバー側の動作が違う？？？(nono2224)
        map_version.setIntvalue(2);

        // nameはエージェントプログラムの名前を設定
        map_name.setStringvalue(agentName);

        // エージェントの種類
        const TypeList = new proto.IntListProto();
        TypeList.addValues(urn.URN_MAP_R[agentType]);
        map_requestedEntityTypes.setIntlist(TypeList);

        map.set(urn.URN_MAP_R["RequestID"], map_requestId);
        map.set(urn.URN_MAP_R["Version"], map_version);
        map.set(urn.URN_MAP_R["Name"], map_name);
        map.set(urn.URN_MAP_R["RequestedEntityTypes"], map_requestedEntityTypes);

        send(client, message);
    });

    return client;
};
