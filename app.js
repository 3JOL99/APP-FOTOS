// ============================================================
// J&G - APP.JS
// ============================================================

const SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbxbVElWq2BqMUS91KGNe5_nrcFI9hF6Z6Su0emRA9nx2bS_rQEqOZQTulEIGES-THM2TQ/exec';


// ============================================================
// ELEMENTS
// ============================================================

const cameraInput = document.getElementById('cameraInput');
const galleryInput = document.getElementById('galleryInput');

const startCamBtn = document.getElementById('startCamBtn');
const startGalleryBtn = document.getElementById('startGalleryBtn');

const uploadAllBtn = document.getElementById('uploadAllBtn');

const status = document.getElementById('status');

const pendingContainer = document.getElementById('pendingContainer');
const pendingPreview = document.getElementById('pendingPreview');

const galleryContainer = document.getElementById('galleryContainer');
const refreshGalleryBtn = document.getElementById('refreshGalleryBtn');


// ============================================================
// VARIABLES
// ============================================================

let pendingFiles = [];
let allFiles = [];
let currentIndex = 0;


// ============================================================
// STATUS
// ============================================================

function setStatus(message) {
  if (status) {
    status.textContent = message || '';
  }
}


// ============================================================
// BOTÓ CÀMERA
// ============================================================

if (startCamBtn && cameraInput) {
  startCamBtn.addEventListener('click', function () {
    setStatus('');
    cameraInput.value = '';
    cameraInput.click();
  });
}


// ============================================================
// BOTÓ GALERIA
// ============================================================

if (startGalleryBtn && galleryInput) {
  startGalleryBtn.addEventListener('click', function () {
    setStatus('');
    galleryInput.value = '';
    galleryInput.click();
  });
}


// ============================================================
// CÀMERA: FITXERS SELECCIONATS
// ============================================================

if (cameraInput) {
  cameraInput.addEventListener('change', function (event) {
    const files = Array.from(event.target.files || []);

    if (files.length > 0) {
      afegirFitxers(files);
    }

    cameraInput.value = '';
  });
}


// ============================================================
// GALERIA: FITXERS SELECCIONATS
// ============================================================

if (galleryInput) {
  galleryInput.addEventListener('change', function (event) {
    const files = Array.from(event.target.files || []);

    if (files.length > 0) {
      afegirFitxers(files);
    }

    galleryInput.value = '';
  });
}


// ============================================================
// AFEGIR FITXERS A LA CUA
// ============================================================

function afegirFitxers(files) {
  files.forEach(function (file) {
    if (
      file.type.startsWith('image/') ||
      file.type.startsWith('video/')
    ) {
      pendingFiles.push(file);
    }
  });

  mostrarPendents();
}


// ============================================================
// MOSTRAR PENDENTS
// ============================================================

function mostrarPendents() {
  if (!pendingContainer || !pendingPreview) {
    return;
  }

  pendingPreview.innerHTML = '';

  if (pendingFiles.length === 0) {
    pendingContainer.style.display = 'none';
    return;
  }

  pendingContainer.style.display = 'block';

  pendingFiles.forEach(function (file, index) {
    const wrapper = document.createElement('div');

    wrapper.className = 'pending-thumb';

    let media;

    if (file.type.startsWith('video/')) {
      media = document.createElement('video');
      media.muted = true;
      media.playsInline = true;
    } else {
      media = document.createElement('img');
    }

    media.src = URL.createObjectURL(file);
    media.alt = file.name;

    wrapper.appendChild(media);

    const removeButton = document.createElement('button');

    removeButton.type = 'button';
    removeButton.className = 'remove-thumb';
    removeButton.textContent = '×';

    removeButton.addEventListener('click', function () {
      pendingFiles.splice(index, 1);
      mostrarPendents();
    });

    wrapper.appendChild(removeButton);

    pendingPreview.appendChild(wrapper);
  });
}


// ============================================================
// BOTÓ PUJAR TOTS
// ============================================================

if (uploadAllBtn) {
  uploadAllBtn.addEventListener('click', function () {
    if (pendingFiles.length === 0) {
      setStatus('No hi ha fitxers pendents per pujar.');
      return;
    }

    pujarFitxers();
  });
}


// ============================================================
// PUJAR FITXERS
// ============================================================

