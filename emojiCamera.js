var imagen;

//Cuando se carga la pagina
window.addEventListener("load", function () {
    //Le decimos que cuando alguien haga clic en el boton
    document.getElementById("subirFotoArchivo").addEventListener("click", function () {
        //Si hay al menos una foto seleccionada
        var imgFile = document.getElementById('fotoArchivo');
        if (imgFile.files && imgFile.files[0]) {
            //La lee
            readPicture(imgFile.files[0]);
        }
    });

    if (typeof Windows !== 'undefined') {
        document.getElementById("subirFotoCamara").addEventListener("click", function () {
            var dialog = new Windows.Media.Capture.CameraCaptureUI();
            dialog.captureFileAsync(Windows.Media.Capture.CameraCaptureUIMode.photo).then(function (file) {
                if (file) {
                    readPicture(file);
                } else {
                    //No Photo captured
                }
            }, function (err) {

            });
        });
    } else {
        document.getElementById("subirFotoCamara").style.display = "none";
    }
});

function readPicture(file) {
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (image) {
        //Y cuando termine de leerla llama a uploadPicture con el resultado
        uploadPicture(image.target.result);
        //Y tambien la guardamos en la variable global
        imagen = new Image();
        imagen.src = image.target.result;
    };
}

function uploadPicture(dataURL) {
    // Initialize the HTTP request.
    var xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://westus.api.cognitive.microsoft.com/emotion/v1.0/recognize');
    xhr.setRequestHeader("Content-Type", 'application/octet-stream');
    xhr.setRequestHeader("Ocp-Apim-Subscription-Key", "ddbbcdf41520452da2feed98f226d46d");
    // Track the state changes of the request.
    xhr.onreadystatechange = function () {
        var DONE = 4; // readyState 4 means the request is done.
        var OK = 200; // status 200 is a successful return.
        if (xhr.readyState === DONE) {
            if (xhr.status === OK) {
                carasAnalizadas(JSON.parse(xhr.responseText));
            } else {
                console.log('Error: ' + xhr.status); // An error occurred during the request.
            }
        }
    };
    // Send the request to send-ajax-data.php
    xhr.send(makeBlob(dataURL));
}

//Magia negra
function makeBlob(dataURL) {
    var BASE64_MARKER = ';base64,';
    if (dataURL.indexOf(BASE64_MARKER) == -1) {
        var parts = dataURL.split(',');
        var contentType = parts[0].split(':')[1];
        var raw = decodeURIComponent(parts[1]);
        return new Blob([raw], { type: contentType });
    }
    var parts = dataURL.split(BASE64_MARKER);
    var contentType = parts[0].split(':')[1];
    var raw = window.atob(parts[1]);
    var rawLength = raw.length;

    var uInt8Array = new Uint8Array(rawLength);

    for (var i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }

    return new Blob([uInt8Array], { type: contentType });
}


function carasAnalizadas(datos) {
    var canvas = document.getElementById("lienzo");
    canvas.width = imagen.width;
    canvas.height = imagen.height;
    var context = canvas.getContext("2d");
    context.drawImage(imagen, 0, 0);
    datos.forEach(function (cara) {
        context.drawImage(elegirEmoji(cara.scores), cara.faceRectangle.left, cara.faceRectangle.top, cara.faceRectangle.width, cara.faceRectangle.height);
    });
}

var emojis = {
    "anger": "emojis/anger.png",
    "contempt": "emojis/contempt.png",
    "disgust": "emojis/disgust.png",
    "fear": "emojis/fear.png",
    "happiness": "emojis/happiness.png",
    "neutral": "emojis/neutral.png",
    "sadness": "emojis/sadness.png",
    "surprise": "emojis/surprise.png"
}

function elegirEmoji(scores) {
    var puntuaciones = [];
    for (var emocion in scores) {
        puntuaciones.push({
            emocion: emocion,
            puntuacion: scores[emocion]
        })
    }
    puntuaciones.sort(function (a, b) {
        return b.puntuacion - a.puntuacion
    });
    var imagen = new Image();
    imagen.src = emojis[puntuaciones[0].emocion]
    return imagen;
}