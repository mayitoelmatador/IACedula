function xywh2xyxy(x) {
    const y = [];
    y[0] = x[0] - x[2] / 2;  // top-left x
    y[1] = x[1] - x[3] / 2;  // top-left y
    y[2] = x[0] + x[2] / 2;  // bottom-right x
    y[3] = x[1] + x[3] / 2;  // bottom-right y
    return y;
  }
  
  export function non_max_suppression(res, conf_thresh = 0.8, iou_thresh = 0.2, max_det = 300) {
    const selected_detections = [];
  
    const x_center = res[0][0];  // Array con x_center
    const y_center = res[0][1];  // Array con y_center
    const widths = res[0][2];    // Array con width
    const heights = res[0][3];   // Array con height
    const scores = res[0][4];    // Array con confidence scores
  
    for (let i = 0; i < scores.length; i++) {
      const score = scores[i];
      
      if (score < conf_thresh) {
        console.warn(`Detection score too low: ${score}`);
        continue;
      }
      
  
      // Crear box y convertir coordenadas
      const box = [
        parseFloat(x_center[i]),
        parseFloat(y_center[i]),
        parseFloat(widths[i]),
        parseFloat(heights[i])
      ];
  
      const object = xywh2xyxy(box);
  
      let addBox = true;
  
      // Verificar solapamiento con cajas ya seleccionadas
      for (let j = 0; j < selected_detections.length; j++) {
        const selectedBox = selected_detections[j].box;
  
        const interXmin = Math.max(object[0], selectedBox[0]);
        const interYmin = Math.max(object[1], selectedBox[1]);
        const interXmax = Math.min(object[2], selectedBox[2]);
        const interYmax = Math.min(object[3], selectedBox[3]);
  
        const interWidth = Math.max(0, interXmax - interXmin);
        const interHeight = Math.max(0, interYmax - interYmin);
        const interArea = interWidth * interHeight;
  
        const boxArea = (object[2] - object[0]) * (object[3] - object[1]);
        const selectedBoxArea = (selectedBox[2] - selectedBox[0]) * (selectedBox[3] - selectedBox[1]);
  
        const unionArea = boxArea + selectedBoxArea - interArea;
        const iou = unionArea > 0 ? interArea / unionArea : 0;
  
        if (iou >= iou_thresh) {
          addBox = false;
          break;
        }
      }
  
      if (addBox) {
        selected_detections.push({
          box: object,
          score: score,
          klass: "id_front"
        });
      }
    }
  
    return selected_detections;
  }
  