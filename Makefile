.DEFAULT_GOAL := help

# Project Setup
PROJECT_NAME := argocd-plugin-tenant-generator

.PHONY: help
##@ General
help: ## Show this help
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage: \033[36m\033[0m\n"} /^[a-zA-Z0-9_-]+:.*?##/ { printf "  \033[36m%-26s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ KinD
kind-create-cluster: ## Create kind cluster
	@if [ ! "$(shell kind get clusters | grep $(PROJECT_NAME))" ]; then \
		kind create cluster --name=$(PROJECT_NAME) --wait 180s; \
		kubectl wait pod --all -n kube-system --for condition=Ready --timeout 180s; \
	fi

kind-delete-cluster: ## Delete kind cluster
	@if [ "$(shell kind get clusters | grep $(PROJECT_NAME))" ]; then \
		kind delete cluster --name=$(PROJECT_NAME) || true; \
	fi

kind-load-image: docker-build ## Build the image and load it into the kind cluster
	@IMAGE=$(PROJECT_NAME):latest; \
	if [ "$(shell kind get clusters | grep $(PROJECT_NAME))" ]; then \
		kind load docker-image $$IMAGE --name=$(PROJECT_NAME); \
	else \
		echo "Kind cluster '$(PROJECT_NAME)' not found. Create it with 'make kind-create-cluster' and try again."; \
		exit 1; \
	fi

##@ Argo
argo-cd-install: ## Install argocd
	@kubectl create namespace argocd || true
	@kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

argo-cd-login: ## Login to argocd
	@argocd login --insecure localhost:8088 --username admin --password $(shell kubectl get secret -n argocd argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

argo-cd-ui: ## Access argocd ui
	@kubectl port-forward svc/argocd-server -n argocd 8088:443

argo-cd-password: ## Get argocd password
	@kubectl get secret -n argocd argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo

##@ Docker
docker-build: ## Build docker image
	docker build -t $(PROJECT_NAME):latest .

##@ Plugin
plugin-svc: ## Deploy the plugin to the cluster
	@kubectl port-forward svc/tenant-generator-plugin -n argocd 4355:8080

##@ Development
start-dev: ## Start development server
	@uv run plugin/main.py
