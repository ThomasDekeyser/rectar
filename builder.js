//Window.console.log not available in IE9 when developper tools are not activated
if (!window.console) window.console = {};
if (!window.console.log) window.console.log = function () { };

(function(ko, $, undefined) {

	ko.bindingHandlers.flash = {
		init: function(element) {
			$(element).hide();
		},
		update: function(element, valueAccessor) {
			var value = ko.utils.unwrapObservable(valueAccessor());
			if (value) {
				$(element).stop().hide().text(value).fadeIn(function() {
					clearTimeout($(element).data("timeout"));
					$(element).data("timeout", setTimeout(function() {
						$(element).fadeOut();
						valueAccessor()(null);
					}, 3000));
				});
			}
		},
		timeout: null
	};	
	
	debug = function (log_txt) {
		if (typeof window.console != 'undefined') {
			console.log(log_txt);
		}
	};

	var SelectOption = function(name,option,isDefault,availableInEditMode,availableInSearch) {
		this.selectName = name;
		this.selectOption = option;
		this.isDefault = isDefault;		
		this.availableInEditMode = availableInEditMode;
		this.availableInSearch = availableInSearch;
	}

	var availableCategories  = [
		new SelectOption('Alles','ALL',true,false,true),
		new SelectOption('Hapjes','hapjes',false,true,true),
		new SelectOption('Voorgerecht','voorgerecht',false,true,true),
		new SelectOption('Hoofdgerecht','hoofdgerecht',false,true,true),
		new SelectOption('Dessert','dessert',false,true,true),
		new SelectOption('Soepen','soepen',false,true,true),
		new SelectOption('Sausen','sausen',false,true,true),
		new SelectOption('Andere','andere',false,true,true)
	];
	

	var availableTemps = [ 
		new SelectOption('Alles','ALL',true,false,true),
		new SelectOption('Warm of koud?','',false,true,false),
		new SelectOption('Warm','warm',false,true,true),
		new SelectOption('Koud','koud',false,true,true),
		new SelectOption('Warm en koud','warm en koud',false,true,true)
		
	];

	var availableSoorten = [ 
		new SelectOption('Alles','ALL',true,false,true),
		new SelectOption('Met vis of vlees?','',false,true,false),
		new SelectOption('Vlees','vlees',false,true,true),
		new SelectOption('Vis','vis',false,true,true),
		new SelectOption('Vis en vlees','vis en vlees',false,true,true),
		new SelectOption('Andere','andere',false,true,true)
	];


	var Button = function(name,value,selected) {
	  this.name = name;
	  this.buttonValue =  ko.observable(value);
	  this.selected = ko.observable(selected);
	}
		
	var initialCategorieButtons = availableCategories.map(function(o) {
			return new Button(o.selectName,o.selectOption,o.isDefault);
	});

	var initialTempButtons = availableTemps.filter(function(so) {
			return so.availableInSearch
		}).map(function(o) {
			return new Button(o.selectName,o.selectOption,o.isDefault);
	});
		
	var initialSoortButtons = availableSoorten.filter(function(so) {
			return so.availableInSearch
		}).map(function(o) {
			return new Button(o.selectName,o.selectOption,o.isDefault);
	});
	
	var emptyRecept = {
		"receptid":"-1",
		"categorie":"andere",
		"temp":"warm",
		"soort":"andere",
		"titel":"",
		"ingred":"",
		"personen":"",
		"tijd":"",
		"diff":"40",
		"uitgeprobeerd":"nee",
		"vooraf":"nee",
		"vriezen":"nee",
		"wijn":"",
		"trefwoord":"",
		"bereiding":"",
		"bron":"",
		"tip":""
	}
	
	var Recept = function(receptData) {
		this.receptid = ko.observable(receptData.receptid);
		this.titel = ko.observable(receptData.titel);
		this.ingred = ko.observable(receptData.ingred);
		this.personen = receptData.personen;
		this.tijd = receptData.tijd;
		this.diff = receptData.diff;
		this.uitgeprobeerd = receptData.uitgeprobeerd;
		this.vooraf = receptData.vooraf;
		this.vriezen = receptData.vriezen;
		this.wijn = receptData.wijn;
		this.trefwoord = receptData.trefwoord;
		this.bereiding = receptData.bereiding;
		this.bron = receptData.bron;
		this.tip = receptData.tip;	
		
		
		this.selectOptionCategorie = ko.observable(availableCategories.filter(function(so) {
				return so.selectOption == receptData.categorie
		})[0]);

		this.selectOptionTemp = ko.observable(availableTemps.filter(function(so) {
				return so.selectOption == receptData.temp
		})[0]);

		this.selectOptionSoort = ko.observable(availableSoorten.filter(function(so) {
				return so.selectOption == receptData.soort
		})[0]);

		this.categorie = ko.computed(function() {
			return this.selectOptionCategorie().selectOption;
		},this);

		this.temp = ko.computed(function() {
			return this.selectOptionTemp().selectOption;
		},this);

		this.soort = ko.computed(function() {
			return this.selectOptionSoort().selectOption;
		},this);
		
		this.viewDiff = function() {
			if(this.diff) {
				return ((this.diff-10)/10) + '/5';
			} else {
				return "Niet geg.";
			}
		}
		this.viewTijd = function() {
			if (this.tijd == '0') {
				return "Niet geg";
			} else {
				return this.tijd;
			}
		}
	}
	
	function isValidRecept(recept) {
		return recept.titel().length > 0;
	}
				
	function myViewModel() {
		var self = this;
		self.beschikbareRecepten = ko.observableArray();
		self.selectedRecept = ko.observable();
		self.lastError = ko.observable();
		self.lastSuccess = ko.observable();
		
		self.categorieButtons = ko.observableArray(initialCategorieButtons);
		self.tempButtons = ko.observableArray(initialTempButtons);
		self.soortButtons = ko.observableArray(initialSoortButtons);
		
		self.selectedCategorieButton = ko.observable(self.categorieButtons()[0]);
		self.selectedTempButton = ko.observable(self.tempButtons()[0]);
		self.selectedSoortButton = ko.observable(self.soortButtons()[0]);
		self.selectedTitel = ko.observable("");
		self.selectedView = ko.observable("view");
		self.availableCategories = ko.observableArray(availableCategories.filter(function(so) {
				return so.availableInEditMode;
		}));
		self.availableTemps = ko.observableArray(availableTemps.filter(function(so) {
				return so.availableInEditMode;
		}));
		self.availableSoorten = ko.observableArray(availableSoorten.filter(function(so) {
				return so.availableInEditMode;
		}));
		
		self.selectCategorieButton = function(button) {
			if (self.categorieButtons()){
				 self.selectedCategorieButton().selected(false); 
			 }
			
			self.selectedCategorieButton(button);
			self.selectedCategorieButton().selected(true);			
			
		};	
	
		self.selectTempButton = function(button) {
			if (self.tempButtons()){
				 self.selectedTempButton().selected(false); 
			 }
			
			self.selectedTempButton(button);
			self.selectedTempButton().selected(true);			
			
		};
		
		self.selectSoortButton = function(button) {
			if (self.soortButtons()){
				 self.selectedSoortButton().selected(false); 
			 }
			
			self.selectedSoortButton(button);
			self.selectedSoortButton().selected(true);				
		};
		
		self.gefilterdeRecepten = ko.computed(function() {
			return ko.utils.arrayFilter(self.beschikbareRecepten(), function(recept) {
				return (self.selectedCategorieButton().buttonValue() == 'ALL' || recept.categorie == self.selectedCategorieButton().buttonValue()) &&
					   (self.selectedTempButton().buttonValue() == 'ALL' || recept.temp == self.selectedTempButton().buttonValue()) &&
					   (self.selectedSoortButton().buttonValue() == 'ALL' || recept.soort == self.selectedSoortButton().buttonValue()) &&
					   (self.selectedTitel().length == 0 || recept.titel.toLowerCase().indexOf(self.selectedTitel().toLowerCase()) >-1);
			});			
		},self);
		
		//LOAD RECEPTEN
		$.get("api/list", function(data) {
			self.beschikbareRecepten(data);
		});		

		self.selectRecept = function(recept) {
			$.get("api/list/"+recept.receptid, function(data) {
				console.log("Loading recept "+recept.receptid);
				self.selectedRecept(new Recept(data));
				self.selectedView("view");
			});
		}		
		
		self.templateToUse = function() {
			this.selectedView
		}
		
		self.setViewMode = function(mode) {
			console.log("Change view mode to "+mode);
			self.selectedView(mode);
		}
			
		
		self.save = function() {
			if (isValidRecept(self.selectedRecept()) > 0) {
				console.log("Saving updated recept...");
				var vmjs = $.parseJSON(ko.toJSON(self));
				var resultObject = {"recept":vmjs.selectedRecept};

				var posting = $.post("api/save",resultObject, function(data) {
					self.lastSuccess("Recept succesvol opgeslaan.");

					//Aanpassen van beschikbare recepten ZONDER alles opnieuw op te vragen
					self.beschikbareRecepten.remove(function(r) {
						return r.receptid == self.selectedRecept().receptid();
					});
					self.selectedRecept().receptid(data.receptid);
					var updatedBeschikbaarRecept = {"receptid":self.selectedRecept().receptid(),
													"titel":self.selectedRecept().titel(),
													"categorie":self.selectedRecept().categorie(),
													"temp":self.selectedRecept().temp(),
													"soort":self.selectedRecept().soort(),
													"changed":true};
													
					//Toevoegen aan BEGIN van de array zodat gewijzigde recepten automatisch vanboven komen
					self.beschikbareRecepten.unshift(updatedBeschikbaarRecept);
					
				});
				posting.fail(function(data) {
					self.lastError("Problemen bij het opslaan van dit recept! :(");
					
				});
			} else {
				self.lastError("Geef een titel aan je recept aub.");
			}
		};

		self.delete = function() {
			console.log("Deleting recept...");
			$.get("api/delete/"+self.selectedRecept().receptid(), function(data) {
				self.lastSuccess("Recept verwijderd.");
				self.beschikbareRecepten.remove(function(r) {
					return r.receptid == self.selectedRecept().receptid();
				});				
				self.selectedRecept(new Recept(emptyRecept));
				self.selectedView("edit");			
			});
		};
		
		self.print = function() {
			window.print();
		}

		
		self.addNewRecept = function() {
			console.log("Aanmaken nieuw recept....");
			self.selectedRecept(new Recept(emptyRecept));
			self.selectedView("edit");			
		};
		
		self.resetFilter = function() {
			console.log("Reset filter....");
			self.selectedRecept(null);
			self.selectCategorieButton(self.categorieButtons()[0]);
			self.selectTempButton(self.tempButtons()[0]);
			self.selectSoortButton(self.soortButtons()[0]);
			self.selectedTitel("");
		};		
	
	};	
	
	
	var vm = new myViewModel();	
	ko.applyBindings(vm);		

})(ko, jQuery);
