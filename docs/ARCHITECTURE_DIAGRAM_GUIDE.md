# 🎨 PromptVerse — Architecture Diagram & Draw.io Guide

Yeh guide aapko aapke project ka professional architecture diagram **Draw.io (diagrams.net)** mein open karne, edit karne, aur image download karne ka complete tareeqa batati hai.

---

## 🚀 Tareeqa 1: Direct File Open Karna (Sabse Aasan — 10 Seconds)

Aapke project ke andar already Draw.io ki official file create kar di gayi hai:
👉 **[`docs/architecture.drawio`](file:///c:/Users/faraz/Desktop/New%20folder/docs/architecture.drawio)**

### Steps:
1. Apne browser mein jayein: **[https://app.diagrams.net/](https://app.diagrams.net/)**
2. Top menu mein click karein: **File $\rightarrow$ Open From $\rightarrow$ Device** (ya apne computer se file chunein).
3. Apne computer se yeh file select karein:
   ```text
   C:\Users\faraz\Desktop\New folder\docs\architecture.drawio
   ```
4. **Boom!** 🎉 Poora professional dark-theme architecture diagram aapki screen par khul jayega jisme har box, icon, port, arrow aur colors perfectly set hain!

---

## ⚡ Tareeqa 2: Mermaid Code Copy-Paste Karna (2 Clicks)

Agar aap kisi naye blank canvas par instant generate karna chahte hain:

1. [app.diagrams.net](https://app.diagrams.net/) par jayein.
2. Top menu bar mein: **Arrange $\rightarrow$ Insert $\rightarrow$ Advanced $\rightarrow$ Mermaid** par click karein.
3. Niche diya gaya code copy karke wahan paste karein aur **Insert** daba dein:

```mermaid
graph TD
    %% CLIENTS
    Client([🌐 Client Browser / Mobile\n'devops-project-demo.study']):::clientStyle -->|1. DNS Query| R53[📡 AWS Route 53 DNS\nApex & WWW A Records\n300s TTL]:::dnsStyle
    
    %% ROUTE 53 TO EC2
    R53 -->|2. Resolves to 3.239.236.53| SG

    %% AWS CLOUD & SECURITY GROUP
    subgraph AWS ["☁️ AWS Cloud (us-east-1)"]
        subgraph SG ["🛡️ AWS Security Group (Firewall)"]
            Port80[Port 80: HTTP Redirect]:::portStyle
            Port443[Port 443: HTTPS SSL]:::sslPortStyle
            Port22[Port 22: SSH Admin]:::sshPortStyle
        end

        subgraph EC2 ["💻 AWS EC2 Instance (Ubuntu 24.04 LTS | 20GB gp3 | 2GB Swap)"]
            Certbot[🔒 Let's Encrypt / Certbot Engine\nHost Path: /etc/letsencrypt\nchmod -R 755]:::certStyle
            EnvFile[📄 .env Secrets\nPreserved via Deploy Guard]:::envStyle

            subgraph Docker ["🐳 Docker Compose Stack (Network: mern-network)"]
                Frontend[1. mern-frontend\nReact 18 Vite + Nginx\nUser: nginx UID 101\nPorts: 8080 & 8443 SSL]:::frontStyle
                Backend[2. mern-backend\nNode.js Express REST API\nUser: node UID 1000\nPort: 5000]:::backStyle
                MongoDB[(3. mern-mongodb\nMongo 7.0 Engine\nPort: 27017 Isolated\nVolume: mongo-data)]:::dbStyle
                MongoExpress[4. mern-mongo-express\nDB Admin GUI\nPort: 8081 Basic Auth]:::guiStyle

                Frontend -->|Reverse Proxy /api/| Backend
                Backend -->|Mongoose Auth| MongoDB
                MongoExpress -->|Admin Access| MongoDB
            end
        end
    end

    %% TRAFFIC FLOW
    Port80 -->|Forward to :8080| Frontend
    Port443 -->|Forward to :8443| Frontend

    %% CI/CD PIPELINE
    subgraph CICD ["🔄 GitHub Actions CI/CD Pipeline"]
        Dev([💻 Developer Push]):::devStyle --> Repo[GitHub: The-Prompt-Lab]:::gitStyle
        Repo --> CI[Stage 1: CI Pipeline\nLint, Test, Build Verification]:::ciStyle
        CI -->|On Success| CD[Stage 2: CD Pipeline\nSSH Action to EC2 Port 22]:::cdStyle
        CD --> Script[scripts/deploy.sh\nRuns via native bash\nIdempotent Deploy & SSL]:::scriptStyle
    end

    Script -.->|SSH Tunnel| Port22

    %% STYLING
    classDef clientStyle fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#fff;
    classDef dnsStyle fill:#2e1065,stroke:#a855f7,stroke-width:2px,color:#fff;
    classDef portStyle fill:#334155,stroke:#64748b,color:#fff;
    classDef sslPortStyle fill:#065f46,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef sshPortStyle fill:#7f1d1d,stroke:#ef4444,stroke-width:2px,color:#fff;
    classDef certStyle fill:#022c22,stroke:#059669,color:#a7f3d0;
    classDef envStyle fill:#374151,stroke:#9ca3af,color:#fff;
    classDef frontStyle fill:#083344,stroke:#06b6d4,stroke-width:2px,color:#fff;
    classDef backStyle fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff;
    classDef dbStyle fill:#14532d,stroke:#22c55e,stroke-width:2px,color:#fff;
    classDef guiStyle fill:#3b0764,stroke:#a855f7,color:#fff;
    classDef devStyle fill:#1e293b,stroke:#94a3b8,color:#fff;
    classDef gitStyle fill:#1e293b,stroke:#3b82f6,color:#fff;
    classDef ciStyle fill:#1e3a8a,stroke:#3b82f6,color:#fff;
    classDef cdStyle fill:#1e3a8a,stroke:#3b82f6,color:#fff;
    classDef scriptStyle fill:#064e3b,stroke:#10b981,stroke-width:2px,color:#fff;
```

---

## 🖼️ Image Export Karne Ka Tareeqa (PNG / PDF)

Jab aap Draw.io mein diagram open kar lein:
1. **File $\rightarrow$ Export as $\rightarrow$ PNG...** par click karein.
2. Options mein:
   * **Zoom**: `200%` ya `300%` select karein (Is se image ultra-HD crystal clear aayegi).
   * **Transparent Background**: Tick karein (agar dark slide par lagana ho) ya untick karein.
3. **Download** daba dein!
4. Yeh image aap apne **LinkedIn posts, resume links, project presentation, ya portfolio** mein laga sakte hain!

---

## 🏛️ Diagram ke Har Block ki Asaan Wazahath (Explain Kaise Karein)

| Box / Section | Rang (Color) | Iska Kaam Kya Hai? |
|---|---|---|
| **End Users / Client** | 🔵 Light Blue | Website open karne wale users (Chrome, Mobile, Desktop). |
| **AWS Route 53** | 🟣 Purple | DNS phonebook jo domain (`devops-project-demo.study`) ko IP `3.239.236.53` deti hai. |
| **AWS Security Group** | 🔴/🟢 Firewall | Server ka security guard: Port 80, 443, 22 ko filter karta hai. |
| **EC2 Host (Ubuntu 24.04)** | 🟡 Gold/Orange | Asli cloud computer jisme 20GB disk aur 2GB Swap RAM lagi hai. |
| **Let's Encrypt / Certbot** | 🟢 Emerald Green | Automatic SSL certificates issue karta hai taake site secure lock 🔒 ho. |
| **Docker Compose Stack** | 🟦 Docker Blue | 4 containers ka isolated network (`mern-frontend`, `mern-backend`, `mern-mongodb`, `mern-mongo-express`). |
| **CI/CD Pipeline (Left Side)** | 🔵 Dark Blue | Developer ka `git push` jo GitHub Actions aur `scripts/deploy.sh` ke zariye automatically deploy karta hai. |
