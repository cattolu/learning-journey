# Learning Journey v6 — XAMPP + MySQL

Learning Journey untuk siswa MPLB dengan 3 kelas dan akun terpisah:
- 10 MPLB — 30 siswa — Guru 10 MPLB
- 11 MPLB — 32 siswa — Guru 11 MPLB
- 12 MPLB — 28 siswa — Guru 12 MPLB

## Progress
Semua data aktivitas awal kosong dan seluruh progress bab dimulai 0%. Progress mapel = rata-rata progress bab. Progress kelas = rata-rata progress seluruh bab pada kelas tersebut. Dashboard mengikuti data MySQL secara real-time setelah disimpan.

## Jalankan
1. Nyalakan Apache dan MySQL di XAMPP.
2. Pastikan Node.js sudah terpasang.
3. Buka terminal VS Code pada folder project ini.
4. Buat `.env` dari `.env.example`.
5. Jalankan `npm install`.
6. Jalankan `npm run setup-db` satu kali untuk membuat/reset database dan akun demo.
7. Jalankan `npm start`.
8. Buka `http://localhost:3000`.

## Akun
Guru: guru10 / guru123, guru11 / guru123, guru12 / guru123.
Siswa: siswa10_01 sampai siswa10_30, siswa11_01 sampai siswa11_32, siswa12_01 sampai siswa12_28. Semua password siswa: `siswa123`.

Guru hanya dapat melihat siswa dari kelas yang ditugaskan. Guru dapat menambah/menghapus bab pada kelasnya. Siswa hanya dapat mengubah progress miliknya sendiri.

## Jika npm PowerShell diblokir
Pilih terminal `Command Prompt (cmd)` di VS Code, lalu jalankan perintah npm dari sana.
