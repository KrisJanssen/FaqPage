﻿(function () {
	"use strict";

	angular.module("FaqApp.controllers").controller("LicensingCtrl", [
		"$scope", "faqService", "$location", "$q", "processing", "licenseStatus", "licensing", "context", "$window",
		function ($scope, faqService, $location, $q, processing, licenseStatus, licensing, context, $window) {
			processing.initilize($scope);
			$scope.lockDeferred = licensing.getLicenseStatus();

			$scope.isAppPart = window.parent !== window;

			$scope.lockDeferred.then(function (license) {
				$scope.underTrial = license.status === licenseStatus.UnderTrial;
				$scope.licensed = license.status === licenseStatus.Licensed;
				$scope.trialExpired = license.status === licenseStatus.TrialExpired;
				$scope.licenseNotValid = license.status === licenseStatus.LicenseNotValid;
				$scope.daysLeft = license.daysLeft;
				$scope.assetId = license.assetId;
			}, function(error) {
				alert(error);
			});

			$scope.navigateToBuy = function () {
				//SP.Utilities.HttpUtility.urlKeyValueEncode
				$window.location.href = String.format("{0}_layouts/15/storefront.aspx?source={1}#vw=AppDetailsView,app={2},clg=0,bm=US,cm=en-US", 
					context.spHostUrl, SP.Utilities.HttpUtility.urlKeyValueEncode($window.location.href), $scope.assetId);
			}
		}
	]);
})();