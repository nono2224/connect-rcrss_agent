import Proto from "../../proto/Proto";
import HumanCommand from "./HumanCommand";

export default class Move extends HumanCommand {
    destinationX: number;
    destinationY: number;
    path: number[];

    constructor(destinationX: number, destinationY: number, path: number[]) {
        super();

        this.destinationX = destinationX;
        this.destinationY = destinationY;
        this.path = path;
    }

    createProto(): Proto {
        const proto = new Proto("AK_MOVE");

        proto.setMessageMapIntValue("DestinationX", this.destinationX);
        proto.setMessageMapIntValue("DestinationY", this.destinationY);
        proto.setMessageMapEntityIdListValue("Path", this.path);

        return proto;
    }
}
