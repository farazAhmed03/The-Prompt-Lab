# 🎓 DevOps & Cloud Engineering Interview Defense Guide (English Edition)
## Project: PromptVerse — Automated Cloud Infrastructure & MERN Containerization

---

## 📌 Executive Summary & 30-Second Elevator Pitch

> *"PromptVerse is a full-stack, containerized AI prompt engineering platform deployed on AWS. I architected the cloud infrastructure using Terraform as code, containerized the multi-tier application using hardened non-root Docker images and Docker Compose, secured network ingress via custom AWS Security Groups and automated Let's Encrypt SSL/TLS certificates on Nginx, routed global traffic through AWS Route 53 with custom DNS, and established an automated, idempotent two-stage CI/CD pipeline using GitHub Actions and a dedicated Bash deployment runner."*

---

## 🏛️ Comprehensive Architectural Layer Breakdown

### Layer 1: Application Architecture & Containerization
* **MERN Microservices**:
  * **Frontend**: React 18 single-page application built with Vite, served through a multi-stage Alpine Nginx image.
  * **Backend**: Node.js/Express REST API communicating with MongoDB via Mongoose.
  * **Database**: MongoDB 7.0 engine with persistent named Docker volume (`mongo-data`).
  * **Management UI**: Mongo-Express administrative web interface for database management.
* **Security Hardening**:
  * **Backend**: Runs under the unprivileged `USER node` (UID 1000) inside `node:20-alpine`.
  * **Frontend**: Utilizes `nginxinc/nginx-unprivileged:alpine` (UID 101) binding to ports `8080` (HTTP) and `8443` (HTTPS) internally.
  * **Network Isolation**: All services communicate across a private Docker bridge network (`mern-network`). MongoDB (Port `27017`) is never exposed to the public host.

---

### Layer 2: Reverse Proxy & Automated SSL/TLS (Nginx + Certbot)
* **Port Mapping**:
  * Host Port `80` $\rightarrow$ Container Port `8080` (HTTP).
  * Host Port `443` $\rightarrow$ Container Port `8443` (HTTPS SSL).
* **Automated Redirection (301)**:
  * All public traffic hitting Port `80` is permanently redirected to `https://$host$request_uri`.
  * **Exception Handling**: An exact-match location block `location = /api/status` is preserved on HTTP to allow Docker and CI/CD internal healthchecks without certificate mismatch warnings.
* **SSL Certificate Automation**:
  * Automated issuance via Let's Encrypt and Certbot in `--standalone` mode.
  * Host volume `/etc/letsencrypt` is mounted into the Nginx container as read-only (`:ro`).
  * Explicit permissions (`chmod -R 755 /etc/letsencrypt/live /etc/letsencrypt/archive`) ensure unprivileged Nginx processes can traverse symlinks and read `privkey.pem`.

---

### Layer 3: Infrastructure as Code (Terraform on AWS)
* **Compute Provisioning (`terraform/main.tf`)**:
  * Provisions a single AWS EC2 instance running official Ubuntu 24.04 Noble LTS.
  * 20GB `gp3` root EBS volume for scalable I/O performance.
* **Server Bootstrap Script (`user_data`)**:
  * **2GB Linux Swap Space**: Prevents Out-Of-Memory (OOM) kernel panics during `docker build` processes on cost-effective `t2.micro` or `t3.micro` instances.
  * **Docker Engine & Plugins**: Installs official Docker CE, Containerd, Buildx, and Docker Compose Plugin non-interactively.
* **Network Security (`terraform/network.tf`)**:
  * Minimal ingress rule set: Ports `22` (SSH admin), `80` (HTTP web), `443` (HTTPS secure), `5000` (Backend API), and `8081` (Mongo-Express).
  * Unrestricted egress (`-1`) to enable downloading container images, OS security patches, and dependencies.
* **Safe State Isolation**:
  * `terraform.tfstate`, `.terraform/`, and `terraform.tfvars` are strictly excluded in `.gitignore` to avoid credential and state leakage.

---

### Layer 4: DNS & Domain Routing (AWS Route 53)
* **Hosted Zone Management (`terraform/route53.tf`)**:
  * Public Hosted Zone for `devops-project-demo.study`.
* **DNS Records**:
  * **Apex Record (`@`)**: Type `A` pointing directly to the EC2 Public IPv4 address (`3.239.236.53`).
  * **Subdomain Record (`www`)**: Type `A` pointing to the same EC2 Public IPv4 address (`3.239.236.53`).
  * **TTL**: Configured at 300 seconds (5 minutes) for rapid propagation during development and updates.

---

### Layer 5: Automated CI/CD Pipeline (GitHub Actions & Deploy Script)
* **Stage 1: Continuous Integration (`.github/workflows/ci.yml`)**:
  * Triggers on pull requests and pushes to `main`.
  * Installs dependencies, runs linting checks, and builds the frontend and backend to catch regressions before deployment.
