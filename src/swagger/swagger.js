const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

function loadYaml(name) {
  return YAML.load(path.join(__dirname, name));
}

function buildSpec() {
  const base = loadYaml('index.yaml');

  const modules = [
    loadYaml('financials.yaml'),
    loadYaml('operations.yaml'),
    loadYaml('product.yaml'),
    loadYaml('inventory.yaml'),
    loadYaml('cx.yaml'),
    loadYaml('workforce.yaml'),
    loadYaml('dashboard.yaml'),
  ];

  base.paths = base.paths || {};
  base.components = base.components || {};

  for (const mod of modules) {
    if (mod.paths) {
      base.paths = { ...base.paths, ...mod.paths };
    }

    if (mod.components) {
      base.components = { ...base.components, ...mod.components };
    }

    if (Array.isArray(mod.tags)) {
      base.tags = [...(base.tags || []), ...mod.tags];
    }
  }

  return base;
}

const setupSwagger = (app) => {
  const swaggerDocument = buildSpec();
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  // eslint-disable-next-line no-console
  console.log('Swagger Docs disponible en /api-docs');
};

module.exports = setupSwagger;
