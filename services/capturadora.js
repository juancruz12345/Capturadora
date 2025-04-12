
import { useRef } from 'react';

import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import wasmBinary from '@ffmpeg/core/dist/ffmpeg-core.wasm?url';



export function useCapturadora(setShowControls, setLoading) {

  const recordedChunks = useRef([]);
  const videoBlobRef = useRef(null);

  let mediaRecorder;
  let captureStream = null;
  let newWindow;
  let videoElement;


  const ffmpegRef = useRef(null);


  
  async function startCapture() {
    try {
     //await initFFmpeg()
      captureStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      startRecording(captureStream);
      
    } catch (err) {
      console.error(`Error: ${err}`);
    }
  }

  function startRecording(stream) {
    recordedChunks.current = [];
    mediaRecorder = new MediaRecorder(stream, { mimeType: "video/webm" });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunks.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      showEditor();
    };

    mediaRecorder.start();
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      captureStream?.getTracks().forEach(track => track.stop());
    }
  }

  function showEditor() {
    const videoBlob = new Blob(recordedChunks.current, { type: "video/webm" });
    videoBlobRef.current = videoBlob;
    const videoUrl = URL.createObjectURL(videoBlob);

    const videoMain = document.getElementById('video-main');
    if (videoMain) {
      videoMain.style.display = 'flex';
      videoMain.src = videoUrl;
    }

    setShowControls(true);
  }

  async function cutVideo(startTime, endTime) {
    try {
      setLoading(true);
      const videoBlob = videoBlobRef.current;

      if (!videoBlob) {
        console.error("No se encontró video para cortar.");
        alert("No hay video disponible. Por favor, graba algo primero.");
        return;
      }

      const inputName = 'input.webm';
      const outputName = `recorte_${startTime}-${endTime}.webm`;
      console.log(ffmpegRef.current)
      ///await initFFmpeg();
      if (!ffmpegRef.current) {
    
        console.log('cargando ffmpeg')
        ffmpegRef.current = createFFmpeg({
          log: true,
          corePath: '/ffmpeg/ffmpeg-core.js',
          wasmBinary,
          threadSupport: false 
         
        });
        await ffmpegRef.current.load();
        console.log('cargao')
      }
      
      
      ffmpegRef.current.FS('writeFile', inputName, await fetchFile(videoBlob));

      await ffmpegRef.current.run(
        '-ss', String(startTime),  // ¡Colocado antes de -i para búsqueda rápida!
        '-i', inputName,
        '-to', String(endTime - startTime),  // Duración en lugar de tiempo final
        '-c:v', 'copy',
        '-c:a', 'copy',
        outputName
      );
      
      // Leer el archivo de salida con FS
      const output= ffmpegRef.current.FS('readFile', outputName);
      const outputBlob = new Blob([output.buffer], { type: 'video/webm' });
      const outputUrl = URL.createObjectURL(outputBlob);
      

      const a = document.createElement('a');
      a.href = outputUrl;
      a.download = outputName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(outputUrl);
    } catch (error) {
      console.error('Error en cutVideo:', error);
      alert('Error al recortar el video.');
    }
    finally {
      setLoading(false)
    }
  }

  function openVideoWindow(stream) {
    newWindow = window.open("", "Screen Share", "width=800,height=600");
    if (newWindow) {
      newWindow.document.write("<video id='sharedVideo' autoplay playsinline style='width:100%; height:100%;'></video>");
      newWindow.document.close();
      videoElement = newWindow.document.getElementById("sharedVideo");
      videoElement.srcObject = stream;
    }
  }

  return {
    startCapture,
    stopRecording,
    cutVideo,
    openVideoWindow
  };
}
