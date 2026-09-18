import React, { useState, useEffect } from 'react';
import { Camera, Search, Mic, Activity, MapPin, ShoppingBag, Moon, Sun, AlertCircle } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GoogleGenAI } from '@google/genai';

// Fix leaflet icon issue in react
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const App = () => {
  const [activeTab, setActiveTab] = useState('scan'); // 'scan', 'processing', 'result'
  const [isDark, setIsDark] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [selectedPrefs, setSelectedPrefs] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [currentData, setCurrentData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const fileToGenerativePart = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          inlineData: {
            data: reader.result.split(',')[1],
            mimeType: file.type
          }
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const processWithGemini = async (text, file) => {
    try {
      setErrorMsg('');
      const client = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });
      const prompt = `Analisis makanan dari ${file ? 'gambar ini' : 'teks: ' + text}.
      Penting: Pertimbangkan preferensi diet ini jika ada: ${selectedPrefs.join(', ')}.
      Kembalikan HANYA JSON mentah (tanpa blok markdown) dengan struktur berikut:
      {
        "name": "Nama Makanan",
        "kalori": 100,
        "protein": "10g",
        "karbo": "20g",
        "lemak": "5g",
        "bahan": ["Bahan 1 (takaran)", "Bahan 2"],
        "langkah": ["Langkah 1", "Langkah 2"]
      }`;

      // Prepare interaction based on whether an image file is provided
      let interaction;
      if (file) {
        const imagePart = await fileToGenerativePart(file);
        interaction = await client.interactions.create({
          model: 'gemini-3.5-flash-lite',
          input: [imagePart, { text: prompt }],
        });
      } else {
        interaction = await client.interactions.create({
          model: 'gemini-3.5-flash-lite',
          input: prompt,
        });
      }

      let jsonText = interaction.output_text;
      // Remove any potential markdown wrappers just in case
      jsonText = jsonText.replace(/```json/g, '').replace(/```/g, '').trim();
      const data = JSON.parse(jsonText);
      setCurrentData(data);
      setActiveTab('result');
    } catch (error) {
      console.error(error);
      setErrorMsg(`Error AI: ${error.message || JSON.stringify(error)}`);
      setActiveTab('scan');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setImageFile(file);
      setActiveTab('processing');
      processWithGemini('', file);
    }
  };

  const handleTextSubmit = (e) => {
    if (e.key === 'Enter' && inputText.trim()) {
      setActiveTab('processing');
      setSelectedImage(null);
      setImageFile(null);
      processWithGemini(inputText, null);
    }
  };

  const handleMicClick = async () => {
    try {
      setIsListening(true);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setTimeout(() => {
        setIsListening(false);
        const mockedVoiceText = 'Nasi Goreng';
        setInputText(mockedVoiceText);
        setActiveTab('processing');
        processWithGemini(mockedVoiceText, null);
      }, 2000);
    } catch (err) {
      alert('Izin mikrofon ditolak atau tidak tersedia.');
      setIsListening(false);
    }
  };

  const togglePref = (pref) => {
    if (selectedPrefs.includes(pref)) {
      setSelectedPrefs(selectedPrefs.filter(p => p !== pref));
    } else {
      setSelectedPrefs([...selectedPrefs, pref]);
    }
  };

  const handleOfflineClick = () => {
    window.open(`https://www.google.com/maps/search/Supermarket+Pasar+terdekat`, '_blank');
  };

  const handleOnlineClick = () => {
    const query = encodeURIComponent(`Bahan masakan ${currentData.name}`);
    window.open(`https://www.tokopedia.com/search?q=${query}`, '_blank');
  };

  const displayImage = selectedImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";

  return (
    <div className="min-h-screen pb-16 transition-colors duration-300">
      {/* Navbar */}
      <header className="glass sticky top-0 z-50 animate-slide-up">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-slate dark:text-dark-textMain transition-colors">NutriScan AI</h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDark(!isDark)} 
              className="p-2 rounded-full hover:bg-slate/10 dark:hover:bg-white/10 transition-colors text-slate dark:text-dark-textMain"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Activity className="text-accent animate-pulse-slow" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        {/* Input Area */}
        {activeTab === 'scan' && (
          <section className="space-y-6 animate-fade-in">
            <div className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl p-6 md:p-8 text-center shadow-sm transition-all duration-300 hover:shadow-md">
              <h2 className="text-xl font-semibold mb-6 text-slate dark:text-dark-textMain">Cek Gizi & Resep Makanan</h2>
              
              <label className="border-2 border-dashed border-accent/50 rounded-2xl p-8 mb-6 hover:bg-accent/5 dark:hover:bg-accent/10 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer min-h-[220px] group">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  onChange={handleImageUpload} 
                />
                <div className="p-4 bg-accent/10 dark:bg-accent/20 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Camera className="w-10 h-10 text-accent" />
                </div>
                <p className="text-textMain dark:text-dark-textMain font-medium text-lg">Ambil Foto atau Upload Gambar</p>
                <p className="text-textMuted dark:text-dark-textMuted text-sm mt-2">Dukung format JPG, PNG</p>
              </label>

              <div className="flex gap-3">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted dark:text-dark-textMuted group-focus-within:text-accent transition-colors" />
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleTextSubmit}
                    placeholder="Ketik nama makanan (Tekan Enter)..." 
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-border dark:border-dark-border dark:bg-dark-card dark:text-dark-textMain focus:ring-2 focus:ring-accent outline-none transition-all duration-300 shadow-sm" 
                  />
                </div>
                <button 
                  onClick={handleMicClick}
                  className={`px-5 py-4 rounded-xl transition-all duration-300 shadow-sm hover:scale-105 active:scale-95 ${
                    isListening ? 'bg-red-500 text-white animate-pulse shadow-red-500/30' : 'bg-accent text-white hover:bg-emerald-600 shadow-accent/30'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl p-6 shadow-sm transition-all duration-300">
              <h3 className="font-semibold mb-4 text-slate dark:text-dark-textMain">Preferensi Diet & Alergi</h3>
              <div className="flex flex-wrap gap-3">
                {['Tanpa Kacang', 'Low Karbo', 'Vegan', 'Halal'].map(tag => {
                  const isSelected = selectedPrefs.includes(tag);
                  return (
                    <span 
                      key={tag} 
                      onClick={() => togglePref(tag)}
                      className={`px-4 py-2 text-sm rounded-full border cursor-pointer transition-all duration-300 font-medium ${
                        isSelected 
                          ? 'bg-accent border-accent text-white shadow-md shadow-accent/30 scale-105' 
                          : 'bg-slate/5 dark:bg-dark-dominant text-slate dark:text-dark-textMain border-border dark:border-dark-border hover:border-accent dark:hover:border-accent hover:text-accent dark:hover:text-accent'
                      }`}
                    >
                      {tag} {isSelected && '✓'}
                    </span>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Processing State */}
        {activeTab === 'processing' && (
          <section className="flex flex-col items-center justify-center min-h-[50vh] animate-fade-in">
            <div className="relative w-64 h-64 bg-slate/5 dark:bg-dark-card rounded-2xl overflow-hidden border-2 border-accent mb-8 shadow-lg shadow-accent/20 transition-all">
              <img src={displayImage} alt="Scanning" className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-accent/20 animate-scan">
                <div className="h-1.5 bg-accent shadow-[0_0_12px_3px_#10B981]"></div>
              </div>
              <div className="absolute top-3 right-3 glass text-textMain dark:text-dark-textMain text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-medium">
                 <Activity className="w-3.5 h-3.5 text-accent animate-pulse" /> AI Bekerja
              </div>
            </div>
            <h2 className="text-2xl font-bold animate-pulse text-accent mb-2">Menganalisis Makanan...</h2>
            <p className="text-textMuted dark:text-dark-textMuted">Tunggu sebentar, Gemini AI sedang memproses.</p>
          </section>
        )}

        {/* Result Area */}
        {activeTab === 'result' && currentData && (
          <section className="space-y-6 animate-slide-up">
            <button 
              onClick={() => { setActiveTab('scan'); setInputText(''); setSelectedImage(null); setImageFile(null); }} 
              className="text-accent text-sm font-medium hover:underline mb-2 flex items-center gap-1.5 hover:-translate-x-1 transition-transform"
            >
              &larr; Kembali Scan Baru
            </button>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Visual Result */}
              <div className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl overflow-hidden relative shadow-sm group">
                 <img src={displayImage} alt="Food" className="w-full h-56 object-cover transition-transform duration-700 group-hover:scale-105" />
                 {/* Bounding box mock */}
                 <div className="absolute top-8 left-8 right-8 bottom-8 border-2 border-accent rounded-xl bg-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="glass text-accent font-bold px-3 py-1 rounded-lg shadow-md">{currentData.name}</span>
                 </div>
                 <div className="absolute bottom-3 right-3 glass px-3 py-1.5 rounded-lg text-sm font-medium text-slate dark:text-dark-textMain shadow-sm">
                   Gemini AI 2.5 Flash
                 </div>
              </div>

              {/* Nutrition Dashboard */}
              <div className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl p-6 md:p-8 shadow-sm">
                <h2 className="text-2xl font-bold mb-1 text-slate dark:text-dark-textMain">{currentData.name}</h2>
                <p className="text-textMuted dark:text-dark-textMuted text-sm mb-6 flex items-center gap-1">
                   <Activity className="w-4 h-4" /> Estimasi Porsi: 250g
                </p>

                <div className="grid grid-cols-4 gap-3 mb-8 text-center">
                  <div className="p-3 bg-slate/5 dark:bg-dark-dominant rounded-xl border border-border dark:border-dark-border hover:border-accent dark:hover:border-accent transition-colors">
                    <div className="text-xs text-textMuted dark:text-dark-textMuted mb-1">Kalori</div>
                    <div className="font-bold text-accent text-lg">{currentData.kalori}</div>
                    <div className="text-[10px] text-textMuted dark:text-dark-textMuted">kcal</div>
                  </div>
                  <div className="p-3 bg-slate/5 dark:bg-dark-dominant rounded-xl border border-border dark:border-dark-border hover:border-accent dark:hover:border-accent transition-colors">
                    <div className="text-xs text-textMuted dark:text-dark-textMuted mb-1">Protein</div>
                    <div className="font-bold text-slate dark:text-dark-textMain text-lg">{currentData.protein}</div>
                  </div>
                  <div className="p-3 bg-slate/5 dark:bg-dark-dominant rounded-xl border border-border dark:border-dark-border hover:border-accent dark:hover:border-accent transition-colors">
                    <div className="text-xs text-textMuted dark:text-dark-textMuted mb-1">Karbo</div>
                    <div className="font-bold text-slate dark:text-dark-textMain text-lg">{currentData.karbo}</div>
                  </div>
                  <div className="p-3 bg-slate/5 dark:bg-dark-dominant rounded-xl border border-warning/50 dark:border-warning/50 hover:border-warning transition-colors relative overflow-hidden group">
                    <div className="absolute inset-0 bg-warning/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                    <div className="relative">
                      <div className="text-xs text-textMuted dark:text-dark-textMuted mb-1">Lemak</div>
                      <div className="font-bold text-warning text-lg">{currentData.lemak}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-textMuted dark:text-dark-textMuted font-medium">Natrium (Garam)</span>
                    <span className="font-semibold text-accent flex items-center gap-1">
                      Rendah (120mg)
                    </span>
                  </div>
                  <div className="w-full bg-border dark:bg-dark-border rounded-full h-2.5 overflow-hidden">
                    <div className="bg-accent h-full rounded-full w-0 transition-all duration-1000 ease-out" style={{width: '20%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recipe & Ingredients */}
            <div className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl p-6 md:p-8 shadow-sm">
              <h3 className="font-bold text-xl mb-5 text-slate dark:text-dark-textMain border-b border-border dark:border-dark-border pb-3">Bahan Terdeteksi & Resep</h3>
              <ul className="space-y-3 mb-8">
                {currentData.bahan && currentData.bahan.map((bahan, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-textMain dark:text-dark-textMain p-2 hover:bg-slate/5 dark:hover:bg-dark-dominant rounded-lg transition-colors">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_5px_rgba(16,185,129,0.5)]"></div> 
                    <span className="font-medium">{bahan}</span>
                  </li>
                ))}
              </ul>
              
              <h4 className="font-bold mb-3 text-slate dark:text-dark-textMain">Langkah Memasak:</h4>
              <ol className="list-decimal pl-5 space-y-3 text-sm text-textMuted dark:text-dark-textMuted">
                {currentData.langkah && currentData.langkah.map((langkah, i) => (
                  <li key={i} className="pl-2">{langkah}</li>
                ))}
              </ol>
            </div>

            {/* Shopping & Location LBS (Mock) */}
            <div className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-2xl p-6 md:p-8 shadow-sm">
              <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-slate dark:text-dark-textMain">
                <ShoppingBag className="w-6 h-6 text-accent" /> Rekomendasi Belanja
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                 <button 
                   onClick={handleOfflineClick}
                   className="flex items-center justify-center gap-2 border-2 border-accent text-accent py-3 rounded-xl hover:bg-accent hover:text-white transition-all duration-300 font-semibold hover:shadow-lg hover:shadow-accent/20 active:scale-95"
                 >
                    <MapPin className="w-5 h-5" /> Cari Toko Terdekat
                 </button>
                 <button 
                   onClick={handleOnlineClick}
                   className="flex items-center justify-center gap-2 bg-slate dark:bg-white text-white dark:text-slate py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-gray-200 transition-all duration-300 font-semibold hover:shadow-lg hover:shadow-slate/20 active:scale-95"
                 >
                    Beli Online Instan
                 </button>
              </div>

              {/* Leaflet Map Mock */}
              <div className="h-64 rounded-xl overflow-hidden border border-border dark:border-dark-border z-0 shadow-inner">
                <MapContainer center={[-6.200000, 106.816666]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[-6.200000, 106.816666]}>
                    <Popup>
                      <div className="font-sans">
                        <strong className="text-slate">Supermarket Segar</strong><br /> 
                        Buka sampai 22:00
                      </div>
                    </Popup>
                  </Marker>
                </MapContainer>
              </div>
            </div>

          </section>
        )}
      </main>
    </div>
  );
};

export default App;
