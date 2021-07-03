class MusicsCanvas {
  constructor() {
    this.width = 400;
    this.barsGap = 5;
    this.initHeight = 0;
    this.counter = 0;
    this.randomMod = 1;
    this.analyser = null;

    this.barGradient = null;
    this.lineWidth = 1;
    this.lineColour = "#aaa";

    this.ctx = null;
    this.canvas = null;

    this.threshold = {
      low: 10,
      mid: 128,
      high: 128
    };

    this.squareData = [new Array(16), new Array(64), new Array(256)];
  }

  rand(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  canvasInit() {
    let canvas = document.getElementById("visualiseCanvas");
    if (canvas.getContext) {
      var ctx = canvas.getContext("2d");
      this.ctx = ctx;
      this.canvas = canvas;
    } else {
      console.error("canvas could not be initialised");
    }

    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = this.lineColour;

    if (this.analyser) {
      // fft data stuff
      this.analyser.fftSize = 256;
      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);

      this.barsWidth = this.width / this.bufferLength * 2.5;
    }

    this.x = canvas.width / 2;
    this.y = canvas.height / 2;

    ctx.imageSmoothingEnabled = false;

    requestAnimationFrame(() => {
      this.updateCanvas(ctx, canvas);
    });
  }

  // [[0, 0], [canvas.width / 2, 0], [0, canvas.height / 2], [canvas.width / 2, canvas.height / 2]]

  randomSquareData() {
    for (let depth = 0; depth < 3; depth++) {
      for (let index = 0; index < this.squareData[depth].length; index++) {
        if (this.rand(0, 10) % 4 === 0) {
          this.squareData[depth][index] = 1;
        } else {
          this.squareData[depth][index] = null;
        }
      }
    }
  }

  drawSquareData() {
    for (let depth = 0; depth < 3; depth++) {
      for (
        let yindex = 0;
        yindex < Math.sqrt(this.squareData[depth].length);
        yindex++
      ) {
        for (
          let xindex = 0;
          xindex < Math.sqrt(this.squareData[depth].length);
          xindex++
        ) {
          let size =
            this.canvas.width / Math.sqrt(this.squareData[depth].length);

          if (
            this.squareData[depth][
              xindex + yindex * Math.sqrt(this.squareData[depth].length)
            ] === 1
          ) {
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.strokeStyle = this.lineColour;
            this.ctx.rect(xindex * size, yindex * size, size, size);
            this.ctx.stroke();
          }
        }
      }
    }
  }

  updateCanvas(ctx, canvas) {
    // this.analyser.getByteFrequencyData(this.dataArray);
    // // clear screen
    // ctx.clearRect(0, 0, canvas.width, canvas.height);
    // /* get realtime fft data */
    // let fftAvg = [0, 0, 0];
    // for (let j = 0; j < 3; j++) {
    //   for (
    //     let i = Math.floor(this.bufferLength / 3 * j);
    //     i < this.bufferLength / 3 * (j + 1);
    //     i++
    //   ) {
    //     fftAvg[j] += this.dataArray[i];
    //   }
    //   fftAvg[j] = fftAvg[j] / this.bufferLength / 3;
    // }
    ///////////////////////////////////////
    // this.drawSquareData(ctx, canvas); //
    //                                   //
    // // things                         //
    // requestAnimationFrame(() => {     //
    //   this.updateCanvas(ctx, canvas); //
    // });                               //
    ///////////////////////////////////////
  }
}

let musicCanvas = new MusicsCanvas();

document.addEventListener("DOMContentLoaded", () => {
  var constraints = {audio: true, video: false};

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function(mediaStream) {
      console.log(mediaStream);

      var audioCtx = new window.AudioContext();
      var analyser = audioCtx.createAnalyser();
      const track = audioCtx.createMediaStreamSource(mediaStream);

      track.connect(analyser);
      musicCanvas.analyser = analyser;

      musicCanvas.canvasInit();
    })
    .catch(function(err) {
      console.log(err);
    });
});
