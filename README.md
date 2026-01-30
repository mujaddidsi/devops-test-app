# DevOps Test – Application Deployment

This project demonstrates deploying the same application using two different approaches, reflecting real-world DevOps environments.

---

## Architecture Overview

### Part A – Traditional Deployment (VM-based)
- Deployed on an AWS EC2 instance
- Application runs with **Node.js + PM2**
- Provisioned and deployed using **Ansible**
- Accessible via public EC2 IP

### Part B – Containerized Deployment (Cloud-native)
- Application containerized using **Docker**
- CI/CD pipeline implemented with **GitHub Actions**
- Docker image pushed to **Docker Hub**
- Application deployed to **Kubernetes (Minikube)**

---

## CI/CD Flow (Part B)

```text
Git Push
   ↓
GitHub Actions
   ↓
Docker Build
   ↓
Push Image to Docker Hub
   ↓
Deploy to Kubernetes
