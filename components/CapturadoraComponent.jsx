import { useState } from 'react';
import { useCapturadora } from '../services/capturadora';
import { Button, Form, Spinner } from 'react-bootstrap';
import { Camera, Download, NewWindow, Pause } from './Icons';

export function CapturadoraComponent() {
  const [showControls, setShowControls] = useState(false);
  const [loading, setLoading] = useState(0)
  const {
    startCapture,
    stopRecording,
    cutVideo,
    openVideoWindow
  } = useCapturadora(setShowControls,setLoading);

  const handleCut = async () => {
    const startTime = parseFloat(document.getElementById('startTime').value);
    const endTime = parseFloat(document.getElementById('endTime').value);

    if (isNaN(startTime) || isNaN(endTime) || startTime >= endTime) {
      alert("Los tiempos de recorte no son válidos");
      return;
    }

    await cutVideo(startTime, endTime);
  };

  return (
    <div>
      <Button id="startBtn" onClick={startCapture}><Camera></Camera>Iniciar</Button>
      <Button id="stopBtn" onClick={stopRecording}><Pause></Pause>Detener</Button>
      <Button id="windowBtn" onClick={() => openVideoWindow()}><NewWindow></NewWindow>Nueva ventana</Button>

     <div style={{display:'flex'}}>

     <video id="video-main" style={{ width: '60%',height:'30%', display: 'none', marginTop:'40px' }} controls />
      <div style={{ marginTop: '1rem', display: showControls ? 'block' : 'none' }}>
       <Form>
        <Form.Group>
          <Form.Label>Inicio</Form.Label>
          <Form.Control type="number" id="startTime" placeholder="Tiempo de inicio (segundos)"></Form.Control>
        </Form.Group>
        <Form.Group>
          <Form.Label>Fin</Form.Label>
          <Form.Control type="number" id="endTime" placeholder="Tiempo de fin (segundos)"></Form.Control>
        </Form.Group>
        
      
       </Form>
        <Button onClick={handleCut}><Download></Download>Recortar y descargar video</Button>
       
      </div>

     </div>
      <div>
        {
          loading ? <div>
            <span><strong>Cargando</strong></span>
           <Spinner/>
          </div>
          :<></>
        }
      </div>

      
    </div>
  );
}
