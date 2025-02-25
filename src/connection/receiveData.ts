import * as proto from "../proto/RCRSProto_pb";
import AK_Acknowledge from "../commands/AK_Acknowledge";
import * as urn from "../URN/URN";

export default class ReceiveData {
    buffer = Buffer.alloc(0);

    constructor() {}

    receive(data, emit, agentId, client, currentStep) {
        // 受信データをバッファに追加
        this.buffer = Buffer.concat([this.buffer, data]);

        // メッセージのサイズが読み取れるか確認 (4バイト以上必要)
        while (this.buffer.length >= 4) {
            // メッセージのサイズを取得
            const size = (this.buffer[0] << 24) | (this.buffer[1] << 16) | (this.buffer[2] << 8) | this.buffer[3];

            // メッセージ全体がバッファに到着しているか確認
            if (this.buffer.length < size + 4) {
                // console.log(`Waiting for more data. Expected: ${size + 4}, Received: ${this.buffer.length}`);
                return; // データが足りない場合は、次の 'data' イベントを待つ
            }

            // メッセージ全体を切り出す
            const messageData = this.buffer.subarray(4, size + 4);

            // バッファから処理済みのメッセージを削除
            this.buffer = this.buffer.subarray(size + 4);

            let res;
            try {
                // メッセージをデシリアライズ
                res = proto.MessageProto.deserializeBinary(messageData);
            } catch (error) {
                console.error("Deserialization error:", error);
                console.error("Received data length:", messageData.length); // 受信データ長
                console.error("Expected size:", size); // 期待されるサイズ
                // 必要に応じて、ここでエラーハンドリングを強化 (例: 接続をリセット)
                console.error("this.buffer content:", this.buffer);
                console.error("Message data content:", messageData);

                return;
            }

            emit("receiveData", res);

            // 帰ってきたメッセージのURNがAKConnectOKのとき
            if (res.getUrn() === urn.URN_MAP_R["KA_CONNECT_OK"]) {
                const res_requestId = res.getComponentsMap().get(urn.URN_MAP_R["RequestID"]).getIntvalue(); // requestId
                agentId = res.getComponentsMap().get(urn.URN_MAP_R["AgentID"]).getEntityid(); // agentId

                new AK_Acknowledge(res_requestId, agentId).send(client);
            }

            if (res.getUrn() == 0x116) {
                currentStep = res.getComponentsMap().get(0x020e).getIntvalue(); // 現在のステップを更新
            }
        }
    }
}