* **Stage 2: Continuous Deployment (`.github/workflows/cd.yml`)**:
  * Triggers via `workflow_run` strictly upon successful CI completion.
  * Establishes a secure SSH tunnel to EC2 using `appleboy/ssh-action` with secrets (`EC2_IP`, `EC2_USER`, `EC2_SSH_KEY`, `EC2_PORT`).
* **Dedicated Runner (`scripts/deploy.sh`)**:
  * Decouples complex shell logic from YAML files.
  * Executes with native `#!/usr/bin/env bash` to bypass Ubuntu `/bin/sh` (Dash) limitations.
  * **Idempotence**: Checks if `.env` exists before touching it; checks if SSL certificate is already issued before executing Certbot; restarts containers with `--remove-orphans`; and runs a 10-cycle healthcheck against `/api/status`.

---

## 🛠️ Real Production Challenges Faced & Solved

| Challenge | Root Cause | Solution Implemented |
|---|---|---|
| **Ubuntu Dash vs Bash Conflict** | `appleboy/ssh-action` runs `/bin/sh`, which symlinks to Dash on Ubuntu. Dash fails on `set -o pipefail` and exits with status 1. | Decoupled deployment logic into `scripts/deploy.sh` with `#!/usr/bin/env bash` and invoked it via `bash ./scripts/deploy.sh`. |
| **Empty Secret Port Failure** | YAML referenced `${{ secrets.EC2_PORT }}` which was undefined, passing an empty string to the SSH plugin and aborting in 1s. | Hardcoded default SSH port 22 in pipeline and ensured `EC2_PORT` was correctly mapped. |
| **Certbot Standalone Port 80 Collision** | Certbot `--standalone` failed to bind to port 80 because the frontend container was already running. | Added `docker compose stop frontend \|\| true` in `deploy.sh` right before Certbot execution to free port 80 during ACME validation. |
| **Unprivileged Nginx EACCES Error** | Let's Encrypt creates `/etc/letsencrypt/archive` with `0700` (root-only). Non-root Nginx UID 101 could not read private key. | Added `sudo chmod -R 755 /etc/letsencrypt/live /etc/letsencrypt/archive` in `deploy.sh` post-certificate generation. |
| **Node.js Data Directory Permission Denied** | Backend Dockerfile switched to `USER node` before creating `/app/data`, causing `mkdir` EACCES crash. | Added `RUN mkdir -p /app/data && chown -R node:node /app` prior to switching to `USER node`. |
| **Terraform Out-Of-Sync State** | Manual Route 53 creation in AWS Console caused Terraform apply conflicts. | Used `terraform import aws_route53_zone.primary <ZONE_ID>` and record imports to bring state into 100% sync without downtime. |

---

## 🎯 Top 10 High-Yield DevOps Interview Questions & Model Answers

### Q1: Why did you use Certbot and Let's Encrypt inside the deployment script rather than AWS Certificate Manager (ACM)?
> **Model Answer:**
> *"AWS Certificate Manager (ACM) provides free SSL certificates, but public ACM certificates can only be attached to AWS-managed services like Application Load Balancers (ALB), CloudFront distributions, or API Gateways. ACM does not allow you to export the private key to install directly on a standalone EC2 instance running Nginx. Since this lab architecture utilizes a single EC2 instance without an ALB to minimize cloud costs, Certbot with Let's Encrypt was the ideal production solution: it allows direct host-level SSL termination on Nginx with automated issuance and renewal."*

---

### Q2: Why did you separate `scripts/deploy.sh` from the GitHub Actions `cd.yml` workflow file?
> **Model Answer:**
> *"Separating `deploy.sh` adheres to the DevOps principle of Separation of Concerns. The CI/CD YAML file should act purely as an orchestrator—handling secrets, triggers, and SSH connection parameters. Putting multi-step deployment logic inside YAML creates syntax fragility, whitespace errors, and vendor lock-in. A standalone `deploy.sh` file allows us to test deployments directly on the EC2 server without triggering a Git push, ensures execution under native Bash (`/bin/bash`) rather than Dash (`/bin/sh`), and makes the pipeline portable across GitHub Actions, GitLab CI, or Jenkins."*

---

### Q3: How do you prevent Out-Of-Memory (OOM) crashes on low-spec EC2 instances during Docker builds?
> **Model Answer:**
> *"During multi-stage Docker builds, Vite bundling and npm installs cause sudden spikes in CPU and RAM consumption, which can easily trigger the Linux OOM Killer on 1GB or 2GB RAM instances. To solve this at the root, I automated the creation of a 2GB Linux Swap file within the Terraform `user_data` bootstrap script (`fallocate -l 2G /swapfile`, `mkswap`, and persistent `/etc/fstab` configuration) with `vm.swappiness=10`. This allows the operating system to offload idle memory pages to disk during heavy compilation spikes, ensuring zero container build freezes."*

---

