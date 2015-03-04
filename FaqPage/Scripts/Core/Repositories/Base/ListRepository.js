﻿function ListRepository(listUrl, listItemConstructor) {
	var e = Function.validateParameters(arguments, [
		{ name: "listUrl", type: String },
		{ name: "listItemConstractor", type: Function }
	], true);

	if (e) throw e;

	this._listUrl = listUrl;
	this._listItemConstructor = listItemConstructor;

	this._context = SP.ClientContext.get_current();
	this._loadListDeffered = FAQ.ListService.getListByUrl(this._listUrl);
	this._loadListDeffered.done(Function.createDelegate(this, function (list) {
		this._list = list;
	}));

	this.folder = null;
}

ListRepository.prototype = {
	getItems: function () {
		return this._getItemsByQuery(SP.CamlQuery.createAllItemsQuery());
	},

	getItemById: function (id) {
		var e = Function.validateParameters(arguments, [
			{ name: "id", type: Number }
		], true);

		if (e) throw e;

		var deferred = this._createDeferred();

		this._loadListDeffered.done(Function.createDelegate(this, function () {
			var item = this._list.getItemById(id);
			this._context.load(item);

			var self = this;

			this._context.executeQueryAsync(function () {
				var resultItem = new self._listItemConstructor(item);
				deferred.resolve(resultItem);
			}, function (sender, error) {
				deferred.reject(new RequestError(error));
			});
		}));

		return deferred.promise;
	},

	getLastItem: function () {
		var camlBuilder = new CamlBuilder();
		var caml = camlBuilder.Where().CounterField(FAQ.Fields.ID).NotEqualTo(0).OrderByDesc(FAQ.Fields.ID).ToString();
		var query = new SP.CamlQuery();
		query.set_viewXml(String.format("<View>" +
											"<Query>{0}</Query>" +
											"<RowLimit>1</RowLimit>" +
										"</View>", caml));

		return this._getItemByQuery(query);
	},

	getRootFolders: function () {
		var deferred = this._createDeferred();

		this._loadListDeffered.done(Function.createDelegate(this, function () {

			var camlBuilder = new CamlBuilder();
			var caml = camlBuilder.Where()
				.IntegerField(FAQ.Fields.FSObjType).EqualTo(1).ToString();
			var camlQuery = new SP.CamlQuery();
			camlQuery.set_viewXml(String.format("<View>" +
												"<Query>{0}</Query>" +
											"</View>", caml));

			var items = this._list.getItems(camlQuery);
			var self = this;
			this._context.load(items);
			this._context.executeQueryAsync(function () {
				var folders = [];
				var itemsEnumerator = items.getEnumerator();
				while (itemsEnumerator.moveNext()) {
					var item = itemsEnumerator.get_current();

					//FIX for Item folder - default, can't figure out how to prevent its creation
					if (item.get_item(FAQ.Fields.Title) === "Item") continue;

					folders.push(new self._listItemConstructor(item));
				}

				deferred.resolve(folders);
			}, function (sender, error) {
				deferred.reject(new RequestError(error));
			});
		}));

		return deferred.promise;
	},

	saveItem: function (model) {
		var e = Function.validateParameters(arguments, [
			{ name: "model", type: this._listItemConstructor }
		], true);

		if (e) throw e;

		if (!model.id || model.id < 1) {
			return this._addItem(model);
		}

		return this._updateItem(model);
	},

	deleteItem: function (model) {
		var e = Function.validateParameters(arguments, [
			{ name: "model", type: this._listItemConstructor }
		], true);

		if (e) throw e;

		var deferred = this._createDeferred();

		this._loadListDeffered.done(Function.createDelegate(this, function () {
			var item = this._list.getItemById(model.id);
			this._context.load(item);

			item.deleteObject();

			this._context.executeQueryAsync(function () {
				deferred.resolve();
			}, function (sender, error) {
				deferred.reject(new RequestError(error));
			});
		}));

		return deferred.promise;
	},

	createFolder: function (folderName) {
		var e = Function.validateParameters(arguments, [
			{ name: "folderName", type: String }
		], true);

		if (e) throw e;

		var deferred = this._createDeferred();

		this._loadListDeffered.done(Function.createDelegate(this, function () {
			var folder = new SP.ListItemCreationInformation();
			folder.set_underlyingObjectType(SP.FileSystemObjectType.folder);
			folder.set_leafName(folderName);
			var folderItem = this._list.addItem(folder);
			folderItem.set_item("Title", folderName);
			folderItem.update();
			this._context.load(folderItem);
			this._context.executeQueryAsync(function () {
				deferred.resolve(folderItem);
			}, function (sender, error) {
				deferred.reject(new RequestError(error));
			});
		}));

		return deferred.promise;
	},

	_createDeferred: function () {
		return angular.injector(['ng']).get("$q").defer();
	},

	_addItem: function (model) {
		var e = Function.validateParameters(arguments, [
			{ name: "model", type: this._listItemConstructor }
		], true);

		if (e) throw e;

		var deferred = this._createDeferred();

		this._loadListDeffered.done(Function.createDelegate(this, function () {
			var itemCreateInfo = new SP.ListItemCreationInformation();
			if (this.folder) {
				itemCreateInfo.set_folderUrl(this._getFolderRelativeUrl());
			}
			var newItem = this._list.addItem(itemCreateInfo);

			this._setFieldValues(newItem, model);
			var self = this;

			newItem.update();
			this._context.load(newItem);

			this._context.executeQueryAsync(function () {
				var resultItem = new self._listItemConstructor(newItem);
				deferred.resolve(resultItem);
			}, function (sender, error) {
				deferred.reject(new RequestError(error));
			});
		}));

		return deferred.promise;
	},

	_updateItem: function (model) {
		var e = Function.validateParameters(arguments, [
			{ name: "model", type: this._listItemConstructor }
		], true);

		if (e) throw e;

		var deferred = this._createDeferred();

		this._loadListDeffered.done(Function.createDelegate(this, function () {
			var item = this._list.getItemById(model.id);
			this._context.load(item);

			this._setFieldValues(item, model);
			var self = this;

			item.update();

			this._context.executeQueryAsync(function () {
				var resultItem = new self._listItemConstructor(item);
				deferred.resolve(resultItem);
			}, function (sender, args) {
				deferred.reject(new RequestError(args));
			});
		}));

		return deferred.promise;
	},

	_setFieldValues: function (item, model) {
		item.set_item(FAQ.Fields.Title, model.title);
		if (model.fileLeafRef) {
			item.set_item(FAQ.Fields.FileLeafRef, model.fileLeafRef);
		}
	},

	_getFolderRelativeUrl: function () {
		var webRelativeUrl = _spPageContextInfo.webServerRelativeUrl.endsWith("/")
			? _spPageContextInfo.webServerRelativeUrl
			: _spPageContextInfo.webServerRelativeUrl + "/";

		return String.format("{0}{1}/{2}", webRelativeUrl, this._listUrl, this.folder);
	},

	_getItemsByQuery: function (camlQuery) {
		var e = Function.validateParameters(arguments, [
			{ name: "camlQuery", type: SP.CamlQuery }
		], true);

		if (e) throw e;

		var deferred = this._createDeferred();

		this._loadListDeffered.done(Function.createDelegate(this, function () {
			if (this.folder) {
				camlQuery.set_folderServerRelativeUrl(this._getFolderRelativeUrl());
			}
			var items = this._list.getItems(camlQuery);
			this._context.load(items);

			var self = this;

			this._context.executeQueryAsync(function () {
				var itemsEnumerator = items.getEnumerator();
				var resultItemList = [];

				while (itemsEnumerator.moveNext()) {
					resultItemList.push(new self._listItemConstructor(itemsEnumerator.get_current()));
				}
				deferred.resolve(resultItemList);

			}, function (sender, args) {
				deferred.reject(new RequestError(args));
			});
		}));

		return deferred.promise;
	},

	_getItemByQuery: function (camlQuery) {
		var e = Function.validateParameters(arguments, [
			{ name: "camlQuery", type: SP.CamlQuery }
		], true);

		if (e) throw e;

		var deferred = this._createDeferred();

		this._loadListDeffered.done(Function.createDelegate(this, function () {
			if (this.folder) {
				camlQuery.set_folderServerRelativeUrl(this._getFolderRelativeUrl());
			}
			var items = this._list.getItems(camlQuery);
			this._context.load(items);

			var self = this;

			this._context.executeQueryAsync(function () {
				var itemsEnumerator = items.getEnumerator();
				var resultItemList = [];

				while (itemsEnumerator.moveNext()) {
					resultItemList.push(new self._listItemConstructor(itemsEnumerator.get_current()));
				}
				if (resultItemList.length > 1) throw "Result contains more than one element";

				deferred.resolve(resultItemList.length === 1 ? resultItemList[0] : null);

			}, function (sender, args) {
				deferred.reject(new RequestError(args));
			});
		}));

		return deferred.promise;
	}
};

ListRepository.registerClass("ListRepository");