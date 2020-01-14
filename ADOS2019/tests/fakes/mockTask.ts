import * as tl from "azure-pipelines-task-lib/task";
import * as vf from "azure-devops-node-utilities/VersionFile";

async function run() {
	try {
		const testMode: string | undefined = tl.getInput("testMode", true);
		const testFilePath: string | undefined = tl.getInput("testFilePath", true);
		const revision: string | undefined = tl.getInput("revision", true);
		if (testMode && testFilePath && revision) {
			const versionFile: vf.IVersionFile = new vf.CsNetLegacyVersionFile([testFilePath]);
			switch (testMode) {
				case "increment": {
					versionFile.incrementRevision();
					break;
				}
				case "insert": {
					versionFile.insertRevision(parseInt(revision));
					break;
				}
				default: {
					throw new Error("Invalid testMode used in mock-run test file.");
				}
			}
		}
		else {
			throw new Error("Either the testMode, testFilePath, or revision is undefined.")
		}
	}
	catch (err) {
		tl.setResult(tl.TaskResult.Failed, err.message);
	}
}

run();