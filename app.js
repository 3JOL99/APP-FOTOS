const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxbVElWq2BqMUS91KGNe5_nrcFI9hF6Z6Su0emRA9nx2bS_rQEqOZQTulEIGES-THM2TQ/exec';

const cameraInput = document.getElementById('cameraInput');
const galleryInput = document.getElementById('galleryInput');
const startCamBtn = document.getElementById('startCamBtn');
const startGalleryBtn = document.getElementById('startGalleryBtn');
const status = document.getElementById('status');
const galleryContainer = document.getElementById('galleryContainer');

const pendingContainer = document.getElementById('pendingContainer');
const pendingCount = document.getElementById('pendingCount');
const pendingPreview = document.getElementById('pendingPreview');
const uploadAllBtn = document.getElementById('uploadAllBtn');

let pendingFiles = [];

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

// Botons per obrir la càmera o galeria
startCamBtn.addEventListener('click', () => {
  status.textContent = '';
  cameraInput.click();
});

startGalleryBtn.addEventListener('click', () => {
  status.textContent = '';
  galleryInput.click();
});

// Acumular fitxers a la cistella
function addFilesToPending(fileList) {
  if (!fileList || fileList.length === 0) return;
  for (let i = 0; i < fileList.length; i++) {
    pendingFiles.push(fileList[i]);
  }
  updatePendingUI();
  cameraInput.value = '';
  galleryInput.value = '';
}

function updatePendingUI() {
  pendingCount.textContent = pendingFiles.length;
  pendingPreview.innerHTML = '';

  if (pendingFiles.length > 0) {
    pendingContainer.style.display = 'block';
    pendingFiles.forEach((file, index) => {
      const thumbDiv = document.createElement('div');
      thumbDiv.className = 'pending-thumb';

      if (file.type.startsWith('image/')) {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        thumbDiv.appendChild(img);
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        thumbDiv.appendChild(video);
      }

      const removeBtn = document.createElement('div');
      removeBtn.className = 'remove-thumb';
      removeBtn.textContent = '×';
      removeBtn.onclick = () => {
        pendingFiles.splice(index, 1);
        updatePendingUI();
      };

      thumbDiv.appendChild(removeBtn);
      pendingPreview.appendChild(thumbDiv);
    });
  } else {
    pendingContainer.style.display = 'none';
  }
}

cameraInput.addEventListener('change', (e) => addFilesToPending(e.target.files));
galleryInput.addEventListener('change', (e) => addFilesToPending(e.target.files));

// Pujar tots els fitxers acumulats
uploadAllBtn.addEventListener('click', async () => {
  if (pendingFiles.length === 0) return;

  const filesToUpload = [...pendingFiles];
  pendingFiles = [];
  updatePendingUI();

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
});

// Lògica del Modal per veure la galeria
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
        if (file.type && file.type.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = file.url;
          img.style.cursor = 'pointer';
          img.addEventListener('click', () => showModalItem(index));
          galleryContainer.appendChild(img);
        } else if (file.type && file.type.startsWith('video/')) {
          const video = document.createElement('video');
          video.src = file.url;
          video.controls = false;
          video.style.cursor = 'pointer';
          video.addEventListener('click', () => showModalItem(index));
          galleryContainer.appendChild(video);
        }
      });
    })
    .catch(() => {
      galleryContainer.innerHTML = 'Error al carregar la galeria.';
    });
}

carregarGaleria();