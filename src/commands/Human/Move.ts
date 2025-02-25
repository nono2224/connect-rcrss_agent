export class Move {
    destinationX: number;
    destinationY: number;
    path: number[];

    constructor(destinationX: number, destinationY: number, path: number[]) {
        this.destinationX = destinationX;
        this.destinationY = destinationY;
        this.path = path;
    }
}
