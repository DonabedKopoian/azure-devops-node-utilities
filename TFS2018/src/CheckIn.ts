import * as fs from "fs";
import * as vm from "azure-devops-node-api";
import * as tfvca from "azure-devops-node-api/TfvcApi";
import * as tfvci from "azure-devops-node-api/interfaces/TfvcInterfaces";
import * as gita from "azure-devops-node-api/GitApi";
import * as giti from "azure-devops-node-api/interfaces/GitInterfaces";
import * as tl from "azure-pipelines-task-lib/task";
import * as cm from "./Common";
import * as vf from "./VersionFile";

/**
 * Describes a Git version control commit/push.
 */
export interface GitCommitPush {
	/**
	 * The list of Git version control file changes.
	 */
	gitFileChanges: GitFileChange[],
	/**
	 * The commit comment to use.
	 */
	comment: string
}

/**
 * Describes a Git version control file change.
 */
export interface GitFileChange {
	/**
	* This is the full path of the file on the build agent's source directory.
	*/
	fullFilePath: string,
	/**
	* The type of change for the file.
	* NOTE: Only add, edit, and delete are currently supported.
	*/
	changeType: giti.VersionControlChangeType

}

/**
 * Describes a Team Foundation version control check-in.
 */
export interface TfvcCheckIn {
	/**
	 * The list of Team Foundation version control file changes.
	 */
	tfvcFileChanges: TfvcFileChange[],
	/**
	 * The check-in comment to use.
	 */
	comment: string,
	/**
	 * The policy override comment to use.
	 */
	policyOverrideComment: string
}

/**
 * Describes a Team Foundation version control file change.
 */
export interface TfvcFileChange {
	/**
	 * This is the full path of the file on the build agent's source directory.
	 */
	fullFilePath: string,
	/**
	* The type of change for the file.
    * NOTE: Only add, edit, and delete are currently supported.
    *		Modify checkInTfvcChanges() to support additional file types.
	*/
	changeType: tfvci.VersionControlChangeType
}

/**
 * Pushes all Git version control changes from the build agent's workspace
 * using the given GitPush item.
 * @param gitCommitPush The object representing the Git version control commit/push.
 * @param projId The ID of the project to which the check-in should be committed against.
 * @returns A promise of a GitPush object which can be used for verification purposes.
 */
export async function pushGitChanges(gitCommitPush: GitCommitPush, projId: string): Promise<giti.GitPush> {
	return new Promise<giti.GitPush>(async (resolve) => {
		const vsts: vm.WebApi = await cm.getWebApi();
		let gitApi: gita.IGitApi = await vsts.getGitApi();
		console.log("Preparing git push...");
		const changes: giti.GitChange[] = await getGitChanges(gitCommitPush);
		const repoId: string | undefined = tl.getVariable("Build.Repository.ID");
		let gitPush: giti.GitPush = <giti.GitPush>{
			commits: [
				{
					changes: changes,
					comment: gitCommitPush.comment,
				}
			],
			refUpdates: [
				{
					name: tl.getVariable("Build.SourceBranch"),
					oldObjectId: getSourceCommitId()
				}
			],
		}
		if (repoId) {
			resolve(gitApi.createPush(gitPush, repoId, projId));
		}
		else {
			throw new Error("Build.Repository.ID returned undefined.");
		}
	});
}

/**
 * Checks in all Team Foundation version control changes from the build agent's workspace
 * using the given TfvcCheckIn item.
 * @param tfvcCheckIn The object representing the Team Foundation version control check-in.
 * @param projId The ID of the project to which the check-in should be committed against.
 * @returns A promise of a TfvcChangesetRef object which can be used for verification purposes.
 */
export async function checkInTfvcChanges(tfvcCheckIn: TfvcCheckIn, projId: string): Promise<tfvci.TfvcChangesetRef> {
	return new Promise<tfvci.TfvcChangesetRef>(async (resolve) => {
		const vsts: vm.WebApi = await cm.getWebApi();
		let tfvcApi: tfvca.ITfvcApi = await vsts.getTfvcApi();
		console.log("Preparing tfvc changeset...");
		const changes: tfvci.TfvcChange[] = await getTfvcChanges(tfvcCheckIn);
		// Set the changeset
		let changeset: tfvci.TfvcChangeset = <tfvci.TfvcChangeset><unknown>{
			changes: changes,
			comment: tfvcCheckIn.comment,
			hasMoreChanges: true,
			policyOverride: {
				comment: tfvcCheckIn.policyOverrideComment,
				policyFailures: []
			}
		};
		// Create it (check-in)
		resolve(await tfvcApi.createChangeset(changeset, projId));
	});
}

