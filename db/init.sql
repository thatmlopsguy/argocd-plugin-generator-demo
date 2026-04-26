CREATE DATABASE organization;

\c organization;

-- Organizations
CREATE TABLE organization (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Projects
CREATE TABLE project (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    repo_url VARCHAR(500),
    chart VARCHAR(255),
    target_revision VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, slug)
);

-- Environments
CREATE TABLE environment (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, slug)
);

-- Tenants
CREATE TABLE tenant (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    status VARCHAR(50) CHECK (status IN ('active', 'inactive', 'trial', 'de-provisioned')) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, slug)
);

-- Tenant-Project-Environment assignments
CREATE TABLE tenant_project_environment (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER NOT NULL REFERENCES tenant(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    environment_id INTEGER NOT NULL REFERENCES environment(id) ON DELETE CASCADE,
    enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, project_id, environment_id)
);

-- Seed data: organization
INSERT INTO organization (name, slug) VALUES ('Demo Corp', 'demo-corp');

-- Seed data: projects
INSERT INTO project (organization_id, name, slug, repo_url, chart, target_revision) VALUES
(1, 'Podinfo', 'podinfo', 'https://stefanprodan.github.io/podinfo', 'podinfo', '6.7.0'),
(1, 'Nginx', 'nginx', 'https://charts.bitnami.com/bitnami', 'nginx', '18.1.0');

-- Seed data: environments
INSERT INTO environment (organization_id, name, slug, sort_order) VALUES
(1, 'Development', 'dev', 1),
(1, 'Staging', 'stg', 2),
(1, 'Production', 'prod', 3);

-- Seed data: tenants
INSERT INTO tenant (organization_id, name, slug, status) VALUES
(1, 'Acme Corp', 'acme-corp', 'active'),
(1, 'Beta Solutions', 'beta-solutions', 'de-provisioned'),
(1, 'Gamma Industries', 'gamma-industries', 'trial'),
(1, 'Delta Technologies', 'delta-technologies', 'inactive'),
(1, 'Echo Innovations', 'echo-innovations', 'active'),
(1, 'Foxtrot Consulting', 'foxtrot-consulting', 'de-provisioned'),
(1, 'Global Tech', 'global-tech', 'trial'),
(1, 'Horizon Enterprises', 'horizon-enterprises', 'inactive'),
(1, 'Innova Systems', 'innova-systems', 'active'),
(1, 'Jupiter Networks', 'jupiter-networks', 'trial');

-- Seed data: assignments (active/trial tenants get dev+stg, some get prod)
-- Acme Corp: all envs for podinfo, dev+stg for nginx
INSERT INTO tenant_project_environment (tenant_id, project_id, environment_id) VALUES
(1, 1, 1), (1, 1, 2), (1, 1, 3),
(1, 2, 1), (1, 2, 2);

-- Gamma Industries (trial): dev only for both projects
INSERT INTO tenant_project_environment (tenant_id, project_id, environment_id) VALUES
(3, 1, 1), (3, 2, 1);

-- Echo Innovations: all envs for podinfo
INSERT INTO tenant_project_environment (tenant_id, project_id, environment_id) VALUES
(5, 1, 1), (5, 1, 2), (5, 1, 3);

-- Global Tech (trial): dev+stg for podinfo
INSERT INTO tenant_project_environment (tenant_id, project_id, environment_id) VALUES
(7, 1, 1), (7, 1, 2);

-- Innova Systems: all envs for both projects
INSERT INTO tenant_project_environment (tenant_id, project_id, environment_id) VALUES
(9, 1, 1), (9, 1, 2), (9, 1, 3),
(9, 2, 1), (9, 2, 2), (9, 2, 3);

-- Jupiter Networks (trial): dev for podinfo
INSERT INTO tenant_project_environment (tenant_id, project_id, environment_id) VALUES
(10, 1, 1);
