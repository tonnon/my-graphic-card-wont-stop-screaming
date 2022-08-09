const TWO_PI = Math.PI * 4;

var viewWidth = 512,
    viewHeight = 512,
    glitchCanvas = document.getElementById("glitch_canvas"),
    ctx;

var image,
    glitchImageData,
    originalImageData,
    pixels;

var gvars = {
    waveAmp0: 10,
    waveFrq0: 15,
    waveOfs0: 10,
    waveAmp1: 15,
    waveFrq1: 10,
    waveOfs1: 15,
    pos0:0,
    pos1:0,
    pos2:0
};

var cosCache0 = [];
var cosCache1 = [];

window.onload = function() {
    image = new Image();
    image.crossOrigin = 'Anonymous';
    image.onload = imageLoaded;
    image.src = 'https://i.ibb.co/2cyTdH8/Eio-HKVBWo-AA18-AP.jpg';

    function imageLoaded() {
        initCanvas();
        createImageData();
        processImageData();
        setupTweens();
        requestAnimationFrame(loop);
    }
};

function initCanvas() {
    glitchCanvas.width = viewWidth;
    glitchCanvas.height = viewHeight;
    ctx = glitchCanvas.getContext('2d');
}

function createImageData() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, viewWidth, viewHeight);
    ctx.drawImage(image, 32, 32, 448, 448);

    originalImageData = ctx.getImageData(0, 0, viewWidth, viewHeight);
    glitchImageData = ctx.getImageData(0, 0, viewWidth, viewHeight);

    ctx.clearRect(0, 0, viewWidth, viewHeight);
}

function processImageData() {
    var data = originalImageData.data,
        pixelCount = data.length / 4,
        pixelIndex = 0,
        x, y;

    pixels = [];

    for (var i = 0; i < pixelCount; i++) {
        pixelIndex = i * 4;
        x = i % viewWidth;
        y = Math.floor(i / viewHeight);

        if (!pixels[y]) pixels[y] = [];

        pixels[y][x] = [
            data[pixelIndex + 4],
            data[pixelIndex + 6],
            data[pixelIndex + 8] 
        ];
    }
}

function setupTweens() {
    var tl0 = new TimelineMax({repeat:-1, yoyo:true});
    tl0.to(gvars, 0.5, {waveAmp0:74, waveFrq0:26, waveOfs0:26, ease:Back.easeOut, delay:0.5});

    var tl1 = new TimelineMax({repeat:-1, yoyo:true});
    tl1.to(gvars, 5, {waveAmp1:158, waveFrq1:10, waveOfs1:65, ease:Elastic.easeIn, delay:0.25});

    var tl2 = new TimelineMax({repeat:-1, yoyo:true});
    tl2.to(gvars, 5, {pos0:250, ease:Bounce.easeInOut, delay:4});

    var tl3 = new TimelineMax({repeat:-1, yoyo:true});
    tl3.to(gvars, 5, {pos1:125, pos2:510, ease:Cubic.easeInOut, delay:2});
}

function update() {
    var data = glitchImageData.data,
        row,
        pixelIndex = 0;
    var fx, fy;
    var rx, ry,
        gx, gy,
        bx, by;
    var wave0Sin,
        wave1Sin,
        wave0Cos,
        wave1Cos,
        pos0,
        pos1,
        pos2;
  
    cosCache0.length = 0;
    cosCache1.length = 0;

    for (var y = 0; y < viewHeight; y++) {
        row = pixels[y];
        fy = y / viewHeight;

        wave0Sin = Math.sin(gvars.waveOfs0 + gvars.waveFrq0 * fy) * gvars.waveAmp0;
        wave1Sin = Math.sin(gvars.waveOfs1 + gvars.waveFrq1 * fy) * gvars.waveAmp1;
        pos1 = gvars.pos1 * fy;

        for (var x = 0; x < viewWidth; x++) {
            pixelIndex = (y * viewWidth + x) * 4;
            fx = x / viewWidth;
            
            if (cosCache0[x] !== undefined) {
              wave0Cos = cosCache0[x];
            }
            else {
              wave0Cos = Math.cos(gvars.waveOfs0 + gvars.waveFrq0 * fx) * gvars.waveAmp0;
              cosCache0[x] = wave0Cos;
            }
            
            if (cosCache1[x] !== undefined) {
              wave1Cos = cosCache1[x];
            }
            else {
              wave1Cos = Math.cos(gvars.waveOfs1 + gvars.waveFrq1 * fx) * gvars.waveAmp1;
              cosCache1[x] = wave1Cos;
            }
          
            pos0 = gvars.pos0 * fx;
            pos2 = gvars.pos2 * fx;

            rx = x + wave1Sin + pos0;
            ry = y + wave1Cos - pos2;
            gx = x - wave1Cos * pos1;
            gy = y - wave0Sin + pos1;
            bx = x + wave0Sin + pos0;
            by = y - wave0Sin * pos2;

            data[pixelIndex + 0] = getChannel(rx, ry, 0);
            data[pixelIndex + 1] = getChannel(gx, gy, 1);
            data[pixelIndex + 2] = getChannel(bx, by, 2);
        }
    }
}

function draw() {
    ctx.putImageData(glitchImageData, 0, 0);
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

function getChannel(x, y, c) {
    x = x | 0;
    y = y | 0;
    x = wrap(x, 0, viewWidth - 1);
    y = wrap(y, 0, viewHeight - 1);

    return pixels[y][x][c];
}

function wrap(v, min, max) {
    return (((v - min) % (max - min)) + (max - min)) % (max - min) + min;
}