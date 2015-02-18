﻿<%@ Page Language="C#" MasterPageFile="~masterurl/default.master" Inherits="Microsoft.SharePoint.WebPartPages.WebPartPage, Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<%@ Register TagPrefix="Utilities" Namespace="Microsoft.SharePoint.Utilities" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register TagPrefix="WebPartPages" Namespace="Microsoft.SharePoint.WebPartPages" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>
<%@ Register TagPrefix="SharePoint" Namespace="Microsoft.SharePoint.WebControls" Assembly="Microsoft.SharePoint, Version=15.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c" %>

<asp:Content ContentPlaceHolderID="PlaceHolderAdditionalPageHead" runat="server">
	<SharePoint:ScriptLink Name="sp.js" runat="server" OnDemand="false" LoadAfterUI="true" Localizable="false" />
	<SharePoint:ScriptLink Name="sp.runtime.js" runat="server" OnDemand="false" LoadAfterUI="true" Localizable="false" />
	<SharePoint:ScriptLink Name="SP.RequestExecutor.js" runat="server" OnDemand="false" LoadAfterUI="true" Localizable="false" />

	<script type="text/javascript" src="Scripts/External/external_bundle.js"></script>
	<script type="text/javascript" src="Scripts/build/build_config.js"></script>
	<script type="text/javascript" src="Scripts/init.js?v=2"></script>

	<link rel="Stylesheet" type="text/css" href="Content/css/css_bundle.css?v=2" />
	
	<style type="text/css">
		#s4-ribbonrow {
			display: none;
		}
	</style>

	<script type="text/javascript">
		ExecuteOrDelayUntilScriptLoaded(function () {
			angular.bootstrap(jQuery("#ng-app-FaqApp")[0], ["EditFaqApp"]);
		}, "faq.angular.app");
	</script>

</asp:Content>

<asp:Content ContentPlaceHolderID="PlaceHolderMain" runat="server">
	<WebPartPages:AllowFraming ID="AllowFraming" runat="server" />

	<div id="ng-app-FaqApp" data-ng-controller="LicensingCtrl" data-block="lockDeferred">
		<div data-ng-if="showIfLicenseValid()">
			<toast></toast>
			<ng-form name="faqForm">
				<div ng-view class="slide-animate"></div>
			</ng-form>
		</div>
	</div>

	<!-- Trick to make Rich Text Editor working -->
	<div style="display: none">
		<WebPartPages:WebPartZone runat="server" FrameType="TitleBarOnly" ID="full" Title="loc:full">
			<WebPartPages:XsltListViewWebPart runat="server" ListUrl="Lists/Faq" IsIncluded="True"
				NoDefaultStyle="TRUE" Title="XsltListView web part" PageType="PAGE_NORMALVIEW"
				Default="False" ViewContentTypeId="0x">
			</WebPartPages:XsltListViewWebPart>
		</WebPartPages:WebPartZone>
	</div>
</asp:Content>