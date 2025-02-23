const net = require("net");
const proto = require("./RCRSProto_pb");
const fs = require("fs");
const fsPromises = require("fs").promises;
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

let fileNum = 0;
let buffer = Buffer.alloc(0);
let commandQueue = [];
let currentStep = 0;
let thisAgentId = 0;
let currentState = "COMMAND_SELECT"; // 現在の状態を追跡する変数

// out ディレクトリの存在確認と作成を行う関数
async function ensureOutDir() {
    const dirPath = "./out";
    try {
        await fsPromises.access(dirPath); // ディレクトリが存在するか確認
        //console.log("Directory already exists:", dirPath); // 存在する場合は何もしない
    } catch (error) {
        if (error.code === "ENOENT") {
            // ENOENT はファイル/ディレクトリが存在しないエラー
            try {
                await fsPromises.mkdir(dirPath); // ディレクトリを作成
                // console.log("Created directory:", dirPath);
            } catch (mkdirError) {
                console.error("Failed to create directory:", mkdirError);
                throw mkdirError; // ディレクトリ作成に失敗した場合は、上位にエラーを伝播
            }
        } else {
            console.error("Error checking directory:", error);
            throw error; // 予期せぬエラーの場合は、上位にエラーを伝播
        }
    }
}

// メッセージをシミュレーションサーバに送信
const client = net.connect({ port: 27931, host: "localhost" }, () => {
    // オブジェクト形式でオプション指定
    const message = new proto.MessageProto();
    // AKConnect: エージェントプログラムからカーネルに接続要求をするメッセージ
    message.setUrn(0x0112);

    const map = message.getComponentsMap();
    const requestId = new proto.MessageComponentProto();
    const version = new proto.MessageComponentProto();
    const name = new proto.MessageComponentProto();
    const requestedEntityTypes = new proto.MessageComponentProto();

    // requestIdはユニークな値にする必要あり
    requestId.setIntvalue(9999);

    // versionはサーバ側で使用されている気配はないので適当な値で良い
    // 1とそれ以外でサーバー側の動作が違う？？？(nono2224)
    version.setIntvalue(2);

    // nameはエージェントプログラムの名前を設定
    name.setStringvalue("ringo");

    // エージェントの種類
    const TypeList = new proto.IntListProto();
    // 土木隊
    TypeList.addValues(0x110e);
    requestedEntityTypes.setIntlist(TypeList);

    map.set(0x0200 | 1, requestId);
    map.set(0x0200 | 3, version);
    map.set(0x0200 | 4, name);
    map.set(0x0200 | 5, requestedEntityTypes);

    send(message);
});

