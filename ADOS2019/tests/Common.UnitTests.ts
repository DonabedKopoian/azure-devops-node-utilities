import * as path from "path";
import * as assert from "assert";
import * as ttm from "azure-pipelines-task-lib/mock-test";
import * as nu from "azure-devops-node-utilities";

describe("Common.UnitTests", function () {

	before(function () {

	});

	after(() => {

	});

	describe("#getWebApi()", function () {

		it.skip("Need to design a mock for asserting the call to createWithBearerToken() in the vm.WebApi.", async function () {
			// Arrange
			this.timeout(3000);

			// Act


			// Arrange

		});

	});

	describe("#getFileExtension()", function () {

		it("Should get proper file extension.", function (done: MochaDone) {
			// Arrange
			this.timeout(3000);
			const fakeFileName: string = "C:\\Users\\Testers\\Desktop\\SomeFile.2019.to.vx3";

			// Act
			const actualExtension: string | undefined = nu.getFileExtension(fakeFileName);

			// Assert
			assert.strictEqual(actualExtension, ".vx3");
			done();
		});

		it("Should return undefined when there is no extension found.", function (done: MochaDone) {
			// Arrange
			this.timeout(3000);
			const fakeFileName: string = "C:\\Users\\Testers\\Desktop\\SomeFolder";

			// Act
			const actualExtension: string | undefined = nu.getFileExtension(fakeFileName);

			// Assert
			assert.strictEqual(actualExtension, undefined);
			done();
		});

	});

	describe("#getFilesListFromPathInput()", function () {

		it.skip("I'll need to mock tl to hopefully unit test these...", function (done: MochaDone) {
			// Arrange
			this.timeout(3000);

			// Act


			// Assert

			done();
		})

	});

});