function getSourceCommitId(): string {
	let args: string[] = new Array();
	args.push("rev-parse");
	args.push("@");
	// git.exe is used here to get the source commit ID
	// NOTE: Trim this string or \R will be at the end.
	let sourceCommitId: string = tl.execSync("git", args).stdout.trim();
	tl.debug(`Commit ID: ${sourceCommitId}`);
	return sourceCommitId;
}

async function getGitChanges(gitCommitPush: GitCommitPush): Promise<giti.GitChange[]> {
	return new Promise(async (resolve) => {
		const backslashRegex: RegExp = new RegExp(/\\/, "g");
		console.log("Preparing git push...");
		let encodingValues: vf.EncodingValues;
		let newContent: giti.ItemContent | undefined = undefined;
		let path: string;
		let changes: giti.GitChange[] = new Array();
		const localPath: string | undefined = tl.getVariable("Build.Repository.LocalPath");
		for (var gitFileChange of gitCommitPush.gitFileChanges) {
			encodingValues = await vf.getEncodingFromTextFileBom(gitFileChange.fullFilePath)
			newContent = undefined;
			if (gitFileChange.changeType !== giti.VersionControlChangeType.Delete) {
				newContent = <giti.ItemContent>{
					content: fs.readFileSync(gitFileChange.fullFilePath, { encoding: encodingValues.encoding }),
					contentType: giti.ItemContentType.RawText
				};
			}
			if (localPath) {
				path = gitFileChange.fullFilePath.replace(localPath, "").replace(backslashRegex, "/");
				tl.debug(`Adding ${path} to commit.`);
				changes.push(<giti.GitChange>{
					changeType: gitFileChange.changeType,
					item: {
						path: path
					},
					newContent: newContent
				});
			}
		}
		resolve(changes);
	});
}

// This is hack, but TFVC, unlike Git, forces us to use the specific latest changeset for the file with
// edit and deletes (for adds, we use changeset number 0 to signify the add).
// Git allows the build changeset to be used regardless if the file is in that specific changeset or not.
async function getTfvcChanges(tfvcCheckIn: TfvcCheckIn): Promise<tfvci.TfvcChange[]> {
	return new Promise(async (resolve) => {
		const changesetRegex: RegExp = new RegExp(/\d+/);
		let convertedPath: string;
		let version: number;
		let encodingValues: vf.EncodingValues;
		let newContent: tfvci.ItemContent | undefined;
		// Create the changes with the server file path
		let changes: tfvci.TfvcChange[] = new Array();
		tl.debug("Adding the following files:");
		for (var tfvcFileChange of tfvcCheckIn.tfvcFileChanges) {
			convertedPath = getConvertedPath(tfvcFileChange.fullFilePath);
			version = 0;
			if (tfvcFileChange.changeType !== tfvci.VersionControlChangeType.Add) {
				version = getVersionForExistingFiles(convertedPath, changesetRegex);
			}
			tl.debug(`${version}`);
			encodingValues = await vf.getEncodingFromTextFileBom(tfvcFileChange.fullFilePath);
			newContent = undefined;
			// Get newContent version File data only if we are editing/adding the file
			if (tfvcFileChange.changeType !== tfvci.VersionControlChangeType.Delete) {
				newContent = <tfvci.ItemContent>{
					content: fs.readFileSync(tfvcFileChange.fullFilePath, { encoding: encodingValues.encoding }),
					contentType: tfvci.ItemContentType.RawText
				};
			}
			changes.push(<tfvci.TfvcChange><unknown>{
				changeType: tfvcFileChange.changeType,
				item: {
					isPendingChange: true,
					encoding: encodingValues.codePage,
					path: convertedPath,
					contentMetadata: {
						encoding: encodingValues.codePage,
						fileName: tfvcFileChange.fullFilePath
					},
					version: version
				},
				newContent: newContent
			});
		}
		resolve(changes);
	});
}

