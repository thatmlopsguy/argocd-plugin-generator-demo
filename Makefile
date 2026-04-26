.DEFAULT_GOAL := help

# Project Setup
PROJECT_NAME := argocd-plugin-generator-demo

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

##@ Argo
argo-cd-install: ## Install argocd
	@kubectl create namespace argocd || true
	@kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

argo-cd-login: ## Login to argocd
	@argocd login --insecure localhost:8088 --username admin --password $(shell kubectl get secret -n argocd argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)

argo-cd-ui: ## Access argocd ui
	@kubectl port-forward svc/argo-cd-argocd-server -n argocd 8088:443

argo-cd-password: ## Get argocd password
	@kubectl get secret -n argocd argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo