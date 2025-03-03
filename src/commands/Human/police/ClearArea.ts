import HumanCommand from "../HumanCommand";
import Proto from "../../../proto/Proto";

export class ClearArea extends HumanCommand {
    destinationX: number;
    destinationY: number;

    constructor(destinationX: number, destinationY: number) {
        super();

        this.destinationX = destinationX;
        this.destinationY = destinationY;
    }

    createProto(): Proto {
        const proto = new Proto("AK_CLEAR_AREA");

        proto.setMessageMapIntValue("DestinationX", this.destinationX);
        proto.setMessageMapIntValue("DestinationY", this.destinationY);

        return proto;
    }
}
