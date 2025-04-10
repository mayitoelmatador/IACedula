import React, { useState, useEffect, useRef } from "react";
import Tesseract from 'tesseract.js';
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl"; // set backend to webgl
// import { BarcodeScanner } from "@zxing/library";
// import { useZXing } from "react-zxing";
import { ToastContainer, toast } from "react-toastify"; // Importar ToastContainer y toast
import "react-toastify/dist/ReactToastify.css"; // Importar el CSS para los toasts
import Loader from "./components/loader";
import { Webcam } from "./utils/webcam";
import { renderBoxes } from "./utils/renderBox";
import { non_max_suppression } from "./utils/nonMaxSuppression";
import "./style/App.css";

// import cedulaImage from './assets/CedulaMia.jpeg';

// Correr en local para servidor -> http-server -c1 --cors .

/**
 * Function to detect image.
 * @param {HTMLCanvasElement} canvasRef canvas reference
 */

function shortenedCol(arrayofarray, indexlist) {
  return arrayofarray.map(function (array) {
    return indexlist.map(function (idx) {
      return array[idx];
    });
  });
}

const App = () => {
  const [loading, setLoading] = useState({ loading: true, progress: 0 });
  const [capturedImage, setCapturedImage] = useState(null);
  const [barcode, setBarcode] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const webcam = new Webcam();
  // configs
  const modelName = "Yolov8";
  const threshold = 0.8;
  /**
   * Function to detect every frame loaded from webcam in video tag.
   * @param {tf.GraphModel} model loaded Yolov8 tensorflow.js model
   */

  const detectFrame = async (model) => {
    const modelDim = 640;
  
    const input = tf.tidy(() => {
      return tf.image
        .resizeBilinear(tf.browser.fromPixels(videoRef.current), [modelDim, modelDim])
        .div(255.0)
        .expandDims(0);
    });
  
    try {
      const res = await model.executeAsync(input);
      const predictions = res.arraySync();
  
      // for (let i = 0; i < 1; i++) {
      //   for(let j = 0; j < 4; j++) {
      //     predictions[i][j] = predictions[i][j].map(value => Math.max(0, Math.min(value / modelDim, 1)));
      //   }
      // }
  
      const detections = non_max_suppression(predictions, threshold);
      
  
      // const boxes = shortenedCol(detections, [0, 1, 2, 3]);
      // const scores = shortenedCol(detections, [4]);
  
      // Extrae los boxes y scores correctamente
      const boxes = detections.map(pred => pred.box);
      const scores = detections.map(pred => pred.score);

      // renderBoxes(canvasRef, threshold, boxes, scores);
      renderBoxes(canvasRef, threshold, boxes, scores, handleCapturedImage, videoRef);
  
      tf.dispose(res);
    } catch (error) {
      console.error("Error en detectFrame:", error);
    }
  
  
    // Ejecutar cada 200ms (5 FPS)
    setTimeout(() => requestAnimationFrame(() => detectFrame(model)), 1000);
  };

  const handleCapturedImage = (imageData) => {
    setCapturedImage(imageData); // Mostrar la imagen capturada

    // Usar Tesseract para extraer texto de la imagen capturada
    Tesseract.recognize(
      imageData, // La imagen capturada (base64)
      'spa', // Idioma
      {
        logger: (m) => console.log(m), // Ver progreso
      }
    ).then(({ data: { text } }) => {
      console.log('Texto extraído:', text);

          // Expresión regular para encontrar un número de cédula con formato X.XXX.XXX.XXX
    const cedulaPattern = /\b\d{1,3}(\.\d{3}){2,3}\b/g;

    // Buscar el patrón en el texto extraído
    const cedulaMatches = text.match(cedulaPattern);

    if (cedulaMatches) {
      const cedula = cedulaMatches[0]; // El primer resultado encontrado

      console.log('Cédula extraída:', cedula);
      // Reemplaza el alert con un toast de react-toastify
      toast.success(`Cédula extraída: ${cedula}`); // Mostrar el toast en lugar del alert

      // Hacer algo con la cédula extraída
    } else {
      console.log('No se encontró una cédula en el texto extraído.');
      toast.error("No se encontró una cédula en el texto extraído.");
    }
    }).catch((error) => {
      console.error("Error al procesar la imagen con Tesseract:", error);
      toast.error("Hubo un error al procesar la imagen.");
    });
  };
  

  useEffect(() => {
    tf.loadGraphModel("model/model.json", {
      onProgress: (fractions) => {
        setLoading({ loading: true, progress: fractions });
      },
    }).then(async (Yolov8) => {
      // Warmup the model before using real data.
      const dummyInput = tf.ones(Yolov8.inputs[0].shape);
      await Yolov8.executeAsync(dummyInput).then((warmupResult) => {
        tf.dispose(warmupResult);
        tf.dispose(dummyInput);

        setLoading({ loading: false, progress: 1 });
        webcam.open(videoRef, () => detectFrame(Yolov8));
      });
    });
  }, []);

  // // Configurar el escáner para leer códigos PDF417
  // const [data, setData] = useState("No scan yet");
  // const { ref, result } = useZXing({
  //   onDetected: (scanResult) => {
  //     setData(scanResult.getText()); // Almacenar el resultado del escaneo
  //   },
  //   formats: [BarcodeScanner.Format.PDF_417], // Especificar PDF417 como formato
  // });
  console.warn = () => {};

  return (
    <div className="App">
      <h2>Object Detection Using Yolov8 & Tensorflow.js</h2>
      {loading.loading ? (
        <Loader>Loading model... {(loading.progress * 100).toFixed(2)}%</Loader>
      ) : (
        <p> </p>
      )}

      <div className="content">
        <video autoPlay playsInline muted ref={videoRef} id="frame" />
        <canvas width={640} height={640} ref={canvasRef} />
      </div>
      {capturedImage && (
        <div>
          <h3>Imagen capturada:</h3>
          <img src={capturedImage} alt="Captured" />
        </div>
      )}
       {/* Aquí se incluye el ToastContainer para mostrar los toasts */}
       <ToastContainer />
        {/* <div>
          <h2>Escanear Código de Barras desde Imagen</h2>
          {barcode ? <p>Código de barras detectado: {barcode}</p> : <p>Cargando imagen...</p>}
        </div> */}
    </div>
  );
};

export default App;
