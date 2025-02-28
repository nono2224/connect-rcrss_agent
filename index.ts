import Move from "./src/commands/Human/Move";
import { Main } from "./src/main";
const readline = require("readline");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const connectAgent = "CIVILIAN";

const app = new Main();

let connect;

connect = app.connect(connectAgent);

connect.on("receiveData", (data) => {
    // console.log(data.toObject());
});

let currentState = "COMMAND_SELECT"; // 現在の状態を追跡する変数

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
            } else {
                console.log("不明なコマンドです。");
                promptUser(); // 同じ状態を維持
            }
        });
    } else if (currentState === "MOVE_INPUT") {
        rl.question("パスを入力 <id1 id2 id3 ...>: ", (answer) => {
            const paths = answer.trim().split(" ");
            const parsedPaths: number[] = [];
            let allNumbers = true;

            for (const path of paths) {
                const num = parseInt(path);
                if (isNaN(num)) {
                    allNumbers = false;
                    break;
                }
                parsedPaths.push(num);
            }

            // if (allNumbers) {
            //     commandQueue.push({
            //         command: "move",
            //         agentId: thisAgentId,
            //         time: -1,
            //         destinationX: -1,
            //         destinationY: -1,
            //         path: parsedPaths,
            //     });
            //     console.log("コマンドをキューに追加しました", commandQueue);
            // } else {
            //     console.log("数字じゃないのが入ってるぞ");
            // }

            app.sendCommand(new Move(-1, -1, parsedPaths));

            currentState = "COMMAND_SELECT"; // コマンド選択状態に戻る
            promptUser();
        });
    } else if (currentState === "CLEAR_INPUT") {
        rl.question("がれきを選択 <id>: ", (answer) => {
            const parsedId = parseInt(answer);

            // if (!isNaN(parsedId)) {
            //     commandQueue.push({
            //         command: "clear",
            //         agentId: thisAgentId,
            //         time: -1,
            //         agent_id: parsedId,
            //     });
            // } else {
            //     console.log("数字じゃないのが入ってるぞ");
            // }
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
                // if (allNumbers) {
                //     commandQueue.push({
                //         command: "clear_area",
                //         agentId: thisAgentId,
                //         time: -1,
                //         destinationX: parsedPaths[0],
                //         destinationY: parsedPaths[1],
                //     });
                //     console.log("コマンドをキューに追加しました", commandQueue);
                // } else {
                //     console.log("数字じゃないのが入ってるぞ");
                // }
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
