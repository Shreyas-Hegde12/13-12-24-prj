const video = document.getElementById('video')
const sampler = document.querySelector('.start-sampling');
let watchState = true;
let cooldowntime = false;
let dominantExpression = 'starter';

const emoji = {
  'neutral': '😇 CALM',
  'happy': '😊 JOY',
  'surprised': '😮 SURPRISED',
  'sad': '😭 SAD',
  'angry': '😤 ANGRY',
}
Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri('/static/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/static/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/static/models'),
  faceapi.nets.faceExpressionNet.loadFromUri('/static/models')
]).then(startVideo)

function startVideo() {
  navigator.getUserMedia(
    { video: {} },
    stream => video.srcObject = stream,
    err => console.error(err)
  )
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  canvas.setAttribute('class','canvas-photo');
  document.querySelector('#video-container').append(canvas);
  
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  //sampler.style.display = 'none';

  setInterval(async () => {
    if (watchState == true && cooldowntime == false) {
      // Detect the face with expressions
      const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions()).withFaceExpressions();
      
      if (detections) {
        // Resize the detections to match the video dimensions
        const resizedDetections = faceapi.resizeResults(detections, displaySize);

        // Clear the canvas before drawing new detections
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

        // Get the face expression with the highest probability
        const expression = detections.expressions;
        setDominantEmotion(expression);
        const confidence = (expression[dominantExpression] * 100).toFixed(1); // Confidence in percentage

        // Draw a box around the face
        const box = resizedDetections.detection.box;
        const ctx = canvas.getContext('2d');

        ctx.strokeStyle = 'rgba(1, 1, 1, 0.8)';  // Green box around the face
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        // Display the current emotion and its confidence inside the box
        if (dominantExpression == 'disgusted'){
          dominantExpression = 'sad';
        }
        if (dominantExpression == 'fearful'){
          dominantExpression = 'sad';
        }
        if (dominantExpression == 'neutral' && parseInt(confidence) <100){
          dominantExpression = 'sad';
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 1)';
        ctx.font = '16px open sans';
        ctx.fillText(`${emoji[dominantExpression]} : ${confidence}%`, box.x + 10, box.y + 20);
      }
    }
  }, 100);
  document.querySelector('#video-container').classList.add('smooth-transition');
  const a = setTimeout(function(){
    document.querySelector('#video-container').classList.remove('gradient'); 
    document.querySelector('.camera-toggle').style.transform = 'scale(1)'; 
    document.querySelector('#video-container').style.maxWidth = '600px';},2e3);
  
});



//Intersection Observer

// Function to handle element visibility changes
function handleIntersection(entries) {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      // Element is in view
      watchState = true;
      console.log('Element is in view:', watchState);
    } else {
      // Element is out of view
      watchState = false;
      console.log('Element is out of view:', watchState);
    }
  });
}

// Create an IntersectionObserver instance
const observer = new IntersectionObserver(handleIntersection, {
  root: null, // Observe the viewport
  threshold: 0.3 // Trigger when 10% of the element is visible
});

// Start observing the target element
observer.observe(video);


//button click cooldown
function cooldown(bool){
  cooldowntime=true;
  const cool = setTimeout(function(){cooldowntime=false; if(video.paused){video.play();}},5e3);

  if(bool==1){
    cooldowntime=false; if(video.paused){video.play();}
  }
}

//pick dominant emotion
function setDominantEmotion(expressions) {
  dominantExpression= Object.keys(expressions).reduce((maxEmotion, currentEmotion) => 
    expressions[currentEmotion] > expressions[maxEmotion] ? currentEmotion : maxEmotion
  );
}

function recommend(){
  cooldown(0);
  if(isPlaying) togglePlay();
  fetchSongOnEmotion(dominantExpression);
  generatePhoto();
  video.pause();
  updateSlider(0);
  document.querySelector('.camera-toggle').style.transform = 'scale(0)';
  document.querySelector('#video-container').classList.remove('smooth-transition'); 
  document.querySelector('#video-container').classList.add('gradient');
  throwPhoto();
  let a = setTimeout(function(){
    document.querySelector('#video-container').classList.add('smooth-transition');
    document.querySelector('#video-container').classList.remove('gradient');
    document.querySelector('.camera-toggle').style.transform = 'scale(1)';
  },3e3);
}

function generatePhoto(){
  const vd = document.querySelector('video');
  const canv = document.createElement('canvas');
  const conx = canv.getContext('2d');
  canv.width = vd.videoWidth;
  canv.height = vd.videoHeight;
  conx.drawImage(vd, 0, 0, canv.width, canv.height);

  const img_src = canv.toDataURL('image/jpeg');
  const boxCanvas = document.querySelector('.canvas-photo'); 
  const box_src = boxCanvas.toDataURL('image/png');
  
  document.querySelector('#photograph').src = img_src;
  document.querySelector('#face-box').src = box_src;
  
}

function throwPhoto(){
  const photo = document.querySelector('#clicked-photo');
  photo.classList.add('clicked-photo-animation');
  const r = setTimeout(function(){photo.classList.remove('clicked-photo-animation');},4e3);
}