export function RawRatio(sprite: cc.Sprite, widthLimit: number, heightLimit: number) {
    let frame = sprite.spriteFrame;
    if (frame == null)
        return;
    let originalSize = frame.getOriginalSize();
    let ratio = Math.min(1, widthLimit / originalSize.width, heightLimit / originalSize.height);
    originalSize.width *= ratio;
    originalSize.height *= ratio;
    sprite.node.width = originalSize.width;
    sprite.node.height = originalSize.height;
}
export function NumMap(minOutput: number, maxOutput: number, minInput: number, maxInput: number, input: number) {
    // input = Math.min(input, maxInput);
    // input = Math.max(input, minInput);
    return minOutput + (maxOutput - minOutput) * (input - minInput) / (maxInput - minInput);
}