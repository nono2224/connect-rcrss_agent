import { Main } from "./src/main";

const app = new Main();

const connect = app.connect();

connect.on("receiveData", (data) => {
    console.log(data.toObject());
});
