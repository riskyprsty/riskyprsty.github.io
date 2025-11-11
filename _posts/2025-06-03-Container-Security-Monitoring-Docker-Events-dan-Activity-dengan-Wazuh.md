---
layout: "post"
title: "Container Security: Monitoring Docker Events dan Activity dengan Wazuh"
permalink: /blog/:title
toc: true
locale: id_ID
categories: blog
tags: docker container-security wazuh siem monitoring cybersecurity
description: "Wazuh SIEM dapat digunakan untuk me-monitoring Docker container, mendeteksi aktivitas mencurigakan dan serangan web secara real-time."
---

<img src="{{ '/assets/img/posts/2025-container-security/header.webp' | prepend: site.baseurl }}" class="img-fluid center m-1">

# Pendahuluan

Docker telah menjadi teknologi containerization yang sangat populer di kalangan developer dan DevOps engineer. Namun, dengan semakin luasnya penggunaan Docker dalam production environment, kebutuhan akan monitoring dan keamanan container juga semakin meningkat. Di sinilah Wazuh dapat digunakan untuk melakukan monitoring pada Docker.

Dalam artikel ini, kita akan membahas bagaimana menggunakan Wazuh untuk monitoring Docker events dan activities secara real-time, serta implementasinya.

# Apa itu Wazuh?

Wazuh adalah platform keamanan open-source yang menyatukan kemampuan XDR (_Extended Detection and Response_) dan SIEM (_Security Information and Event Management_) yang menyediakan berbagai capabilities untuk container security, termasuk:

- **Centralized logging** - Mengumpulkan log dari berbagai sumber
- **Real-time monitoring** - Monitoring aktivitas secara real-time
- **Vulnerability scanning** - Scan kerentanan security
- **Incident response automation** - Otomasi respons terhadap insiden keamanan

# Prerequisites

Sebelum memulai, pastikan sudah memiliki:

1. **Docker Server** - Server yang menjalankan Docker engine
2. **Wazuh Agent** - Agent Wazuh terinstall pada Docker server
3. **Wazuh Server** - Wazuh agent sudah terdaftar ke Wazuh server

# Langkah-langkah Konfigurasi

## Step 1: Install Python Docker Library

Sebelum menginstall library, sebaiknya kita melakukan setup virtual environment terlebih dahulu supaya tidak mengganggu package global system.

```bash
cd /var/ossec/wodles/docker
python3 -m venv venv
source venv/bin/activate
```

Instal library Docker untuk Python yang diperlukan Wazuh Docker listener.

```bash
# Untuk Python 3.8–3.10
(venv) pip3 install docker==7.1.0 urllib3==1.26.20 requests==2.32.2

# Untuk Python 3.11–3.12
(venv) pip3 install docker==7.1.0 urllib3==1.26.20 requests==2.32.2
```

{% include alerts.html type="info" content="Penggunaan virtual environment sangat direkomendasikan untuk mengisolasi dependencies dan menghindari konflik dengan package system." %}

### Update Shebang pada Script DockerListener

Edit file `/var/ossec/wodles/docker/DockerListener`:

```bash
nano /var/ossec/wodles/docker/DockerListener
```

Ubah baris pertama dari:

```python
#!/usr/bin/env python3
```

Menjadi path ke venv:

```python
#!/var/ossec/wodles/docker/venv/bin/python3
```

### Uji Coba DockerListener

<img src="{{ '/assets/img/posts/2025-container-security/docker-listener-test.webp' | prepend: site.baseurl }}" class="img-fluid center m-1">

Uji coba jalankan binary DockerListener, pastikan terhubung ke Docker service.

```bash
sudo /var/ossec/wodles/docker/DockerListener
```
<img src="{{ '/assets/img/posts/2025-container-security/docker-service-listener.webp' | prepend: site.baseurl }}" class="img-fluid center m-1">

## Step 2: Konfigurasi Wazuh Agent

Tambahkan konfigurasi berikut ke file `/var/ossec/etc/ossec.conf` pada Docker server:

```xml
<wodle name="docker-listener">
  <disabled>no</disabled>
</wodle>
```

Restart Wazuh agent untuk menerapkan perubahan:

```bash
systemctl restart wazuh-agent
```

## Step 3: Konfigurasi Advanced (Optional)

Untuk konfigurasi yang lebih advanced, Anda dapat menggunakan berbagai opsi scheduling:

```xml
<wodle name="docker-listener">
  <interval>10m</interval>
  <attempts>5</attempts>
  <run_on_start>no</run_on_start>
  <disabled>no</disabled>
</wodle>
```

**Penjelasan konfigurasi:**

- `interval`: Waktu tunggu untuk rerun listener jika gagal
- `attempts`: Jumlah percobaan eksekusi listener jika gagal
- `run_on_start`: Jalankan listener segera saat Wazuh agent start
- `disabled`: Enable/disable Docker listener

# Use Case 1: Monitoring User Interaction dengan Docker Container