// シミュレーションサーバからのメッセージを受信
client.on("data", (data) => {
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

        // メッセージをJSON形式で出力
        // console.log("送られてきた内容");
        // console.log("Decoded URN:", res.getUrn()); // デシリアライズ後のURNを出力
        // console.log(JSON.stringify(res.toObject()));
        // console.log("\n");
        writeFileAsync(JSON.stringify(res.toObject()));

        // 帰ってきたメッセージのURNがAKConnectOKのとき
        if (res.getUrn() == 0x0114) {
            // KA_CONNECT_OK
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

            send(message);
        }

        if (res.getUrn() == 0x116) {
            currentStep = res.getComponentsMap().get(0x020e).getIntvalue(); // 現在のステップを更新
            sendCommand(res); // コマンドを送信 (キューにコマンドがあればそれも処理)
        }
    }
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

function send(message) {
    // console.log("送るメッセージ");
    // console.log(JSON.stringify(message.toObject()));
    // console.log("\n");
    const buffer = message.serializeBinary();
    const sizeBuffer = new Uint8Array([(buffer.length >> 24) & 255, (buffer.length >> 16) & 255, (buffer.length >> 8) & 255, buffer.length & 255]);
    client.write(sizeBuffer);
    client.write(buffer);
}

async function writeFileAsync(data) {
    try {
        await ensureOutDir(); // ディレクトリの存在確認と作成

        const filePath = "./out/" + fileNum + ".json";
        await fsPromises.writeFile(filePath, data); // Promise バージョンの writeFile を使用
        // console.log("ファイルに書き込みました:", filePath);
        fileNum++;
    } catch (error) {
        console.error("ファイル書き込みエラー:", error); // より詳細なエラー情報を出力
        // 必要に応じて、ここでリトライ処理などを実装
    }
}

function sendCommand(res) {
    // キューにコマンドがあれば、それを処理
    if (commandQueue.length > 0) {
        const nextCommand = commandQueue.shift(); // キューからコマンドを取り出す
        nextCommand.time = currentStep + 1; // 適切なステップ数を設定
        const message = createCommandMessage(nextCommand);
        send(message);
    }
}

function createCommandMessage(command) {
    const message = new proto.MessageProto();
    if (command.command === "move") {
        message.setUrn(0x1302);

        const map = message.getComponentsMap();
        const agentId = new proto.MessageComponentProto();
        const time = new proto.MessageComponentProto();
        const destinationX = new proto.MessageComponentProto();
        const destinationY = new proto.MessageComponentProto();
        const path = new proto.MessageComponentProto();

        agentId.setEntityid(command.agentId);
        time.setIntvalue(command.time);
        destinationX.setIntvalue(command.destinationX);
        destinationY.setIntvalue(command.destinationY);

        const intList = new proto.IntListProto();
        if (Array.isArray(command.path)) {
            for (const p of command.path) {
                intList.addValues(p);
            }
        }
        path.setEntityidlist(intList);

        map.set(0x0202, agentId);
        map.set(0x020e, time);
        map.set(0x1402, destinationX);
        map.set(0x1403, destinationY);
        map.set(0x1405, path);

        return message;
    } else if (command.command === "clear") {
        message.setUrn(0x1309);

        const map = message.getComponentsMap();
        const agentId = new proto.MessageComponentProto();
        const time = new proto.MessageComponentProto();
        const agent_id = new proto.MessageComponentProto();

        agentId.setEntityid(command.agentId);
        time.setIntvalue(command.time);
        agent_id.setEntityid(command.agent_id);

        map.set(0x0202, agentId);
        map.set(0x020e, time);
        map.set(0x1401, agent_id);

        return message;
    } else if (command.command === "clear_area") {
        message.setUrn(0x130a);

        const map = message.getComponentsMap();
        const agentId = new proto.MessageComponentProto();
        const time = new proto.MessageComponentProto();
        const destinationX = new proto.MessageComponentProto();
        const destinationY = new proto.MessageComponentProto();

        agentId.setEntityid(command.agentId);
        time.setIntvalue(command.time);
        destinationX.setIntvalue(command.destinationX);
        destinationY.setIntvalue(command.destinationY);

        map.set(0x0202, agentId);
        map.set(0x020e, time);
        map.set(0x1402, destinationX);
        map.set(0x1403, destinationY);

        return message;
    }
}

function promptUser() {
    if (currentState === "COMMAND_SELECT") {
        rl.question("コマンドの選択 <move or clear or clearArea or exit>: ", (answer) => {
            if (answer === "move") {
                currentState = "MOVE_INPUT";
                promptUser(); // 次の状態へ遷移
            } else if (answer === "clear") {
                currentState = "CLEAR_INPUT";
                promptUser(); // 次の状態へ遷移
            } else if (answer === "clearArea") {
                currentState = "CLEAR-AREA_INPUT";
                promptUser();
            } else if (answer === "exit") {
                rl.close();
                client.end();
            } else {
                console.log("不明なコマンドです。");
                promptUser(); // 同じ状態を維持
            }
        });
    } else if (currentState === "MOVE_INPUT") {
        rl.question("パスを入力 <id1 id2 id3 ...>: ", (answer) => {
            const paths = answer.trim().split(" ");
            const parsedPaths = [];
            let allNumbers = true;

            for (const path of paths) {
                const num = parseInt(path);
                if (isNaN(num)) {
                    allNumbers = false;
                    break;
                }
                parsedPaths.push(num);
            }

            if (allNumbers) {
                commandQueue.push({
                    command: "move",
                    agentId: thisAgentId,
                    time: -1,
                    destinationX: -1,
                    destinationY: -1,
                    path: parsedPaths,
                });
                console.log("コマンドをキューに追加しました", commandQueue);
            } else {
                console.log("数字じゃないのが入ってるぞ");
            }
            currentState = "COMMAND_SELECT"; // コマンド選択状態に戻る
            promptUser();
        });
    } else if (currentState === "CLEAR_INPUT") {
        rl.question("がれきを選択 <id>: ", (answer) => {
            const parsedId = parseInt(answer);

            if (!isNaN(parsedId)) {
                commandQueue.push({
                    command: "clear",
                    agentId: thisAgentId,
                    time: -1,
                    agent_id: parsedId,
                });
            } else {
                console.log("数字じゃないのが入ってるぞ");
            }
            currentState = "COMMAND_SELECT"; // コマンド選択状態に戻る
            promptUser();
        });
    } else if (currentState === "CLEAR-AREA_INPUT") {
        rl.question("座標を選択 <x y>: ", (answer) => {
            const paths = answer.trim().split(" ");
            const parsedPaths = [];
            let allNumbers = true;

            for (const path of paths) {
                const num = parseInt(path);
                if (isNaN(num)) {
                    allNumbers = false;
                    break;
                }
                parsedPaths.push(num);
            }

            if (parsedPaths.length >= 2) {
                if (allNumbers) {
                    commandQueue.push({
                        command: "clear_area",
                        agentId: thisAgentId,
                        time: -1,
                        destinationX: parsedPaths[0],
                        destinationY: parsedPaths[1],
                    });
                    console.log("コマンドをキューに追加しました", commandQueue);
                } else {
                    console.log("数字じゃないのが入ってるぞ");
                }
                currentState = "COMMAND_SELECT"; // コマンド選択状態に戻る
                promptUser();
            } else {
                console.log("少ないぞ");

                currentState = "COMMAND_SELECT"; // コマンド選択状態に戻る
                promptUser();
            }
        });
    }
}

// 初回の入力を開始
promptUser();

rl.on("close", () => {
    console.log("入力を終了します");
});
