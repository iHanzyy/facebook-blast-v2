# Guide Mencari dan Memverifikasi Grup Facebook

Gunakan guide ini setiap kali diminta mencari atau bergabung ke grup baru. Jangan mencari atau bergabung bila tugas pengguna hanya membersihkan data.

## Aturan wajib

1. Baca `data/groups.json` dan daftar blokir di bawah sebelum pencarian.
2. Identitas grup adalah ID Facebook kanonis dari URL `/groups/<id>`, bukan nama. Tolak ID yang sudah ada di `data/groups.json` atau daftar blokir.
3. `data/group-candidates.json` hanya staging untuk proses yang sedang berjalan. Jangan simpan grup `joined`, `requested`, `failed`, `filtered`, `manual_action_required`, atau kandidat lama di file ini.
4. Setelah membuka kandidat dengan profil browser yang dipakai aplikasi, pastikan akun sudah menjadi anggota dan URL tetap mengarah ke ID yang sama. Tolak login, checkpoint, approval tertunda, pertanyaan keanggotaan, redirect, atau halaman yang tidak dapat diverifikasi.
5. Buka composer grup. Kandidat lulus hanya jika dialog composer benar-benar terbuka, editor terlihat dan bisa difokuskan, serta kontrol **Foto/video** tersedia. Teks tombol atau placeholder tanpa dialog/editor yang aktif tidak cukup.
6. Jangan mengirim posting percobaan. Tutup composer setelah pemeriksaan.
7. Bila satu pemeriksaan gagal, jangan tambahkan grup ke `data/groups.json`. Keluar dari grup bila sudah terlanjur bergabung, lalu hapus kandidatnya.
8. Tambahkan grup ke `data/groups.json` hanya setelah seluruh pemeriksaan pada langkah 2–5 lulus dalam sesi yang sama.
9. Setelah kandidat dipromosikan atau ditolak, hapus kandidat tersebut. Saat proses selesai atau dihentikan, `data/group-candidates.json` harus kembali memiliki `"groups": []`.
10. Jangan melewati CAPTCHA, verifikasi keamanan, pembatasan Facebook, atau rate limit. Hentikan proses dan laporkan tindakan manual yang diperlukan.

## Gate kelulusan

Sebuah grup boleh menjadi grup aktif hanya jika semua kondisi ini benar:

- ID Facebook kanonis berhasil dibaca dan tidak duplikat.
- ID dan nama tidak ada di daftar blokir.
- Status keanggotaan aktif, bukan pending.
- Halaman grup selesai dimuat tanpa redirect/checkpoint.
- Composer terbuka.
- Editor composer aktif dan dapat difokuskan.
- Kontrol **Foto/video** tersedia.

Jika satu kondisi tidak terbukti, hasilnya **tolak**. Jangan menebak bahwa composer akan berfungsi.

## Pembersihan kandidat

- Sudah ada di `data/groups.json`: hapus dari kandidat.
- Lulus gate: pindahkan ke `data/groups.json`, lalu hapus dari kandidat.
- Gagal, pending, perlu tindakan manual, tidak dipakai, atau proses terputus: hapus dari kandidat.
- Jangan menghidupkan kembali kandidat gagal dari proses lama.

## Daftar blokir 15–16 November 2026

Jangan cari ulang, join, atau tambahkan grup berikut. Cocokkan ID kanonis, bukan hanya nama tampilan.