### Q4: How did you ensure security for non-root containers while handling privileged SSL certificates?
> **Model Answer:**
> *"We adhered to the Principle of Least Privilege across the container lifecycle. In the backend Dockerfile, we switched execution to `USER node` and pre-allocated file ownership with `chown -R node:node /app`. For Nginx, we used `nginxinc/nginx-unprivileged`, which runs as UID 101 and binds to unprivileged ports `8080` and `8443`. Because Certbot generates certificates with `0700` root-only permissions on host directory `/etc/letsencrypt/archive`, we configured `deploy.sh` to adjust permissions to `755` and mounted `/etc/letsencrypt` into the container as read-only (`:ro`). This gives Nginx read-only access to certificates without needing root privileges."*

---

### Q5: How does your CD pipeline guarantee that production secrets (`.env`) are never overwritten?
> **Model Answer:**
> *"Production secrets are protected through a three-layer defense: First, `.env` and `*.env.*` are explicitly listed in `.gitignore`, preventing developers from accidentally committing credentials to Git. Second, `deploy.sh` contains an idempotent safety guard: `test -f .env || cp .env.example .env`. If the live `.env` exists on the server, the script skips touching it entirely. Third, `git reset --hard origin/main` only resets files tracked by version control, leaving untracked files like `.env` completely intact on the host."*

---

### Q6: If an engineer creates resources manually in the AWS Console, how do you bring them under Terraform control without downtime?
> **Model Answer:**
> *"If a resource is created out-of-band via the AWS Console—such as our Route 53 Hosted Zone—running `terraform apply` would fail due to an `AlreadyExists` conflict. To resolve this without destroying the resource, I wrote the matching Terraform configuration in `route53.tf` and executed `terraform import aws_route53_zone.primary <HOSTED_ZONE_ID>`. For DNS records, I used `terraform import aws_route53_record.apex <ZONE_ID>_<DOMAIN_NAME>_<RECORD_TYPE>`. After import, running `terraform plan` outputs 'No changes', confirming that the remote state and Terraform configuration are in 100% synchronization."*

---

### Q7: Why did you configure Nginx to listen on ports 8080 and 8443 inside the container instead of 80 and 443?
> **Model Answer:**
> *"In Linux, TCP ports below 1024 are privileged well-known ports that can only be bound by the `root` superuser (UID 0). Because our frontend container uses `nginxinc/nginx-unprivileged` running as user `nginx` (UID 101) to prevent container escape vulnerabilities, it cannot bind to port 80 or 443 directly. Therefore, Nginx listens internally on unprivileged ports `8080` and `8443`. Docker Compose handles the translation via port mappings: `80:8080` and `443:8443`, allowing external clients to connect over standard HTTP and HTTPS ports."*

---

### Q8: How did you implement zero-downtime health checking in your CD pipeline?
> **Model Answer:**
> *"In `deploy.sh`, after running `docker compose up -d --build --remove-orphans`, we implement a post-deployment verification loop using `curl --fail --silent --output /dev/null http://localhost/api/status`. The loop retries 10 times with 5-second intervals. If the endpoint responds with HTTP 200, dangling Docker images are pruned (`docker image prune -f`), and the deployment exits successfully with status 0. If the health check fails across all 10 attempts, the script prints the last 100 lines of container logs (`docker compose logs --tail=100`) and exits with status 1, flagging the pipeline as failed in GitHub Actions."*

---

### Q9: What is the difference between an A Record and a CNAME record, and why did you use an A Record for EC2?
> **Model Answer:**
> *"An **A Record** (Address Record) maps a domain name directly to a 32-bit IPv4 address (e.g., `devops-project-demo.study` $\rightarrow$ `3.239.236.53`). A **CNAME Record** (Canonical Name) maps an alias name to another domain name (e.g., `www.example.com` $\rightarrow$ `example.com`), requiring an additional DNS lookup. Furthermore, the DNS RFC 1034 prohibits CNAME records at the zone apex (root domain). Because our EC2 instance has a direct public IPv4 address and we needed both apex and `www` to resolve directly to our server with lowest DNS latency, we configured **A Records** for both."*

---

### Q10: If traffic grows from 100 to 500,000 active users, how would you evolve this architecture?
> **Model Answer:**
> *"To scale this architecture for high availability and enterprise load, I would evolve it in three phases:
> 1. **Stateless Compute & Auto-Scaling**: Decouple the monolithic EC2 instance into an Auto Scaling Group (ASG) behind an **Application Load Balancer (ALB)**, moving SSL termination to the ALB with AWS ACM.
> 2. **Managed Database Tier**: Migrate MongoDB from a single Docker container to **Amazon DocumentDB** or **MongoDB Atlas** with multi-AZ replication, automated backups, and sharding.
> 3. **Static Caching & Container Orchestration**: Offload React frontend static assets to **Amazon S3** with **Amazon CloudFront CDN** for global edge caching, and migrate backend containers to **Amazon ECS with Fargate** or **Amazon EKS (Kubernetes)** with horizontal pod autoscaling (HPA)."*

