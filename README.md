Macera Zamanı

Doğa keşif platformu uydu haritası üzerinde kamp, gezi ve piknik alanlarını işaretle, rotalarını çiz, paylaşabilirsin

Özellikler

- 🛰️ Uydu görünümlü dünya haritası (Esri World Imagery)
- 📍 Yer ekleme: isim, açıklama ve kategori (⛺ Kamp / 🌄 Gezi / 🍖 Piknik / 📍 Diğer)
- 🛤️ Rota çizme: haritaya tıklayarak rota oluşturma, kategori seçimi (🥾 Yürüyüş / 🚙 Off-road / 🚴 Bisiklet)
- 📏 Rota uzunluğu otomatik km cinsinden hesaplanır
- 🎯 Kullanıcının kendi konumunu gösterme ve koordinat verme
- 📋 Sağ panelde kayıtlı yerler/rotaların listesi ve arama
- 🔒 Ekleme/silme işlemleri şifre korumalı, görüntüleme herkese açık

Kullanılan Teknolojiler

-Backend: Python, Flask
-Veritabanı: SQLite
-Harita: Leaflet.js + Esri Uydu Görüntüleri
-Frontend: HTML, CSS, JavaScript (framework yok)

Kurulum

```bash
git clone https://github.com/azizenesozturk/macera-zamani.git
cd macera-zamani

python -m venv venv
source venv/Scripts/activate      # Windows (Git Bash)
# venv\Scripts\activate            # Windows (PowerShell/cmd)
# source venv/bin/activate         # Mac/Linux

pip install -r requirements.txt

python database.py                # Veritabanını oluştur
python app.py                     # Sunucuyu başlat
```

Sonra tarayıcıda `http://127.0.0.1:5000` adresini aç.

Notlar

- Ekleme/silme işlemleri için şifre gerekir, bu şifre `app.py` içinde `EDIT_PASSWORD` değişkeninde tanımlıdır — kendi kurulumunda değiştirmen önerilir.
- `static/logo.png` dosyasını kendi logonla değiştirebilirsin.

Yazar

Aziz Enes Öztürk ([@azizenesozturk](https://github.com/azizenesozturk))