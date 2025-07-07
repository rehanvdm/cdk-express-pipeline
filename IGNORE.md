```text
workflows: {
  github: {
    workingDir: ".",

    synth: {
      buildWorkflowPath: {
        type: "preset-npm", "manual-workflow"
        "manual-workflow": { // If specifying manual-workflow, define the name of the workflow to call before
          workflowName: "",
        },
        "preset-npm": {
          nodeVersion: 20
        }
      },
      commands: {
        dev: 'npm run cdk synth '**' -c env=dev --cdk.out=cdk.out/dev',
        prod: 'npm run cdk synth '**' -c env=prod --cdk.out=cdk.out/prod'
      }
    },
    diff: {
      on: {
        pull_requests: {
          branches: [""]
        }
      }
      assumeRoleArn: "",
      assumeRegion: "",
      stackSelector: "wave" | "stage"
      command: {
        dev: 'npm run cdk diff {stackSelector} --app=cdk.out/dev', // Only extract the cdkOutDir to the "corymhall/cdk-diff-action@v2", rest auto generate
        prod: 'npm run cdk diff {stackSelector} --app=cdk.out/prod'
      },
      writeAsComment: true // default, then use "corymhall/cdk-diff-action@v2" instead of just normak cdk diff
    },
    deploy: {
      on: {
        push: {
          branches
        }
        tags: {
          ...
        }
      },
      assumeRoleArn: "",
      assumeRegion: "",
      stackSelector: "wave" | "stage" // Leave till later, coz would need to know stack depenendcies more complicated // | "stack",
      command: {
        dev: 'npm run cdk deploy {stackSelector} --app=cdk.out/dev --concurrency 5 --require-approval never --exclusively',
        prod: 'npm run cdk deploy {stackSelector} --app=cdk.out/prod --concurrency 5 --require-approval never --exclusively'
      },
    }
  },

}


```