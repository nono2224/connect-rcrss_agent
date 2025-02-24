import * as proto from "./../proto/RCRSProto_pb";
import AK_Acknowledge from "./AK_Acknowledge";
import sendCommand from "./sendCommand";

export default (buffer, data, emit, agentId, client, currentStep) => {
    // 受信データをバッファに追加
    buffer = Buffer.concat([buffer, data]);

    // メッセージのサイズが読み取れるか確認 (4バイト以上必要)
    while (buffer.length >= 4) {
        // メッセージのサイズを取得
        const size = (buffer[0] << 24) | (buffer[1] << 16) | (buffer[2] << 8) | buffer[3];

        // メッセージ全体がバッファに到着しているか確認
        if (buffer.length < size + 4) {
            // console.log(`Waiting for more data. Expected: ${size + 4}, Received: ${buffer.length}`);
            return; // データが足りない場合は、次の 'data' イベントを待つ
        }

        // メッセージ全体を切り出す
        const messageData = buffer.subarray(4, size + 4);

        // バッファから処理済みのメッセージを削除
        buffer = buffer.subarray(size + 4);

        let res;
        try {
            // メッセージをデシリアライズ
            res = proto.MessageProto.deserializeBinary(messageData);
        } catch (error) {
            console.error("Deserialization error:", error);
            console.error("Received data length:", messageData.length); // 受信データ長
            console.error("Expected size:", size); // 期待されるサイズ
            // 必要に応じて、ここでエラーハンドリングを強化 (例: 接続をリセット)
            console.error("Buffer content:", buffer);
            console.error("Message data content:", messageData);

            return;
        }

        emit("receiveData", res);

        // 帰ってきたメッセージのURNがAKConnectOKのとき
        if (res.getUrn() == 0x0114) {
            AK_Acknowledge(res, client, agentId);
        }

        if (res.getUrn() == 0x116) {
            currentStep = res.getComponentsMap().get(0x020e).getIntvalue(); // 現在のステップを更新
            sendCommand(); // コマンドを送信 (キューにコマンドがあればそれも処理)
        }
    }
};
