function draw1(progress) {
    chip.style.top = progress*11*(fieldCell+1) + progress*3 + 'vh';
}
function animate({timing, draw, duration}) {
    let start = performance.now();
    requestAnimationFrame(function animateFrame(time) {
        let timeFraction = (time - start) / duration;
        if (timeFraction > 1) timeFraction = 1;
        let progress = timing(timeFraction);
        draw(progress);
        if (timeFraction < 1) {
            requestAnimationFrame(animateFrame);
        }
    });
}
function bounce1(timeFraction) {
    
    for (let a = 0, b = 1;; a += b, b /= 2) {
        if ((1 - timeFraction) >= (7 - 4 * a) / 11) {
            return 1 - (-Math.pow((11 - 6 * a - 11 * (1 - timeFraction)) / 4, 2) + Math.pow(b, 2));
        }
    }
}
animate({timing: bounce1, draw: draw1, duration: 1000});