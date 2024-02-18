// Firebase setup

const firebaseConfig = {
  apiKey: "AIzaSyBTducKB3NujUbneE9LB1vroV7gQyTxasM",
  authDomain: "mayanglyph-d81c2.firebaseapp.com",
  projectId: "mayanglyph-d81c2",
  storageBucket: "mayanglyph-d81c2.appspot.com",
  messagingSenderId: "214903580564",
  appId: "1:214903580564:web:c871071208eef9942fd181"
};

const app = firebase.initializeApp(firebaseConfig)
const storage = firebase.storage()

// glyph images set up
async function fetchImages() {
    const storageRef = firebase.storage().ref().child("image");
    const folderRef = storageRef.child("glyphs");
    const loader = document.querySelector('.loader');
  
    try {
      loader.style.display = 'block';
      const result = await folderRef.listAll();
      const urlPromises = result.items.map(imageRef => imageRef.getDownloadURL());
      const urls = await Promise.all(urlPromises);
      
      for (let i = urls.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [urls[i], urls[j]] = [urls[j], urls[i]];
      }
  
      const selectedUrls = urls.slice(0, 35);
      displayImages(selectedUrls);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      loader.style.display = 'none';
    }
}


function displayImages(imageUrls) {
    const imageGrid = document.getElementById('imageGrid');
  
    imageUrls.forEach(url => {
        let img = document.createElement('img');
        img.src = url;
        img.alt = 'Mayan Glyph';

        imageGrid.appendChild(img);
        
        img.addEventListener('click', function() {
            const previousSelected = document.querySelector('.selected-glyph');
            if (previousSelected) {
                previousSelected.classList.remove('selected-glyph');
            }
            img.classList.add('selected-glyph');

            let storage = firebase.storage()
            let storageRef = storage.refFromURL(img.src)
            selectedDrawingName = storageRef.name
            setPlaceholderGlyph(url);
        });
    });
}

function setPlaceholderGlyph(url) {
    const placeholderGlyph = document.getElementById('placeholder-glyph');
    placeholderGlyph.src = url;
    placeholderGlyph.style.display = 'block';
}
  

// Canvas setup

canvas = document.querySelector("canvas"),
submitBtn = document.getElementById('submit')
toolBtns = document.querySelectorAll(".tool"),
fillColor = document.querySelector("#fill-color"),
sizeSlider = document.querySelector("#size-slider"),
colorPicker = document.querySelector("#color-picker"),
clearCanvas = document.querySelector(".clear-canvas"),
saveImg = document.querySelector(".save-img"),
ctx = canvas.getContext("2d");

let devicePixelRatio = window.devicePixelRatio || 1;

let prevMouseX, prevMouseY, snapshot,
isDrawing = false,
selectedTool = "brush",
brushWidth = 5,
selectedColor = "#000";
selectedDrawingName = ""
let strokes = [];

// const testCanvas = document.getElementById('testCanvas');
// const testCtx = testCanvas.getContext('2d');


// document.getElementById('testDrawButton').addEventListener('click', function() {
//     drawStrokesFromData(testCtx, strokes);
// });

window.addEventListener("load", () => {
    canvas.width = canvas.offsetWidth * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
    canvas.style.width = canvas.offsetWidth + 'px';
    canvas.style.height = canvas.offsetHeight + 'px';
    brushWidth = 5 * devicePixelRatio;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
});

const drawRect = (e) => {
    if(!fillColor.checked) {
        return ctx.strokeRect(e.offsetX, e.offsetY, prevMouseX - e.offsetX, prevMouseY - e.offsetY);
    }
    ctx.fillRect(e.offsetX, e.offsetY, prevMouseX - e.offsetX, prevMouseY - e.offsetY);
}

const drawCircle = (e) => {
    ctx.beginPath();
    let radius = Math.sqrt(Math.pow((prevMouseX - e.offsetX), 2) + Math.pow((prevMouseY - e.offsetY), 2));
    ctx.arc(prevMouseX, prevMouseY, radius, 0, 2 * Math.PI);
    fillColor.checked ? ctx.fill() : ctx.stroke();
}

const drawTriangle = (e) => {
    ctx.beginPath();
    ctx.moveTo(prevMouseX, prevMouseY);
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.lineTo(prevMouseX * 2 - e.offsetX, e.offsetY);
    ctx.closePath();
    fillColor.checked ? ctx.fill() : ctx.stroke();
}