async function pujarFitxers() {
  const filesToUpload = pendingFiles.slice();

  uploadAllBtn.disabled = true;

  try {
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];

      setStatus(
        'Pujant ' +
        (i + 1) +
        ' de ' +
        filesToUpload.length +
        '...'
      );

      const base64 = await convertirABase64(file);

      const extensio = obtenirExtensio(file.name);

      const ara = new Date();

      const any = ara.getFullYear();
      const mes = String(ara.getMonth() + 1).padStart(2, '0');
      const dia = String(ara.getDate()).padStart(2, '0');

      const hores = String(ara.getHours()).padStart(2, '0');
      const minuts = String(ara.getMinutes()).padStart(2, '0');
      const segons = String(ara.getSeconds()).padStart(2, '0');

      const random = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, '0');

      const nomPersonalitzat =
        any + '-' +
        mes + '-' +
        dia + '_' +
        hores + '-' +
        minuts + '-' +
        segons + '_' +
        random + '.' +
        extensio;

      const resposta = await fetch(SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8'
        },
        body: JSON.stringify({
          data: base64,
          type: file.type,
          name: nomPersonalitzat
        })
      });

      if (!resposta.ok) {
        throw new Error(
          'Error HTTP ' + resposta.status
        );
      }
    }

    pendingFiles = [];

    mostrarPendents();

    setStatus(
      'Tots els fitxers s’han pujat correctament.'
    );

    carregarGaleria();

  } catch (error) {
    console.error('Error pujant fitxers:', error);

    setStatus(
      'Hi ha hagut un error en pujar els fitxers.'
    );

  } finally {
    uploadAllBtn.disabled = false;
  }
}


// ============================================================
// CONVERTIR A BASE64
// ============================================================

function convertirABase64(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();

    reader.onload = function () {
      const resultat = reader.result;
      const base64 = resultat.split(',')[1];

      resolve(base64);
    };

    reader.onerror = function () {
      reject(
        new Error('No s’ha pogut llegir el fitxer.')
      );
    };

    reader.readAsDataURL(file);
  });
}


// ============================================================
// OBTENIR EXTENSIÓ
// ============================================================

function obtenirExtensio(nom) {
  const parts = nom.split('.');

  if (parts.length < 2) {
    return 'jpg';
  }

  return parts.pop().toLowerCase();
}


// ============================================================
// CARREGAR GALERIA
// ============================================================

async function carregarGaleria() {
  if (!galleryContainer) {
    return;
  }

  galleryContainer.innerHTML =
    '<p>Carregant galeria...</p>';

  try {
    const resposta = await fetch(
      SCRIPT_URL + '?action=getFiles&t=' + Date.now()
    );

    if (!resposta.ok) {
      throw new Error(
        'Error HTTP ' + resposta.status
      );
    }

    const dades = await resposta.json();

    if (!Array.isArray(dades)) {
      throw new Error(
        'La resposta no és una llista.'
      );
    }

    allFiles = dades;

    mostrarGaleria();

  } catch (error) {
    console.error(
      'Error carregant la galeria:',
      error
    );

    galleryContainer.innerHTML =
      '<p>No s’ha pogut carregar la galeria.</p>';
  }
}


// ============================================================
// MOSTRAR GALERIA
// ============================================================

function mostrarGaleria() {
  if (!galleryContainer) {
    return;
  }

  galleryContainer.innerHTML = '';

  if (allFiles.length === 0) {
    galleryContainer.innerHTML =
      '<p>Encara no hi ha fotos ni vídeos.</p>';

    return;
  }

  allFiles.forEach(function (file, index) {
    const item = document.createElement('div');

    item.className = 'gallery-item';

    if (
      file.type &&
      file.type.startsWith('image/')
    ) {
      const img = document.createElement('img');

      img.src = file.url;
      img.alt = file.name || 'Foto';
      img.loading = 'lazy';

      img.addEventListener('click', function () {
        obrirModal(index);
      });

      item.appendChild(img);

    } else if (
      file.type &&
      file.type.startsWith('video/')
    ) {
      const video = document.createElement('video');

      video.src = file.url;
      video.muted = true;
      video.playsInline = true;
      video.preload = 'metadata';

      video.addEventListener('click', function () {
        obrirModal(index);
      });

      item.appendChild(video);

    } else {
      const link = document.createElement('a');

      link.href = file.url;
      link.target = '_blank';
      link.textContent =
        file.name || 'Obrir fitxer';

      item.appendChild(link);
    }

    galleryContainer.appendChild(item);
  });
}


// ============================================================
// REFRESCAR GALERIA
// ============================================================

if (refreshGalleryBtn) {
  refreshGalleryBtn.addEventListener(
    'click',
    function () {
      carregarGaleria();
    }
  );
}


// ============================================================
// MODAL
// ============================================================

const imageModal =
  document.getElementById('imageModal');

const closeModal =
  document.getElementById('closeModal');

const downloadBtn =
  document.getElementById('downloadBtn');

const modalContent =
  document.getElementById('modalContent');

const modalVideoContent =
  document.getElementById('modalVideoContent');

const prevBtn =
  document.getElementById('prevBtn');

const nextBtn =
  document.getElementById('nextBtn');


// ============================================================
// OBRIR MODAL
// ============================================================

function obrirModal(index) {
  if (!imageModal) {
    return;
  }

  if (
    allFiles.length === 0 ||
    index < 0 ||
    index >= allFiles.length
  ) {
    return;
  }

  currentIndex = index;

  mostrarFitxerModal();

  imageModal.style.display = 'flex';
}


// ============================================================
// MOSTRAR FITXER AL MODAL
// ============================================================

