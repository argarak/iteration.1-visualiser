class MusicsCanvas {
  constructor() {
    this.width = 400;
    this.barsGap = 5;
    this.initHeight = 0;
    this.counter = 0;
    this.randomMod = 1;
    this.analyser = null;

    this.barGradient = null;
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
    } else {
      console.error("canvas could not be initialised");
    }

    if (this.analyser) {
      // fft data stuff
      this.analyser.fftSize = 256;
      this.bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(this.bufferLength);

      this.barsWidth = this.width / this.bufferLength * 2.5;
    }

    if (!this.barGradient) {
      // rainbow gradient!!
      this.barGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 1.2);
      let sumcolors = 1 / 4;
      this.barGradient.addColorStop(sumcolors * 0, "red");
      this.barGradient.addColorStop(sumcolors * 1, "orange");
      this.barGradient.addColorStop(sumcolors * 2, "yellow");
      this.barGradient.addColorStop(sumcolors * 3, "green");
    }

    this.x = canvas.width / 2;
    this.y = canvas.height / 2;

    ctx.imageSmoothingEnabled = false;

    for (let i = 0; i < Math.floor(canvas.width / this.barsWidth); i++) {
      ctx.fillStyle = this.barGradient;
      ctx.fillRect(
        i * (this.barsWidth + this.barsGap),
        canvas.height - this.initHeight,
        this.barsWidth,
        this.initHeight
      );
    }

    requestAnimationFrame(() => {
      this.updateCanvas(ctx, canvas);
    });
  }

  updateCanvas(ctx, canvas) {
    this.analyser.getByteFrequencyData(this.dataArray);

    // clear screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.randomMod = Math.sin((this.counter % 2e5) / 2000) * 5;

    for (let i = 0; i < this.bufferLength; i++) {
      let barHeight = this.dataArray[i] / 2;
      this.counter++;

      ctx.fillStyle = this.barGradient;
      ctx.fillRect(
        i * (this.barsWidth + this.barsGap),
        canvas.height - this.initHeight,
        this.barsWidth,
        -barHeight * (canvas.height / 255 * 2)
      );
    }

    // things
    requestAnimationFrame(() => {
      this.updateCanvas(ctx, canvas);
    });
  }
}

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
      let musicCanvas = new MusicsCanvas();
      musicCanvas.analyser = analyser;

      musicCanvas.canvasInit();
    })
    .catch(function(err) {
      console.log(err);
    });
});
