import React, { useState } from 'react';
import { Camera, Search, Mic, Upload, Activity, MapPin, ShoppingBag } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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

  return (
    <div className="min-h-screen pb-16">
      {/* Navbar */}
      <header className="bg-card shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-slate">NutriScan AI</h1>
          <Activity className="text-accent" />
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 mt-6">
        {/* Input Area */}
        {activeTab === 'scan' && (
          <section className="space-y-6">
            <div className="bg-card border border-border rounded-xl p-6 text-center">
              <h2 className="text-lg font-semibold mb-4">Cek Gizi & Resep Makanan</h2>
              
              <div className="border-2 border-dashed border-accent/50 rounded-xl p-8 mb-4 hover:bg-accent/5 transition flex flex-col items-center justify-center cursor-pointer min-h-[200px]" onClick={() => setActiveTab('processing')}>
                <Camera className="w-12 h-12 text-accent mb-3" />
                <p className="text-textMain font-medium">Ambil Foto atau Upload Gambar</p>
                <p className="text-textMuted text-sm mt-1">Dukung format JPG, PNG</p>
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-textMuted" />
                  <input type="text" placeholder="Ketik nama makanan..." className="w-full pl-10 pr-4 py-3 rounded-lg border border-border focus:ring-2 focus:ring-accent outline-none" />
                </div>
                <button className="bg-accent text-white p-3 rounded-lg hover:bg-emerald-600 transition">
                  <Mic className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold mb-3">Preferensi Diet & Alergi</h3>
              <div className="flex flex-wrap gap-2">
                {['Tanpa Kacang', 'Low Karbo', 'Vegan', 'Halal'].map(tag => (
                  <span key={tag} className="px-3 py-1 bg-slate/5 text-slate text-sm rounded-full border border-border cursor-pointer hover:border-accent">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Processing State */}
        {activeTab === 'processing' && (
          <section className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="relative w-64 h-64 bg-slate/5 rounded-xl overflow-hidden border-2 border-accent mb-6">
              <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" alt="Scanning" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-accent/20 animate-scan">
                <div className="h-1 bg-accent shadow-[0_0_8px_2px_#10B981]"></div>
              </div>
              <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                 <Activity className="w-3 h-3" /> 95% Akurat
              </div>
            </div>
            <h2 className="text-xl font-semibold animate-pulse text-accent">Menganalisis Makanan...</h2>
            <p className="text-textMuted mt-2">Mencocokkan dengan database USDA & TKPI</p>
            
            <button onClick={() => setActiveTab('result')} className="mt-8 px-6 py-2 bg-border text-textMain rounded-lg hover:bg-gray-300">
              Skip Animasi (Mock)
            </button>
          </section>
        )}

        {/* Result Area */}
        {activeTab === 'result' && (
          <section className="space-y-6">
            <button onClick={() => setActiveTab('scan')} className="text-accent text-sm font-medium hover:underline mb-2 flex items-center gap-1">
              &larr; Kembali Scan
            </button>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Visual Result */}
              <div className="bg-card border border-border rounded-xl overflow-hidden relative">
                 <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80" alt="Food" className="w-full h-48 object-cover" />
                 {/* Bounding box mock */}
                 <div className="absolute top-8 left-8 right-8 bottom-8 border-2 border-accent rounded-lg bg-accent/10"></div>
              </div>

              {/* Nutrition Dashboard */}
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="text-xl font-semibold mb-1">Salad Mangkuk Sehat</h2>
                <p className="text-textMuted text-sm mb-6">Estimasi Porsi: 250g</p>

                <div className="grid grid-cols-4 gap-2 mb-6 text-center">
                  <div className="p-2 bg-slate/5 rounded-lg border border-border">
                    <div className="text-xs text-textMuted mb-1">Kalori</div>
                    <div className="font-bold text-accent">320</div>
                    <div className="text-[10px] text-textMuted">kcal</div>
                  </div>
                  <div className="p-2 bg-slate/5 rounded-lg border border-border">
                    <div className="text-xs text-textMuted mb-1">Protein</div>
                    <div className="font-bold text-slate">15g</div>
                  </div>
                  <div className="p-2 bg-slate/5 rounded-lg border border-border">
                    <div className="text-xs text-textMuted mb-1">Karbo</div>
                    <div className="font-bold text-slate">45g</div>
                  </div>
                  <div className="p-2 bg-slate/5 rounded-lg border border-warning">
                    <div className="text-xs text-textMuted mb-1">Lemak</div>
                    <div className="font-bold text-warning">12g</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-textMuted">Natrium (Garam)</span>
                    <span className="font-medium text-accent">Rendah (120mg)</span>
                  </div>
                  <div className="w-full bg-border rounded-full h-1.5"><div className="bg-accent h-1.5 rounded-full" style={{width: '20%'}}></div></div>
                </div>
              </div>
            </div>

            {/* Recipe & Ingredients */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4">Bahan Terdeteksi & Resep</h3>
              <ul className="space-y-2 mb-6">
                {['Selada (100g)', 'Tomat Ceri (50g)', 'Telur Rebus (1 butir)', 'Alpukat (50g)'].map((bahan, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-accent"></div> {bahan}
                  </li>
                ))}
              </ul>
              
              <h4 className="font-medium mb-2 text-sm">Langkah Memasak:</h4>
              <ol className="list-decimal pl-5 space-y-1 text-sm text-textMuted">
                <li>Cuci bersih selada dan tomat ceri.</li>
                <li>Rebus telur hingga matang, kupas dan potong.</li>
                <li>Potong dadu alpukat.</li>
                <li>Campurkan semua bahan dalam mangkuk, tambahkan dressing sesuai selera.</li>
              </ol>
            </div>

            {/* Shopping & Location LBS (Mock) */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-accent" /> Rekomendasi Belanja
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                 <button className="flex items-center justify-center gap-2 border border-accent text-accent py-2 rounded-lg hover:bg-accent hover:text-white transition">
                    <MapPin className="w-4 h-4" /> Cari Toko Terdekat
                 </button>
                 <button className="flex items-center justify-center gap-2 bg-slate text-white py-2 rounded-lg hover:bg-slate-800 transition">
                    Beli Online Instan
                 </button>
              </div>

              {/* Leaflet Map Mock */}
              <div className="h-48 rounded-xl overflow-hidden border border-border z-0">
                <MapContainer center={[-6.200000, 106.816666]} zoom={13} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[-6.200000, 106.816666]}>
                    <Popup>
                      Supermarket Segar <br /> Buka sampai 22:00
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
