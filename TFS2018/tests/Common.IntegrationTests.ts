import * as path from "path";
import * as assert from "assert";
import * as vm from "azure-devops-node-api";
import * as ttm from "azure-pipelines-task-lib/mock-test";
import * as nu from "azure-devops-node-utilities";

describe("Common.IntegrationTests", function () {

	before(function () {

	});

	after(() => {

	});

	describe("#getWebApi()", function () {

		it.skip("Should get a valid WebApi object.", async function () {
			// Arange
			this.timeout(3000);
			// Will possibly need to fake this test using tl mock lib,
			// Tricking the System.TeamFoundationCollectionUri is going
			// to be the tricky part unless I run this test during a build,
			// which is kinda ugly... a new developer could add integration tests
			// that inadvertently negatively impact the TFS/ADOS instance

			// Act
			const actualWebApi: vm.WebApi = await nu.getWebApi();

			// Assert
			assert.notStrictEqual(actualWebApi, undefined);
		});

	});
	
});