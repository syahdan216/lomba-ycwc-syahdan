import React, { useState, useEffect } from 'react';
import { Camera, Search, Mic, Activity, MapPin, ShoppingBag, Moon, Sun, AlertCircle, Sparkles, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { GoogleGenAI } from '@google/genai';

// Fix leaflet default icon in React
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

const DIET_OPTIONS = ['Tanpa Kacang', 'Low Karbo', 'Vegan', 'Halal', 'Tinggi Protein', 'Bebas Gluten'];

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
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        try {
          resolve({
            inlineData: {
              data: reader.result.split(',')[1],
              mimeType: file.type || 'image/jpeg'
            }
          });
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const extractJsonFromText = (text) => {
    if (!text) throw new Error('Respon AI kosong');
    
    // Clean markdown code blocks
    let cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
    
    // Find first '{' and last '}'
    const startIdx = cleaned.indexOf('{');
    const endIdx = cleaned.lastIndexOf('}');
    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      cleaned = cleaned.substring(startIdx, endIdx + 1);
    }
    
    return JSON.parse(cleaned);
  };

  const fetchFoodImage = async (foodName) => {
    try {
      if (!foodName) return null;
      const cleanName = foodName.replace(/resep|cara membuat|menu|makanan/gi, '').trim();

      // 1. Cari di Wikipedia Bahasa Indonesia
      const wikiIdUrl = `https://id.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanName)}&gsrlimit=1&prop=pageimages&pithumbsize=800&format=json&origin=*`;
      const resId = await fetch(wikiIdUrl);
      const dataId = await resId.json();
      if (dataId.query && dataId.query.pages) {
        const pages = Object.values(dataId.query.pages);
        if (pages.length > 0 && pages[0].thumbnail && pages[0].thumbnail.source) {
          return pages[0].thumbnail.source;
        }
      }

      // 2. Cari di Wikipedia English
      const wikiEnUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanName)}&gsrlimit=1&prop=pageimages&pithumbsize=800&format=json&origin=*`;
      const resEn = await fetch(wikiEnUrl);
      const dataEn = await resEn.json();
      if (dataEn.query && dataEn.query.pages) {
        const pages = Object.values(dataEn.query.pages);
        if (pages.length > 0 && pages[0].thumbnail && pages[0].thumbnail.source) {
          return pages[0].thumbnail.source;
        }
      }

      // 3. Cari di Wikimedia Commons
      const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(cleanName + ' dish')}&gsrlimit=1&prop=pageimages&pithumbsize=800&format=json&origin=*`;
      const resCommons = await fetch(commonsUrl);
      const dataCommons = await resCommons.json();
      if (dataCommons.query && dataCommons.query.pages) {
        const pages = Object.values(dataCommons.query.pages);
        if (pages.length > 0 && pages[0].thumbnail && pages[0].thumbnail.source) {
          return pages[0].thumbnail.source;
        }
      }
    } catch (err) {
      console.warn('Gagal fetch gambar dari internet:', err);
    }

    // 4. Fallback ke gambar kuliner beresolusi tinggi
    return `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80`;
  };

  const processWithGemini = async (foodQuery, file) => {
    try {
      setErrorMsg('');
      setActiveTab('processing');

      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' && process.env?.VITE_GEMINI_API_KEY);
      if (!apiKey) {
        throw new Error('API Key belum terbaca di Vercel. Pastikan sudah set VITE_GEMINI_API_KEY dan lakukan Redeploy (Clear build cache).');
      }

      const client = new GoogleGenAI({ apiKey });
      
      const prefText = selectedPrefs.length > 0 
        ? `Preferensi/Kebutuhan diet: ${selectedPrefs.join(', ')}.` 
        : 'Tidak ada preferensi diet khusus.';

      const systemInstruction = `Kamu adalah pakar nutrisi dan kuliner NutriScan AI.
Tugasmu menganalisis makanan berdasarkan ${file ? 'gambar yang diunggah' : 'nama makanan: "' + foodQuery + '"'}.
${prefText}

Wajib kembalikan HANYA format JSON valid tanpa kata pengantar atau markdown tambahan.
Struktur JSON wajib:
{
  "name": "Nama Makanan Lengkap",
  "porsi": "250g (1 Porsi)",
  "kalori": 320,
  "protein": "15g",
  "karbo": "40g",
  "lemak": "11g",
  "natrium": "350mg",
  "natriumLevel": "Rendah / Sedang / Tinggi",
  "natriumPersen": 25,
  "bahan": ["Bahan 1 (takaran)", "Bahan 2 (takaran)", "Bahan 3 (takaran)"],
  "langkah": ["Langkah 1...", "Langkah 2...", "Langkah 3..."],
  "tipsDiet": "Catatan ringkas kecocokan gizi terhadap preferensi pengguna"
}`;

      let interaction;
      if (file) {
        const imagePart = await fileToGenerativePart(file);
        interaction = await client.interactions.create({
          model: 'gemini-3.5-flash-lite',
          input: [
            imagePart,
            { text: systemInstruction }
          ]
        });
      } else {
        interaction = await client.interactions.create({
          model: 'gemini-3.5-flash-lite',
          input: systemInstruction
        });
      }

      const rawOutput = interaction.output_text;
      const parsedData = extractJsonFromText(rawOutput);

      // Ambil gambar langsung dari internet jika user mencari via teks / mic
      if (!file) {
        const onlineImg = await fetchFoodImage(parsedData.name || foodQuery);
        setSelectedImage(onlineImg);
      }

      setCurrentData({
        name: parsedData.name || foodQuery || 'Makanan Teranalisis',
        porsi: parsedData.porsi || '1 Porsi (250g)',
        kalori: parsedData.kalori || 0,
        protein: parsedData.protein || '0g',
        karbo: parsedData.karbo || '0g',
        lemak: parsedData.lemak || '0g',
        natrium: parsedData.natrium || '0mg',
        natriumLevel: parsedData.natriumLevel || 'Normal',
        natriumPersen: parsedData.natriumPersen || 20,
        bahan: Array.isArray(parsedData.bahan) ? parsedData.bahan : ['Bahan alami'],
        langkah: Array.isArray(parsedData.langkah) ? parsedData.langkah : ['Siapkan bahan dan masak hingga matang.'],
        tipsDiet: parsedData.tipsDiet || 'Porsi seimbang untuk kebutuhan energi harian.'
      });

      setActiveTab('result');
    } catch (error) {
      console.error('Error saat proses AI:', error);
      setErrorMsg(`Gagal memproses data: ${error.message || 'Terjadi kesalahan pada AI'}`);
      setActiveTab('scan');
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      setImageFile(file);
      processWithGemini('', file);
    }
  };

  const handleTextSubmit = (e) => {
    if (e.key === 'Enter' && inputText.trim()) {
      setSelectedImage(null);
      setImageFile(null);
      processWithGemini(inputText.trim(), null);
    }
  };

  const handleSearchBtn = () => {
    if (inputText.trim()) {
      setSelectedImage(null);
      setImageFile(null);
      processWithGemini(inputText.trim(), null);
    }
  };

  const handleMicClick = async () => {
    try {
      setIsListening(true);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setTimeout(() => {
        setIsListening(false);
        const mockedVoiceText = 'Nasi Goreng Spesial';
        setInputText(mockedVoiceText);
        setSelectedImage(null);
        setImageFile(null);
        processWithGemini(mockedVoiceText, null);
      }, 2000);
    } catch (err) {
      alert('Izin mikrofon tidak tersedia atau ditolak.');
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
    const query = encodeURIComponent(`Supermarket Pasar bahan ${currentData?.name || 'makanan'} terdekat`);
    window.open(`https://www.google.com/maps/search/${query}`, '_blank');
  };

  const handleOnlineClick = () => {
    const query = encodeURIComponent(`Bahan masakan ${currentData?.name || 'sehat'}`);
    window.open(`https://www.tokopedia.com/search?q=${query}`, '_blank');
  };

  const displayImage = selectedImage || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80";

  return (
    <div className="min-h-screen pb-16 transition-colors duration-300">
      {/* Navbar */}
      <header className="glass sticky top-0 z-50 animate-slide-up">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center shadow-md shadow-accent/30 text-white">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate dark:text-dark-textMain leading-tight">NutriScan AI</h1>
              <p className="text-[11px] text-textMuted dark:text-dark-textMuted">Asisten Gizi & Rekomendasi Makanan</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDark(!isDark)} 
              className="p-2.5 rounded-xl border border-border dark:border-dark-border bg-card dark:bg-dark-card hover:bg-slate/10 dark:hover:bg-white/10 transition-colors text-slate dark:text-dark-textMain shadow-sm"
              title="Ganti Tema"
            >
              {isDark ? <Sun className="w-5 h-5 text-warning" /> : <Moon className="w-5 h-5" />}
            </button>
            <Activity className="text-accent animate-pulse-slow w-6 h-6 hidden sm:block" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-8">
        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 p-4 rounded-2xl mb-6 flex items-center gap-3 animate-fade-in shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMsg}</p>
          </div>
        )}

        {/* INPUT STATE (Tab Scan / Form Awal) */}
        {activeTab === 'scan' && (
          <section className="space-y-6 animate-fade-in">
            {/* Input Box Card */}
            <div className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-3xl p-6 md:p-8 text-center shadow-sm transition-all duration-300">
              <h2 className="text-xl md:text-2xl font-bold mb-2 text-slate dark:text-dark-textMain">Cek Gizi & Resep Makanan</h2>
              <p className="text-textMuted dark:text-dark-textMuted text-sm mb-6">Unggah foto makanan atau ketik nama hidangan untuk analisis otomatis oleh Gemini 3.5</p>
              
              {/* Upload Dropzone */}
              <label className="border-2 border-dashed border-accent/40 rounded-2xl p-8 mb-6 hover:bg-accent/5 dark:hover:bg-accent/10 transition-all duration-300 flex flex-col items-center justify-center cursor-pointer min-h-[200px] group relative overflow-hidden">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden" 
                  onChange={handleImageUpload} 
                />
                <div className="p-4 bg-accent/10 dark:bg-accent/20 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  <Camera className="w-9 h-9 text-accent" />
                </div>
                <p className="text-textMain dark:text-dark-textMain font-semibold text-base">Ambil Foto atau Upload Gambar Makanan</p>
                <p className="text-textMuted dark:text-dark-textMuted text-xs mt-1">Mendukung format JPG, PNG, WEBP</p>
              </label>

              {/* Text Input & Mic */}
              <div className="flex gap-2.5">
                <div className="relative flex-1 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted dark:text-dark-textMuted group-focus-within:text-accent transition-colors" />
                  <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleTextSubmit}
                    placeholder="Atau ketik nama makanan (misal: Sate Ayam, Gado-Gado)..." 
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-border dark:border-dark-border bg-dominant/50 dark:bg-dark-dominant/50 dark:text-dark-textMain focus:ring-2 focus:ring-accent focus:bg-card dark:focus:bg-dark-card outline-none transition-all duration-300 text-sm shadow-inner" 
                  />
                </div>
                <button 
                  onClick={handleSearchBtn}
                  className="px-5 py-3.5 bg-accent hover:bg-emerald-600 text-white rounded-2xl font-semibold text-sm transition-all shadow-md shadow-accent/20 hover:scale-105 active:scale-95"
                >
                  Analisis
                </button>
                <button 
                  onClick={handleMicClick}
                  title="Suara"
                  className={`p-3.5 rounded-2xl transition-all shadow-sm hover:scale-105 active:scale-95 ${
                    isListening ? 'bg-red-500 text-white animate-pulse shadow-red-500/30' : 'bg-dominant dark:bg-dark-dominant border border-border dark:border-dark-border text-slate dark:text-dark-textMain hover:border-accent hover:text-accent'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Preferensi Diet Card */}
            <div className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-3xl p-6 shadow-sm transition-all duration-300">
              <h3 className="font-bold text-base mb-1 text-slate dark:text-dark-textMain">Preferensi Diet & Kebutuhan Khusus</h3>
              <p className="text-textMuted dark:text-dark-textMuted text-xs mb-4">Pilih filter untuk menyesuaikan kalkulasi saran nutrisi dan resep pengganti</p>
              
              <div className="flex flex-wrap gap-2.5">
                {DIET_OPTIONS.map(tag => {
                  const isSelected = selectedPrefs.includes(tag);
                  return (
                    <button 
                      key={tag} 
                      type="button"
                      onClick={() => togglePref(tag)}
                      className={`px-4 py-2 text-xs md:text-sm rounded-full border cursor-pointer transition-all duration-200 font-medium flex items-center gap-1.5 ${
                        isSelected 
                          ? 'bg-accent border-accent text-white shadow-md shadow-accent/30 scale-105' 
                          : 'bg-dominant/50 dark:bg-dark-dominant text-slate dark:text-dark-textMain border-border dark:border-dark-border hover:border-accent hover:text-accent'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* PROCESSING STATE */}
        {activeTab === 'processing' && (
          <section className="flex flex-col items-center justify-center min-h-[55vh] animate-fade-in text-center">
            <div className="relative w-64 h-64 bg-slate/5 dark:bg-dark-card rounded-3xl overflow-hidden border-2 border-accent mb-6 shadow-xl shadow-accent/20">
              <img src={displayImage} alt="Scanning" className="w-full h-full object-cover opacity-85" />
              <div className="absolute inset-0 bg-accent/20 animate-scan">
                <div className="h-2 bg-accent shadow-[0_0_15px_4px_#10B981]"></div>
              </div>
              <div className="absolute top-3 right-3 glass text-textMain dark:text-dark-textMain text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 font-semibold">
                 <Activity className="w-3.5 h-3.5 text-accent animate-pulse" /> AI Memproses
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate dark:text-dark-textMain mb-2">Menganalisis Makanan...</h2>
            <p className="text-textMuted dark:text-dark-textMuted text-sm max-w-sm">Gemini 3.5 sedang mengkalkulasi kandungan gizi, makronutrien, bahan, dan panduan resep.</p>
          </section>
        )}

        {/* RESULT DASHBOARD STATE (Layout Awal Lengkap) */}
        {activeTab === 'result' && currentData && (
          <section className="space-y-6 animate-slide-up">
            <button 
              onClick={() => { setActiveTab('scan'); setInputText(''); setSelectedImage(null); setImageFile(null); }} 
              className="inline-flex items-center gap-2 text-sm font-semibold text-accent hover:text-emerald-600 transition-colors py-1 px-3 rounded-xl bg-accent/10 hover:bg-accent/20"
            >
              <ArrowLeft className="w-4 h-4" /> Scan Makanan Lain
            </button>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Visual Card */}
              <div className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-3xl overflow-hidden relative shadow-sm flex flex-col">
                 <div className="relative h-60 w-full overflow-hidden">
                   <img src={displayImage} alt={currentData.name} className="w-full h-full object-cover" />
                   <div className="absolute bottom-3 right-3 glass px-3 py-1 rounded-xl text-xs font-semibold text-slate dark:text-dark-textMain shadow-sm">
                     Gemini 3.5 Flash Lite
                   </div>
                 </div>
                 
                 <div className="p-6 flex-1 flex flex-col justify-between">
                   <div>
                     <span className="text-xs uppercase tracking-wider text-accent font-bold">Hasil Analisis</span>
                     <h2 className="text-2xl font-bold text-slate dark:text-dark-textMain mt-1">{currentData.name}</h2>
                     <p className="text-xs text-textMuted dark:text-dark-textMuted mt-1">Estimasi: {currentData.porsi}</p>
                   </div>

                   {currentData.tipsDiet && (
                     <div className="mt-4 p-3.5 bg-dominant dark:bg-dark-dominant rounded-2xl border border-border dark:border-dark-border text-xs text-textMain dark:text-dark-textMain leading-relaxed">
                       <span className="font-bold text-accent">💡 Tips Diet: </span>
                       {currentData.tipsDiet}
                     </div>
                   )}
                 </div>
              </div>

              {/* Nutrition Dashboard */}
              <div className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-3xl p-6 md:p-8 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate dark:text-dark-textMain mb-4">Kandungan Makronutrisi</h3>
                  
                  <div className="grid grid-cols-4 gap-2.5 mb-6 text-center">
                    <div className="p-3.5 bg-dominant dark:bg-dark-dominant rounded-2xl border border-border dark:border-dark-border">
                      <div className="text-[11px] text-textMuted dark:text-dark-textMuted mb-1 font-medium">Kalori</div>
                      <div className="font-extrabold text-accent text-lg">{currentData.kalori}</div>
                      <div className="text-[10px] text-textMuted dark:text-dark-textMuted">kcal</div>
                    </div>
                    <div className="p-3.5 bg-dominant dark:bg-dark-dominant rounded-2xl border border-border dark:border-dark-border">
                      <div className="text-[11px] text-textMuted dark:text-dark-textMuted mb-1 font-medium">Protein</div>
                      <div className="font-extrabold text-slate dark:text-dark-textMain text-lg">{currentData.protein}</div>
                    </div>
                    <div className="p-3.5 bg-dominant dark:bg-dark-dominant rounded-2xl border border-border dark:border-dark-border">
                      <div className="text-[11px] text-textMuted dark:text-dark-textMuted mb-1 font-medium">Karbo</div>
                      <div className="font-extrabold text-slate dark:text-dark-textMain text-lg">{currentData.karbo}</div>
                    </div>
                    <div className="p-3.5 bg-dominant dark:bg-dark-dominant rounded-2xl border border-warning/40">
                      <div className="text-[11px] text-textMuted dark:text-dark-textMuted mb-1 font-medium">Lemak</div>
                      <div className="font-extrabold text-warning text-lg">{currentData.lemak}</div>
                    </div>
                  </div>

                  {/* Natrium Bar */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-textMuted dark:text-dark-textMuted">Kadar Garam (Natrium)</span>
                      <span className="text-accent">{currentData.natriumLevel} ({currentData.natrium})</span>
                    </div>
                    <div className="w-full bg-border dark:bg-dark-border rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="bg-accent h-full rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${Math.min(Math.max(currentData.natriumPersen, 10), 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border dark:border-dark-border text-[11px] text-textMuted dark:text-dark-textMuted flex items-center justify-between">
                  <span>Target harian standar: 2000 kcal</span>
                  <span className="text-accent font-semibold">{Math.round((currentData.kalori / 2000) * 100)}% AKG</span>
                </div>
              </div>
            </div>

            {/* Recipe & Ingredients */}
            <div className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="font-bold text-xl mb-4 text-slate dark:text-dark-textMain border-b border-border dark:border-dark-border pb-3">
                Bahan Utama & Takaran
              </h3>
              <ul className="grid sm:grid-cols-2 gap-3 mb-8">
                {currentData.bahan && currentData.bahan.map((bahan, i) => (
                  <li key={i} className="flex items-center gap-3 text-sm text-textMain dark:text-dark-textMain p-3 bg-dominant/50 dark:bg-dark-dominant/50 rounded-2xl border border-border/60 dark:border-dark-border/60">
                    <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_6px_rgba(16,185,129,0.5)] flex-shrink-0"></div> 
                    <span className="font-medium">{bahan}</span>
                  </li>
                ))}
              </ul>
              
              <h3 className="font-bold text-xl mb-4 text-slate dark:text-dark-textMain border-b border-border dark:border-dark-border pb-3">
                Panduan Memasak
              </h3>
              <ol className="space-y-3 text-sm text-textMain dark:text-dark-textMain">
                {currentData.langkah && currentData.langkah.map((langkah, i) => (
                  <li key={i} className="flex gap-3 items-start p-3 bg-dominant/40 dark:bg-dark-dominant/40 rounded-2xl">
                    <span className="w-6 h-6 rounded-xl bg-accent/15 text-accent font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="leading-relaxed">{langkah}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Shopping & Location */}
            <div className="bg-card dark:bg-dark-card border border-border dark:border-dark-border rounded-3xl p-6 md:p-8 shadow-sm">
              <h3 className="font-bold text-xl mb-2 flex items-center gap-2 text-slate dark:text-dark-textMain">
                <ShoppingBag className="w-6 h-6 text-accent" /> Rekomendasi Tempat Belanja Bahan
              </h3>
              <p className="text-textMuted dark:text-dark-textMuted text-xs mb-6">Beli bahan segar secara online atau cari supermarket/pasar terdekat</p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                 <button 
                   onClick={handleOfflineClick}
                   className="flex items-center justify-center gap-2 border-2 border-accent text-accent py-3.5 px-4 rounded-2xl hover:bg-accent hover:text-white transition-all duration-300 font-semibold text-sm shadow-sm hover:shadow-lg hover:shadow-accent/20 active:scale-95"
                 >
                    <MapPin className="w-5 h-5" /> Cari Supermarket / Pasar Terdekat
                 </button>
                 <button 
                   onClick={handleOnlineClick}
                   className="flex items-center justify-center gap-2 bg-slate dark:bg-white text-white dark:text-slate py-3.5 px-4 rounded-2xl hover:bg-slate-800 dark:hover:bg-gray-200 transition-all duration-300 font-semibold text-sm shadow-sm hover:shadow-lg active:scale-95"
                 >
                    <ShoppingBag className="w-5 h-5" /> Beli Bahan Online di Tokopedia
                 </button>
              </div>

              {/* Leaflet Map */}
              <div className="h-64 rounded-2xl overflow-hidden border border-border dark:border-dark-border z-0 shadow-inner">
                <MapContainer center={[-6.200000, 106.816666]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[-6.200000, 106.816666]}>
                    <Popup>
                      <div className="font-sans text-xs">
                        <strong className="text-slate">Supermarket / Pasar Segar</strong><br /> 
                        Bahan masakan segar tersedia
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
