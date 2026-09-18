# AI Pendeteksi Resep Makanan & Gizi

Platform berbasis AI untuk mempermudah transisi gaya hidup sehat dalam kegiatan sehari-hari.

## Cara Kerja

1. **Input Multi-Modal**: 
   Pengguna memberikan input berupa foto makanan, teks, atau suara. Mendukung preferensi porsi, alergi, atau diet.
2. **Pemrosesan AI**: 
   Computer Vision mendeteksi makanan dari foto. NLP menganalisis bahan dan metode masak, mencocokkan dengan database gizi (USDA/TKPI).
3. **Pencarian Lokasi (Offline/Online)**: 
   Mencari pasar terdekat via mock data LBS atau tautan *e-commerce*.
4. **Visualisasi Output**: 
   Bagan nutrisi interaktif, resep langkah demi langkah, dan peta toko.

## Fitur Utama
- **Deteksi AI Multi-modal**: Kamera, teks, dan *voice input*.
- **Personalisasi Diet**: Peringatan alergi dan batas kesehatan.
- **Rincian Nutrisi**: Label warna batas aman makro/mikronutrisi.
- **Integrasi Peta & E-Commerce**: Rekomendasi offline (Leaflet.js) dan link otomatis.
- **Resep Adaptif**: Panduan masak berdasarkan deteksi bahan.

## Cara Menjalankan (Development)
```bash
npm install
npm run dev
```