function mostrarFitxerModal() {
  if (allFiles.length === 0) {
    return;
  }

  const file = allFiles[currentIndex];

  if (modalContent) {
    modalContent.innerHTML = '';
    modalContent.style.display = 'none';
  }

  if (modalVideoContent) {
    modalVideoContent.innerHTML = '';
    modalVideoContent.style.display = 'none';
  }

  if (
    file.type &&
    file.type.startsWith('image/')
  ) {
    if (modalContent) {
      const img = document.createElement('img');

      img.src = file.url;
      img.alt = file.name || 'Foto';

      modalContent.appendChild(img);
      modalContent.style.display = 'block';
    }

  } else if (
    file.type &&
    file.type.startsWith('video/')
  ) {
    if (modalVideoContent) {
      const video = document.createElement('video');

      video.src = file.url;
      video.controls = true;
      video.autoplay = true;
      video.playsInline = true;

      modalVideoContent.appendChild(video);
      modalVideoContent.style.display = 'block';
    }
  }

  if (downloadBtn) {
    downloadBtn.onclick = function () {
      descarregarFitxer(file);
    };
  }
}


// ============================================================
// TANCAR MODAL
// ============================================================

function tancarModal() {
  if (!imageModal) {
    return;
  }

  imageModal.style.display = 'none';

  if (modalContent) {
    modalContent.innerHTML = '';
  }

  if (modalVideoContent) {
    modalVideoContent.innerHTML = '';
  }
}


if (closeModal) {
  closeModal.addEventListener(
    'click',
    function () {
      tancarModal();
    }
  );
}


if (imageModal) {
  imageModal.addEventListener(
    'click',
    function (event) {
      if (event.target === imageModal) {
        tancarModal();
      }
    }
  );
}


// ============================================================
// ANTERIOR
// ============================================================

if (prevBtn) {
  prevBtn.addEventListener(
    'click',
    function () {
      if (allFiles.length === 0) {
        return;
      }

      currentIndex--;

      if (currentIndex < 0) {
        currentIndex = allFiles.length - 1;
      }

      mostrarFitxerModal();
    }
  );
}


// ============================================================
// SEGÜENT
// ============================================================

if (nextBtn) {
  nextBtn.addEventListener(
    'click',
    function () {
      if (allFiles.length === 0) {
        return;
      }

      currentIndex++;

      if (currentIndex >= allFiles.length) {
        currentIndex = 0;
      }

      mostrarFitxerModal();
    }
  );
}


// ============================================================
// TECLAT
// ============================================================

document.addEventListener(
  'keydown',
  function (event) {
    if (
      !imageModal ||
      imageModal.style.display === 'none'
    ) {
      return;
    }

    if (event.key === 'Escape') {
      tancarModal();
    }

    if (event.key === 'ArrowLeft') {
      if (prevBtn) {
        prevBtn.click();
      }
    }

    if (event.key === 'ArrowRight') {
      if (nextBtn) {
        nextBtn.click();
      }
    }
  }
);


// ============================================================
// DESCARREGAR
// ============================================================

function descarregarFitxer(file) {
  if (!file || !file.url) {
    return;
  }

  const link = document.createElement('a');

  link.href = file.url;
  link.target = '_blank';
  link.rel = 'noopener';
  link.download = file.name || '';

  document.body.appendChild(link);

  link.click();

  link.remove();
}


// ============================================================
// POPUP D'INSTRUCCIONS
// ============================================================

const downloadInstructions =
  document.getElementById('downloadInstructions');

const closeDownloadInstructions =
  document.getElementById('closeDownloadInstructions');


if (closeDownloadInstructions) {
  closeDownloadInstructions.addEventListener(
    'click',
    function () {
      if (downloadInstructions) {
        downloadInstructions.style.display = 'none';
      }
    }
  );
}


if (downloadInstructions) {
  downloadInstructions.addEventListener(
    'click',
    function (event) {
      if (event.target === downloadInstructions) {
        downloadInstructions.style.display = 'none';
      }
    }
  );
}


// ============================================================
// PESTANYES
// ============================================================

const tabButtons =
  document.querySelectorAll('.tab-btn');

const tabContents =
  document.querySelectorAll('.tab-content');


tabButtons.forEach(function (button) {
  button.addEventListener(
    'click',
    function () {
      const targetId =
        button.getAttribute('data-tab');

      tabButtons.forEach(function (btn) {
        btn.classList.remove('active');
      });

      tabContents.forEach(function (content) {
        content.classList.remove('active');
      });

      button.classList.add('active');

      const target =
        document.getElementById(targetId);

      if (target) {
        target.classList.add('active');
      }

      if (targetId === 'galleryTab') {
        carregarGaleria();
      }
    }
  );
});


// ============================================================
// REFRESC AUTOMÀTIC
// ============================================================

setInterval(
  function () {
    const galleryTab =
      document.getElementById('galleryTab');

    if (
      galleryTab &&
      galleryTab.classList.contains('active')
    ) {
      carregarGaleria();
    }
  },
  10000
);


// ============================================================
// INICI
// ============================================================

mostrarPendents();

console.log(
  'J&G: app.js carregat correctament.'
);
