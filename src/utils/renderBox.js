export const renderBoxes = (
  canvasRef,
  threshold,
  boxes_data,
  scores_data,
  captureImageCallback,
  videoRef
) => {
  const ctx = canvasRef.current.getContext("2d");
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height); // Clear canvas

  const font = "18px sans-serif";
  ctx.font = font;
  ctx.textBaseline = "top";

  for (let i = 0; i < scores_data.length; i++) {
    if (scores_data[i] > threshold) {
      const klass = "Cedula";
      const score = (parseFloat(scores_data[i]) * 100).toFixed(1);

      // Adjust coordinates if already normalized
      // let [x1, y1, x2, y2] = boxes_data[i].map(coord => parseFloat(coord) * 640);

      let [x1, y1, x2, y2] = boxes_data[i];

      const width = x2 - x1;
      const height = y2 - y1;

      // Draw bounding box
      ctx.strokeStyle = "#B033FF";
      ctx.lineWidth = 2;
      ctx.strokeRect(x1, y1, width, height);

      // Label background
      ctx.fillStyle = "#B033FF";
      const textWidth = ctx.measureText(`${klass} - ${score}%`).width;
      const textHeight = parseInt(font, 10);
      ctx.fillRect(
        x1 - 1,
        y1 - (textHeight + 2),
        textWidth + 2,
        textHeight + 2
      );

      // Draw label
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${klass} - ${score}%`, x1 - 1, y1 - (textHeight + 2));

      if (score >= 92) {
        // Crear un canvas temporal para capturar la imagen del video sin los bounding boxes
        // Funciona muy bien ------------------------------------------------------------------------
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");

        // Establecer el tamaño del canvas temporal igual al del video
        tempCanvas.width = videoRef.current.videoWidth;
        tempCanvas.height = videoRef.current.videoHeight;

        // Dibujar el contenido del video en el canvas temporal
        tempCtx.drawImage(
          videoRef.current,
          0,
          0,
          tempCanvas.width,
          tempCanvas.height
        );

        // Capturar la imagen del video (sin las anotaciones)
        const imageData = tempCanvas.toDataURL("image/png");

        // Llamar al callback para pasar la imagen capturada
        captureImageCallback(imageData);

        // Crear un canvas temporal para capturar la imagen del video sin los bounding boxes
        // const tempCanvas = document.createElement("canvas");
        // const tempCtx = tempCanvas.getContext("2d");

        // // Establecer el tamaño del canvas temporal igual al del bounding box
        // const width = x2 - x1;
        // const height = y2 - y1;
        // tempCanvas.width = width;
        // tempCanvas.height = height;

        // // Dibujar la imagen del video en el canvas temporal usando las coordenadas del bounding box
        // tempCtx.drawImage(
        //   videoRef.current, // El video
        //   x1, // Coordenada X de la esquina superior izquierda del bounding box
        //   y1, // Coordenada Y de la esquina superior izquierda del bounding box
        //   width, // Ancho del bounding box
        //   height, // Alto del bounding box
        //   0, // Posición X en el canvas temporal
        //   0, // Posición Y en el canvas temporal
        //   width, // Ancho en el canvas temporal
        //   height // Alto en el canvas temporal
        // );

        // // Convertir la imagen recortada a formato base64 (imagen PNG)
        // const imageData = tempCanvas.toDataURL("image/png");

        // // Llamar al callback para pasar la imagen capturada
        // captureImageCallback(imageData);
      }
    }
  }
};
