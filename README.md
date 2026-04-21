# DevOps Portfolio – Application Deployment

A hands-on project demonstrating two deployment approaches for the same Node.js application, reflecting real-world DevOps environments — from traditional VM-based provisioning to fully containerized cloud-native deployment.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         PART A – VM-based                           │
│                                                                     │
│   Local Machine                    AWS EC2 (Ubuntu 22.04)           │
│  ┌──────────────┐   Ansible SSH   ┌──────────────────────────────┐  │
│  │ ansible      │────────────────▶│  runtime.yml                 │  │
│  │ control node │                 │  └─ Node.js 18 + PM2         │  │
│  │              │                 │                              │  │
│  │              │                 │  deploy.yml                  │  │
│  │              │────────────────▶│  └─ git clone                │  │
│  └──────────────┘                 │     npm install              │  │
│                                   │     pm2 start :3000          │  │
│                                   └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    PART B – Cloud-native                            │
│                                                                     │
│  git push                                                           │
│     │                                                               │
│     ▼                                                               │
│  ┌──────────────────┐                                               │
│  │  GitHub Actions  │── docker build ──▶ Docker Hub                │
│  │  CI/CD Pipeline  │                   (mujaddidsi/devops-test-app)│
│  └──────────────────┘                          │                   │
│                                                │ kubectl apply     │
│                                                ▼                   │
│                              ┌─────────────────────────────────┐   │
│                              │     Kubernetes (Minikube)        │   │
│                              │                                  │   │
│                              │  Ingress (devops-test-app.local) │   │
│                              │       │                          │   │
│                              │  Service (NodePort :30007)       │   │
│                              │       │                          │   │
│                              │  Deployment ──▶ HPA (1–3 pods)  │   │
│                              └─────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Part A (VM-based) | Part B (Cloud-native) |
|---|---|---|
| Infrastructure | AWS EC2 (Ubuntu 22.04) | Kubernetes (Minikube) |
| Provisioning | Ansible | — |
| Runtime | Node.js 18 + PM2 | Docker (Alpine image) |
| CI/CD | — | GitHub Actions |
| Registry | — | Docker Hub |
| Autoscaling | — | HPA (CPU-based) |
| Ingress | EC2 Public IP | Kubernetes Ingress |

---

## Part A – VM-based Deployment (Ansible + EC2)

### Project Structure

```
ansible/
├── ansible.cfg       # SSH config, privilege escalation
├── inventory.ini     # Target host definition (app_servers group)
├── runtime.yml       # Installs Node.js 18 & PM2, configures systemd startup
└── deploy.yml        # Clones repo, installs deps, starts app via PM2
```

> Ansible files are located in the `ansible/` directory at the root of this repository.

### Prerequisites

- Ansible 2.x+ installed on local machine
- AWS EC2 instance running Ubuntu 22.04 LTS
- SSH private key (`.pem`) with access to the instance

### Configuration

Update `inventory.ini` with your EC2 public IP:

```ini
[app_servers]
app1 ansible_host=<YOUR_EC2_PUBLIC_IP>
```

Update `ansible.cfg` with your SSH key path:

```ini
private_key_file = ~/.ssh/your-key.pem
```

### Deployment

```bash
# Step 1 – Provision runtime (Node.js 18 + PM2 + systemd service)
ansible-playbook runtime.yml

# Step 2 – Deploy application
ansible-playbook deploy.yml

# Or run both in sequence
ansible-playbook runtime.yml && ansible-playbook deploy.yml
```

### Monitoring & Logs

```bash
pm2 list                        # List running processes
pm2 logs devops-test-app        # Stream application logs
pm2 monit                       # Real-time CPU & memory monitor
```

### Design Decisions

- **Two-playbook separation** — `runtime.yml` handles system provisioning (idempotent, run once), `deploy.yml` handles application lifecycle (run on every release). This separation allows re-deploying without re-provisioning the runtime.
- **PM2 with systemd startup** — ensures the app automatically restarts after EC2 reboots without manual intervention.
- **`force: yes` on git module** — guarantees the latest commit is always pulled, avoiding stale deployments from cached state.
- **`host_key_checking = False`** — disabled for automation convenience in this test environment. Should be enabled in production.

---

## Part B – Containerized Deployment (Docker + GitHub Actions + Kubernetes)

### Repository Structure

```
.
├── .github/
│   └── workflows/
│       └── ci-cd.yml       # GitHub Actions pipeline
├── ansible/
│   ├── ansible.cfg         # SSH config, privilege escalation
│   ├── inventory.ini       # Target host definition (app_servers group)
│   ├── runtime.yml         # Installs Node.js 18 & PM2, configures systemd startup
│   └── deploy.yml          # Clones repo, installs deps, starts app via PM2
├── k8s/
│   ├── deployment.yaml     # Pod spec with resource requests & limits
│   ├── hpa.yaml            # Horizontal Pod Autoscaler (CPU-based)
│   ├── ingress.yaml        # Host-based Ingress routing
│   └── service.yaml        # NodePort Service
├── Dockerfile              # Alpine-based Node.js image
├── index.js                # Application source
└── package.json
```

### CI/CD Pipeline

Every push to `main` triggers:

```
git push → GitHub Actions → docker build → docker push (Docker Hub) → kubectl apply
```

#### GitHub Actions Secrets Required

| Secret | Description |
|---|---|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub access token (not account password) |

### Deploy to Kubernetes (Minikube)

```bash
# 1. Start Minikube
minikube start

# 2. Enable Ingress addon
minikube addons enable ingress

# 3. Apply all manifests
kubectl apply -f k8s/

# 4. Verify resources
kubectl get all

# 5. Add local DNS entry
echo "$(minikube ip) devops-test-app.local" | sudo tee -a /etc/hosts

# 6. Access the app
curl http://devops-test-app.local
```

### Expected Response

```json
{
  "message": "Hello from DevOps Portfolio App!",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "hostname": "devops-test-app-xxxxxxxxx-xxxxx"
}
```

### Verify HPA Autoscaling

```bash
# Watch HPA in real-time
kubectl get hpa -w

# Generate load (separate terminal)
kubectl run load-generator \
  --image=busybox --restart=Never \
  -- /bin/sh -c "while true; do wget -q -O- http://devops-test-app:3000; done"

# Observe pods scaling up
kubectl get pods -w
```

### Design Decisions

- **Alpine base image** — significantly smaller than the full Node.js image, reducing attack surface and registry storage.
- **HPA threshold at 50% CPU** — conservative enough to trigger scaling before pod saturation, providing headroom during traffic spikes.
- **Resource requests & limits** — CPU request `100m` / limit `500m` gives the scheduler accurate data for pod placement and prevents resource contention.
- **NodePort + Ingress** — NodePort enables direct Minikube access; Ingress adds host-based routing to simulate a production-like traffic flow.

---

## Author

**Jade** – Cloud & DevOps Engineer  
[GitHub](https://github.com/mujaddidsi) · [Docker Hub](https://hub.docker.com/u/mujaddidsi)
