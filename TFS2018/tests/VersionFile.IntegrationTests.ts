import * as path from "path";
import * as assert from "assert";
import * as ttm from "azure-pipelines-task-lib/mock-test";
import * as vf from "azure-devops-node-utilities/VersionFile";

describe("VersionFile.IntegrationTests", function () {

	before(function () {

	});

	after(() => {

	});

	describe("-CsNetLegacyVersionFile", function () {

		describe("#insertRevision()", function () {

			it.skip("Create Integration Tests", async function () {
				// Arrange
				this.timeout(3000);

				// Act


				// Assert

			});

			it.skip("Refactor Test.", function (done: MochaDone) {
				this.timeout(3000);
				let versionFile = new vf.CsNetLegacyVersionFile([path.join(__dirname, "..", "_files", "AssemblyInfo3.cs")]);
				assert.equal(versionFile.insertRevision(42), true, "Insert call returned false.");
				assert.equal(versionFile.getFullVersion(), "1.0.42", "Wrong version set.");
				versionFile = new vf.CsNetLegacyVersionFile([path.join(__dirname, "..", "_files", "AssemblyInfo4.cs")]);
				assert.equal(versionFile.insertRevision(42), true, "Insert call returned false.");
				assert.equal(versionFile.getFullVersion(), "1.0.7.42", "Wrong version set.");
				done();
			});

			it.skip("Refactor Test.", function (done: MochaDone) {
				this.timeout(3000);

				let tp: string = path.join(__dirname, "..", "mocker", "insertAtMax.js");
				let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

				tr.run();
				console.log(tr.stdout);
				console.log(tr.succeeded);
				assert.equal(tr.succeeded, true, "Should have succeeded.");
				assert.equal(tr.warningIssues.length, 1, "Should have one warning.");
				assert.equal(tr.errorIssues.length, 0, "Should have no errors.");
				done();
			});

			it.skip("Refactor Test.", function (done: MochaDone) {
				this.timeout(3000);

				let tp: string = path.join(__dirname, "..", "mocker", "insertPastMax.js");
				let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

				tr.run();
				// NOTE: Do not print out stdout since it contains an error messages
				// that causes the npm test task on a build pipeline to fail.
				console.log(tr.succeeded);
				assert.equal(tr.succeeded, false, "Should have failed.");
				assert.equal(tr.warningIssues.length, 0, "Should have zero warnings.");
				assert.equal(tr.errorIssues.length, 1, "Should have one error.");
				done();
			});

		});

		describe("#incrementRevision()", function () {

			it.skip("Create Integration Tests", async function () {
				// Arrange
				this.timeout(3000);

				// Act


				// Assert

			});

			it.skip("Refactor Test.", function (done: MochaDone) {
				this.timeout(3000);
				let versionFile = new vf.CsNetLegacyVersionFile([path.join(__dirname, "..", "_files", "AssemblyInfoNoVersion.cs")]);
				assert.equal(versionFile.incrementRevision(), false, "Increment call unexpectedly returned true.");
				assert.equal(versionFile.insertRevision(1), false, "Insert call unexpectedly returned true.");
				assert.equal(versionFile.getFullVersion(), null, "Expected a null getFullVersion.");
				done();
			});

			it.skip("Refactor Test.", function (done: MochaDone) {
				this.timeout(3000);
				let versionFile = new vf.CsNetLegacyVersionFile([path.join(__dirname, "..", "_files", "AssemblyInfo3.cs")]);
				assert.equal(versionFile.incrementRevision(), true, "Increment call returned false.");
				assert.equal(versionFile.getFullVersion(), "1.0.1", "Wrong version set.");
				versionFile = new vf.CsNetLegacyVersionFile([path.join(__dirname, "..", "_files", "AssemblyInfo4.cs")]);
				assert.equal(versionFile.incrementRevision(), true, "Increment call returned false.");
				assert.equal(versionFile.getFullVersion(), "1.0.7.1", "Wrong version set.");
				done();
			});

			it.skip("Refactor Test.", function (done: MochaDone) {
				this.timeout(3000);

				let tp: string = path.join(__dirname, "..", "mocker", "incrementToMax.js");
				let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

				tr.run();
				console.log(tr.stdout);
				console.log(tr.succeeded);
				assert.equal(tr.succeeded, true, "Should have succeeded.");
				assert.equal(tr.warningIssues.length, 1, "Should have one warning.");
				assert.equal(tr.errorIssues.length, 0, "Should have no errors.");
				done();
			});

			it.skip("Refactor Test.", function (done: MochaDone) {
				this.timeout(3000);

				let tp: string = path.join(__dirname, "..", "mocker", "incrementPastMax.js");
				let tr: ttm.MockTestRunner = new ttm.MockTestRunner(tp);

				tr.run();
				// NOTE: Do not print out stdout since it contains an error messages
				// that causes the npm test task on a build pipeline to fail.
				console.log(tr.succeeded);
				assert.equal(tr.succeeded, false, "Should have failed.");
				assert.equal(tr.warningIssues.length, 0, "Should have zero warnings.");
				assert.equal(tr.errorIssues.length, 1, "Should have one error.");
				done();
			});

		});

		describe("#getFullVersion()", function () {

			it.skip("Create Integration Tests", async function () {
				// Arrange
				this.timeout(3000);

				// Act


				// Assert

			});

			it.skip("Refactor Test.", function (done: MochaDone) {
				this.timeout(3000);
				try {
					vf.checkRevision(NaN);
					assert.fail("Passing NaN should have thrown an exception.");
				}
				catch { }
				done();
			});

			it.skip("Refactor Test.", function (done: MochaDone) {
				this.timeout(3000);
				try {
					vf.checkRevision(65536);
					assert.fail("Passing NaN should have thrown an exception.");
				}
				catch { }
				done();
			});

			it.skip("Refactor Test.", function (done: MochaDone) {
				this.timeout(3000);
				try {
					vf.checkRevision(65535);
				}
				catch (err) {
					assert.fail(`Exception of ${err} unexpectedly received.`);
				}
				done();
			});

		});

	});

	describe("-CsNetCoreSdkVersionFile", function () {

		describe("#insertRevision()", function () {

			it.skip("Create Integration Tests", async function () {
				// Arrange
				this.timeout(3000);

				// Act


				// Assert

			});

			it.skip("Refactor Test.", function (done: MochaDone) {
				this.timeout(3000);
				let versionFile = new vf.CsNetCoreSdkVersionFile([path.join(__dirname, "..", "_files", "TestLibrary3.csproj")]);
				assert.equal(versionFile.insertRevision(4), true, "Insert call returned false.");
				assert.equal(versionFile.getFullVersion(), "1.2.4-alpha", "Wrong version set.");
				versionFile = new vf.CsNetCoreSdkVersionFile([path.join(__dirname, "..", "_files", "TestLibrary4.csproj")]);
				assert.equal(versionFile.insertRevision(4), true, "Insert call returned false.");
				assert.equal(versionFile.getFullVersion(), "1.2.7.4", "Wrong version set.");
				done();
			});

		});

		describe("#incrementRevision()", function () {

			it.skip("Create Integration Tests", async function () {
				// Arrange
				this.timeout(3000);

				// Act


				// Assert

			});

			it.skip("Refactor Test.", function (done: MochaDone) {
				this.timeout(3000);
				let versionFile = new vf.CsNetCoreSdkVersionFile([path.join(__dirname, "..", "_files", "TestLibrary3.csproj")]);
				assert.equal(versionFile.incrementRevision(), true, "Increment call returned false.");
				assert.equal(versionFile.getFullVersion(), "1.2.1-alpha", "Wrong version set.");
				versionFile = new vf.CsNetCoreSdkVersionFile([path.join(__dirname, "..", "_files", "TestLibrary4.csproj")]);
				assert.equal(versionFile.incrementRevision(), true, "Increment call returned false.");
				assert.equal(versionFile.getFullVersion(), "1.2.7.1", "Wrong version set.");
				done();
			});

		});

		describe("#getFullVersion()", function () {

			it.skip("Create Integration Tests", async function () {
				// Arrange
				this.timeout(3000);

				// Act


				// Assert

			});

		});

	});

	describe("-CppVersionFile", function () {

		describe("#insertRevision()", function () {

			it.skip("Create Integration Tests", async function () {
				// Arrange
				this.timeout(3000);

				// Act


				// Assert

			});

			it.skip("Refactor Test.", function (done: MochaDone) {
				this.timeout(3000);
				let versionFile = new vf.CppVersionFile([path.join(__dirname, "..", "_files", "Resource4.rc")]);
				assert.equal(versionFile.insertRevision(92), true, "Insert call returned false.");
				assert.equal(versionFile.getFullVersion(), "2.4.8.92", "Wrong version set.");
				done();
			});

		});

		describe("#incrementRevision()", function () {

			it.skip("Create Integration Tests", async function () {
				// Arrange
				this.timeout(3000);

				// Act


				// Assert

			});

			it.skip("Refactor Test.", function (done: MochaDone) {
				this.timeout(3000);
				let versionFile = new vf.CppVersionFile([path.join(__dirname, "..", "_files", "Resource4.rc")]);
				assert.equal(versionFile.incrementRevision(), true, "Increment call returned false.");
				assert.equal(versionFile.getFullVersion(), "2.4.8.1", "Wrong version set.");
				done();
			});

		});

		describe("#getFullVersion()", function () {

			it.skip("Create Integration Tests", async function () {
				// Arrange
				this.timeout(3000);

				// Act


				// Assert

			});

		});

	});

	describe("-GradleVersionFile", function () {

		describe("#insertRevision()", function () {

			it.skip("Create Integration Tests", async function () {
				// Arrange
				this.timeout(3000);

				// Act


				// Assert

			});

			it.skip("Refactor Test.", function (done: MochaDone) {
				this.timeout(3000);
				let versionFile = new vf.GradleVersionFile([path.join(__dirname, "..", "_files", "build3.gradle")]);
				assert.equal(versionFile.insertRevision(78), true, "Insert call returned false.");
				assert.equal(versionFile.getFullVersion(), "1.2.78", "Wrong version set.");
				versionFile = new vf.GradleVersionFile([path.join(__dirname, "..", "_files", "build4.gradle")]);
				assert.equal(versionFile.insertRevision(78), true, "Insert call returned false.");
				assert.equal(versionFile.getFullVersion(), "1.2.6.78-prealpha", "Wrong version set.");
				versionFile = new vf.GradleVersionFile([path.join(__dirname, "..", "_files", "build3.gradle.kts")]);
				assert.equal(versionFile.insertRevision(14), true, "Insert call returned false.");
				assert.equal(versionFile.getFullVersion(), "1.2.14-prealpha", "Wrong version set.");
				versionFile = new vf.GradleVersionFile([path.join(__dirname, "..", "_files", "build4.gradle.kts")]);
				assert.equal(versionFile.insertRevision(14), true, "Insert call returned false.");
				assert.equal(versionFile.getFullVersion(), "1.2.6.14", "Wrong version set.");
				done();
			});

		});

		describe("#incrementRevision()", function () {

			it.skip("Create Integration Tests", async function () {
				// Arrange
				this.timeout(3000);

				// Act


				// Assert

			});

			it.skip("Refactor Test.", function (done: MochaDone) {
				this.timeout(3000);
				let versionFile = new vf.GradleVersionFile([path.join(__dirname, "..", "_files", "build3.gradle")]);
				assert.equal(versionFile.incrementRevision(), true, "Increment call returned false.");
				assert.equal(versionFile.getFullVersion(), "1.2.1", "Wrong version set.");
				versionFile = new vf.GradleVersionFile([path.join(__dirname, "..", "_files", "build4.gradle")]);
				assert.equal(versionFile.incrementRevision(), true, "Increment call returned false.");
				assert.equal(versionFile.getFullVersion(), "1.2.6.1-prealpha", "Wrong version set.");
				versionFile = new vf.GradleVersionFile([path.join(__dirname, "..", "_files", "build3.gradle.kts")]);
				assert.equal(versionFile.incrementRevision(), true, "Increment call returned false.");
				assert.equal(versionFile.getFullVersion(), "1.2.1-prealpha", "Wrong version set.");
				versionFile = new vf.GradleVersionFile([path.join(__dirname, "..", "_files", "build4.gradle.kts")]);
				assert.equal(versionFile.incrementRevision(), true, "Increment call returned false.");
				assert.equal(versionFile.getFullVersion(), "1.2.6.1", "Wrong version set.");
				done();
			});

		});

		describe("#getFullVersion()", function () {

			it.skip("Create Integration Tests", async function () {
				// Arrange
				this.timeout(3000);

				// Act


				// Assert

			});

		});

	});

	describe("-JsonVersionFile", function () {

		describe("#insertRevision()", function () {

			it.skip("Create Integration Tests", async function () {
				// Arrange
				this.timeout(3000);

				// Act


				// Assert

			});

			it.skip("Refactor Test.", function (done: MochaDone) {
				this.timeout(3000);
				let versionFile = new vf.JsonVersionFile([path.join(__dirname, "..", "_files", "package3.json")]);
				assert.equal(versionFile.insertRevision(109), true, "Insert call returned false.");
				assert.equal(versionFile.getFullVersion(), "0.2.109-alpha", "Wrong version set.");
				versionFile = new vf.JsonVersionFile([path.join(__dirname, "..", "_files", "package4.json")]);
				assert.equal(versionFile.insertRevision(109), true, "Insert call returned false.");
				assert.equal(versionFile.getFullVersion(), "0.2.0.109", "Wrong version set.");
				done();
			});

		});

		describe("#incrementRevision()", function () {

			it.skip("Create Integration Tests", async function () {
				// Arrange
				this.timeout(3000);

				// Act


				// Assert

			});

			it.skip("Refactor Test.", function (done: MochaDone) {
				this.timeout(3000);
				let versionFile = new vf.JsonVersionFile([path.join(__dirname, "..", "_files", "package3.json")]);
				assert.equal(versionFile.incrementRevision(), true, "Increment call returned false.");
				assert.equal(versionFile.getFullVersion(), "0.2.1-alpha", "Wrong version set.");
				versionFile = new vf.JsonVersionFile([path.join(__dirname, "..", "_files", "package4.json")]);
				assert.equal(versionFile.incrementRevision(), true, "Increment call returned false.");
				assert.equal(versionFile.getFullVersion(), "0.2.0.1", "Wrong version set.");
				done();
			});

		});

		describe("#getFullVersion()", function () {

			it.skip("Create Integration Tests", async function () {
				// Arrange
				this.timeout(3000);

				// Act


				// Assert

			});

		});

	});

});