| ID | Error | Nama |
| --- | --- | --- |
| `3585434885011416` | `POST_SUBMIT_FAILED` | JUAL BELI IPHONE JAKARTA - DEPOK - BOGOR . |
| `1526223387955707` | `COMPOSER_NOT_FOUND` | JUAL BELI IPHONE BOGOR |
| `288534324257878` | `POST_FAILED` | JUAL BELI IPHONE BOGOR BARAT |
| `1617829185526669` | `COMPOSER_NOT_FOUND` | JUAL BELI IPHONE BOGOR KOTA |
| `1232973067378779` | `COMPOSER_NOT_FOUND` | JUAL BELI IPHONE BOGOR DAN SEKITARNYA |
| `2216825085305282` | `COMPOSER_NOT_FOUND` | JUAL-BELI IPHONE JABODETABEK SEKITARNYA |
| `121097451918604` | `COMPOSER_NOT_FOUND` | JUAL BELI HP DAERAH BOGOR |
| `515470177791151` | `POST_FAILED` | JUAL BELI iPHONE BOGOR DAN SEKITARNYA |
| `968822628126591` | `COMPOSER_NOT_FOUND` | JUAL BELI IPHONE SEJABODETABEK |
| `1192928354184392` | `COMPOSER_NOT_FOUND` | jual beli hp bogor dramaga-cibanteng-ciampea-lw.liang |
| `289582192148998` | `POST_FAILED` | JUAL BELI HP CITAYAM BOJONGGEDE |
| `2672472806101655` | `COMPOSER_NOT_FOUND` | Jual beli HP secound/baru ,Daerah CILEUNGSI - JONGGOL - WANAHERANG |
| `877076529017910` | `POST_SUBMIT_FAILED` | Jual beli hp dramaga ipb bogor barat |
| `414015555971470` | `COMPOSER_NOT_FOUND` | Jual beli HP-Tenjolaya-ciampea-dramaga.Dan sekitar nya |
| `618805127483583` | `POST_SUBMIT_FAILED` | JUAL BELIHP DEPOK SAWANGAN BOJONG SARI PARUNG DAN SEKITARNYA |
| `1943387366319114` | `COMPOSER_NOT_FOUND` | Jual beli hp daerah bogor |
| `270453570261438` | `COMPOSER_NOT_FOUND` | JUAL BELI ALL HP CITEUREP-CIBINONG-SENTUL-PEMDA SKITARNYH |
| `229289139713327` | `COMPOSER_NOT_FOUND` | JUAL BELI HP JATINEGARA JAKTIM JAKSEL dan sekitarnya |
| `1522163008457949` | `POST_FAILED` | Jual Beli iPhone Cianjur |
| `2024717544438605` | `COMPOSER_NOT_FOUND` | JUAL BELI Hp khusus KOTA SERANG |
| `562299081068813` | `COMPOSER_NOT_FOUND` | Jual beli hp pamulang,ciputat, bintaro |
| `985218175212345` | `POST_SUBMIT_FAILED` | Jual beli HP seken Ciledug Kreo Cipondoh pondok Aren pondok kacang |
| `935288766622388` | `COMPOSER_NOT_FOUND` | Jual Beli Hp Jatiasih Bekasi |
| `1053685852167797` | `POST_SUBMIT_FAILED` | Jual beli hp bekasi jati asih |
| `1500715410173486` | `COMPOSER_NOT_FOUND` | Jual beli hp daerah bintaro dan sekitar. |
| `679244950704879` | `COMPOSER_NOT_FOUND` | JUAL BELI IPHONE TANGSEL |
| `1997694834968429` | `POST_FAILED` | Jual beli iPhoneJabodetabek Jakarta timur |
| `976213990436233` | `COMPOSER_NOT_FOUND` | JUAL BELI IPHONE RESMI JAKARTA |
| `1162296678273024` | `COMPOSER_NOT_FOUND` | JUAL BELI IPHONE TANGSEL & TANGERANG |
| `747410415939539` | `COMPOSER_NOT_FOUND` | JUAL BELI HP JAKARTA PUSAT |
| `1190107941923245` | `COMPOSER_NOT_FOUND` | JUAL BELI HP IPHONE & ANDROID DAERAH BOGOR KOTA DAN SEKITARNYA |
| `544272355953653` | `COMPOSER_NOT_FOUND` | JUAL BELI HP DAERAH CITEUREUP/CIBINONG/SENTUL/GN.PUTRI DLL.. |
| `1738259486490352` | `COMPOSER_NOT_FOUND` | Jual beli hp second daerah cibinong,pemda,citereup,bogor |
| `1640502722691775` | `COMPOSER_NOT_FOUND` | JUAL BELI HP TANGERANG KOTA/KABUPATEN |
| `221906496018870` | `POST_FAILED` | jual beli hp khusus daerah kota bekasi dan sekitarnya |
| `1409558629784632` | `IMAGE_UPLOAD_FAILED` | Jual Beli iPhone Bekasi kota dan sekitarnya |
