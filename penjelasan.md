# Penjelasan Ide dan Fitur Project: AI Pendeteksi Resep Makanan & Gizi

## Ide Utama
Project ini adalah platform berbasis AI yang dirancang untuk membantu pengguna memahami makanan yang mereka konsumsi, meliputi resep, kandungan gizi, hingga rekomendasi belanja (online maupun offline). Fokus utamanya adalah mempermudah transisi gaya hidup sehat dalam kegiatan sehari-hari dengan antarmuka yang sangat modern dan user-friendly.

## Cara Kerja
1. **Input Multi-Modal**: Pengguna memberikan input ke sistem, bisa berupa foto makanan, deskripsi teks, maupun perintah suara. Pengguna juga dapat memasukkan preferensi porsi, alergi, atau diet khusus.
2. **Pemrosesan AI**: Model *Computer Vision* mendeteksi jenis makanan dari foto. Model *NLP* menganalisis bahan, memperhitungkan metode masak, dan mencocokkannya dengan database gizi (USDA/TKPI) untuk mendapatkan informasi nutrisi presisi. AI juga merekomendasikan resep adaptif dan substitusi bahan yang lebih sehat.
3. **Pencarian Lokasi (Offline/Online)**: Sistem menggunakan *mock data* lokasi untuk mencari pasar atau supermarket terdekat (LBS/Proximity Search) atau menyediakan tautan langsung (Deep Linking) untuk pembelian bahan di *e-commerce*.
4. **Visualisasi Output**: Hasil analisis ditampilkan ke pengguna melalui bagan nutrisi interaktif (donut chart/progress bar), panduan resep langkah demi langkah, dan peta lokasi tempat belanja.

## Fitur-Fitur Utama
- **Deteksi AI Multi-modal**: Dukungan kamera untuk segmentasi objek, integrasi teks, dan *voice input*.
- **Personalisasi Porsi dan Diet**: Penyesuaian gramasi, peringatan dini terhadap pemicu alergi atau bahan yang melebihi batas kesehatan pengguna.
- **Rincian Nutrisi Interaktif**: Visualisasi *makronutrisi* dan *mikronutrisi* dengan label warna (hijau, kuning, merah) indikator batas aman.
- **Integrasi Peta & E-Commerce**: Rekomendasi lokasi toko pangan offline terdekat menggunakan *Leaflet.js* dan *mock data*, serta link otomatis *e-commerce*.
- **Resep Adaptif**: Panduan langkah demi langkah berdasarkan ketersediaan dan analisis bahan yang paling pas.
