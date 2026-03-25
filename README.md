📥 Installation Guide
Buka terminal dan jalankan perintah berikut secara berurutan:

Bash
git clone https://github.com/elmeerasay/here.git
Bash
cd here
Bash
npm install axios chalk dotenv crypto readline
⚙️ Configuration Setup
Dapatkan API Key di https://here.now/#sites. PENTING: Jangan lupa untuk Add Wallet (0x...) di dashboard Here.now agar pembayaran dari pembeli masuk ke dompet kamu.

Bash
nano .env
Isi dengan API Key kamu:

Bash
HERENOW_API_KEY=ISI_API_KEY_DISINI
Simpan dengan menekan:

Bash
CTRL + X + Y + ENTER
🚀 How to Run
Jalankan bot produksi website kamu:

Bash
node random_web.js
📂 Main Features
Memory-Only Mode: Tidak menyisakan file sampah index.html di folder proyek.

Anti-Black Screen: Bot otomatis mencari gambar lain jika gambar yang didownload gelap/rusak.

Clean Pricing: Harga otomatis dibulatkan (Contoh: 50, 100, 500, 1000) agar terlihat profesional.

English Paywall: Tampilan kunci premium dengan pesan "This website is locked".

Bulk Management: Bisa ubah harga banyak web sekaligus atau hapus beberapa web dalam satu perintah.

⚡ Credits
Built with passion by FULLOCHZ
