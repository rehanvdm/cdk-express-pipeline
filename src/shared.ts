export interface MermaidDiagramOutput {
  /**
   * The path where the Mermaid diagram will be saved. If not provided defaults to root
   * */
  readonly path?: string;

  /**
   * Must end in `.md`. If not provided, defaults to cdk-express-pipeline-deployment-order.md
   * */
  readonly fileName?: string;
}