const startDraw = (e) => {
    isDrawing = true;
    prevMouseX = e.offsetX * devicePixelRatio;
    prevMouseY = e.offsetY * devicePixelRatio;

    ctx.beginPath();
    ctx.lineWidth = brushWidth;
    ctx.strokeStyle = '#000';
    ctx.fillStyle = '#000';

    strokes.push({ 
        points: [{x: prevMouseX, y: prevMouseY}],
        color: ctx.strokeStyle,
        width: ctx.lineWidth,
        type: selectedTool
    });

    snapshot = ctx.getImageData(0, 0, canvas.width, canvas.height);
}

const drawing = (e) => {
    if(!isDrawing) return;
    ctx.putImageData(snapshot, 0, 0);

    const x = e.offsetX * devicePixelRatio;
    const y = e.offsetY * devicePixelRatio;

    strokes[strokes.length - 1].points.push({x, y});
    ctx.lineWidth = brushWidth;

    if(selectedTool === "brush"|| selectedTool === "eraser"){
        ctx.strokeStyle = selectedColor;
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    } 
    else if(selectedTool === "rectangle"){
        drawRect(e);
    } else if(selectedTool === "circle"){
        drawCircle(e);
    } else {
        drawTriangle(e);
    }

    prevMouseX = x;
    prevMouseY = y;
}

function drawStrokesFromData(ctx, strokesData) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.globalCompositeOperation = "source-over";
    let finalStrokes = computeFinalStrokes(strokesData)
    finalStrokes.forEach(stroke => {
        ctx.beginPath();
        ctx.lineWidth = stroke.width;
        ctx.strokeStyle = stroke.color;

        stroke.points.forEach((point, index) => {
            if (index === 0) {
                ctx.moveTo(point.x / devicePixelRatio, point.y / devicePixelRatio);
            } else {
                ctx.lineTo(point.x / devicePixelRatio, point.y / devicePixelRatio);
            }
        });

        ctx.stroke();
    });
}

toolBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".options .active")?.classList.remove("active");
        btn.classList.add("active");
        selectedTool = btn.id;

        if (selectedTool === "eraser") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = brushWidth;
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = selectedColor;
            ctx.lineWidth = brushWidth;
        }
    });
});


sizeSlider.addEventListener("change", () => {
    brushWidth = sizeSlider.value * devicePixelRatio;
    ctx.lineWidth = brushWidth;
});

clearCanvas.addEventListener("click", () => {
    ctx.globalCompositeOperation = "destination-out";   
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "source-over";
    strokes = []
});


saveImg.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `${Date.now()}.jpg`;
    link.href = canvas.toDataURL();
    link.click();
});

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", drawing);
canvas.addEventListener("mouseup", () => isDrawing = false);

function showMessage(message) {
    var completeMsg = document.getElementById('completeMsgText');
    completeMsg.innerHTML = completeMsg.textContent = message;
    document.getElementById('completeMsg').style.display = 'block';
}

document.getElementById('closeMsg').addEventListener('click', function() {
    document.getElementById('completeMsg').style.display = 'none';
});


// submit action
submitBtn.addEventListener('click', function() {
    submitBtn.disabled = true;
    
    if (!selectedDrawingName) {
        showMessage('Please select a glyph before submitting.')
        submitBtn.disabled = false;
        return;
    }

    showMessage('Uploading...');

    uploadCanvasImage().catch(error => {
        console.error('Upload failed', error);
    });
});

const uploadCanvasImage = async () => {
    try {
        submitBtn.disabled = true;
        const blob = await new Promise((resolve, reject) => canvas.toBlob(resolve, 'image/png'));
        let fileName = 'canvas_' + Math.round(Math.random() * 9999) + '.png';

        const drawingData = {
            selectedDrawingName,
            // strokes,
            // userLocation,
            timestamp: new Date().toISOString(),
        };
        const drawingDataString = JSON.stringify(drawingData);
        
        const metadata = {
            customMetadata: {
                // 'drawingName': selectedDrawingName,
                'drawingDataString' : drawingDataString
            }
        };

        const url = await uploadProcess(blob, fileName, metadata);
        showMessage('Canvas image uploaded successfully');
        return url;
    } catch (error) {
        console.error('Upload failed', error);
        showMessage('Failed to upload image. Please try again.');
        throw error;
    } finally {
        submitBtn.disabled = false;
    }
};


const uploadProcess = async (file, fileName, metadata) => {
    const storageRef = firebase.storage().ref().child("image");
    const drawingFolderRef = storageRef.child("drawings");
    const imageRef = drawingFolderRef.child(fileName);
    const uploadTask = imageRef.put(file, metadata);

    return new Promise((resolve, reject) => {
        uploadTask.on("state_changed", 
            (snapshot) => {
                
            }, 
            (error) => {
                reject(error);
            }, 
            async () => {
                try {
                    const url = await storageRef.child("drawings").child(fileName).getDownloadURL();
                    console.log("URL", url);
                    resolve(url);
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
};

fetchImages();