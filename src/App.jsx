import React, { useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, addDoc, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getGeminiResponse } from './services/gemini';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: 'Bienvenido al entorno de diagnóstico. He calibrado mis algoritmos para detectar anomalías eléctricas y lógicas. ¿Qué dispositivo estamos analizando?',
      title: 'SISTEMA DE DIAGNÓSTICO AVANZADO',
      logicSteps: []
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatWindowRef = useRef(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Cargar historial al iniciar
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const q = query(collection(db, "mensajes"), orderBy("timestamp", "asc"));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const loadedMessages = snap.docs.map(doc => doc.data());
          setMessages(loadedMessages);
        }
      } catch (e) {
        console.error("Error cargando historial:", e);
      }
    };
    loadHistory();
  }, []);

  const addMessage = async (role, text, title = "ANÁLISIS TÉCNICO", logicSteps = []) => {
    const newMsg = { role, text, title, logicSteps, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, newMsg]);
    
    // Persistir en Firebase
    try {
      await addDoc(collection(db, "mensajes"), newMsg);
    } catch (e) {
      console.error("Error guardando mensaje:", e);
    }
  };

  const sendToNova = async () => {
    const prompt = inputValue.trim();
    if (!prompt || isTyping) return;

    addMessage('user', prompt, "REPORTE DE ENTRADA");
    setInputValue('');
    setIsTyping(true);

    const low = prompt.toLowerCase();

    // Lógica de aprendizaje (Firebase)
    if (low.startsWith("asunto:")) {
      const data = prompt.substring(7);
      try {
        await addDoc(collection(db, "conocimiento"), {
          detalle: data,
          timestamp: new Date().toISOString()
        });
        addMessage('ai', "Caso indexado en la red neuronal. He aprendido este antecedente técnico.", "LEARNING OK", ["Sincronizando base de conocimientos..."]);
      } catch (e) {
        addMessage('ai', "Error al sincronizar con Firebase.", "SYSTEM ERROR");
      }
      setIsTyping(false);
      return;
    }

    try {
      // 1. MEMORIA DE LARGO PLAZO: Buscar contexto técnico en Firebase
      const snap = await getDocs(collection(db, "conocimiento"));
      let technicalContext = "";
      
      snap.forEach(doc => {
        const words = low.split(" ").filter(w => w.length > 4);
        if (words.some(w => doc.data().detalle.toLowerCase().includes(w))) {
          technicalContext += `Antecedente encontrado: ${doc.data().detalle}. `;
        }
      });

      // 2. MEMORIA DE CORTO PLAZO: Enviar el historial de chat actual + Contexto Firebase
      const aiPrompt = technicalContext 
        ? `CONTEXTO TÉCNICO PREVIO: ${technicalContext}\nPREGUNTA USUARIO: ${prompt}`
        : prompt;

      // Solo enviamos los últimos 10 mensajes para no saturar el contexto
      const chatHistory = messages.slice(-10);
      
      const aiResponse = await getGeminiResponse(aiPrompt, chatHistory);

      addMessage('ai', aiResponse.text, "NOVA INTELLIGENCE", aiResponse.steps);
    } catch (error) {
      addMessage('ai', "Error en el núcleo de procesamiento.", "CRITICAL ERROR", [error.message]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') sendToNova();
  };

  const showProtocols = (type) => {
    if (type === 'encendido') {
      addMessage('ai', "1. Inspección visual (Corrosión) -> 2. Consumo inicial (Fuente) -> 3. Caída de tensión en botón Power -> 4. Buck/LDO del PMIC.", "PROTOCOLO ENCENDIO", ["Paso 1: Medir VDD_MAIN", "Paso 2: Ciclos de encendido"]);
    } else {
      addMessage('ai', "1. Tensión VBUS (5V) -> 2. Comunicación CC1/CC2 -> 3. Protocolo de carga Hydra/Tristar -> 4. Línea de Batería BSI/SWI.", "PROTOCOLO CARGA", ["Paso 1: Test USB", "Paso 2: Integridad IC de carga"]);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100%' }}>
      {/* SIDEBAR */}
      <div id="sidebar">
        <div className="brand-box">
          <h2>CLSERVICELL <span style={{ color: '#fff' }}>PRO</span></h2>
          <span style={{ fontSize: '0.6rem', color: '#666' }}>ADVANCED DIAGNOSTIC MODULE</span>
        </div>
        <button className="nav-btn" onClick={() => showProtocols('encendido')}>⚡ PROTOCOLO ENCENDIDO</button>
        <button className="nav-btn" onClick={() => showProtocols('carga')}>🔌 PROTOCOLO CARGA</button>
        <button className="nav-btn" onClick={() => alert("Accediendo a la red neuronal...")}>📂 BASE DE CONOCIMIENTO</button>
        <button className="nav-btn" onClick={async () => {
          if(confirm("¿Seguro que deseas borrar todo el historial?")) {
            setMessages([]);
            // Opcional: Borrar de Firebase (requeriría listar y borrar cada doc)
          }
        }}>🗑️ REINICIAR CONSOLA</button>
      </div>

      {/* MAIN CONTENT */}
      <div id="main">
        <div id="top-info">
          <span>SISTEMA: DIAGNOSTIC KERNEL V6.5 (REACT + GEMINI)</span>
          <span>ENGINEER MODE: ON</span>
        </div>

        <div id="chat-container">
          <div id="chat-window" ref={chatWindowRef}>
            {messages.map((msg, index) => (
              <div key={index} className={`msg ${msg.role}`}>
                <span className="protocol-tag">{msg.title}</span>
                {msg.text}
                {msg.logicSteps && msg.logicSteps.map((step, i) => (
                  <div key={i} className="logic-step">{`> ${step}`}</div>
                ))}
              </div>
            ))}
            {isTyping && (
                <div className="msg ai">
                    <span className="protocol-tag">NOVA PENSANDO...</span>
                    <div className="logic-step">&gt; Analizando parámetros eléctricos...</div>
                </div>
            )}
          </div>
        </div>

        <div id="input-area">
          <input
            type="text"
            value={inputValue}
            placeholder="Ej: iPhone 13 no carga, consume 450mA estático..."
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isTyping}
          />
          <button 
            id="send-btn" 
            onClick={sendToNova} 
            disabled={isTyping}
            style={{ opacity: isTyping ? 0.5 : 1 }}
          >
            {isTyping ? "ANALIZANDO..." : "ANALIZAR"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
