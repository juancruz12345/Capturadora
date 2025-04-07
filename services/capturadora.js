import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';
import { useRef } from 'react';

export function useCapturadora(setShowControls, setLoading) {
  const ffmpeg = createFFmpeg({
    log: true,
    corePath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.10.0/dist/ffmpeg-core.js',
    wasmPath: 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.10.0/dist/ffmpeg-core.wasm',
    ///threadSupport: false ///en desasrrollo debe estar en false para desabilitar multihilo
     worker: false // 👈 evita usar SharedArrayBuffer
  });

  const recordedChunks = useRef([]);
  const videoBlobRef = useRef(null);
  
  let mediaRecorder;
  let captureStream = null;
  let newWindow;
  let videoElement;

  async function initFFmpeg() {
    if (!ffmpeg.isLoaded()) {
      await ffmpeg.load();
      
    }
  }

  async function startCapture() {
    try {
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

      await initFFmpeg();
      
      ffmpeg.FS('writeFile', inputName, await fetchFile(videoBlob));

      await ffmpeg.run(
        '-i', inputName,
        '-ss', startTime.toString(),
        "-to", endTime.toString(),
        '-c:v', 'libvpx',
        '-c:a', 'libvorbis',
        outputName
      );
      
      const data = ffmpeg.FS('readFile', outputName);
      const blob = new Blob([data.buffer], { type: 'video/webm' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = outputName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(url);
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
