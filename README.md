# ArgoCD Plugin Generator Demo

This repository demonstrates how to create a custom generator plugin for ArgoCD ApplicationSet.
The plugin generates ArgoCD Applications based on data stored in a PostgreSQL database.

- The plugin service source code is in `/plugin`.
- First, create the sample postgres service by running :

```sh
kubectl apply -f manifests/postgres-manifests.yaml -n argocd
```

- Then, create the plugin service in k8s cluster by running :

```sh
kubectl apply -f manifests/plugin-manifests.yaml -n argocd
```

- Finally, `/argocd` has the `applicationset.yaml` which can be applied ona k8s cluster that has ArgoCD installed by running :

```sh
kubectl apply -f argocd/applicationset.yaml -n argocd
```

- The Docker image can be pulled by running :

```sh
make kind-load-image
```

Here's how the flow looks like :

```text
[Custom Generator Plugin] --> [ApplicationSet] --> [Argo CD Applications]
      ^                             |
      |                             v
[PostgreSQL Database]        [Kubernetes Cluster]
```

## References

- https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Generators-Plugin/
- https://tanmay-bhat.github.io/posts/argocd-plugin-generator-multitenant-deployment/