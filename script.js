const translations = {
  en: {
    welcome: "🛒 Welcome to RAN General Store",
    searchPlaceholder: "Search for products...",
    mrp: "MRP",
    price: "Price",
    addToCart: "Add to Cart",
    close: "X Close",
    noResults: "No products found."
  },
  hi: {
    welcome: "🛒 स्वागत है RAN जनरल स्टोर में",
    searchPlaceholder: "उत्पाद खोजें...",
    mrp: "अधिकतम खुदरा मूल्य",
    price: "मूल्य",
    addToCart: "कार्ट में जोड़ें",
    close: "बंद करें",
    noResults: "कोई उत्पाद नहीं मिला।"
  },
  te: {
    welcome: "🛒 RAN సాధారణ స్టోర్‌కు స్వాగతం",
    searchPlaceholder: "ఉత్పత్తులను వెతకండి...",
    mrp: "ఎంఆర్‌పి",
    price: "ధర",
    addToCart: "కార్ట్‌లో చేర్చు",
    close: "మూసివెయ్యి",
    noResults: "ఉత్పత్తులు లభించలేదు."
  }
};

const overlay = document.getElementById("zoomOverlay");
const zoomImage = document.getElementById("zoomImage");
const zoomTitle = document.getElementById("zoomTitle");
const zoomMrp = document.getElementById("zoomMrp");
const zoomPrice = document.getElementById("zoomPrice");
const zoomContainer = document.getElementById("zoomContainer");
const closeBtn = document.getElementById("closeBtn");
const searchBar = document.getElementById("searchBar");
const productList = document.getElementById("product-list");
const languageSelector = document.getElementById("languageSelector");
const welcomeText = document.getElementById("welcomeText");
const micIcon = document.getElementById("micIcon");

let selectedLanguage = "en";
let scale = 1;
let isDragging = false;
let origin = { x: 0, y: 0 };
let offset = { x: 0, y: 0 };
let allProducts = [];

function updateZoomTransform() {
  zoomImage.style.transform = `translate(${offset.x}px, ${offset.y}px) scale(${scale})`;
}

function getProductName(name) {
  if (typeof name === 'object') {
    return name[selectedLanguage] || name["en"] || Object.values(name)[0];
  }
  return name;
}

function applyTranslations() {
  const t = translations[selectedLanguage];
  welcomeText.innerText = t.welcome;
  searchBar.placeholder = t.searchPlaceholder;
  closeBtn.innerText = t.close;
}

function renderProducts(products) {
  productList.innerHTML = '';
  const t = translations[selectedLanguage];
  if (products.length === 0) {
    productList.innerHTML = `<p>${t.noResults}</p>`;
    return;
  }

  products.forEach(p => {
    const displayName = getProductName(p.name);
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img src="${p.image}" alt="${displayName}">
      <div class="card-body">
        <div class="card-title">${displayName}</div>
        <div class="card-mrp">${t.mrp}: ₹${p.mrp}</div>
        <div class="card-price">${t.price}: ₹${p.price}</div>
        <button class="btn">${t.addToCart}</button>
      </div>
    `;

    card.addEventListener("click", () => {
      scale = 1;
      offset = { x: 0, y: 0 };
      zoomImage.style.transform = "none";
      zoomImage.src = p.image;
      zoomImage.alt = displayName;
      zoomTitle.innerText = displayName;
      zoomMrp.innerHTML = `<span class="card-mrp">${t.mrp}: ₹${p.mrp}</span>`;
      zoomPrice.innerHTML = `<span class="card-price">${t.price}: ₹${p.price}</span>`;
      overlay.style.display = "flex";
    });

    productList.appendChild(card);
  });
}

fetch("products.json")
  .then(res => res.json())
  .then(products => {
    allProducts = products;
    applyTranslations();
    renderProducts(allProducts);
  });

function cleanText(text) {
  return text.toLowerCase().trim().replace(/[.,!?]$/, "");
}

function filterProducts(query) {
  query = cleanText(query);
  const filtered = allProducts.filter(p => {
    const names = typeof p.name === "object" ? Object.values(p.name) : [p.name];
    return names.some(n => cleanText(n).includes(query));
  });
  renderProducts(filtered);
}

searchBar.addEventListener("input", () => {
  filterProducts(searchBar.value);
});

languageSelector.addEventListener("change", () => {
  selectedLanguage = languageSelector.value;
  applyTranslations();
  renderProducts(allProducts);
  updateSpeechLanguage();
});

closeBtn.addEventListener("click", () => overlay.style.display = "none");
overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.style.display = "none"; });

zoomContainer.addEventListener("wheel", (e) => {
  e.preventDefault();
  const previousScale = scale;
  scale += e.deltaY < 0 ? 0.1 : -0.1;
  scale = Math.min(Math.max(1, scale), 4);
  const scaleRatio = scale / previousScale;
  offset.x *= scaleRatio;
  offset.y *= scaleRatio;
  updateZoomTransform();
});

zoomContainer.addEventListener("mousedown", (e) => {
  isDragging = true;
  origin = { x: e.clientX - offset.x, y: e.clientY - offset.y };
  zoomContainer.style.cursor = "grabbing";
});

window.addEventListener("mouseup", () => {
  isDragging = false;
  zoomContainer.style.cursor = "grab";
});

window.addEventListener("mousemove", (e) => {
  if (isDragging) {
    offset.x = e.clientX - origin.x;
    offset.y = e.clientY - origin.y;
    updateZoomTransform();
  }
});

// Voice Search
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

function getRecognitionLang(langCode) {
  switch (langCode) {
    case "en": return "en-IN";
    case "hi": return "hi-IN";
    case "te": return "te-IN";
    default: return "en-IN";
  }
}

function updateSpeechLanguage() {
  if (!recognition) return;
  recognition.lang = getRecognitionLang(selectedLanguage);
}

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  updateSpeechLanguage();

  micIcon.addEventListener("click", () => {
    recognition.start();
  });

  recognition.onresult = (event) => {
    const spokenText = event.results[0][0].transcript;
    searchBar.value = spokenText;
    filterProducts(spokenText);
  };

  recognition.onerror = (e) => {
    console.error("Speech recognition error:", e.error);
  };
} else {
  micIcon.style.display = "none";
  alert("Voice recognition not supported in this browser.");
}