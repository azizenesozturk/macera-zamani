
# Macera Zamanı

Doğa keşif platformu — uydu haritası üzerinde kamp, gezi ve piknik alanlarını işaretle, rotalarını çiz, paylaşabilirsin.

🔗 **Canlı demo:** [ozturkazizenes.pythonanywhere.com](https://ozturkazizenes.pythonanywhere.com)

## Özellikler

- 🛰️ Uydu görünümlü dünya haritası (Esri World Imagery)
- 📍 Yer ekleme: isim, açıklama ve kategori (⛺ Kamp / 🌄 Gezi / 🍖 Piknik / 📍 Diğer)
- 🛤️ Rota çizme: haritaya tıklayarak rota oluşturma, kategori seçimi (🥾 Yürüyüş / 🚙 Off-road / 🚴 Bisiklet)
- 📏 Rota uzunluğu otomatik km cinsinden hesaplanır
- 🎯 Kullanıcının kendi konumunu gösterme ve koordinat verme
- 📋 Sağ panelde kayıtlı yerler/rotaların listesi ve arama
- 🔒 Ekleme/silme işlemleri şifre korumalı, görüntüleme herkese açık

## Kullanılan Teknolojiler

- Backend: Python, Flask
- Veritabanı: SQLite
- Harita: Leaflet.js + Esri Uydu Görüntüleri
- Frontend: HTML, CSS, JavaScript (framework yok)

## Kurulum

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

## Notlar

- Ekleme/silme işlemleri için şifre gerekir, bu şifre `app.py` içinde `EDIT_PASSWORD` değişkeninde tanımlıdır — kendi kurulumunda değiştirmen önerilir.
- `static/logo.png` dosyasını kendi logonla değiştirebilirsin.

## Bu Projede Öğrendiklerim

Bu projeyi Flask + SQLite + Leaflet.js kullanarak sıfırdan kurdum. Yapay zeka desteğiyle çalıştım ama her satırı anlayarak ilerledim — süreçte şunları öğrendim:

- **Flask ile REST API tasarımı:** GET/POST/DELETE endpoint'leri, JSON request/response yönetimi, ve session tabanlı basit bir yetkilendirme sistemi kurdum. Görüntüleme herkese açık kalsın ama ekleme/silme sadece şifreyle yapılabilsin diye bir `@edit_required` decorator yazdım.

- **SQLite ile veritabanı tasarımı:** Tabloları sıfırdan tasarladım, ileride yeni bir sütun (kategori) eklemem gerektiğinde şemayı nasıl güncelleyeceğimi öğrendim.

- **Leaflet.js ile harita entegrasyonu:** Uydu görüntüsü katmanı, tıklama olayları, marker/polyline çizimi, ve Haversine formülüyle iki koordinat arası mesafe hesaplama.

- **Debugging deneyimi:** Rota çizerken çizgi hiç görünmüyordu — meğerse renk kodunda yanlışlıkla `##f97316` (çift `#`) yazmışım, geçersiz bir CSS rengi tarayıcı tarafından sessizce yok sayılıyormuş. Tarayıcı konsolunu (`F12`) kullanarak hataları ayıklamayı öğrendim.

- **UX üzerine düşünme:** İlk tasarımda tek bir buton hem "rota çizmeyi başlat" hem "rotayı bitir" işini yapıyordu, kullanırken kafa karıştırdığını fark edip ayrı bir "Rotayı Bitir" butonu ekleyerek çözdüm — çalışan kod ile *anlaşılır* kod arasındaki farkı deneyimledim.

- **Git ve versiyon kontrolü:** `.gitignore` ile hangi dosyaların (sanal ortam, veritabanı, önbellek dosyaları) versiyon kontrolüne dahil edilmemesi gerektiğini, ve yanlışlıkla eklenmişlerse `git rm --cached` ile nasıl çıkarılacağını öğrendim.

## Yazar

Aziz Enes Öztürk ([@azizenesozturk](https://github.com/azizenesozturk))