Mari kita test monitoring Docker events dengan melakukan berbagai operasi container.

## 1. Jalankan Container

Jalankan container sederhana menggunakan image httpd:

```bash
docker run -d --name test-container httpd
```

<img src="{{ '/assets/img/posts/2025-container-security/run-container.webp' | prepend: site.baseurl }}" class="img-fluid center m-1">

Hasil monitoring dapat kita lihat pada Wazuh dashboard di module **Threat Hunting** atau **Docker listener dashboard**.

<img src="{{ '/assets/img/posts/2025-container-security/dashboard-run.webp' | prepend: site.baseurl }}" class="img-fluid center m-1">

## 2. Pause, Resume, Stop Container

Lakukan operasi pause, unpause, dan stop pada container:

```bash
docker pause test-container
docker unpause test-container
docker stop test-container
```

<img src="{{ '/assets/img/posts/2025-container-security/pause-resume-stop.webp' | prepend: site.baseurl }}" class="img-fluid center m-1">

Setiap operasi ini akan tercatat di Wazuh dashboard dengan detail event yang lengkap.

<img src="{{ '/assets/img/posts/2025-container-security/dashboard-operations.webp' | prepend: site.baseurl }}" class="img-fluid center m-1">

## 3. Remove Container dan Hapus Image

Hapus container dan image yang sudah tidak digunakan:

```bash
docker rm test-container
docker rmi httpd
```

<img src="{{ '/assets/img/posts/2025-container-security/remove-container.webp' | prepend: site.baseurl }}" class="img-fluid center m-1">

Event removal juga akan terekam di Wazuh.

<img src="{{ '/assets/img/posts/2025-container-security/dashboard-remove.webp' | prepend: site.baseurl }}" class="img-fluid center m-1">

# Use Case 2: Monitoring Container Runtime untuk Deteksi Web Attacks

Use case ini menunjukkan bagaimana Wazuh dapat monitoring runtime logs container web untuk mendeteksi serangan web, seperti SQL Injection.

## Konfigurasi Wazuh Agent

Tambahkan konfigurasi berikut ke `/var/ossec/etc/ossec.conf` pada Docker server:

```xml
<localfile>
  <log_format>syslog</log_format>
  <location>/var/lib/docker/containers/*/*-json.log</location>
</localfile>
```

Restart Wazuh agent:

```bash
systemctl restart wazuh-agent
```

## Konfigurasi Wazuh Server

Tambahkan decoder berikut ke `/var/ossec/etc/decoders/local_decoder.xml` pada Wazuh server:

```xml
<decoder name="web-accesslog-docker">
  <parent>json</parent>
  <type>web-log</type>
  <use_own_name>true</use_own_name>
  <prematch offset="after_parent">^log":"\S+ \S+ \S+ \.*[\S+ \S\d+] \.*"\w+ \S+</prematch>
  <regex offset="after_parent">^log":"(\S+) \S+ \S+ \.*[\S+ \S\d+] \.*"(\w+) (\S+)</regex>
  <order>srcip,protocol,url,id</order>
</decoder>

<decoder name="json">
  <parent>json</parent>
  <use_own_name>true</use_own_name>
  <plugin_decoder>JSON_Decoder</plugin_decoder>
</decoder>
```

Restart Wazuh manager:

```bash
systemctl restart wazuh-manager
```

{% include alerts.html type="info" content="Decoder berfungsi untuk mem-parsing log dari format JSON Docker menjadi field-field yang dapat dianalisis oleh Wazuh." %}

## Testing SQL Injection Detection

Jalankan web container dengan nginx:

```bash
docker run --name test-container -p 80:80 -d nginx
```

<img src="{{ '/assets/img/posts/2025-container-security/container-nginx.webp' | prepend: site.baseurl }}" class="img-fluid center m-1">

Simulasi SQL injection attack:

```bash
curl -XGET "http://<WEB_IP_ADDRESS>/users/?id=SELECT+*+FROM+users"
```

<img src="{{ '/assets/img/posts/2025-container-security/sql-injection-test.webp' | prepend: site.baseurl }}" class="img-fluid center m-1">

## Hasil Deteksi

Alert akan muncul pada Wazuh Dashboard dengan detail lengkap mengenai serangan SQL Injection yang terdeteksi:

<img src="{{ '/assets/img/posts/2025-container-security/sqli-alert-1.webp' | prepend: site.baseurl }}" class="img-fluid center m-1">

Detail alert akan menampilkan informasi seperti:

- Source IP attacker
- URL yang diserang
- Payload SQL Injection
- Timestamp serangan
- Rule ID dan severity level

<img src="{{ '/assets/img/posts/2025-container-security/sqli-alert-2.webp' | prepend: site.baseurl }}" class="img-fluid center m-1">

# Referensi

- [Wazuh Official Documentation](https://documentation.wazuh.com/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
- [Wazuh Docker Integration](https://documentation.wazuh.com/current/user-manual/capabilities/container-security/docker-monitoring.html)