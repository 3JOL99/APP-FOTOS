const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxbVElWq2BqMUS91KGNe5_nrcFI9hF6Z6Su0emRA9nx2bS_rQEqOZQTulEIGES-THM2TQ/exec';

const galleryInput = document.getElementById('galleryInput');
const startCamBtn = document.getElementById('startCamBtn');
const startGalleryBtn = document.getElementById('startGalleryBtn');
const status = document.getElementById('status');
const galleryContainer = document.getElementById('galleryContainer');

// Elements de la Càmera Interna
const cameraModal = document.getElementById('cameraModal');
const cameraStream = document.getElementById('cameraStream');
const shutterBtn = document.getElementById('shutterBtn');
const camTray = document.getElementById('camTray');
const camCounter = document.getElementById('camCounter');
const closeCamModal = document.getElementById('closeCamModal');
const sendCamPhotosBtn = document.getElementById('sendCamPhotosBtn');

let mediaStream = null;
let currentSessionFiles = [];

const smartInstallBtn = document.getElementById('smartInstallBtn');
const iosInstructions = document.getElementById('iosInstructions');

let deferredPrompt = null;
const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator.standalone);

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  smartInstallBtn.style.display = 'inline-block';
});

if (isIos && !isInStandaloneMode) {
  smartInstallBtn.style.display = 'inline-block';
}

smartInstallBtn.addEventListener('click', async () => {
  if (isIos) {
    iosInstructions.style.display = iosInstructions.style.display === 'block' ? 'none' : 'block';
  } else if (deferredPrompt) {
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      smartInstallBtn.style.display = 'none';
    }
    deferredPrompt = null;
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js');
}

// Obrir la càmera interna (estil WhatsApp)
startCamBtn.addEventListener('click', async () => {
  status.textContent = '';
  currentSessionFiles = [];
  updateCamTrayUI();
  
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' }, 
      audio: false 
    });
    cameraStream.srcObject = mediaStream;
    cameraModal.style.display = 'flex';
  } catch (err) {
    alert('No s\'ha pogut accedir a la càmera. Assegura\'t de donar permisos.');
  }
});

// Tancar la càmera interna
closeCamModal.addEventListener('click', () => {
  stopCameraStream();
});

function stopCameraStream() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop());
    mediaStream = null;
  }
  cameraModal.style.display = 'none';
}

// Botó de disparar (fent foto)
shutterBtn.addEventListener('click', () => {
  if (!mediaStream) return;

  const canvas = document.createElement('canvas');
  canvas.width = cameraStream.videoWidth || 1280;
  canvas.height = cameraStream.videoHeight || 720;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(cameraStream, 0, 0, canvas.width, canvas.height);

  canvas.toBlob((blob) => {
    const now = new Date();
    const nom = `foto_${now.getTime()}.jpg`;
    const file = new File([blob], nom, { type: 'image/jpeg' });
    currentSessionFiles.push(file);
    updateCamTrayUI();
  }, 'image/jpeg', 0.85);
});

// Actualitzar la safata inferior de la càmera
function updateCamTrayUI() {
  camCounter.textContent = `${currentSessionFiles.length} fotos`;
  camTray.innerHTML = '';

  currentSessionFiles.forEach((file, index) => {
    const div = document.createElement('div');
    div.className = 'cam-thumb';

    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    div.appendChild(img);

    const removeBtn = document.createElement('div');
    removeBtn.className = 'cam-remove';
    removeBtn.textContent = '×';
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      currentSessionFiles.splice(index, 1);
      updateCamTrayUI();
    };

    div.appendChild(removeBtn);
    camTray.appendChild(div);
  });
}

// Enviar les fotos fetes des de la càmera interna
sendCamPhotosBtn.addEventListener('click', async () => {
  if (currentSessionFiles.length === 0) {
    alert('Primer has de fer alguna foto!');
    return;
  }

  const filesToUpload = [...currentSessionFiles];
  stopCameraStream();
  uploadFiles(filesToUpload);
});

// Seleccionar fitxers de la galeria normal
startGalleryBtn.addEventListener('click', () => {
  status.textContent = '';
  galleryInput.click();
});

galleryInput.addEventListener('change', (e) => {
  if (e.target.files && e.target.files.length > 0) {
    const filesToUpload = Array.from(e.target.files);
    galleryInput.value = '';
    uploadFiles(filesToUpload);
  }
});

