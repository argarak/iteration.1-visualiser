class MusicsCanvas {
  constructor() {
    this.width = 400;
    this.barsGap = 5;
    this.initHeight = 0;
    this.counter = 0;
    this.randomMod = 1;
    this.analyser = null;

    this.barGradient = null;
    this.lineWidth = 2;
    this.lineColour = "#aaa";

    this.ctx = null;
    this.canvas = null;

    //this.threshold = [12, 11, 4];
    this.threshold = [1, 1, 1];
    this.multSeed = -1;

    this.squareData = [new Array(16), new Array(64), new Array(256)];
  }

  rand(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  changeMultSeed(self) {
    self.multSeed = self.rand(5, 60);
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

    window.setInterval(this.changeMultSeed, 1000*60*5, this);

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

  generateSquareData(fftAvg) {
    //console.log(fftAvg);

    if (this.multSeed === -1) {
      this.changeMultSeed(this);
    }

    for (let depth = 0; depth < 3; depth++) {
      let selSquare;
      let drawSquare = false;

      if (fftAvg[depth] > this.threshold[depth]) {
        // choose a random number depending on depth
        // selSquare = this.rand(0, this.squareData[depth].length);

        // randomise this parameter when there's silence between tracks??
        selSquare =
          Math.floor(fftAvg[depth] * this.multSeed * (depth+1) * Math.sin(fftAvg[depth] / 5)) %
          this.squareData[depth].length;
        drawSquare = true;
      } else {
        // switch (depth) {
        //   case 0:
        //     this.squareData[depth] = new Array(16);
        //     break;
        //   case 1:
        //     this.squareData[depth] = new Array(64);
        //     break;
        //   case 2:
        //     this.squareData[depth] = new Array(256);
        //     break;
        // }
      }
      for (let index = 0; index < this.squareData[depth].length; index++) {
        if (drawSquare && selSquare === index) {
          if (this.squareData[depth][index] > 0.5) {
            let nextindex = index + 1;
            if (
              this.squareData[depth][
                nextindex % this.squareData[depth].length
              ] > 0.5
            ) {
              //this.squareData = [new Array(16), new Array(64), new Array(256)];
            } else {
              this.squareData[depth][
                nextindex % this.squareData[depth].length
              ] = 1;
            }
          }
          this.squareData[depth][index] = 1;
        }
      }

      this.squareData[depth] = this.squareData[depth].map(
        x => (x && x > 0.001 ? x * 0.6 : 0)
      );
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
            ] > 0
          ) {
            this.ctx.lineWidth = this.lineWidth;
            this.ctx.strokeStyle = `rgba(255, 255, 255, ${this.squareData[
              depth
            ][xindex + yindex * Math.sqrt(this.squareData[depth].length)]})`;
            this.ctx.rect(xindex * size, yindex * size, size, size);
            this.ctx.stroke();
          }
        }
      }
    }
  }

  drawCross() {
    this.ctx.strokeStyle = `rgba(255, 255, 255, 1)`;
    this.ctx.beginPath();
    this.ctx.moveTo(this.canvas.width / 2, this.canvas.height);
    this.ctx.lineTo(this.canvas.width / 2, 0);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(0, this.canvas.height / 2);
    this.ctx.lineTo(this.canvas.width, this.canvas.height / 2);
    this.ctx.stroke();
  }

  updateCanvas(ctx, canvas) {
    this.analyser.getByteFrequencyData(this.dataArray);

    // clear screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    /* get realtime fft data */
    let fftAvg = [0, 0, 0];
    for (let j = 0; j < 3; j++) {
      for (
        let i = Math.floor(this.bufferLength / 3 * j);
        i < this.bufferLength / 3 * (j + 1);
        i++
      ) {
        fftAvg[j] += this.dataArray[i];
      }
      fftAvg[j] = fftAvg[j] / this.bufferLength / 3;
    }

    this.generateSquareData(fftAvg);
    this.drawSquareData();
    this.drawCross();

    requestAnimationFrame(() => {
      this.updateCanvas(ctx, canvas);
    });
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