// This is hack, but these are the reasons for it:
// 1. There is no mechanism that allows converting a local file path back
//	  to a tfvc server path by Microsoft.  As a matter of fact, tl.getPathInput()
//	  automatically provides the local file paths from a server path, making this difficult.
// 2. There is no possible way to get tfvc workspaces from a build in any way, shape, or form.
//	  There is an Interface for Workspaces, but the Node API does not use it and it is not supported with Rest API.
// 3. There is no way to get the folder used in addition to Build.SourcesDirectory, and this is required to
//	  separate different projects that have potential name conflicts.  For instance,
//	  C# .NET Standard/Core projects where two projects from separate repositories have the same name
//	  would likely cause build failures since those projects automatically pick up all files.
//	  You could require that use of the task mandates using Build.SourcesDirectory with a blank subfolder,
//	  but then you are limiting the environment this task can succeed in.
// 4. I have to call tf stat for each file, or the convertedPath Array will be out-of-order from the originalPath array.
//	  This is because the output of tf stat is not necessarily in order of the files it was given to search for.
function getConvertedPath(workspaceFullFilePath: string): string {
	let args: string[] = new Array();
	let convertedPath: string = "";
	const folderRegex: RegExp = new RegExp(/^\$\/.*$/, "gm");
	const fileRegex: RegExp = new RegExp(/^[^$].*?(edit|add|delete)/, "gm");
	const fileReplaceRegex: RegExp = new RegExp(/(edit|add|delete)/, "g");
	args.push("stat");
	// We only want to get the version file changes.
	args.push(workspaceFullFilePath);
	args.push("/loginType:OAuth");
	args.push(`/login:.,${tl.getVariable("System.AccessToken")}`);
	args.push("/noprompt");
	// TF.exe is used here to convert the local file paths to tfvc server paths.
	// See above for explanation.
	let stdout: string = tl.execSync("tf", args).stdout;
	let folderGroups: RegExpMatchArray | null = stdout.match(new RegExp(/\$\/[^$]*/, "g"));
	if (folderGroups) {
		for (var folderGroup of folderGroups) {
			let folder: RegExpMatchArray | null = folderGroup.match(folderRegex);
			// We expect the files are being edited, added, or deleted.
			// Any additional change type support will need to be performed here.
			let files: RegExpMatchArray | null = folderGroup.match(fileRegex);
			// We know it won't be null, but TypeScript won't
			if (folder && files) {
				// We're only expecting one file and folder match, so use that for all files.
				// Remove the edit, add, or deleted part of the file regex return.
				convertedPath = `${folder[0]}/${files[0].replace(fileReplaceRegex, "").trim()}`;
			}
		}
	}
	else {
		throw new Error("No file changes were detected.  Verify all file changes occurred prior to this call.");
	}
	return convertedPath;
}

// NOTE:  Ensure changesetRegex is not flagged with global.
function getVersionForExistingFiles(serverPath: string, changesetRegex: RegExp): number {
	tl.debug(serverPath);
	let args = new Array();
	args.push("history");
	args.push(serverPath);
	args.push("/recursive");
	args.push(`/collection:${tl.getVariable("System.TeamFoundationCollectionUri")}`);
	args.push("/loginType:OAuth");
	args.push(`/login:.,${tl.getVariable("System.AccessToken")}`);
	args.push("/stopafter:1");
	args.push("/noprompt");
	// TF.exe is used here to determine the latest changeset for the file being changed.
	// In .NET Framework this was automatic, but not in Node API.
	let stdout = tl.execSync("tf", args).stdout;
	tl.debug("STDOUT:");
	tl.debug(stdout);
	let changesetVersion: RegExpMatchArray | null = stdout.match(changesetRegex);
	if (changesetVersion) {
		// Just go with the first match.  This should not be global anyway so only one match should return.
		tl.debug(`Changeset: ${changesetVersion[0]}`);
		return parseInt(changesetVersion[0]);
	}
	return 0;
}