// Funció general per pujar qualsevol llista de fitxers al Drive
async function uploadFiles(filesToUpload) {
  status.textContent = `Preparant ${filesToUpload.length} fitxers per pujar...`;

  for (let i = 0; i < filesToUpload.length; i++) {
    const file = filesToUpload[i];
    status.textContent = `Pujant \({i + 1} de\){filesToUpload.length}...`;

    const now = new Date();
    const any = now.getFullYear();
    const mes = String(now.getMonth() + 1).padStart(2, '0');
    const dia = String(now.getDate()).padStart(2, '0');
    const hores = String(now.getHours()).padStart(2, '0');
    const minuts = String(now.getMinutes()).padStart(2, '0');
    const segons = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000) + i;
    
    const extensio = file.name.split('.').pop() || 'jpg';
    const nomPersonalitzat = `\({any}-\){mes}-\({dia}_\){hores}-\({minuts}-\){segons}_\({random}.\){extensio}`;

    await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = function(evt) {
        const bytes = new Uint8Array(evt.target.result);
        let binary = '';
        const len = bytes.byteLength;
        for (let j = 0; j < len; j++) {
          binary += String.fromCharCode(bytes[j]);
        }
        const base64 = btoa(binary);

        fetch(SCRIPT_URL, {
          method: 'POST',
          body: new URLSearchParams({
            data: base64,
            type: file.type,
            name: nomPersonalitzat
          })
        })
        .then(res => res.text())
        .then(() => resolve())
        .catch(() => resolve());
      };
      reader.readAsArrayBuffer(file);
    });
  }

  status.textContent = 'Tots els fitxers pujats correctament! 🎉';
  carregarGaleria();
}

// Lògica del Modal per veure les fotos de la galeria a pantalla completa
const imageModal = document.getElementById('imageModal');
const modalContent = document.getElementById('modalContent');
const modalVideoContent = document.getElementById('modalVideoContent');
const closeModal = document.getElementById('closeModal');
const downloadBtn = document.getElementById('downloadBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let allFiles = [];
let currentIndex = 0;

function showModalItem(index) {
  if (index < 0) index = allFiles.length - 1;
  if (index >= allFiles.length) index = 0;
  currentIndex = index;

  const file = allFiles[currentIndex];

  downloadBtn.href = `https://drive.google.com/uc?export=download&id=${file.id}&confirm=t`;
  downloadBtn.setAttribute('download', file.name);

  if (file.type.startsWith('image/')) {
    modalVideoContent.style.display = 'none';
    modalVideoContent.pause();
    modalContent.style.display = 'block';
    modalContent.src = file.url;
  } else if (file.type.startsWith('video/')) {
    modalContent.style.display = 'none';
    modalContent.src = '';
    modalVideoContent.style.display = 'block';
    modalVideoContent.src = file.url;
  }
  imageModal.style.display = 'flex';
}

closeModal.addEventListener('click', () => {
  imageModal.style.display = 'none';
  modalContent.src = '';
  modalVideoContent.src = '';
  modalVideoContent.pause();
});

imageModal.addEventListener('click', (e) => {
  if (e.target === imageModal) {
    imageModal.style.display = 'none';
    modalContent.src = '';
    modalVideoContent.src = '';
    modalVideoContent.pause();
  }
});

prevBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  showModalItem(currentIndex - 1);
});

nextBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  showModalItem(currentIndex + 1);
});

function carregarGaleria() {
  fetch(SCRIPT_URL + '?action=getFiles')
    .then(res => res.json())
    .then(files => {
      allFiles = files;
      galleryContainer.innerHTML = '';
      if (files.length === 0) {
        galleryContainer.innerHTML = 'Encara no hi ha fotos. Siguis el primer!';
    return;
    }
    files.forEach((file, index) => {
    if (file.type.startsWith('image/')) {
    const img = document.createElement('img');
    img.src = file.url;
    img.style.cursor = 'pointer';
    img.addEventListener('click', () => showModalItem(index));
    galleryContainer.appendChild(img);
    } else if (file.type.startsWith('video/')) {
    const video = document.createElement('video');
    video.src = file.url;
    video.controls = false;
    video.style.cursor = 'pointer';
    video.addEventListener('click', () => showModalItem(index));
    galleryContainer.appendChild(video);
    }
    });
    });
}

carregarGaleria();