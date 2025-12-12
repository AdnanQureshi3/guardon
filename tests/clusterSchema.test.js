const { parseSchemaText, summarizeSchema } = require("../src/utils/clusterSchema.js");

describe("clusterSchema utilities", () => {
  test("parses OpenAPI JSON", async () => {
    const text = JSON.stringify({ openapi: "3.0.0", paths: {} });
    const parsed = await parseSchemaText(text);
    expect(parsed.openapi).toBeTruthy();
    const s = summarizeSchema(parsed);
    expect(s.hasOpenAPI).toBe(true);
    expect(s.crdCount).toBe(0);
  });

  test("parses CRD YAML", async () => {
    const yaml = `apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: foos.example.com
spec:
  group: example.com
  scope: Namespaced
  names:
    plural: foos
    singular: foo
    kind: Foo
`;
    const parsed = await parseSchemaText(yaml);
    expect(Array.isArray(parsed.crds)).toBe(true);
    expect(parsed.crds.length).toBe(1);
    const s = summarizeSchema(parsed);
    expect(s.hasOpenAPI).toBe(false);
    expect(s.crdCount).toBe(1);
  });
});
