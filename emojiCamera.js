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
        document.getElementById("compartir").addEventListener("click",share);
    } else {
        document.getElementById("subirFotoCamara").style.display = "none";
        document.getElementById("compartir").style.display = "none";
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

var emojis = {};
emojis["anger"] = new Image();
emojis["anger"].src = "emojis/anger.png";
emojis["contempt"] = new Image();
emojis["contempt"].src = "emojis/contempt.png";
emojis["disgust"] = new Image();
emojis["disgust"].src = "emojis/disgust.png";
emojis["fear"] = new Image();
emojis["fear"].src = "emojis/fear.png";
emojis["happiness"] = new Image();
emojis["happiness"].src = "emojis/happiness.png";
emojis["neutral"] = new Image();
emojis["neutral"].src = "emojis/neutral.png";
emojis["sadness"] = new Image();
emojis["sadness"].src = "emojis/sadness.png";
emojis["surprise"] = new Image();
emojis["surprise"].src = "emojis/surprise.png";


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
    return emojis[puntuaciones[0].emocion];
}



function share() {
    var dataTransferManager = Windows.ApplicationModel.DataTransfer.DataTransferManager.getForCurrentView();
    dataTransferManager.addEventListener("datarequested", generateSharedPicture);
    Windows.ApplicationModel.DataTransfer.DataTransferManager.showShareUI();
}

function generateSharedPicture(e) {
    var output;
    var input;
    var outputStream;
    var blob = document.getElementById("lienzo").msToBlob();
    var deferral = e.request.getDeferral();
    Windows.Storage.ApplicationData.current.temporaryFolder.createFileAsync("photo.png",
        Windows.Storage.CreationCollisionOption.replaceExisting).
        then(function (file) {
            return file.openAsync(Windows.Storage.FileAccessMode.readWrite);
        }).then(function (stream) {
            outputStream = stream;
            output = stream.getOutputStreamAt(0);
            input = blob.msDetachStream();
            return Windows.Storage.Streams.RandomAccessStream.copyAsync(input, output);
        }).then(function () {
            return output.flushAsync();
        }).done(function () {
            input.close();
            output.close();
            outputStream.close();
            Windows.Storage.ApplicationData.current.temporaryFolder.getFileAsync("photo.png").done(function (imageFile) {
                request.data.properties.title = "Mi cara es un Emoji!";
                request.data.properties.description = "En efecto, mi cara es un emoji";
                request.data.setText("Foto hecha con EmojiCamera");
                var streamReference = Windows.Storage.Streams.RandomAccessStreamReference.createFromFile(imageFile);
                request.data.properties.thumbnail = streamReference;
                request.data.setStorageItems([imageFile]);
                request.data.setBitmap(streamReference);
                deferral.complete();
            });
        });
}